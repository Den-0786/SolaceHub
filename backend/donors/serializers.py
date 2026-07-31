from rest_framework import serializers
from deployments.models import Deployment
from .models import Donor


class DonorSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.username', read_only=True)
    deployment = serializers.PrimaryKeyRelatedField(
        queryset=Deployment.objects.all(),
        required=False,
        allow_null=True,
    )
    deceased_name = serializers.CharField(source='deployment.deceased_name', read_only=True)
    deceased_age = serializers.IntegerField(source='deployment.deceased_age', read_only=True)
    deceased_image = serializers.ImageField(source='deployment.deceased_image', read_only=True)

    class Meta:
        model = Donor
        fields = [
            'id', 'donor_name', 'phone_number', 'amount', 'receipt_id', 'time',
            'date', 'method', 'status', 'event_day', 'deployment',
            'deceased_name', 'deceased_age', 'deceased_image',
            'logged_by', 'logged_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'date', 'created_at', 'updated_at']
