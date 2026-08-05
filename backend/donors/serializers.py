from rest_framework import serializers
from deployments.models import Deployment
from .models import Donor


class DonorSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.SerializerMethodField()
    deployment = serializers.PrimaryKeyRelatedField(
        queryset=Deployment.objects.all(),
        required=False,
        allow_null=True,
    )
    deceased_name = serializers.CharField(source='deployment.deceased_name', read_only=True)
    deceased_age = serializers.IntegerField(source='deployment.deceased_age', read_only=True)
    deceased_image = serializers.ImageField(source='deployment.deceased_image', read_only=True)

    def get_logged_by_name(self, obj):
        if obj.logged_by:
            return obj.logged_by.display_name or obj.logged_by.username
        return None

    class Meta:
        model = Donor
        fields = [
            'id', 'donor_name', 'phone_number', 'amount', 'receipt_id', 'time',
            'date', 'method', 'status', 'event_day', 'operator_name', 'deployment',
            'deceased_name', 'deceased_age', 'deceased_image',
            'logged_by', 'logged_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'date', 'created_at', 'updated_at']
