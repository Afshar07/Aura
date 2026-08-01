import { createServer } from "node:http";
import { createSerialTransport } from "./serial-transport.js";
import { createStateStore } from "./state-store.js";

const HOST = "127.0.0.1";
const HTTP_PORT = Number(process.env.AURA_BRIDGE_PORT ?? "43110");
const HEARTBEAT_INTERVAL_MS = 2000;

if (!Number.isInteger(HTTP_PORT) || HTTP_PORT < 1 || HTTP_PORT > 65535) throw new Error("AURA_BRIDGE_PORT must be an integer between 1 and 65535");

const transport = createSerialTransport();
const store = createStateStore({ writer: (line) => transport.write(line), log: console });

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let settled = false;
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > 1024) {
        tooLarge = true;
        settled = true;
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => { if (!settled) { settled = true; resolve(body); } });
    request.on("error", (error) => { if (!settled) { settled = true; reject(error); } });
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ...store.snapshot(), serialConnected: transport.isConnected() }));
    return;
  }
  if (request.method !== "POST" || !["/state", "/event"].includes(request.url)) { response.writeHead(404).end(); return; }
  if (request.url === "/event" && request.headers["content-type"]?.split(";", 1)[0].trim() !== "application/json") { response.writeHead(415).end("Content-Type must be application/json"); return; }
  try {
    const body = JSON.parse(await readRequestBody(request));
    if (request.url === "/state") store.setLegacyState(body.state);
    else store.apply(body);
    response.writeHead(204).end();
  } catch (problem) { response.writeHead(400).end(problem.message); }
});

server.listen(HTTP_PORT, HOST, () => console.log(`Aura bridge: listening on http://${HOST}:${HTTP_PORT}.`));
transport.connect().catch((problem) => console.error(`Aura bridge: ${problem.message}`));
setInterval(() => { store.heartbeat(); transport.connect().catch((problem) => console.error(`Aura bridge: ${problem.message}`)); }, HEARTBEAT_INTERVAL_MS);
