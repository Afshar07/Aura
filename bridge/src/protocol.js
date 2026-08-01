const STATES = new Set(["idle", "thinking", "working", "waiting", "error", "success"]);
const ACTIVITIES = new Set(["read", "search", "edit", "shell", "test", "other"]);
const ATTENTIONS = new Set(["permission", "user_input", "confirmation", "authentication", "manual_action"]);

function requiredName(value, category) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${category} name must be a non-empty string`);
  }
  return value.toLowerCase();
}

function safeInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function normalizeState(value) {
  const state = requiredName(value, "state").replace(/^aura:/, "");
  const legacy = { busy: "working", idle: "idle", error: "error" };
  const normalized = legacy[state] ?? state;
  if (!STATES.has(normalized)) throw new Error(`Unknown state: ${value}`);
  return normalized;
}

export function normalizeEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new Error("Event must be a JSON object");
  }
  const category = requiredName(event.category, "category");
  const name = requiredName(event.name, category);
  if (category === "state") return { category, name: normalizeState(name) };
  if (category === "activity") {
    const normalized = ACTIVITIES.has(name) ? name : "other";
    return { category, name: normalized };
  }
  if (category === "attention") {
    if (!ATTENTIONS.has(name)) throw new Error(`Unknown attention name: ${event.name}`);
    return { category, name };
  }
  if (category === "metric") {
    if (!["errors", "warnings"].includes(name)) throw new Error(`Unknown metric name: ${event.name}`);
    return { category, name, value: safeInteger(event.value, `metric ${name}`) };
  }
  if (category === "progress") {
    if (name !== "todo") throw new Error(`Unknown progress name: ${event.name}`);
    const total = safeInteger(event.total, "progress total");
    const completed = safeInteger(event.completed, "progress completed");
    if (completed > total) throw new Error("progress completed must not exceed total");
    return { category, name, completed, total };
  }
  if (category === "summary") {
    if (name !== "files") throw new Error(`Unknown summary name: ${event.name}`);
    return { category, name, value: safeInteger(event.value, "summary files") };
  }
  throw new Error(`Unknown event category: ${event.category}`);
}

export function eventToLine(event) {
  const normalized = normalizeEvent(event);
  const prefix = `AURA:${normalized.category.toUpperCase()}`;
  if (normalized.category === "metric") return `${prefix}:${normalized.name.toUpperCase()}:${normalized.value}`;
  if (normalized.category === "progress") return `${prefix}:TODO:${normalized.completed}:${normalized.total}`;
  if (normalized.category === "summary") return `${prefix}:FILES:${normalized.value}`;
  return `${prefix}:${normalized.name.toUpperCase()}`;
}

export function stateLine(state) {
  return `AURA:STATE:${normalizeState(state).toUpperCase()}`;
}

export function heartbeatLine() {
  return "AURA:HEARTBEAT";
}

export { ACTIVITIES, ATTENTIONS, STATES };
