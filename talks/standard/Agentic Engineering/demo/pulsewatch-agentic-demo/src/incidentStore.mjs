import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function readJson(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  return JSON.parse(await readFile(fullPath, "utf8"));
}

function assertSafeServiceName(service) {
  if (!/^[a-z0-9-]+$/.test(service)) {
    throw new Error(`Unsafe service name: ${service}`);
  }
}

export async function listIncidents(filters = {}) {
  const incidents = await readJson("data/incidents.json");

  return incidents.filter((incident) => {
    if (filters.status && incident.status !== filters.status) {
      return false;
    }

    if (filters.service && incident.service !== filters.service) {
      return false;
    }

    return true;
  });
}

export async function getIncident(incidentId) {
  const incidents = await listIncidents();
  return incidents.find((incident) => incident.id === incidentId) ?? null;
}

export async function getIncidentEvents(incidentId) {
  const events = await readJson("data/events.json");
  return events
    .filter((event) => event.incidentId === incidentId)
    .sort((left, right) => left.time.localeCompare(right.time));
}

export async function getRunbook(service) {
  assertSafeServiceName(service);
  return readFile(path.join(projectRoot, "docs", "runbooks", `${service}.md`), "utf8");
}
