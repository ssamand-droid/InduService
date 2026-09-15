from rest_framework import serializers
from .models import Review, ReviewImage
from users.serializers import UserSerializer

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'product', 'service', 'service_request',
            'order', 'rating', 'title', 'comment', 'pros', 'cons',
            'is_verified_purchase', 'is_approved',
            'seller_response', 'response_date',
            'helpful_count', 'not_helpful_count',
            'images', 'created_at',
        ]
        read_only_fields = ['user', 'is_verified_purchase', 'is_approved',
                           'helpful_count', 'not_helpful_count',
                           'seller_response', 'response_date']

class SellerResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['seller_response']