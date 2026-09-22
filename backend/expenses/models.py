from django.db import models


class Expense(models.Model):
    description = models.CharField(max_length=300)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(null=True, blank=True)
    recorded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    deployment = models.ForeignKey('deployments.Deployment', on_delete=models.CASCADE, null=True, blank=True, related_name='expenses')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.description} - {self.amount}"