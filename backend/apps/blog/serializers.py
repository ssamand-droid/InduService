from rest_framework import serializers
from django.utils.text import slugify
from .models import BlogPost, BlogCategory, BlogTag

class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name', 'slug']


class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'post_count', 'is_active']
    
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
            'tags', 'read_time', 'view_count', 'published_at', 'is_featured', 'status'
        ]


class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    tags = BlogTagSerializer(many=True, read_only=True)
    related_posts = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ('slug', 'view_count', 'created_at', 'updated_at')
    
    def get_related_posts(self, obj):
        related = BlogPost.objects.filter(
            category=obj.category, status='published'
        ).exclude(id=obj.id)[:3]
        return BlogPostListSerializer(related, many=True).data


# ========== این Serializer برای ایجاد و ویرایش است ==========
class BlogPostCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'title', 'excerpt', 'content', 'category', 'tags',
            'status', 'read_time', 'is_featured',
            'meta_title', 'meta_description', 'meta_keywords',
            'featured_image'
        ]
    
    def validate_title(self, value):
        """اعتبارسنجی عنوان و تولید slug"""
        if not value:
            raise serializers.ValidationError("عنوان مقاله الزامی است")
        return value
    
    def create(self, validated_data):
        from django.utils import timezone
        
        tags_string = validated_data.pop('tags', '')
        request = self.context.get('request')
        
        # تولید slug از عنوان
        base_slug = slugify(validated_data.get('title'), allow_unicode=True)
        slug = base_slug
        counter = 1
        
        # اطمینان از یکتایی slug
        while BlogPost.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # تنظیم تاریخ انتشار
        published_at = None
        if validated_data.get('status') == 'published':
            published_at = timezone.now()
        
        # ایجاد مقاله
        blog_post = BlogPost.objects.create(
            author=request.user,
            slug=slug,
            published_at=published_at,
            **validated_data
        )
        
        # اضافه کردن تگ‌ها
        if tags_string:
            tag_names = [t.strip() for t in tags_string.split(',') if t.strip()]
            for tag_name in tag_names:
                tag, _ = BlogTag.objects.get_or_create(name=tag_name)
                blog_post.tags.add(tag)
        
        return blog_post
    
    def update(self, instance, validated_data):
        from django.utils import timezone
        
        tags_string = validated_data.pop('tags', None)
        
        # اگر عنوان تغییر کرده، slug را بروزرسانی کن
        if 'title' in validated_data and validated_data['title'] != instance.title:
            base_slug = slugify(validated_data['title'], allow_unicode=True)
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exclude(id=instance.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            instance.slug = slug
        
        # اگر وضعیت به منتشر شده تغییر کرد، تاریخ انتشار را تنظیم کن
        if validated_data.get('status') == 'published' and instance.status != 'published':
            validated_data['published_at'] = timezone.now()
        
        # بروزرسانی فیلدها
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # بروزرسانی تگ‌ها
        if tags_string is not None:
            instance.tags.clear()
            tag_names = [t.strip() for t in tags_string.split(',') if t.strip()]
            for tag_name in tag_names:
                tag, _ = BlogTag.objects.get_or_create(name=tag_name)
                instance.tags.add(tag)
        
        return instance