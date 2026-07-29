from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Tenant, TenantCredential

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'tenant', 'is_using_fallback']
    list_filter = ['role', 'is_using_fallback', 'tenant']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone', 'tenant', 'is_using_fallback')}),
    )

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'hired_start_date', 'hired_duration_days', 'expiration_date', 'status']
    list_filter = ['status', 'hired_duration_days']
    search_fields = ['name', 'owner__username']

@admin.register(TenantCredential)
class TenantCredentialAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'credential_type', 'username', 'created_by', 'is_active']
    list_filter = ['credential_type', 'is_active', 'tenant']
    search_fields = ['username', 'tenant__name']
