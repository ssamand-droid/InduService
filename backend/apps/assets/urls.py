from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.AssetCategoryViewSet)
router.register(r'all', views.AssetViewSet, basename='asset')
router.register(r'alerts', views.AssetAlertViewSet, basename='alert')

urlpatterns = [
    # Main asset endpoints
    path('', include(router.urls)),
    
    # Nested endpoints for asset parts (without drf-nested-routers)
    path('assets/<uuid:asset_pk>/parts/', views.AssetPartViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-parts-list'),
    path('assets/<uuid:asset_pk>/parts/<int:pk>/', views.AssetPartViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-parts-detail'),
    
    # Nested endpoints for asset documents
    path('assets/<uuid:asset_pk>/documents/', views.AssetDocumentViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-documents-list'),
    path('assets/<uuid:asset_pk>/documents/<int:pk>/', views.AssetDocumentViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-documents-detail'),
    
    # Nested endpoints for maintenance logs
    path('assets/<uuid:asset_pk>/maintenance/', views.AssetMaintenanceLogViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-maintenance-list'),
    path('assets/<uuid:asset_pk>/maintenance/<int:pk>/', views.AssetMaintenanceLogViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-maintenance-detail'),
    
    # Nested endpoints for hotspots
    path('assets/<uuid:asset_pk>/hotspots/', views.DigitalTwinHotspotViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-hotspots-list'),
    path('assets/<uuid:asset_pk>/hotspots/<int:pk>/', views.DigitalTwinHotspotViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-hotspots-detail'),
    
    # Asset custom actions
    path('assets/<uuid:pk>/update_health/', views.AssetViewSet.as_view({
        'post': 'update_health'
    }), name='asset-update-health'),
    path('assets/<uuid:pk>/emergency_stop/', views.AssetViewSet.as_view({
        'post': 'emergency_stop'
    }), name='asset-emergency-stop'),
    path('assets/<uuid:pk>/dashboard/', views.AssetViewSet.as_view({
        'get': 'dashboard'
    }), name='asset-dashboard'),
    path('assets/global_dashboard/', views.AssetViewSet.as_view({
        'get': 'global_dashboard'
    }), name='asset-global-dashboard'),
    path('assets/bulk_import_excel/', views.AssetViewSet.as_view({
        'post': 'bulk_import_excel'
    }), name='asset-bulk-import'),
    path('assets/download_template/', views.AssetViewSet.as_view({
        'get': 'download_template'
    }), name='asset-download-template'),
    # Sensor endpoints
    path('assets/<uuid:asset_pk>/sensors/', views.SensorViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-sensors-list'),
    path('assets/<uuid:asset_pk>/sensors/<int:pk>/', views.SensorViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-sensors-detail'),
    path('assets/<uuid:asset_pk>/sensors/<int:pk>/record_reading/', views.SensorViewSet.as_view({
        'post': 'record_reading'
    }), name='sensor-record-reading'),
    path('assets/<uuid:asset_pk>/sensors/<int:pk>/readings/', views.SensorViewSet.as_view({
        'get': 'readings'
    }), name='sensor-readings'),

    # Hotspot endpoints
    path('assets/<uuid:asset_pk>/hotspots/', views.HotspotViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-hotspots-list'),
    path('assets/<uuid:asset_pk>/hotspots/<int:pk>/', views.HotspotViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-hotspots-detail'),

    # Maintenance Schedule endpoints
    path('assets/<uuid:asset_pk>/schedules/', views.MaintenanceScheduleViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-schedules-list'),
    path('assets/<uuid:asset_pk>/schedules/<int:pk>/', views.MaintenanceScheduleViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-schedules-detail'),
    path('assets/<uuid:asset_pk>/schedules/<int:pk>/mark_completed/', views.MaintenanceScheduleViewSet.as_view({
        'post': 'mark_completed'
    }), name='schedule-mark-completed'),

    # Failure Prediction endpoints
    path('assets/<uuid:asset_pk>/predictions/', views.FailurePredictionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='asset-predictions-list'),
    path('assets/<uuid:asset_pk>/predictions/<int:pk>/', views.FailurePredictionViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='asset-predictions-detail'),
    path('assets/<uuid:asset_pk>/predictions/<int:pk>/resolve/', views.FailurePredictionViewSet.as_view({
        'post': 'resolve'
    }), name='prediction-resolve'),
    path('assets/<uuid:pk>/run_prediction/', views.AssetViewSet.as_view({
        'post': 'run_prediction'
    }), name='asset-run-prediction'),
]