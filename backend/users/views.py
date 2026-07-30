from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.hashers import make_password
import logging
from .models import User, Credential
from .serializers import UserSerializer, LoginSerializer, PasswordChangeSerializer, CredentialSerializer, CredentialUpdateSerializer

logger = logging.getLogger(__name__)

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

        logger.info(f"Attempting authentication for username: {username}")
        
        user = authenticate(username=username, password=password)
        if user:
            logger.info(f"Authentication successful for user: {username}, role: {user.role}")
            
            if role and user.role != role:
                logger.warning(f"Role mismatch. Expected: {role}, Actual: {user.role}")
                return Response({'error': 'Invalid role for this user'}, status=status.HTTP_403_FORBIDDEN)

            token, created = Token.objects.get_or_create(user=user)
            logger.info(f"Token {'created' if created else 'retrieved'} for user: {username}")
            
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
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
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

class CredentialDetailView(generics.RetrieveUpdateAPIView):
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_credential_view(request):
    serializer = CredentialUpdateSerializer(data=request.data)
    if serializer.is_valid():
        credential_type = request.data.get('credential_type')
        if not credential_type:
            return Response({'error': 'credential_type is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            credential = Credential.objects.get(credential_type=credential_type)
            if 'username' in serializer.validated_data:
                credential.username = serializer.validated_data['username']
            if 'password' in serializer.validated_data:
                credential.password_hash = make_password(serializer.validated_data['password'])
            if 'desk_operator_name' in serializer.validated_data:
                credential.desk_operator_name = serializer.validated_data['desk_operator_name']
            if 'temp_login' in serializer.validated_data:
                credential.temp_login = serializer.validated_data['temp_login']
            if 'session_expired' in serializer.validated_data:
                credential.session_expired = serializer.validated_data['session_expired']
            credential.save()
            return Response(CredentialSerializer(credential).data)
        except Credential.DoesNotExist:
            return Response({'error': 'Credential not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
