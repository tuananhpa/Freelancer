import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduledTasks,
  notificationPayload,
} from "../worker/notifications.mjs";
test("notifications honor disabled sound preference", () => {
  assert.deepEqual(notificationPayload("Hi", "Body", { sound: false }), {
    title: "Hi",
    body: "Body",
    url: "/",
    silent: true,
  });
  assert.equal(
    notificationPayload("Hi", "Body", { sound: true }).silent,
    false,
  );
});
test("missing push credentials do not abort cleanup", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-10-14T00:16:00Z"),
  });
  const changes = [];
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind() {
            return this;
          },
          async all() {
            return {
              results:
                sql === "SELECT * FROM settings"
                  ? [
                      {
                        user_id: "u",
                        data: JSON.stringify({
                          pushEnabled: true,
                          autoBackup: false,
                        }),
                      },
                    ]
                  : [],
            };
          },
          async first() {
            return null;
          },
          async run() {
            changes.push(sql);
            return { meta: { changes: 1 } };
          },
        };
      },
    },
  };
  await scheduledTasks(env);
  assert.ok(changes.includes("DELETE FROM sessions WHERE expires_at<?"));
});
