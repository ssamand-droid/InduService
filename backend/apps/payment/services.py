"""
سرویس‌های مربوط به پرداخت (اتصال به درگاه بانکی)
"""
import requests
from django.conf import settings
from django.urls import reverse
from .models import Transaction, Invoice

class ZarinPalGateway:
    """کلاس کمکی برای اتصال به زرین‌پال (نمونه)"""
    SANDBOX_URL = 'https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentRequest.json'
    SANDBOX_START_PAY = 'https://sandbox.zarinpal.com/pg/StartPay/'

    @classmethod
    def request_payment(cls, amount, description, callback_url, mobile=None, email=None):
        data = {
            'MerchantID': settings.ZARINPAL_MERCHANT_ID,
            'Amount': amount,
            'Description': description,
            'CallbackURL': callback_url,
        }
        if mobile:
            data['Mobile'] = mobile
        if email:
            data['Email'] = email

        response = requests.post(cls.SANDBOX_URL, data=data)
        result = response.json()
        if result.get('Status') == 100:
            return {
                'success': True,
                'authority': result['Authority'],
                'payment_url': f"{cls.SANDBOX_START_PAY}{result['Authority']}"
            }
        return {'success': False, 'error': f"خطای درگاه: {result.get('Status')}"}

    @classmethod
    def verify_payment(cls, authority, amount):
        data = {
            'MerchantID': settings.ZARINPAL_MERCHANT_ID,
            'Authority': authority,
            'Amount': amount,
        }
        response = requests.post('https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json', data=data)
        result = response.json()
        if result.get('Status') == 100:
            return {'success': True, 'ref_id': result['RefID']}
        return {'success': False, 'error': f"خطای تایید: {result.get('Status')}"}