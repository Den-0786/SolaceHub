from rest_framework import serializers
from .models import User, Tenant, TenantCredential

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'tenant', 'is_using_fallback', 'created_at']
        read_only_fields = ['id', 'created_at']

class TenantSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'owner', 'owner_username', 'hired_start_date', 'hired_duration_days', 'expiration_date', 'status', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_is_active(self, obj):
        return obj.is_active()

class TenantCredentialSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantCredential
        fields = ['id', 'tenant', 'tenant_name', 'credential_type', 'username', 'fallback_username', 'created_by', 'created_by_username', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    role = serializers.CharField(required=False)

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
