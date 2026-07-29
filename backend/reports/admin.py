from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_type', 'generated_by', 'generated_at']
    list_filter = ['report_type', 'generated_at']
    readonly_fields = ['generated_at']
