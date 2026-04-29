#!/usr/bin/env node

import { createInterface } from "node:readline";
import { buildIncidentBrief, formatBriefMarkdown } from "../src/brief.mjs";
import { getIncident, getIncidentEvents, getRunbook, listIncidents } from "../src/incidentStore.mjs";

const tools = [
  {
    name: "list_active_incidents",
    description: "List non-resolved PulseWatch incidents, optionally filtered by service.",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description: "Optional service name such as payments-api or checkout-web."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_incident_context",
    description: "Return incident details, timeline events, and the matching runbook excerpt.",
    inputSchema: {
      type: "object",
      properties: {
        incidentId: {
          type: "string",
          description: "Incident id such as INC-1042."
        }
      },
      required: ["incidentId"],
      additionalProperties: false
    }
  },
  {
    name: "draft_incident_brief",
    description: "Create a Markdown incident brief from current PulseWatch fixture data.",
    inputSchema: {
      type: "object",
      properties: {
        incidentId: {
          type: "string",
          description: "Incident id such as INC-1042."
        }
      },
      required: ["incidentId"],
      additionalProperties: false
    }
  },
  {
    name: "lookup_runbook",
    description: "Read the service runbook for a PulseWatch service.",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description: "Service name such as payments-api or checkout-web."
        }
      },
      required: ["service"],
      additionalProperties: false
    }
  }
];

function textContent(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

async function callTool(name, args = {}) {
  if (name === "list_active_incidents") {
    const incidents = await listIncidents({ service: args.service });
    return textContent(incidents.filter((incident) => incident.status !== "resolved"));
  }

  if (name === "get_incident_context") {
    const incident = await getIncident(args.incidentId);
    if (!incident) {
      throw new Error(`Unknown incident: ${args.incidentId}`);
    }

    return textContent({
      incident,
      events: await getIncidentEvents(args.incidentId),
      runbook: await getRunbook(incident.service)
    });
  }

  if (name === "draft_incident_brief") {
    const brief = await buildIncidentBrief(args.incidentId);
    return textContent(formatBriefMarkdown(brief));
  }

  if (name === "lookup_runbook") {
    return textContent(await getRunbook(args.service));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function send(message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);
}

function sendResult(id, result) {
  send({ id, result });
}

function sendError(id, code, message) {
  send({
    id,
    error: {
      code,
      message
    }
  });
}

async function handleRequest(request) {
  if (request.method === "initialize") {
    sendResult(request.id, {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: {
        name: "pulsewatch-agentic-demo",
        version: "0.1.0"
      }
    });
    return;
  }

  if (request.method === "notifications/initialized") {
    return;
  }

  if (request.method === "tools/list") {
    sendResult(request.id, { tools });
    return;
  }

  if (request.method === "tools/call") {
    const { name, arguments: args } = request.params ?? {};
    sendResult(request.id, await callTool(name, args));
    return;
  }

  if (request.method === "resources/list") {
    sendResult(request.id, {
      resources: [
        {
          uri: "pulsewatch://runbooks/payments-api",
          name: "Payments API runbook",
          mimeType: "text/markdown"
        },
        {
          uri: "pulsewatch://runbooks/checkout-web",
          name: "Checkout Web runbook",
          mimeType: "text/markdown"
        }
      ]
    });
    return;
  }

  if (request.method === "resources/read") {
    const uri = request.params?.uri;
    const service = uri?.replace("pulsewatch://runbooks/", "");
    if (!service || service === uri) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    sendResult(request.id, {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: await getRunbook(service)
        }
      ]
    });
    return;
  }

  sendError(request.id, -32601, `Method not found: ${request.method}`);
}

const lines = createInterface({
  input: process.stdin,
  terminal: false
});

for await (const line of lines) {
  if (!line.trim()) {
    continue;
  }

  let request;
  try {
    request = JSON.parse(line);
    await handleRequest(request);
  } catch (error) {
    sendError(request?.id ?? null, -32000, error.message);
  }
}
