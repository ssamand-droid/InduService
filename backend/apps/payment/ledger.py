from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from .models import LedgerAccount, LedgerEntry, LedgerJournal


@transaction.atomic
def post_procurement_payment(procurement_payment):
    """Post balanced buyer and supplier journals once a payment is independently verified."""
    payment = procurement_payment
    invoice = payment.invoice
    purchase_order = invoice.purchase_order
    if invoice.currency != purchase_order.currency:
        raise ValueError('Supplier invoice currency must match the purchase order currency.')

    amount = Decimal(payment.amount)
    source_key = f'procurement-payment:{payment.pk}'
    buyer = purchase_order.buyer
    supplier = purchase_order.supplier
    journals = {}

    def account(org, code, name, kind):
        obj, _ = LedgerAccount.objects.get_or_create(
            organization=org, code=code, currency=invoice.currency,
            defaults={'name': name, 'account_type': kind},
        )
        return obj

    def journal(org, memo):
        obj, _ = LedgerJournal.objects.get_or_create(
            organization=org, source_key=source_key,
            defaults={'memo': memo, 'currency': invoice.currency},
        )
        journals[org.pk] = obj
        return obj

    buyer_journal = journal(buyer, f'پرداخت تدارکاتی فاکتور {invoice.invoice_number}')
    supplier_journal = journal(supplier, f'دریافت وجه فاکتور {invoice.invoice_number}')

    entries = [
        (buyer_journal, account(buyer, 'PROCUREMENT_EXPENSE', 'هزینه تدارکات', LedgerAccount.AccountType.EXPENSE), amount, Decimal('0'), 'ثبت هزینه خرید'),
        (buyer_journal, account(buyer, 'BANK_CASH', 'بانک و وجه نقد', LedgerAccount.AccountType.CASH), Decimal('0'), amount, 'پرداخت به تأمین‌کننده'),
        (supplier_journal, account(supplier, 'BANK_CASH', 'بانک و وجه نقد', LedgerAccount.AccountType.CASH), amount, Decimal('0'), 'دریافت وجه از خریدار'),
        (supplier_journal, account(supplier, 'PROCUREMENT_REVENUE', 'درآمد فروش تدارکاتی', LedgerAccount.AccountType.REVENUE), Decimal('0'), amount, 'ثبت درآمد فروش'),
    ]
    for target_journal, target_account, debit, credit, description in entries:
        if not target_journal.entries.filter(account=target_account, debit=debit, credit=credit).exists():
            LedgerEntry.objects.create(
                journal=target_journal, account=target_account,
                debit=debit, credit=credit, description=description,
            )

    for posted in journals.values():
        totals = posted.entries.aggregate(debits=Sum('debit'), credits=Sum('credit'))
        if (totals['debits'] or Decimal('0')) != (totals['credits'] or Decimal('0')):
            raise ValueError('Ledger journal is not balanced.')
    return list(journals.values())
