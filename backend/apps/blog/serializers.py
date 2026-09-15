from rest_framework import serializers
from .models import BlogPost, BlogCategory, BlogTag

class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name', 'slug']

class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()

class BlogPostListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    tags = BlogTagSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image',
            'category_name', 'category_slug', 'author_name',
            'tags', 'read_time', 'view_count', 'published_at', 'is_featured'
        ]

class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    tags = BlogTagSerializer(many=True, read_only=True)
    related_posts = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = '__all__'

    def get_related_posts(self, obj):
        related = BlogPost.objects.filter(
            category=obj.category, status='published'
        ).exclude(id=obj.id)[:3]
        return BlogPostListSerializer(related, many=True).data