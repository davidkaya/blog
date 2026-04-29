#!/usr/bin/env node

async function readStdin() {
  let input = "";
  process.stdin.setEncoding("utf8");

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  return input;
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output);
    }
    return output;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectStrings(item, output);
    }
  }

  return output;
}

const raw = await readStdin();
const payload = raw ? JSON.parse(raw) : {};
const allText = JSON.stringify(payload);
const touchedFixtures = collectStrings(payload).some(
  (value) =>
    value.includes("data/incidents.json") ||
    value.includes("data\\incidents.json") ||
    value.includes("docs/runbooks/") ||
    value.includes("docs\\runbooks\\")
);

if (touchedFixtures && !allText.includes("ALLOW_FIXTURE_EDIT")) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "Demo fixtures and runbooks are protected. Add ALLOW_FIXTURE_EDIT to the prompt if this edit is intentional."
      }
    })
  );
  process.exit(0);
}

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow"
    }
  })
);
