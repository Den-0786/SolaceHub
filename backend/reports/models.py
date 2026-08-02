from django.db import models

class Report(models.Model):
    REPORT_TYPES = [
        ('financial', 'Financial Audit'),
        ('donors', 'Top Donors'),
        ('catering', 'Catering Audit'),
    ]

    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    data = models.JSONField()
    generated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    generated_at = models.DateTimeField(auto_now_add=True)
