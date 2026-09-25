from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Credential, LoginAttempt

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'role']
    list_filter = ['role']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role',)}),
    )

@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ['credential_type', 'username', 'desk_operator_name', 'temp_login', 'session_expired', 'created_at']
    list_filter = ['credential_type', 'temp_login', 'session_expired']
    search_fields = ['username', 'credential_type']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ['username', 'failed_attempts', 'locked_until', 'last_attempt_at']
    list_filter = ['locked_until']
    search_fields = ['username']
    readonly_fields = ['username', 'failed_attempts', 'locked_until', 'last_attempt_at']
