from django.contrib import admin
from .models import Donor

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ['donor_name', 'phone_number', 'amount', 'receipt_id', 'date', 'time', 'event_day', 'status']
    list_filter = ['status', 'event_day', 'date', 'method']
    search_fields = ['donor_name', 'receipt_id', 'phone_number']
