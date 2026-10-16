from rest_framework import serializers
import random
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'family_name', 'date', 'access_code', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'access_code': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def create(self, validated_data):
        # Auto-generate a unique access_code if not provided. The code is
        # derived from the family name, so two families (or two funerals for
        # the same family) must never end up sharing one - keep regenerating
        # until the code is free.
        if not validated_data.get('access_code') and validated_data.get('family_name'):
            base_code = validated_data['family_name'].upper().replace(' ', '')[:6]
            while True:
                random_num = random.randint(10000, 99999)
                candidate = f"{base_code}{random_num}"
                if not Event.objects.filter(access_code=candidate).exists():
                    validated_data['access_code'] = candidate
                    break
        return super().create(validated_data)
