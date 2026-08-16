"""
هندلر خطاهای یکپارچه برای API
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # استانداردسازی ساختار خطا
        # 🆕 هندل کردن data که می‌تونه dict یا list باشه
        if isinstance(response.data, dict):
            message = response.data.get('detail', 'خطایی رخ داده است.')
        elif isinstance(response.data, list):
            message = str(response.data[0]) if response.data else 'خطایی رخ داده است.'
        else:
            message = str(response.data)
        
        custom_response_data = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': message,
                'details': response.data
            }
        }
        response.data = custom_response_data
    else:
        # خطاهای پیش‌بینی نشده
        return Response(
            {
                'success': False,
                'error': {
                    'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                    'message': 'خطای داخلی سرور',
                    'details': str(exc)
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response