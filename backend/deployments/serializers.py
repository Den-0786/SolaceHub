from rest_framework import serializers
from .models import Deployment, Hardware

class HardwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hardware
        fields = ['id', 'name', 'hardware_type', 'status', 'battery', 'ip_address', 'deployment', 'created_at']
        read_only_fields = ['id', 'created_at']

class DeploymentSerializer(serializers.ModelSerializer):
    hardware_set = HardwareSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Deployment
        fields = ['id', 'title', 'venue', 'client', 'phone', 'start_date', 'end_date', 'status', 'created_by', 'created_by_name', 'hardware_set', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
