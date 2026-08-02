from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_family_name = serializers.CharField(source='event.family_name', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'report_type', 'data', 'generated_by', 'generated_by_name', 'event', 'event_title', 'event_family_name', 'generated_at']
        read_only_fields = ['id', 'generated_at']
