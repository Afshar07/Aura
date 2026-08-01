import test from "node:test";
import assert from "node:assert/strict";

import * as pluginModule from "./aura-activity.js";

const { AuraActivityPlugin } = pluginModule;

/**
 * @param {Array<{ url: string; options: RequestInit }>} calls
 * @param {number} expectedCount
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
async function waitForFetchCalls(calls, expectedCount, timeoutMs = 250) {
  const deadline = Date.now() + timeoutMs;

  while (calls.length < expectedCount && Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
  }

  assert.equal(calls.length, expectedCount);
}

/**
 * @param {(calls: Array<{ url: string; options: RequestInit }>) => Promise<void>} run
 * @returns {Promise<void>}
 */
async function withMockFetch(run) {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    await run(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/**
 * @param {{ url: string; options: RequestInit }} call
 * @param {string} path
 * @param {object} body
 */
function assertPost(call, path, body) {
  assert.equal(call.url, `http://127.0.0.1:43110${path}`);
  assert.equal(call.options.method, "POST");
  assert.equal(call.options.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(call.options.body), body);
}

test("exports only the OpenCode plugin entry function", () => {
  assert.deepEqual(Object.keys(pluginModule), ["AuraActivityPlugin"]);
  assert.equal(typeof AuraActivityPlugin, "function");
});

test("maps session states and suppresses repeated state values", async () => {
  await withMockFetch(async (calls) => {
    const plugin = await AuraActivityPlugin();

    await plugin.event({ event: { type: "session.status", properties: { status: { type: "busy" } } } });
    await plugin.event({ event: { type: "session.status", properties: { status: { type: "busy" } } } });
    await plugin.event({ event: { type: "session.status", properties: { status: { type: "retry" } } } });
    await plugin.event({ event: { type: "session.status", properties: { status: { type: "idle" } } } });
    await plugin.event({ event: { type: "session.idle" } });
    await plugin.event({ event: { type: "session.error" } });
    await waitForFetchCalls(calls, 3);

    assertPost(calls[0], "/state", { state: "BUSY" });
    assertPost(calls[1], "/state", { state: "IDLE" });
    assertPost(calls[2], "/state", { state: "ERROR" });
  });
});

test("maps attention and working lifecycle events without attention deduplication", async () => {
  await withMockFetch(async (calls) => {
    const plugin = await AuraActivityPlugin();

    for (const type of ["permission.asked", "permission.v2.asked"]) {
      await plugin.event({ event: { type } });
    }
    for (const type of ["question.asked", "question.v2.asked"]) {
      await plugin.event({ event: { type } });
    }
    for (const type of [
      "permission.replied",
      "permission.v2.replied",
      "question.replied",
      "question.v2.replied",
      "question.rejected",
      "question.v2.rejected",
    ]) {
      const lifecyclePlugin = await AuraActivityPlugin();
      await lifecyclePlugin.event({ event: { type } });
    }

    await waitForFetchCalls(calls, 10);
    assert.deepEqual(calls.slice(0, 4).map((call) => JSON.parse(call.options.body)), [
      { category: "attention", name: "permission" },
      { category: "attention", name: "permission" },
      { category: "attention", name: "user_input" },
      { category: "attention", name: "user_input" },
    ]);
    for (const call of calls.slice(4)) {
      assertPost(call, "/state", { state: "WORKING" });
    }
    for (const call of calls.slice(0, 4)) {
      assertPost(call, "/event", JSON.parse(call.options.body));
    }
  });
});

test("emits WORKING after each permission cycle on the same plugin instance", async () => {
  await withMockFetch(async (calls) => {
    const plugin = await AuraActivityPlugin();

    await plugin.event({ event: { type: "permission.asked" } });
    await plugin.event({ event: { type: "permission.replied" } });
    await plugin.event({ event: { type: "permission.asked" } });
    await plugin.event({ event: { type: "permission.replied" } });
    await waitForFetchCalls(calls, 4);

    assertPost(calls[0], "/event", { category: "attention", name: "permission" });
    assertPost(calls[1], "/state", { state: "WORKING" });
    assertPost(calls[2], "/event", { category: "attention", name: "permission" });
    assertPost(calls[3], "/state", { state: "WORKING" });
  });
});

test("ignores unknown events", async () => {
  await withMockFetch(async (calls) => {
    const plugin = await AuraActivityPlugin();

    await plugin.event({ event: { type: "unknown.event" } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(calls.length, 0);
  });
});

test("does not reject when HTTP fails or never resolves", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => {
      throw new Error("bridge down");
    };
    const failedPlugin = await AuraActivityPlugin();
    await assert.doesNotReject(
      failedPlugin.event({ event: { type: "session.status", properties: { status: { type: "busy" } } } }),
    );

    globalThis.fetch = () => new Promise(() => {});
    const hangingPlugin = await AuraActivityPlugin();
    await assert.doesNotReject(
      Promise.race([
        hangingPlugin.event({ event: { type: "permission.asked" } }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("event hook blocked")), 50);
        }),
      ]),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
