from django.db import models

class Deployment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('attended', 'Attended'),
        ('rejected', 'Rejected'),
    ]
    
    title = models.CharField(max_length=200)
    venue = models.CharField(max_length=200)
    client = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Hardware(models.Model):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('in_use', 'In Use'),
        ('ready', 'Ready'),
    ]
    
    HARDWARE_TYPES = [
        ('tablet', 'Tablet'),
        ('printer', 'Printer'),
    ]
    
    name = models.CharField(max_length=200)
    hardware_type = models.CharField(max_length=50, choices=HARDWARE_TYPES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='offline')
    battery = models.IntegerField(null=True, blank=True)
    ip_address = models.CharField(max_length=50, blank=True)
    deployment = models.ForeignKey(Deployment, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
