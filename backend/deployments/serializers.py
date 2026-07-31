from rest_framework import serializers
from .models import Deployment, Hardware, SessionTimer, Backup


class SessionTimerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionTimer
        fields = ['id', 'event', 'start_timestamp', 'duration_days', 'duration_hours', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'event', 'created_at', 'updated_at']


class HardwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hardware
        fields = ['id', 'event', 'name', 'hardware_type', 'status', 'battery', 'ip_address', 'deployment', 'created_at']
        read_only_fields = ['id', 'event', 'created_at']


class DeploymentSerializer(serializers.ModelSerializer):
    hardware_set = HardwareSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    session_timer = SessionTimerSerializer(read_only=True)
    dates = serializers.SerializerMethodField()
    deceased_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Deployment
        fields = ['id', 'event', 'title', 'venue', 'client', 'phone', 'start_date', 'end_date', 'status', 'created_by', 'created_by_name', 'hardware_set', 'session_timer', 'dates', 'deceased_name', 'deceased_age', 'deceased_image', 'created_at', 'updated_at']
        read_only_fields = ['id', 'event', 'created_at', 'updated_at']

    def get_dates(self, obj):
        if obj.start_date and obj.end_date:
            return f"{obj.start_date.year} – {obj.end_date.year}"
        return ''


class BackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Backup
        fields = ['id', 'event', 'deployment', 'csv_file', 'record_count', 'created_at']
        read_only_fields = ['id', 'event', 'created_at']
