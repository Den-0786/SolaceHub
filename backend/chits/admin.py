from django.contrib import admin
from .models import Chit

@admin.register(Chit)
class ChitAdmin(admin.ModelAdmin):
    list_display = ['security_code', 'representative_name', 'number_of_people', 'voucher_type', 'deployment', 'event_day', 'date', 'time']
    list_filter = ['voucher_type', 'event_day', 'date', 'deployment']
    search_fields = ['security_code', 'representative_name']
