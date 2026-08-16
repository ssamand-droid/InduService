from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlogPostViewSet, BlogCategoryViewSet

router = DefaultRouter()
router.register(r'posts', BlogPostViewSet)
router.register(r'categories', BlogCategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]