from django.contrib import admin
from .models import Deployment, Hardware

@admin.register(Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = ['title', 'venue', 'client', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['title', 'venue', 'client']

@admin.register(Hardware)
class HardwareAdmin(admin.ModelAdmin):
    list_display = ['name', 'hardware_type', 'status', 'battery', 'ip_address', 'deployment']
    list_filter = ['hardware_type', 'status', 'deployment']
    search_fields = ['name', 'ip_address']
