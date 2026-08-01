import test from "node:test";
import assert from "node:assert/strict";
import { eventToLine, heartbeatLine, normalizeEvent } from "../src/protocol.js";

test("converts supported events to exact serial lines", () => {
  assert.equal(heartbeatLine(), "AURA:HEARTBEAT");
  assert.equal(eventToLine({ category: "state", name: "working" }), "AURA:STATE:WORKING");
  assert.equal(eventToLine({ category: "activity", name: "read" }), "AURA:ACTIVITY:READ");
  assert.equal(eventToLine({ category: "attention", name: "permission" }), "AURA:ATTENTION:PERMISSION");
  assert.equal(eventToLine({ category: "metric", name: "errors", value: 2 }), "AURA:METRIC:ERRORS:2");
  assert.equal(eventToLine({ category: "metric", name: "warnings", value: 1 }), "AURA:METRIC:WARNINGS:1");
  assert.equal(eventToLine({ category: "progress", name: "todo", completed: 2, total: 3 }), "AURA:PROGRESS:TODO:2:3");
  assert.equal(eventToLine({ category: "summary", name: "files", value: 4 }), "AURA:SUMMARY:FILES:4");
});

test("accepts unknown activities with degraded normalization", () => {
  assert.deepEqual(normalizeEvent({ category: "activity", name: "deploy" }), { category: "activity", name: "other" });
  assert.equal(eventToLine({ category: "activity", name: "deploy" }), "AURA:ACTIVITY:OTHER");
});

test("rejects invalid categories, names, metrics, and todo values", () => {
  assert.throws(() => normalizeEvent({ category: "unknown", name: "x" }), /Unknown event category/);
  assert.throws(() => normalizeEvent({ category: "state", name: "nope" }), /Unknown state/);
  assert.throws(() => normalizeEvent({ category: "attention", name: "nope" }), /Unknown attention/);
  assert.throws(() => normalizeEvent({ category: "metric", name: "errors", value: -1 }), /nonnegative safe integer/);
  assert.throws(() => normalizeEvent({ category: "progress", name: "todo", completed: 4, total: 3 }), /must not exceed/);
  assert.throws(() => normalizeEvent({ category: "summary", name: "files", value: 1.2 }), /nonnegative safe integer/);
});

test("maps legacy states", () => {
  assert.equal(eventToLine({ category: "state", name: "BUSY" }), "AURA:STATE:WORKING");
  assert.equal(eventToLine({ category: "state", name: "IDLE" }), "AURA:STATE:IDLE");
  assert.equal(eventToLine({ category: "state", name: "ERROR" }), "AURA:STATE:ERROR");
});
