import assert from "node:assert/strict";
import test from "node:test";
import { summarizeRisk } from "../src/severity.mjs";

test("resolved incidents are monitored", () => {
  const risk = summarizeRisk({
    status: "resolved",
    severity: "SEV3",
    impactedUsers: 12000,
    metrics: {
      burnRate: 20,
      errorRate: 0.25
    }
  });

  assert.equal(risk.action, "monitor");
  assert.deepEqual(risk.reasons, ["incident is resolved"]);
});

test("service owner is paged when customer impact crosses thresholds", () => {
  const risk = summarizeRisk({
    status: "mitigating",
    severity: "SEV2",
    impactedUsers: 1380,
    metrics: {
      burnRate: 5.4,
      errorRate: 0.073
    }
  });

  assert.equal(risk.action, "page-service-owner");
  assert.match(risk.reasons.join("\n"), /burn rate/);
  assert.match(risk.reasons.join("\n"), /error rate/);
});

test("incident commander is paged for severe signals", () => {
  const risk = summarizeRisk({
    status: "investigating",
    severity: "SEV2",
    impactedUsers: 22000,
    metrics: {
      burnRate: 13,
      errorRate: 0.11
    }
  });

  assert.equal(risk.action, "page-incident-commander");
  assert.match(risk.reasons.join("\n"), /impacted users/);
});
