# OpenCode activity verification

## Requirements and startup

- Node.js **20 or newer**
- A connected ESP32 running the current firmware
- A USB serial bridge started from this checkout

From the repository root:

```sh
cd bridge
npm install
npm start
```

The bridge listens on `http://127.0.0.1:43110`. It discovers a CP210x device
automatically. Set an explicit port when needed:

```powershell
$env:AURA_SERIAL_PORT = "COM3"
npm start
```

```sh
AURA_SERIAL_PORT=/dev/ttyUSB0 npm start       # Linux
AURA_SERIAL_PORT=/dev/cu.usbserial-XXXX npm start # macOS
```

## HTTP checks

PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:43110/health
Invoke-WebRequest -Method Post -Uri http://127.0.0.1:43110/state `
  -ContentType 'application/json' -Body '{"state":"BUSY"}'
Invoke-WebRequest -Method Post -Uri http://127.0.0.1:43110/state `
  -ContentType 'application/json' -Body '{"state":"IDLE"}'
Invoke-WebRequest -Method Post -Uri http://127.0.0.1:43110/state `
  -ContentType 'application/json' -Body '{"state":"ERROR"}'
```

curl:

```sh
curl http://127.0.0.1:43110/health
curl -i -X POST http://127.0.0.1:43110/state -H 'content-type: application/json' -d '{"state":"BUSY"}'
curl -i -X POST http://127.0.0.1:43110/state -H 'content-type: application/json' -d '{"state":"IDLE"}'
curl -i -X POST http://127.0.0.1:43110/state -H 'content-type: application/json' -d '{"state":"ERROR"}'
```

Expected behavior:

- `GET /health` returns JSON such as `{"state":"IDLE","serialConnected":true}`.
- Valid `POST /state` requests return HTTP `204` and visibly select BUSY,
  IDLE, or ERROR on the ESP32/TFT.
- Invalid states return HTTP `400`; other paths/methods return `404`.

The baseline has been confirmed: health returned
`{"state":"IDLE","serialConnected":true}`, and BUSY, IDLE, and ERROR were
visibly confirmed on the ESP32/TFT.

## Timeout behavior

The bridge marks non-IDLE activity stale after **10 seconds** and sends IDLE.
The firmware independently returns to its idle face after **5 seconds** without
a valid state command. The plugin's HTTP request timeout is intentionally
short (300 ms), and bridge failures are ignored by OpenCode.

The automatic timeout after stopping the bridge has been physically verified:
Aura returns to IDLE within the firmware's five-second valid-command timeout.

The generic permission workflow has also been physically verified. A permission
event shows the distinct waiting face, and an error event shows red eyes with a
yellow exclamation mark.

The bridge now sends `AURA:HEARTBEAT` for liveness instead of replaying the
current visual state. This lifecycle patch still requires hardware verification:
heartbeats must preserve activity and waiting faces, `permission.replied` must
exit waiting, and stopping the host must still return Aura to idle.

## Known limitations

- Session status still uses BUSY, IDLE, and ERROR through the legacy `/state`
  route during migration.
- The generic `/event` route currently drives the permission workflow; later
  tool, diagnostic, progress, and summary behavior is not implemented yet.
- Confirmed OpenCode permission and question events trigger the action-required
  buzzer. Confirmation, authentication, and manual-action attention commands are
  supported through `/event`, but OpenCode has no confirmed generic event names
  for them yet.
- Only one current state is retained; duplicate state events are suppressed.
- The bridge requires the serial device to be present and accessible. Linux
  users may need serial-device permissions (commonly the `dialout` group).
- The bridge is local-only (`127.0.0.1`) and has no authentication.
