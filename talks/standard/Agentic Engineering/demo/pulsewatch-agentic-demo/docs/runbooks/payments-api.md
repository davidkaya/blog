# Payments API Runbook

The payments API owns checkout authorization, capture, and settlement webhook processing.

## First checks

- Compare authorization timeout rate with the last successful deployment.
- Check third-party processor status before declaring an internal root cause.
- If EU traffic is affected, confirm whether the regional routing policy changed.

## Mitigation

- Roll back routing changes before retrying deployments.
- Keep checkout-web informed because customers experience the issue there first.
- Use customer-facing language for SEV2 or higher incidents.

## Escalation

Page the service owner when burn rate is >= 4 or error rate is >= 5%.
Page the incident commander for SEV1, burn rate >= 12, or broad customer impact.
