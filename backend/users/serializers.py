from rest_framework import serializers
from .models import User, Credential

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'role', 'event', 'created_at']
        read_only_fields = ['id', 'created_at']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    role = serializers.CharField(required=False)
    event_id = serializers.UUIDField(required=False)
    access_code = serializers.CharField(required=False)

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

class CredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credential
        fields = ['id', 'credential_type', 'username', 'password_hash', 'desk_operator_name', 'temp_login', 'session_expired', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CredentialUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False)
    desk_operator_name = serializers.CharField(required=False, allow_blank=True)
    temp_login = serializers.BooleanField(required=False)
    session_expired = serializers.BooleanField(required=False)
