const BRIDGE_BASE_URL = "http://127.0.0.1:43110";
const REQUEST_TIMEOUT_MS = 300;

const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const configuredLogLevel =
  process.env.AURA_LOG_LEVEL?.toLowerCase() ?? "warn";

const logLevel =
  LOG_LEVELS[configuredLogLevel] ?? LOG_LEVELS.warn;

/**
 * @typedef {"BUSY" | "IDLE" | "ERROR" | "WORKING"} TAuraState
 */

/**
 * @typedef {{
 *   category: string;
 *   name: string;
 * }} IAuraEvent
 */

/**
 * @typedef {{
 *   type?: string;
 *   properties?: {
 *     status?: {
 *       type?: string;
 *     };
 *   };
 * }} IOpenCodeEvent
 */

/**
 * @param {"error" | "warn" | "info" | "debug"} level
 * @param {string} message
 */
function log(level, message) {
  if (LOG_LEVELS[level] > logLevel) return;

  const writer =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;

  writer(`Aura plugin: ${message}`);
}

/**
 * @param {number} timeoutMs
 * @returns {{ signal: AbortSignal; dispose: () => void }}
 */
function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  timeoutId.unref?.();

  return {
    signal: controller.signal,
    dispose: () => clearTimeout(timeoutId),
  };
}

/**
 * @param {IOpenCodeEvent} event
 * @returns {TAuraState | undefined}
 */
function stateForEvent(event) {
  if (event.type === "session.idle") {
    return "IDLE";
  }

  if (event.type === "session.error") {
    return "ERROR";
  }

  if (
    event.type === "permission.replied" ||
    event.type === "permission.v2.replied" ||
    event.type === "question.replied" ||
    event.type === "question.v2.replied" ||
    event.type === "question.rejected" ||
    event.type === "question.v2.rejected"
  ) {
    return "WORKING";
  }

  if (event.type === "session.status") {
    const status = event.properties?.status?.type;

    if (status === "busy" || status === "retry") {
      return "BUSY";
    }

    if (status === "idle") {
      return "IDLE";
    }
  }

  return undefined;
}

/**
 * @param {IOpenCodeEvent} event
 * @returns {IAuraEvent[]}
 */
function eventMappingsForEvent(event) {
  if (
    event.type === "permission.asked" ||
    event.type === "permission.v2.asked"
  ) {
    return [
      {
        category: "attention",
        name: "permission",
      },
    ];
  }

  if (
    event.type === "question.asked" ||
    event.type === "question.v2.asked"
  ) {
    return [
      {
        category: "attention",
        name: "user_input",
      },
    ];
  }

  return [];
}

/**
 * @param {TAuraState} state
 * @returns {Promise<void>}
 */
async function sendState(state) {
  const timeout = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/state`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ state }),
      signal: timeout.signal,
    });

    if (!response.ok) {
      log(
        "warn",
        `bridge rejected state ${state} (${response.status}).`,
      );
    }
  } catch (error) {
    log(
      "debug",
      `bridge unavailable (${
        error instanceof Error ? error.message : "request failed"
      }).`,
    );
  } finally {
    timeout.dispose();
  }
}

/**
 * @param {IAuraEvent} event
 * @returns {Promise<void>}
 */
async function sendEvent(event) {
  const timeout = createTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/event`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
      signal: timeout.signal,
    });

    if (!response.ok) {
      log(
        "warn",
        `bridge rejected ${event.category}/${event.name} (${response.status}).`,
      );
    }
  } catch (error) {
    log(
      "debug",
      `bridge unavailable (${
        error instanceof Error ? error.message : "request failed"
      }).`,
    );
  } finally {
    timeout.dispose();
  }
}

/**
 * This must be the only exported function in this plugin file.
 *
 * @returns {Promise<{
 *   event: ({ event }: { event: IOpenCodeEvent }) => Promise<void>;
 * }>}
 */
export const AuraActivityPlugin = async () => {
  /** @type {TAuraState | undefined} */
  let lastState;

  return {
    event: async ({ event }) => {
      const mappedEvents = eventMappingsForEvent(event);

      if (mappedEvents.length > 0) {
        lastState = undefined;
      }

      /*
       * Do not await bridge traffic.
       *
       * OpenCode currently invokes event hooks without awaiting their returned
       * promises, but explicit fire-and-forget keeps the plugin's intention
       * clear and prevents future hook behavior from blocking on the bridge.
       */
      for (const mappedEvent of mappedEvents) {
        void sendEvent(mappedEvent);
      }

      const state = stateForEvent(event);

      if (!state || state === lastState) {
        return;
      }

      lastState = state;
      log("info", `state ${state}.`);

      void sendState(state);
    },
  };
};
