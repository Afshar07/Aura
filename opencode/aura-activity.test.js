import test from "node:test";
import assert from "node:assert/strict";

import {
  AuraActivityPlugin,
  createAuraActivityPlugin,
  eventMappingsForEvent,
  stateForEvent,
} from "./aura-activity.js";

test("maps permission requested and replied lifecycle events", () => {
  assert.deepEqual(eventMappingsForEvent({ type: "permission.asked" }), [
    { category: "attention", name: "permission" },
    { category: "state", name: "waiting" },
  ]);
  assert.deepEqual(eventMappingsForEvent({ type: "permission.replied" }), [
    { category: "state", name: "working" },
  ]);
});

test("preserves session state mappings", () => {
  assert.equal(stateForEvent({ type: "session.status", properties: { status: { type: "busy" } } }), "BUSY");
  assert.equal(stateForEvent({ type: "session.status", properties: { status: { type: "retry" } } }), "BUSY");
  assert.equal(stateForEvent({ type: "session.status", properties: { status: { type: "idle" } } }), "IDLE");
  assert.equal(stateForEvent({ type: "session.idle" }), "IDLE");
  assert.equal(stateForEvent({ type: "session.error" }), "ERROR");
});

test("emits permission requested then replied in order and suppresses duplicates", async () => {
  const emitted = [];
  const plugin = await createAuraActivityPlugin({
    sendEvent: async (event) => emitted.push(["event", event]),
    sendState: async (state) => emitted.push(["state", state]),
  });

  await plugin.event({ event: { type: "permission.asked" } });
  await plugin.event({ event: { type: "permission.asked" } });
  await plugin.event({ event: { type: "permission.replied" } });
  await plugin.event({ event: { type: "permission.replied" } });

  assert.deepEqual(emitted, [
    ["event", { category: "attention", name: "permission" }],
    ["event", { category: "state", name: "waiting" }],
    ["event", { category: "state", name: "working" }],
  ]);
});

test("isolates bridge failures from the plugin handler", async () => {
  const plugin = await createAuraActivityPlugin({
    sendEvent: async () => { throw new Error("bridge down"); },
    sendState: async () => { throw new Error("bridge down"); },
  });

  await assert.doesNotReject(plugin.event({ event: { type: "permission.asked" } }));
  await assert.doesNotReject(plugin.event({ event: { type: "session.status", properties: { status: { type: "busy" } } } }));
});

test("exports the OpenCode plugin factory", async () => {
  assert.equal(typeof AuraActivityPlugin, "function");
});
