# Checkout Web Runbook

Checkout Web owns the browser checkout flow, confirmation page, and client-side telemetry.

## First checks

- Compare Real User Monitoring p95 latency with API health checks.
- Check cache hit rate after content or feature-flag rollouts.
- Confirm whether order creation is healthy before writing customer impact.

## Mitigation

- Roll back content bundle changes when cache hit rate drops sharply.
- Coordinate with payments-api before publishing payment-related claims.
- Keep updates short when the issue is latency-only and order creation is healthy.

## Escalation

Page the web service owner when p95 latency is above 2000 ms and customer impact is confirmed.
