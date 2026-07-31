from rest_framework import serializers
from deployments.models import Deployment
from .models import Chit


class ChitSerializer(serializers.ModelSerializer):
    issued_by_name = serializers.CharField(source='issued_by.username', read_only=True)
    deployment = serializers.PrimaryKeyRelatedField(
        queryset=Deployment.objects.all(),
        required=False,
        allow_null=True,
    )
    deceased_name = serializers.CharField(source='deployment.deceased_name', read_only=True)
    deceased_age = serializers.IntegerField(source='deployment.deceased_age', read_only=True)
    deceased_image = serializers.ImageField(source='deployment.deceased_image', read_only=True)

    class Meta:
        model = Chit
        fields = [
            'id', 'security_code', 'representative_name', 'number_of_people',
            'voucher_type', 'event_day', 'time', 'date', 'deployment',
            'deceased_name', 'deceased_age', 'deceased_image',
            'issued_by', 'issued_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'date', 'created_at']
