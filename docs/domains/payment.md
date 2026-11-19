# Payment & Finance Domain

**Current app:** `backend/apps/payment` · **Observed models:** CommissionRule, Wallet, WalletTransaction, Invoice, Payment, PaymentReceipt, Transaction, Settlement.

## Responsibility

Represent financial obligations and records, payment/receipt activity, commission, wallet movements, and settlement.

## Risk profile

The Phase 0 audit flags sensitive financial calculations and direct coupling to `orders` and `services`. Transaction/payment terminology overlaps and refund/payment lifecycle semantics require review. Treat money, currency, payer/payee, status, and immutable audit history as high-risk data.

## Invariants

Financial status remains independent from business status. Work completion or customer acceptance does not itself prove payment or settlement. Avoid recalculation/rewriting of historical financial facts; determine idempotency and reconciliation rules before changes. See [ADR-004](../decisions/ADR-004.md) and [dispute lifecycle](../workflows/dispute-lifecycle.md).
