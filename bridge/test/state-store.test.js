import test from "node:test";
import assert from "node:assert/strict";
import { createStateStore } from "../src/state-store.js";

test("suppresses duplicate events but still writes heartbeat", () => {
  let clock = 100;
  const lines = [];
  const store = createStateStore({ now: () => clock, writer: (line) => lines.push(line), staleAfterMs: 10 });
  store.apply({ category: "state", name: "working" });
  store.apply({ category: "state", name: "working" });
  assert.deepEqual(lines, ["AURA:STATE:WORKING"]);
  store.heartbeat();
  store.heartbeat();
  assert.deepEqual(lines, ["AURA:STATE:WORKING", "AURA:STATE:WORKING", "AURA:STATE:WORKING"]);
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
  assert.equal(lines.at(-1), "AURA:STATE:IDLE");
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
