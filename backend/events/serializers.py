from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'family_name', 'date', 'access_code', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
