import test from "node:test";
import assert from "node:assert/strict";
import { createStateStore } from "../src/state-store.js";

test("suppresses duplicate events but still writes periodic heartbeat", () => {
  let clock = 100;
  const lines = [];
  const store = createStateStore({ now: () => clock, writer: (line) => lines.push(line), staleAfterMs: 10 });
  store.apply({ category: "state", name: "working" });
  store.apply({ category: "state", name: "working" });
  assert.deepEqual(lines, ["AURA:STATE:WORKING"]);
  store.heartbeat();
  store.heartbeat();
  assert.deepEqual(lines, ["AURA:STATE:WORKING", "AURA:HEARTBEAT", "AURA:HEARTBEAT"]);
});

test("heartbeat does not replace activity", () => {
  let clock = 100;
  const lines = [];
  const store = createStateStore({ now: () => clock, writer: (line) => lines.push(line), staleAfterMs: 10 });
  store.apply({ category: "activity", name: "read" });
  const activityAt = store.snapshot().lastActivityAt;
  clock = 105;
  store.heartbeat();
  assert.equal(store.snapshot().state, "WORKING");
  assert.equal(store.snapshot().activity, "read");
  assert.equal(store.snapshot().lastActivityAt, activityAt);
  assert.equal(lines.at(-1), "AURA:HEARTBEAT");
});

test("heartbeat does not replace permission state", () => {
  let clock = 100;
  const lines = [];
  const store = createStateStore({ now: () => clock, writer: (line) => lines.push(line), staleAfterMs: 10 });
  store.apply({ category: "attention", name: "permission" });
  const permissionAt = store.snapshot().lastActivityAt;
  assert.equal(store.snapshot().state, "WAITING");
  assert.equal(store.snapshot().attention, "permission");
  clock = 105;
  store.heartbeat();
  assert.equal(store.snapshot().lastActivityAt, permissionAt);
  assert.equal(store.snapshot().state, "WAITING");
  assert.equal(store.snapshot().attention, "permission");
  assert.equal(lines.at(-1), "AURA:HEARTBEAT");
});

test("permission reply state exits waiting", () => {
  const store = createStateStore({ writer: () => {} });
  store.apply({ category: "attention", name: "permission" });
  store.apply({ category: "state", name: "working" });
  assert.equal(store.snapshot().state, "WORKING");
  assert.equal(store.snapshot().attention, undefined);
});

test("falls back to idle when activity is stale", () => {
  let clock = 0;
  const lines = [];
  const store = createStateStore({ now: () => clock, writer: (line) => lines.push(line), staleAfterMs: 10 });
  store.apply({ category: "activity", name: "read" });
  assert.equal(store.snapshot().state, "WORKING");
  clock = 11;
  store.heartbeat();
  assert.equal(store.snapshot().state, "IDLE");
  assert.equal(store.snapshot().activity, undefined);
  assert.equal(store.snapshot().attention, undefined);
  assert.equal(lines.at(-1), "AURA:STATE:IDLE");
  store.heartbeat();
  assert.equal(lines.at(-1), "AURA:STATE:IDLE");
});

test("metrics, progress, and summaries do not extend lifecycle", () => {
  let clock = 0;
  const store = createStateStore({ now: () => clock, writer: () => {}, staleAfterMs: 10 });
  store.apply({ category: "state", name: "working" });
  store.apply({ category: "metric", name: "errors", value: 1 });
  store.apply({ category: "progress", name: "todo", completed: 1, total: 2 });
  store.apply({ category: "summary", name: "files", value: 1 });
  clock = 10;
  store.heartbeat();
  assert.equal(store.snapshot().state, "IDLE");
});

test("does not suppress an event that was not delivered", () => {
  const lines = [];
  let connected = false;
  const store = createStateStore({ writer: (line) => { if (!connected) return false; lines.push(line); } });
  store.apply({ category: "state", name: "working" });
  connected = true;
  store.apply({ category: "state", name: "working" });
  assert.deepEqual(lines, ["AURA:STATE:WORKING"]);
});
