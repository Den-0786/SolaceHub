from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'System Owner'),
        ('family_head', 'Family Head'),
        ('chit_staff', 'Chit Staff'),
        ('donation_staff', 'Donation Staff'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='donation_staff')
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    is_using_fallback = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    first_name = None
    last_name = None
    email = None
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

class Tenant(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('locked', 'Locked'),
    ]
    
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_tenants')
    hired_start_date = models.DateTimeField()
    hired_duration_days = models.IntegerField()
    expiration_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def is_active(self):
        return self.status == 'active' and timezone.now() <= self.expiration_date
    
    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'

class TenantCredential(models.Model):
    CREDENTIAL_TYPES = [
        ('family_dashboard', 'Family Dashboard'),
        ('chit_console', 'Chit Console'),
        ('donation_portal', 'Donation Portal'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='credentials')
    credential_type = models.CharField(max_length=50, choices=CREDENTIAL_TYPES)
    username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=255)
    fallback_username = models.CharField(max_length=150, blank=True)
    fallback_password_hash = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_credentials')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Tenant Credential'
        verbose_name_plural = 'Tenant Credentials'
        unique_together = ['tenant', 'credential_type']
