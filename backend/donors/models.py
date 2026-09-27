from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

AMOUNT_VALIDATORS = [
    MinValueValidator(
        Decimal('0.01'),
        'Amount must be greater than zero.',
    ),
]

class Donor(models.Model):
    donor_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=AMOUNT_VALIDATORS)
    receipt_id = models.CharField(max_length=50, unique=True)
    time = models.TimeField()
    date = models.DateField(auto_now_add=True)
    method = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='RECORDED')
    event_day = models.IntegerField()
    operator_name = models.CharField(max_length=150, blank=True, null=True)
    logged_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    deployment = models.ForeignKey('deployments.Deployment', on_delete=models.CASCADE, null=True, blank=True, related_name='donations')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='donors')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entry_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Permanent per-event position in the ledger, assigned on create.',
    )

    class Meta:
        ordering = ['entry_number', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'entry_number'],
                name='unique_donor_entry_number_per_event',
            ),
        ]
