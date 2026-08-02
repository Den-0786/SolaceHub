from django.db import models

class Deployment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('attended', 'Attended'),
        ('rejected', 'Rejected'),
    ]

    venue = models.CharField(max_length=200)
    client = models.CharField(max_length=200)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='deployments')
    phone = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    deceased_name = models.CharField(max_length=200, blank=True)
    year_of_birth = models.PositiveIntegerField(null=True, blank=True, help_text="Year of birth (e.g., 1980)")
    deceased_image = models.ImageField(upload_to='deceased_images/', null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def deceased_age(self):
        """Calculate age from year_of_birth"""
        if not self.year_of_birth:
            return None
        from datetime import datetime
        current_year = datetime.now().year
        age = current_year - self.year_of_birth
        return age

    @property
    def title(self):
        """Get title from related event for backward compatibility"""
        return self.event.title if self.event else "No Event"

    def __str__(self):
        return f"{self.event.title if self.event else 'No Event'} - {self.venue}"

class SessionTimer(models.Model):
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='session_timers')
    deployment = models.OneToOneField(Deployment, on_delete=models.CASCADE, related_name='session_timer')
    start_timestamp = models.DateTimeField(help_text="Session start time")
    duration_days = models.IntegerField(default=0, help_text="Duration in days")
    duration_hours = models.IntegerField(default=0, help_text="Duration in hours")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Session Timer'
        verbose_name_plural = 'Session Timers'

    def __str__(self):
        return f"Session for {self.deployment.event.title if self.deployment.event else 'No Event'}"

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
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='hardware')
    created_at = models.DateTimeField(auto_now_add=True)


class Backup(models.Model):
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='backups')
    deployment = models.ForeignKey(Deployment, on_delete=models.CASCADE, null=True, blank=True)
    csv_file = models.FileField(upload_to='backups/%Y/%m/%d/')
    record_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Backup for {self.deployment.event.title if self.deployment.event else 'No Event'} at {self.created_at}"
