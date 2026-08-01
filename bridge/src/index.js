import { createServer } from "node:http";
import { SerialPort } from "serialport";

const HOST = "127.0.0.1";
const HTTP_PORT = Number.parseInt(process.env.AURA_BRIDGE_PORT ?? "43110", 10);
const BAUD_RATE = 115200;
const RECONNECT_DELAY_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 2000;
const STALE_ACTIVITY_MS = 10000;
const CP210X_VENDOR_ID = "10c4";

let serialPort;
let currentState = "IDLE";
let lastActivityAt = 0;

function normalizeHex(value) {
  return value?.toLowerCase().replace(/^0x/, "");
}

async function findAuraPort() {
  if (process.env.AURA_SERIAL_PORT) {
    return process.env.AURA_SERIAL_PORT;
  }

  const ports = await SerialPort.list();
  const cp210xPort = ports.find(
    (port) => normalizeHex(port.vendorId) === CP210X_VENDOR_ID,
  );

  return cp210xPort?.path;
}

function sendState() {
  if (!serialPort?.isOpen) {
    return;
  }

  serialPort.write(`AURA:OPENCODE:${currentState}\n`);
}

async function connectSerial() {
  if (serialPort?.isOpen) {
    return;
  }

  const path = await findAuraPort();

  if (!path) {
    console.warn("Aura bridge: CP210x serial device not found; retrying.");
    return;
  }

  serialPort = new SerialPort({ path, baudRate: BAUD_RATE, autoOpen: false });

  serialPort.on("error", (error) => {
    console.error(`Aura bridge: serial error: ${error.message}`);
  });

  serialPort.on("close", () => {
    console.warn("Aura bridge: serial connection closed; reconnecting.");
  });

  serialPort.open((error) => {
    if (error) {
      console.error(`Aura bridge: cannot open ${path}: ${error.message}`);
      return;
    }

    console.log(`Aura bridge: connected to ${path} at ${BAUD_RATE} baud.`);
    setTimeout(sendState, 1500);
  });
}

function setState(state) {
  currentState = state;
  lastActivityAt = Date.now();
  sendState();
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ state: currentState, serialConnected: serialPort?.isOpen ?? false }));
    return;
  }

  if (request.method !== "POST" || request.url !== "/state") {
    response.writeHead(404).end();
    return;
  }

  try {
    const body = JSON.parse(await readRequestBody(request));

    if (!["BUSY", "IDLE", "ERROR"].includes(body.state)) {
      response.writeHead(400).end("Invalid state");
      return;
    }

    setState(body.state);
    response.writeHead(204).end();
  } catch (error) {
    response.writeHead(400).end(error.message);
  }
});

server.listen(HTTP_PORT, HOST, () => {
  console.log(`Aura bridge: listening on http://${HOST}:${HTTP_PORT}.`);
});

await connectSerial();
setInterval(connectSerial, RECONNECT_DELAY_MS);
setInterval(() => {
  if (currentState !== "IDLE" && Date.now() - lastActivityAt >= STALE_ACTIVITY_MS) {
    currentState = "IDLE";
  }

  sendState();
}, HEARTBEAT_INTERVAL_MS);
