# PulseWatch Severity Policy

## Escalation actions

| Action | When to recommend it |
| --- | --- |
| `page-incident-commander` | SEV1 incidents, burn rate >= 12, error rate >= 15%, or impacted users >= 10000 |
| `page-service-owner` | Burn rate >= 4, error rate >= 5%, or impacted users >= 1000 |
| `watch` | Active incident below paging thresholds |
| `monitor` | Resolved incident |

## Customer communication rules

- Use customer-facing language for `SEV1` and `SEV2`.
- Do not publish root cause until an incident event explicitly confirms it.
- For `mitigating`, say what is being mitigated but avoid claiming the issue is fixed.
- For `resolved`, include monitoring language unless the incident record says no recurrence is
  possible.
