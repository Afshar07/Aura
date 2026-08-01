import { eventToLine, normalizeEvent, stateLine } from "./protocol.js";

export function createStateStore({ writer = () => {}, now = Date.now, staleAfterMs = 10000, log } = {}) {
  let state = "idle";
  let activity;
  let metrics = { errors: 0, warnings: 0 };
  let lastActivityAt = 0;
  let lastEventLine;

  function write(line, force = false) {
    if (!force && line === lastEventLine) return false;
    const delivered = writer(line) !== false;
    if (!force && delivered) lastEventLine = line;
    return delivered;
  }

  function apply(event) {
    let normalized;
    try {
      normalized = normalizeEvent(event);
    } catch (error) {
      log?.error?.(`invalid event: ${error.message}`);
      throw error;
    }
    const line = eventToLine(normalized);
    const previousState = state;
    if (normalized.category === "state") {
      state = normalized.name;
      lastActivityAt = now();
    }
    if (normalized.category === "activity") {
      activity = normalized.name;
      state = "working";
      lastActivityAt = now();
    }
    if (normalized.category === "metric") metrics[normalized.name] = normalized.value;
    if (state !== previousState) log?.info?.(`state transition: ${previousState.toUpperCase()} -> ${state.toUpperCase()}`);
    write(line);
    return normalized;
  }

  function setLegacyState(value) {
    let normalized;
    try {
      normalized = normalizeEvent({ category: "state", name: value });
    } catch (error) {
      log?.error?.(`invalid state: ${error.message}`);
      throw error;
    }
    const previousState = state;
    state = normalized.name;
    lastActivityAt = now();
    if (state !== previousState) log?.info?.(`state transition: ${previousState.toUpperCase()} -> ${state.toUpperCase()}`);
    write(stateLine(state));
  }

  function heartbeat() {
    const stale = state !== "idle" && now() - lastActivityAt >= staleAfterMs;
    if (stale) {
      const previousState = state;
      state = "idle";
      activity = undefined;
      log?.info?.(`state transition: ${previousState.toUpperCase()} -> IDLE (stale)`);
    }
    write(stateLine(state), true);
  }

  function snapshot() {
    return { state: state.toUpperCase(), activity, metrics: { ...metrics }, lastActivityAt };
  }

  return { apply, setLegacyState, heartbeat, snapshot };
}
