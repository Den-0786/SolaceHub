from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('family_head', 'Family Head'),
        ('desk_operator', 'Desk Operator'),
        ('admin', 'Admin'),
        ('owner', 'Owner'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='desk_operator')
    phone = models.CharField(max_length=20, blank=True)
    is_temp_login = models.BooleanField(default=False)
