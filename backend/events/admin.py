from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'family_name', 'date', 'access_code', 'is_active', 'created_at']
    list_filter = ['is_active', 'date']
    search_fields = ['title', 'family_name', 'access_code']
