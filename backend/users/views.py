from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import logging
import uuid
from .models import User, Credential, LoginAttempt
from .serializers import (
    UserSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    CredentialSerializer,
    CredentialUpdateSerializer,
)
from events.models import Event
from deployments.utils import event_session_expired

logger = logging.getLogger(__name__)

MAX_FAILED_LOGIN_ATTEMPTS = 3
LOGIN_LOCKOUT_MINUTES = 15


def _is_login_locked(username):
    """Return (locked, locked_until) for the given username."""
    try:
        attempt = LoginAttempt.objects.get(username=username)
    except LoginAttempt.DoesNotExist:
        return False, None
    if attempt.locked_until and attempt.locked_until > timezone.now():
        return True, attempt.locked_until
    return False, None


def _record_failed_login(username):
    """Increment the failed-attempt counter and lock once the limit is reached."""
    attempt, _ = LoginAttempt.objects.get_or_create(username=username)
    if attempt.locked_until and attempt.locked_until <= timezone.now():
        attempt.failed_attempts = 0
        attempt.locked_until = None
    attempt.failed_attempts += 1
    attempt.last_attempt_at = timezone.now()
    if attempt.failed_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
        attempt.locked_until = timezone.now() + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
        attempt.failed_attempts = MAX_FAILED_LOGIN_ATTEMPTS
    attempt.save()
    return attempt


def _clear_login_attempts(username):
    LoginAttempt.objects.filter(username=username).delete()


