from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.hashers import make_password, check_password
from .models import User, Tenant, TenantCredential
from .serializers import UserSerializer, LoginSerializer, PasswordChangeSerializer, TenantSerializer, TenantCredentialSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        role = serializer.validated_data.get('role')
        
        # Try standard Django auth first
        user = authenticate(username=username, password=password)
        if user:
            if role and user.role != role:
                return Response({'error': 'Invalid role for this user'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check tenant expiration for non-owners
            if user.role != 'owner' and user.tenant:
                if not user.tenant.is_active():
                    return Response({
                        'error': 'Subscription expired',
                        'message': 'Your subscription has expired. Please contact system administration to renew.',
                        'fallback': True
                    }, status=status.HTTP_403_FORBIDDEN)
            
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        
        # Try tenant credential authentication
        try:
            credential = TenantCredential.objects.select_related('tenant').get(
                username=username,
                is_active=True
            )
            
            # Check if tenant is expired
            if not credential.tenant.is_active():
                # Try fallback credentials
                if credential.fallback_username == username and check_password(password, credential.fallback_password_hash):
                    return Response({
                        'error': 'Subscription expired',
                        'message': 'Your subscription has expired. Using fallback credentials. Please contact system administration to renew.',
                        'fallback': True
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    return Response({
                        'error': 'Subscription expired',
                        'message': 'Your subscription has expired. Please contact system administration to renew.',
                        'fallback': False
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Check normal credentials
            if check_password(password, credential.password_hash):
                # Find or create user for this credential
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'role': role if role else 'donation_staff',
                        'tenant': credential.tenant,
                        'is_using_fallback': False
                    }
                )
                
                if not created:
                    user.tenant = credential.tenant
                    user.role = role if role else user.role
                    user.is_using_fallback = False
                    user.save()
                
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': UserSerializer(user).data
                })
            
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        except TenantCredential.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    else:
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

class TenantListCreateView(generics.ListCreateAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TenantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

class TenantCredentialListCreateView(generics.ListCreateAPIView):
    serializer_class = TenantCredentialSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = self.kwargs.get('tenant_id')
        if tenant_id:
            return TenantCredential.objects.filter(tenant_id=tenant_id)
        return TenantCredential.objects.filter(tenant__owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TenantCredentialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TenantCredential.objects.all()
    serializer_class = TenantCredentialSerializer
    permission_classes = [IsAuthenticated]
