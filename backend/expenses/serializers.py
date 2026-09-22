from rest_framework import serializers
from deployments.models import Deployment
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    spent_by = serializers.CharField(max_length=150, required=False, allow_blank=True)
    deployment = serializers.PrimaryKeyRelatedField(
        queryset=Deployment.objects.all(),
        required=False,
        allow_null=True,
    )

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.display_name or obj.recorded_by.username
        return None

    class Meta:
        model = Expense
        fields = [
            'id', 'description', 'spent_by', 'amount', 'date', 'deployment',
            'recorded_by', 'recorded_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']