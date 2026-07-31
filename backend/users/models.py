from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'System Owner'),
        ('client', 'Client'),
        ('chit_staff', 'Chit Staff'),
        ('donation_staff', 'Donation Staff'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='donation_staff')
    display_name = models.CharField(max_length=150, blank=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    first_name = None
    last_name = None
    email = None

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class Credential(models.Model):
    CREDENTIAL_TYPE_CHOICES = [
        ('client', 'Client'),
        ('desk_operator', 'Desk Operator'),
        ('master_fallback', 'Master Fallback'),
    ]

    credential_type = models.CharField(max_length=20, choices=CREDENTIAL_TYPE_CHOICES)
    username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=255)
    desk_operator_name = models.CharField(max_length=150, blank=True, null=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='credentials')
    temp_login = models.BooleanField(default=True)
    session_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Credential'
        verbose_name_plural = 'Credentials'
        unique_together = ('credential_type', 'event')

    def __str__(self):
        return f"{self.get_credential_type_display()} - {self.username}"
