const ESCALATION_THRESHOLDS = Object.freeze({
  serviceOwner: {
    burnRate: 4,
    errorRate: 0.05,
    impactedUsers: 1000
  },
  incidentCommander: {
    burnRate: 12,
    errorRate: 0.15,
    impactedUsers: 10000
  }
});

function normalizeRate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return value > 1 ? value / 100 : value;
}

function addReason(reasons, label, actual, threshold, formatter = String) {
  if (actual >= threshold) {
    reasons.push(`${label} ${formatter(actual)} crossed ${formatter(threshold)}`);
  }
}

function formatPercent(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

export function summarizeRisk(incident) {
  const metrics = incident.metrics ?? {};
  const burnRate = metrics.burnRate ?? 0;
  const errorRate = normalizeRate(metrics.errorRate);
  const impactedUsers = incident.impactedUsers ?? 0;

  if (incident.status === "resolved") {
    return {
      action: "monitor",
      reasons: ["incident is resolved"]
    };
  }

  const commanderReasons = [];
  addReason(commanderReasons, "burn rate", burnRate, ESCALATION_THRESHOLDS.incidentCommander.burnRate);
  addReason(
    commanderReasons,
    "error rate",
    errorRate,
    ESCALATION_THRESHOLDS.incidentCommander.errorRate,
    formatPercent
  );
  addReason(
    commanderReasons,
    "impacted users",
    impactedUsers,
    ESCALATION_THRESHOLDS.incidentCommander.impactedUsers
  );

  if (incident.severity === "SEV1" || commanderReasons.length > 0) {
    return {
      action: "page-incident-commander",
      reasons: incident.severity === "SEV1" ? ["incident is already SEV1", ...commanderReasons] : commanderReasons
    };
  }

  const ownerReasons = [];
  addReason(ownerReasons, "burn rate", burnRate, ESCALATION_THRESHOLDS.serviceOwner.burnRate);
  addReason(ownerReasons, "error rate", errorRate, ESCALATION_THRESHOLDS.serviceOwner.errorRate, formatPercent);
  addReason(ownerReasons, "impacted users", impactedUsers, ESCALATION_THRESHOLDS.serviceOwner.impactedUsers);

  if (ownerReasons.length > 0) {
    return {
      action: "page-service-owner",
      reasons: ownerReasons
    };
  }

  return {
    action: "watch",
    reasons: ["all signals are below paging thresholds"]
  };
}
