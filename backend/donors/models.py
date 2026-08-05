from django.db import models

class Donor(models.Model):
    donor_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt_id = models.CharField(max_length=50, unique=True)
    time = models.TimeField()
    date = models.DateField(auto_now_add=True)
    method = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='PRINTED')
    event_day = models.IntegerField()
    operator_name = models.CharField(max_length=150, blank=True, null=True)
    logged_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    deployment = models.ForeignKey('deployments.Deployment', on_delete=models.CASCADE, null=True, blank=True, related_name='donations')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='donors')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-time']
