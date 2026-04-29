# INC-1042: Elevated checkout payment failures

## Summary

We are responding to elevated checkout payment failures affecting the payments-api service.

## Impact

Customers in the EU region may see payment authorization timeouts during checkout.

## Current status

The team has rolled back the latest payments-api routing change and is monitoring processor latency.

## Next update

We will provide the next update within 30 minutes.

## Internal evidence

- `INC-1042` fixture reports `status: mitigating`.
- Timeline event at `2026-04-29T10:22:00Z` confirms the routing rollback.
- Payments API runbook says to check processor status before declaring root cause.
