from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
import logging
import uuid
from .models import User, Credential
from .serializers import (
    UserSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    CredentialSerializer,
    CredentialUpdateSerializer,
)
from events.models import Event

logger = logging.getLogger(__name__)


def resolve_event_id(data, request):
    """Resolve event_id from request data or access_code."""
    event_id = data.get('event_id')
    if event_id:
        return str(event_id)

    access_code = data.get('access_code')
    if access_code:
        try:
            event = Event.objects.get(access_code=access_code)
            return str(event.id)
        except Event.DoesNotExist:
            return None

    return request.META.get('HTTP_X_EVENT_ID') or request.query_params.get('event_id')


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    logger.info(f"Login request received. Method: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request data: {request.data}")

    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        role = serializer.validated_data.get('role')
        event_id = resolve_event_id(serializer.validated_data, request)

        logger.info(f"Attempting authentication for username: {username} (event: {event_id})")

        # 1. Try standard Django user first (owner/admin)
        user = authenticate(username=username, password=password)
        if user:
            logger.info(f"Authentication successful for user: {username}, role: {user.role}")

            if role and user.role != role:
                logger.warning(f"Role mismatch. Expected: {role}, Actual: {user.role}")
                return Response({'error': 'Invalid role for this user'}, status=status.HTTP_403_FORBIDDEN)

            token, created = Token.objects.get_or_create(user=user)
            logger.info(f"Token {'created' if created else 'retrieved'} for user: {username}")

            user_data = UserSerializer(user).data
            return Response({
                'token': token.key,
                'user': user_data,
                'event_id': str(user.event_id) if user.event_id else None
            })

        # 2. Fallback to Credential-based logins (client, desk_operator, master_fallback)
        credentials = Credential.objects.filter(username=username)
        if event_id:
            credentials = credentials.filter(Q(event_id=event_id) | Q(event__isnull=True))

        matching = [
            c for c in credentials
            if c.password_hash and check_password(password, c.password_hash)
        ]

        if matching:
            credential = matching[0]
            logger.info(f"Credential match for username: {username}, type: {credential.credential_type}")

            # Client / desk operator cannot log in when their session has expired
            if credential.credential_type in ('client', 'desk_operator') and credential.session_expired:
                return Response(
                    {
                        'error': 'Session expired',
                        'message': 'Your session has expired. Please contact the system administrator.'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            role_map = {
                'client': 'client',
                'desk_operator': 'desk_operator',
                'master_fallback': 'owner',
            }
            user_role = role_map.get(credential.credential_type, credential.credential_type)
            assigned_event_id = str(credential.event_id) if credential.event_id else event_id

            # Build a unique username per event so different events can share the same credential name
            user_identifier = f"{assigned_event_id}_{credential.username}" if assigned_event_id else credential.username

            user, created = User.objects.get_or_create(
                username=user_identifier,
                defaults={
                    'role': user_role,
                    'display_name': credential.username,
                    'event_id': assigned_event_id,
                }
            )
            user.role = user_role
            user.display_name = credential.username
            if assigned_event_id:
                user.event_id = assigned_event_id
            user.set_password(password)
            user.save()

            token, created = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            user_data['role'] = user_role
            user_data['event_id'] = assigned_event_id

            logger.info(f"Token {'created' if created else 'retrieved'} for credential user: {username}")
            return Response({
                'token': token.key,
                'user': user_data,
                'event_id': assigned_event_id
            })

        logger.warning(f"Authentication failed for username: {username}")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    logger.error(f"Serializer validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        update_session_auth_hash(request, user)
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class CredentialListView(generics.ListAPIView):
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.request.META.get('HTTP_X_EVENT_ID') or self.request.query_params.get('event_id')
        if event_id:
            return Credential.objects.filter(event_id=event_id)
        return Credential.objects.all()


class CredentialDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.request.META.get('HTTP_X_EVENT_ID') or self.request.query_params.get('event_id')
        if event_id:
            return Credential.objects.filter(event_id=event_id)
        return Credential.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_credential_view(request):
    serializer = CredentialUpdateSerializer(data=request.data)
    if serializer.is_valid():
        credential_type = request.data.get('credential_type')
        if not credential_type:
            return Response({'error': 'credential_type is required'}, status=status.HTTP_400_BAD_REQUEST)

        event_id = (
            request.META.get('HTTP_X_EVENT_ID')
            or request.data.get('event_id')
            or request.query_params.get('event_id')
        )

        try:
            credential, _ = Credential.objects.update_or_create(
                credential_type=credential_type,
                event_id=event_id,
                defaults={
                    'username': serializer.validated_data.get('username', ''),
                    'desk_operator_name': serializer.validated_data.get('desk_operator_name', ''),
                }
            )
            if 'password' in serializer.validated_data:
                raw_password = serializer.validated_data['password']
                credential.password_hash = make_password(raw_password)

                # Sync the linked User so token login keeps working
                role_map = {
                    'client': 'client',
                    'desk_operator': 'desk_operator',
                    'master_fallback': 'owner',
                }
                user_role = role_map.get(credential_type, 'client')
                user_identifier = f"{event_id}_{credential.username}" if event_id else credential.username
                user, _ = User.objects.get_or_create(
                    username=user_identifier,
                    defaults={'role': user_role, 'display_name': credential.username, 'event_id': event_id}
                )
                user.role = user_role
                user.display_name = credential.username
                if event_id:
                    user.event_id = event_id
                user.set_password(raw_password)
                user.save()

            if 'temp_login' in serializer.validated_data:
                credential.temp_login = serializer.validated_data['temp_login']
            if 'session_expired' in serializer.validated_data:
                credential.session_expired = serializer.validated_data['session_expired']
            credential.save()
            return Response(CredentialSerializer(credential).data)
        except Exception as e:
            logger.error(f"Credential update error: {str(e)}")
            return Response({'error': 'Failed to update credential'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
