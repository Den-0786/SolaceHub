from django.db import models

class Chit(models.Model):
    VOUCHER_TYPES = [
        ('full_meal', 'Full Meal'),
        ('drinks_only', 'Drinks Only'),
        ('snacks_only', 'Snacks Only'),
    ]
    
    security_code = models.CharField(max_length=50, unique=True)
    representative_name = models.CharField(max_length=200)
    number_of_people = models.IntegerField()
    voucher_type = models.CharField(max_length=50, choices=VOUCHER_TYPES)
    event_day = models.IntegerField()
    time = models.TimeField()
    date = models.DateField(auto_now_add=True)
    issued_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    deployment = models.ForeignKey('deployments.Deployment', on_delete=models.CASCADE, null=True, blank=True, related_name='chits')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='chits')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-time']