def _minutes_remaining(locked_until):
    remaining = locked_until - timezone.now()
    return max(1, int(remaining.total_seconds() // 60) + 1)


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
        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password']
        role = serializer.validated_data.get('role')
        event_id = resolve_event_id(serializer.validated_data, request)

        # Lockout check: deny logins for usernames with too many failed attempts.
        locked, locked_until = _is_login_locked(username)
        if locked:
            minutes = _minutes_remaining(locked_until)
            logger.warning(f"Login blocked for locked username: {username}")
            return Response(
                {
                    'error': 'Too many failed attempts',
                    'message': f'Login locked after {MAX_FAILED_LOGIN_ATTEMPTS} failed attempts. Try again in about {minutes} minute(s).'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        logger.info(f"Attempting authentication for username: {username} (event: {event_id})")

        # 1. Real Django account login (owner/admin) first. The owner's own
        #    account must always be able to log in, even when a master fallback
        #    key happens to share its username. Synced users created for
        #    master_fallback are no longer created, so authenticate() here only
        #    matches genuine accounts.
        user = authenticate(username=username, password=password)
        if user:
            logger.info(f"Authentication successful for user: {username}, role: {user.role}")

            if role and user.role != role:
                logger.warning(f"Role mismatch. Expected: {role}, Actual: {user.role}")
                return Response({'error': 'Invalid role for this user'}, status=status.HTTP_403_FORBIDDEN)

            _clear_login_attempts(username)
            token, created = Token.objects.get_or_create(user=user)
            logger.info(f"Token {'created' if created else 'retrieved'} for user: {username}")

            user_data = UserSerializer(user).data
            # When a real account (owner/admin) supplies an event access code,
            # scope the session to that event so the dashboards open with the
            # right active event instead of ignoring the access code.
            return Response({
                'token': token.key,
                'user': user_data,
                'event_id': str(user.event_id) if user.event_id else (event_id or None)
            })

        # 2. Credential-based logins (client, desk_operator, master_fallback).
        credentials = Credential.objects.filter(username=username)
        if event_id:
            credentials = credentials.filter(Q(event_id=event_id) | Q(event__isnull=True))

        matching = [
            c for c in credentials
            if c.password_hash and check_password(password, c.password_hash)
        ]

        if matching:
            preferred = [c for c in matching if c.credential_type in ('client', 'desk_operator')]
            fallback = [c for c in matching if c.credential_type == 'master_fallback']

            if preferred:
                # Prefer the credential scoped to the requested event, then any
                # event-scoped one, then a global one.
                preferred.sort(key=lambda c: (0 if c.event_id == event_id else 1 if c.event_id else 2))

                # Same username exists for more than one event and no event context
                # was provided, so we cannot determine which event to log into.
                distinct_events = {c.event_id for c in preferred if c.event_id}
                if len(preferred) > 1 and not event_id and len(distinct_events) > 1:
                    return Response(
                        {
                            'error': 'Multiple events matched',
                            'message': 'This username exists for more than one event. Please enter the event access code to continue.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                credential = preferred[0]

                # Client / desk operator cannot log in when their session has expired
                if credential.session_expired:
                    return Response(
                        {
                            'error': 'Session expired',
                            'message': 'Your session has expired. Please contact the system administrator.'
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            else:
                # No client/desk operator matched. Only fall back to the master key,
                # and only when the client session for that event has already expired.
                credential = fallback[0] if fallback else None
                if credential is None:
                    attempt = _record_failed_login(username)
                    remaining = max(0, MAX_FAILED_LOGIN_ATTEMPTS - attempt.failed_attempts)
                    logger.warning(f"Authentication failed for username: {username}")
                    return Response(
                        {
                            'error': 'Invalid credentials',
                            'message': f'Invalid username or password. {remaining} attempt(s) remaining.' if remaining else 'Invalid username or password.'
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                event_context = credential.event_id or event_id
                if not event_context:
                    return Response(
                        {
                            'error': 'Access code required',
                            'message': 'Enter the event access code to use the master fallback key. Your own owner account can be used at any time.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                active_client = Credential.objects.filter(
                    credential_type='client',
                    event_id=event_context,
                    session_expired=False,
                ).exists()
                # Fallback unlocks once the session has actually ended, whether
                # that is recorded via the client session_expired flag or simply
                # because the session timer's computed expiry has passed.
                if active_client and not event_session_expired(event_context):
                    return Response(
                        {
                            'error': 'Session still active',
                            'message': 'Master fallback is only available after the client session has expired.'
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Enforce the session timer at login, independent of the stored
            # session_expired flag. This is the authoritative gate: as soon as
            # the event's timer elapses, client and desk-operator credentials
            # stop working even if no background job ever flagged them.
            if credential.credential_type in ('client', 'desk_operator') and event_session_expired(
                credential.event_id or event_id
            ):
                logger.info(f"Blocking login for expired session: {username} ({credential.credential_type})")
                return Response(
                    {
                        'error': 'Session expired',
                        'message': 'Your session has expired. Please contact the system administrator.'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            logger.info(f"Credential match for username: {username}, type: {credential.credential_type}")

            role_map = {
                'client': 'client',
                'desk_operator': 'desk_operator',
                'master_fallback': 'owner',
            }
            user_role = role_map.get(credential.credential_type, credential.credential_type)
            assigned_event_id = str(credential.event_id) if credential.event_id else event_id

            # Build a unique username per event so different events can share the
            # same credential name. Fallback logins get a distinct prefix so they
            # can never collide with (or overwrite) the owner's real account.
            if credential.credential_type == 'master_fallback':
                user_identifier = f"fallback_{assigned_event_id}_{credential.username}" if assigned_event_id else f"fallback_{credential.username}"
            else:
                user_identifier = f"{assigned_event_id}_{credential.username}" if assigned_event_id else credential.username

            operator_name = credential.desk_operator_name or credential.username
            user, created = User.objects.get_or_create(
                username=user_identifier,
                defaults={
                    'role': user_role,
                    'display_name': operator_name,
                    'event_id': assigned_event_id,
                }
            )
            user.role = user_role
            user.display_name = operator_name
            if assigned_event_id:
                user.event_id = assigned_event_id
            user.set_password(password)
            user.save()

            _clear_login_attempts(username)
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

        attempt = _record_failed_login(username)
        remaining = max(0, MAX_FAILED_LOGIN_ATTEMPTS - attempt.failed_attempts)
        if remaining == 0:
            locked, locked_until = _is_login_locked(username)
            minutes = _minutes_remaining(locked_until) if locked_until else LOGIN_LOCKOUT_MINUTES
            logger.warning(f"Login locked for username: {username} after {MAX_FAILED_LOGIN_ATTEMPTS} failed attempts")
            return Response(
                {
                    'error': 'Too many failed attempts',
                    'message': f'Login locked after {MAX_FAILED_LOGIN_ATTEMPTS} failed attempts. Try again in about {minutes} minute(s).'
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        logger.warning(f"Authentication failed for username: {username}")
        return Response(
            {
                'error': 'Invalid credentials',
                'message': f'Invalid username or password. {remaining} attempt(s) remaining.'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

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
        # Non-owners (clients/operators) must only ever see credentials for
        # their own event, even if the X-Event-ID header is missing.
        user = self.request.user
        if user.role not in ('owner', 'admin') and user.event_id:
            return Credential.objects.filter(event_id=user.event_id)
        return Credential.objects.all()


class CredentialDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        event_id = self.request.META.get('HTTP_X_EVENT_ID') or self.request.query_params.get('event_id')
        if event_id:
            return Credential.objects.filter(event_id=event_id)
        # Non-owners (clients/operators) must only ever see credentials for
        # their own event, even if the X-Event-ID header is missing.
        user = self.request.user
        if user.role not in ('owner', 'admin') and user.event_id:
            return Credential.objects.filter(event_id=user.event_id)
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

        # Role-based credential provisioning:
        # - The owner provisions the client (admin) credential and the master
        #   fallback key. The owner does NOT create desk-operator credentials.
        # - The client (admin) provisions the shared desk-operator credential
        #   for operators, and only for their own event.
        user = request.user
        if credential_type in ('client', 'master_fallback'):
            if user.role != 'owner':
                return Response(
                    {'error': 'Only the system owner can provision client or master fallback credentials.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif credential_type == 'desk_operator':
            if user.role not in ('client', 'admin'):
                return Response(
                    {'error': 'Only an admin can provision desk-operator credentials.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Force the operator credential to the requester's own event so an
            # admin can never create or modify credentials for another family.
            event_id = str(user.event_id) if user.event_id else event_id
            if not event_id:
                return Response(
                    {'error': 'No event context. Please select an event.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': f'Unknown credential type: {credential_type}'},
                status=status.HTTP_400_BAD_REQUEST
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

                # Sync the linked User so token login keeps working. The master
                # fallback key never gets a synced user (it would collide with the
                # owner's real account), and an existing owner/admin account is
                # never overwritten.
                if credential_type != 'master_fallback':
                    role_map = {
                        'client': 'client',
                        'desk_operator': 'desk_operator',
                        'master_fallback': 'owner',
                    }
                    user_role = role_map.get(credential_type, 'client')
                    user_identifier = f"{event_id}_{credential.username}" if event_id else credential.username
                    operator_name = credential.desk_operator_name or credential.username
                    user, created = User.objects.get_or_create(
                        username=user_identifier,
                        defaults={'role': user_role, 'display_name': operator_name, 'event_id': event_id}
                    )
                    if created or user.role not in ('owner', 'admin'):
                        user.role = user_role
                        user.display_name = operator_name
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_credential_password_view(request):
    """Verify and change a credential's own password (used by the client on first login / password change)."""
    credential_type = request.data.get('credential_type')
    old_password = request.data.get('old_password', '')
    new_password = request.data.get('new_password')

    if credential_type != 'client':
        return Response({'error': 'Only client credentials can be changed here'}, status=status.HTTP_400_BAD_REQUEST)
    if not new_password or len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

    event_id = (
        request.META.get('HTTP_X_EVENT_ID')
        or request.data.get('event_id')
        or request.query_params.get('event_id')
    )

    try:
        credential = Credential.objects.get(credential_type='client', event_id=event_id)
    except Credential.DoesNotExist:
        return Response({'error': 'Client credential not found for this event'}, status=status.HTTP_404_NOT_FOUND)

    # On first-time (temporary) login the current password is not known to the client,
    # so it may be changed without the old password. Every subsequent change requires it.
    if not check_password(old_password, credential.password_hash) and not credential.temp_login:
        return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)

    credential.password_hash = make_password(new_password)
    credential.temp_login = False
    credential.save()

    # Keep the linked Django user in sync so token auth keeps working
    user_identifier = f"{event_id}_{credential.username}" if event_id else credential.username
    user, _ = User.objects.get_or_create(
        username=user_identifier,
        defaults={'role': 'client', 'display_name': credential.username, 'event_id': event_id}
    )
    user.role = 'client'
    user.display_name = credential.username
    if event_id:
        user.event_id = event_id
    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password changed successfully'})
