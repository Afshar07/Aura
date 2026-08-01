import { SerialPort } from "serialport";

const BAUD_RATE = 115200;
const CP210X_VENDOR_ID = "10c4";

function normalizeHex(value) { return value?.toLowerCase().replace(/^0x/, ""); }

export function createSerialTransport({
  serialPortClass = SerialPort,
  env = process.env,
  log = console,
  reconnectDelayMs = 2000,
} = {}) {
  let port;
  let connecting = false;
  let retryTimer;
  const levels = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
  const level = levels[String(env.AURA_LOG_LEVEL ?? "info").toLowerCase()] ?? levels.info;
  const canLog = (wanted) => level <= levels[wanted];
  const info = (message) => canLog("info") && log.info?.(`Aura bridge: ${message}`);
  const warn = (message) => canLog("warn") && log.warn?.(`Aura bridge: ${message}`);
  const error = (message) => canLog("error") && log.error?.(`Aura bridge: ${message}`);

  async function discover() {
    if (env.AURA_SERIAL_PORT) return env.AURA_SERIAL_PORT;
    const ports = await serialPortClass.list();
    return ports.find((item) => normalizeHex(item.vendorId) === CP210X_VENDOR_ID)?.path;
  }

  async function connect() {
    if (connecting || port?.isOpen) return;
    connecting = true;
    try {
      const path = await discover();
      if (!path) { warn("CP210x serial device not found; retrying."); return; }
      const candidate = new serialPortClass({ path, baudRate: BAUD_RATE, autoOpen: false });
      port = candidate;
      candidate.on("error", (problem) => error(`serial error: ${problem.message}`));
      candidate.on("close", () => { warn("serial connection closed; reconnecting."); schedule(); });
      await new Promise((resolve, reject) => candidate.open((problem) => problem ? reject(problem) : resolve()));
      info(`connected to ${path} at ${BAUD_RATE} baud.`);
    } catch (problem) {
      if (port?.isOpen !== true) port = undefined;
      error(`cannot connect to serial device: ${problem.message}`);
      schedule();
    } finally { connecting = false; }
  }

  function schedule() {
    if (!retryTimer) retryTimer = setTimeout(() => { retryTimer = undefined; connect().catch((problem) => error(problem.message)); }, reconnectDelayMs);
  }

  function write(line) {
    if (!port?.isOpen) return false;
    port.write(`${line}\n`, (problem) => problem && error(`serial write failed: ${problem.message}`));
    return true;
  }

  return { connect, write, isConnected: () => Boolean(port?.isOpen), discover };
}
