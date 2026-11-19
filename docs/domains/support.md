# Support & Disputes Domain

**Current app:** `backend/apps/support` · **Observed models:** TicketStatus, TicketPriority, TicketCategory, Ticket, TicketMessage, DisputeResolution, Dispute.

## Responsibility

Handle support conversations and dispute records/resolutions.

## Current-state questions

Inventory status choices and transitions, requester/respondent access, evidence attachments, links to service/order/contract/payment, resolution authority, reopen behavior, and audit history. A dispute must preserve underlying business and financial records rather than silently mutate or erase them.

## Lifecycle

The documented dispute flow is a desired operational outline pending source/state verification, not a claim that all stages or policies are implemented. See [dispute lifecycle](../workflows/dispute-lifecycle.md).
