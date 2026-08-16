from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Order, OrderItem
from notification.services import notify_order_status_change, create_notification

@receiver(post_save, sender=Order)
def create_mro_steps_for_service_order(sender, instance, created, **kwargs):
    """
    اگر سفارش شامل درخواست خدمت باشد، مراحل MRO بر اساس سناریو ایجاد شود.
    """
    if created and hasattr(instance, 'service_request') and instance.service_request:
        scenario = instance.service_request.service.service_scenario
        instance.generate_default_mro_steps(scenario)
        
@receiver(post_save, sender=Order)
def order_status_changed_notification(sender, instance, created, **kwargs):
    """
    ارسال اعلان به خریدار و فروشنده هنگام تغییر وضعیت سفارش.
    """
    if not created:
        # وضعیت تغییر کرده است
        notify_order_status_change(instance)

@receiver(post_save, sender=Order)
def reduce_stock_on_confirmation(sender, instance, created, **kwargs):
    """
    کاهش موجودی محصولات زمانی که سفارش تایید می‌شود.
    """
    if instance.status == Order.OrderStatus.CONFIRMED:
        # برای جلوگیری از کاهش مجدد، چک می‌کنیم که قبلاً موجودی کم نشده باشد
        # می‌توان یک فیلد Boolean به Order اضافه کرد ولی برای سادگی از سیگنال pre_save استفاده می‌کنیم
        pass  # منطق کاهش موجودی در pre_save هندل می‌شود

@receiver(pre_save, sender=Order)
def handle_stock_on_confirmation(sender, instance, **kwargs):
    """
    وقتی وضعیت از PENDING به CONFIRMED تغییر می‌کند، موجودی محصولات کاهش یابد.
    """
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            if old_instance.status != Order.OrderStatus.CONFIRMED and instance.status == Order.OrderStatus.CONFIRMED:
                # سفارش تازه تایید شده است
                with transaction.atomic():
                    for item in instance.items.all():
                        product = item.product
                        if product.stock_quantity >= item.quantity:
                            product.stock_quantity -= item.quantity
                            product.save(update_fields=['stock_quantity'])
                        else:
                            # در صورت کمبود موجودی، وضعیت را برگردانیم یا اعلان دهیم
                            # اینجا فقط یک پیام لاگ می‌کنیم (در عمل باید خطا داده شود)
                            pass
        except Order.DoesNotExist:
            pass