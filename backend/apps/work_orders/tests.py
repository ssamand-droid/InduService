from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from services.models import ServiceRequest, ServiceRequestQuote
from work_orders.models import WorkOrder


class WorkOrderAPITest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.customer = User.objects.create_user(phone_number='09121110001', password='test-pass-123', role='buyer')
        self.provider = User.objects.create_user(phone_number='09121110002', password='test-pass-123', role='service_provider')
        self.request = ServiceRequest.objects.create(
            buyer=self.customer, title='پمپ شماره ۱', description='رفع نشتی', status=ServiceRequest.Status.ACCEPTED,
        )
        self.quote = ServiceRequestQuote.objects.create(
            service_request=self.request, provider=self.provider, quoted_price=125000,
            provider_notes='تعویض آب‌بند', is_selected=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.customer)

    def test_accepted_request_creates_scoped_work_order(self):
        response = self.client.post(f'/api/work-orders/from-request/{self.request.pk}/')
        self.assertEqual(response.status_code, 201)
        work_order = WorkOrder.objects.get(service_request=self.request)
        self.assertEqual(work_order.provider, self.provider)
        self.assertEqual(work_order.scope_snapshot['selected_quote_id'], str(self.quote.pk))
        self.assertEqual(work_order.scope_snapshot['quoted_price'], '125000')

    def test_provider_submits_and_customer_accepts_work(self):
        work_order = WorkOrder.objects.create(
            service_request=self.request, customer=self.customer, provider=self.provider,
        )
        work_order.transition(WorkOrder.Status.IN_PROGRESS, actor=self.provider)
        work_order.transition(WorkOrder.Status.SUBMITTED, actor=self.provider, completion_report='رفع نشتی و تست فشار انجام شد')
        work_order.transition(WorkOrder.Status.ACCEPTED, actor=self.customer)
        work_order.refresh_from_db()
        self.assertEqual(work_order.status, WorkOrder.Status.ACCEPTED)
        self.assertIsNotNone(work_order.started_at)
        self.assertIsNotNone(work_order.submitted_at)
        self.assertIsNotNone(work_order.accepted_at)
