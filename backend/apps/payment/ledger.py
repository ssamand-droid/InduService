from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from .models import LedgerAccount, LedgerEntry, LedgerJournal
from procurement.models import ProcurementPayment, SupplierInvoice


@transaction.atomic
def post_procurement_payment(procurement_payment):
    """Post exactly one balanced pair of journals for a verified payment."""

    # Reload and lock the authoritative database row; do not trust stale objects.
    payment = ProcurementPayment.objects.select_for_update().select_related(
        'invoice__purchase_order__buyer',
        'invoice__purchase_order__supplier',
    ).get(pk=procurement_payment.pk)

    if payment.status != ProcurementPayment.Status.VERIFIED:
        raise ValueError('Only verified procurement payments can be posted.')

    invoice = payment.invoice
    purchase_order = invoice.purchase_order

    if invoice.status not in (
        SupplierInvoice.Status.MATCHED,
        SupplierInvoice.Status.SETTLED,
    ):
        raise ValueError('Supplier invoice is not in a payable status.')

    if invoice.currency != purchase_order.currency:
        raise ValueError(
            'Supplier invoice currency must match the purchase order currency.'
        )

    amount = Decimal(payment.amount)
    if amount <= 0:
        raise ValueError('Procurement payment amount must be greater than zero.')

    buyer = purchase_order.buyer
    supplier = purchase_order.supplier

    if buyer.pk == supplier.pk:
        raise ValueError('Buyer and supplier organizations must be different.')

    source_key = f'procurement-payment:{payment.pk}'

    def account(org, code, name, kind):
        obj, _ = LedgerAccount.objects.get_or_create(
            organization=org,
            code=code,
            currency=invoice.currency,
            defaults={'name': name, 'account_type': kind},
        )
        if obj.account_type != kind or obj.currency != invoice.currency:
            raise ValueError(
                f'Ledger account configuration mismatch: {code}.'
            )
        return obj

    def journal(org, memo):
        obj, _ = LedgerJournal.objects.get_or_create(
            organization=org,
            source_key=source_key,
            defaults={'memo': memo, 'currency': invoice.currency},
        )
        if obj.currency != invoice.currency:
            raise ValueError(
                'Existing ledger journal currency does not match payment currency.'
            )
        return obj

    buyer_journal = journal(
        buyer, f'پرداخت تدارکاتی فاکتور {invoice.invoice_number}'
    )
    supplier_journal = journal(
        supplier, f'دریافت وجه فاکتور {invoice.invoice_number}'
    )

    buyer_expense = account(
        buyer, 'PROCUREMENT_EXPENSE', 'هزینه تدارکات',
        LedgerAccount.AccountType.EXPENSE,
    )
    buyer_cash = account(
        buyer, 'BANK_CASH', 'بانک و وجه نقد',
        LedgerAccount.AccountType.CASH,
    )
    supplier_cash = account(
        supplier, 'BANK_CASH', 'بانک و وجه نقد',
        LedgerAccount.AccountType.CASH,
    )
    supplier_revenue = account(
        supplier, 'PROCUREMENT_REVENUE', 'درآمد فروش تدارکاتی',
        LedgerAccount.AccountType.REVENUE,
    )

    expected = {
        buyer_journal.pk: [
            (buyer_expense, amount, Decimal('0'), 'ثبت هزینه خرید'),
            (buyer_cash, Decimal('0'), amount, 'پرداخت به تأمین‌کننده'),
        ],
        supplier_journal.pk: [
            (supplier_cash, amount, Decimal('0'), 'دریافت وجه از خریدار'),
            (supplier_revenue, Decimal('0'), amount, 'ثبت درآمد فروش'),
        ],
    }

    journals = [buyer_journal, supplier_journal]
    existing = {
        item.pk: list(
            item.entries.select_related('account').order_by('pk')
        )
        for item in journals
    }

    existing_count = sum(len(rows) for rows in existing.values())

    if existing_count:
        # A partial or altered posting is corruption, not an invitation to append
        # more entries and silently create a second financial result.
        for item in journals:
            actual = sorted(
                (
                    row.account_id,
                    row.debit,
                    row.credit,
                    row.description,
                )
                for row in existing[item.pk]
            )
            wanted = sorted(
                (
                    acc.pk,
                    debit,
                    credit,
                    description,
                )
                for acc, debit, credit, description in expected[item.pk]
            )
            if actual != wanted:
                raise ValueError(
                    'Existing ledger posting is incomplete or differs from '
                    'the verified payment. Manual reconciliation is required.'
                )
    else:
        for item in journals:
            for acc, debit, credit, description in expected[item.pk]:
                LedgerEntry.objects.create(
                    journal=item,
                    account=acc,
                    debit=debit,
                    credit=credit,
                    description=description,
                )

    for item in journals:
        totals = item.entries.aggregate(
            debits=Sum('debit'),
            credits=Sum('credit'),
        )
        debits = totals['debits'] or Decimal('0')
        credits = totals['credits'] or Decimal('0')
        if debits != credits:
            raise ValueError('Ledger journal is not balanced.')

    return journals
