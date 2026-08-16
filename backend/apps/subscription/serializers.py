from rest_framework import serializers
from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    monthly_price_display = serializers.CharField(read_only=True)
    yearly_price_display = serializers.CharField(read_only=True)

    class Meta:
        model = Plan
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    plan_slug = serializers.SlugRelatedField(
        source='plan', slug_field='slug', queryset=Plan.objects.all(), write_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ['user', 'start_date', 'end_date', 'created_at']