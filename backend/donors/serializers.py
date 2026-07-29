from rest_framework import serializers
from .models import Donor

class DonorSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.username', read_only=True)

    class Meta:
        model = Donor
        fields = ['id', 'donor_name', 'phone_number', 'amount', 'receipt_id', 'time', 'date', 'method', 'status', 'event_day', 'logged_by', 'logged_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'date', 'created_at', 'updated_at']
