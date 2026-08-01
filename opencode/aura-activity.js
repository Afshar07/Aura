const BRIDGE_BASE_URL = "http://127.0.0.1:43110";
const REQUEST_TIMEOUT_MS = 300;
const LOG_LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const configuredLogLevel = process.env.AURA_LOG_LEVEL?.toLowerCase() ?? "warn";
const logLevel = LOG_LEVELS[configuredLogLevel] ?? LOG_LEVELS.warn;

/**
 * Converts an OpenCode event into the small state vocabulary understood by the bridge.
 *
 * @param {{ type?: string, properties?: { status?: { type?: string } } }} event
 * @returns {"BUSY"|"IDLE"|"ERROR"|undefined}
 */
export function stateForEvent(event) {
  if (event.type === "session.idle") return "IDLE";
  if (event.type === "session.error") return "ERROR";

  if (event.type === "session.status") {
    const status = event.properties?.status?.type;
    if (status === "busy" || status === "retry") return "BUSY";
    if (status === "idle") return "IDLE";
  }

  return undefined;
}

function log(level, message) {
  if (LOG_LEVELS[level] > logLevel) return;
  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  writer(`Aura plugin: ${message}`);
}

/**
 * Sends one state to the optional local bridge without allowing transport failures to escape.
 *
 * @param {"BUSY"|"IDLE"|"ERROR"|"WORKING"} state
 * @returns {Promise<void>}
 */
export async function sendState(state) {
  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/state`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) log("warn", `bridge rejected ${state} (${response.status}).`);
  } catch (error) {
    log("warn", `bridge unavailable (${error instanceof Error ? error.message : "request failed"}).`);
  }
}

/**
 * Sends one generic event to the optional local bridge without blocking OpenCode.
 *
 * @param {{ category: string, name: string }} event
 * @returns {Promise<void>}
 */
export async function sendEvent(event) {
  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/event`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      log("warn", `bridge rejected ${event.category}/${event.name} (${response.status}).`);
      return;
    }

  } catch (error) {
    log("warn", `bridge unavailable (${error instanceof Error ? error.message : "request failed"}).`);
  }
}

export function eventMappingsForEvent(event) {
  if (event.type === "permission.asked") {
    return [
      { category: "attention", name: "permission" },
      { category: "state", name: "waiting" },
    ];
  }

  if (event.type === "permission.replied") {
    return [{ category: "state", name: "working" }];
  }

  return [];
}

/**
 * Creates an OpenCode plugin with isolated lifecycle state and injectable bridge transports.
 *
 * @param {{ sendEvent?: (event: { category: string, name: string }) => Promise<void>, sendState?: (state: "BUSY"|"IDLE"|"ERROR"|"WORKING") => Promise<void> }} [transports]
 * @returns {Promise<{ event: ({ event }: { event: { type?: string, properties?: { status?: { type?: string } } } }) => Promise<void> }>}
 */
export const createAuraActivityPlugin = async ({
  sendEvent: sendEventTransport = sendEvent,
  sendState: sendStateTransport = sendState,
} = {}) => {
  let lastState;
  let lastEventKey;
  let eventQueue = Promise.resolve();

  const handleEvent = async (event) => {
    const eventKey = JSON.stringify(event);
    if (eventKey === lastEventKey) return;
    lastEventKey = eventKey;

    const mappings = eventMappingsForEvent(event);
    if (mappings.length > 0) {
      for (const mappedEvent of mappings) {
        try {
          await sendEventTransport(mappedEvent);
        } catch (error) {
          log("warn", `bridge unavailable (${error instanceof Error ? error.message : "request failed"}).`);
        }
      }
      return;
    }

    const state = stateForEvent(event);
    if (!state || state === lastState) return;

    lastState = state;
    log("info", `state ${state}.`);
    try {
      await sendStateTransport(state);
    } catch (error) {
      log("warn", `bridge unavailable (${error instanceof Error ? error.message : "request failed"}).`);
    }
  };

  return {
    event: ({ event }) => {
      const task = eventQueue.then(() => handleEvent(event));
      eventQueue = task.catch(() => {});
      return task.catch(() => {});
    },
  };
};

export const AuraActivityPlugin = createAuraActivityPlugin;
