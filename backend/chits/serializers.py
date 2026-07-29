from rest_framework import serializers
from .models import Chit

class ChitSerializer(serializers.ModelSerializer):
    issued_by_name = serializers.CharField(source='issued_by.username', read_only=True)

    class Meta:
        model = Chit
        fields = ['id', 'security_code', 'representative_name', 'number_of_people', 'voucher_type', 'event_day', 'time', 'date', 'issued_by', 'issued_by_name', 'created_at']
        read_only_fields = ['id', 'date', 'created_at']
