from rest_framework import serializers
import random
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'family_name', 'date', 'access_code', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # Auto-generate access_code if not provided
        if not validated_data.get('access_code') and validated_data.get('family_name'):
            base_code = validated_data['family_name'].upper().replace(' ', '')[:6]
            random_num = random.randint(10000, 99999)
            validated_data['access_code'] = f"{base_code}{random_num}"
        return super().create(validated_data)
