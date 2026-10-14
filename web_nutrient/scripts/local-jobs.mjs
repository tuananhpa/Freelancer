import { readFileSync } from "node:fs";
const secret = readFileSync(".dev.vars", "utf8").match(
  /JOB_TOKEN="([^"]+)"/,
)?.[1];
if (!secret) throw new Error("Run npm run setup first.");
async function tick() {
  try {
    const r = await fetch("http://127.0.0.1:8787/api/jobs/run", {
      method: "POST",
      headers: { "x-nutri-request": "1", authorization: "Bearer " + secret },
    });
    if (!r.ok) console.log("Scheduled work returned " + r.status);
  } catch {
    console.log("Scheduled work waiting for local server.");
  }
}
await tick();
setInterval(tick, 60000);
console.log("Local reminders and daily backup scheduler running.");
