# System Architecture

## Firmware

Use PlatformIO with the Arduino framework for ESP32 initially. This supports reliable progress and a conventional project structure. Consider ESP-IDF only when the Arduino framework creates a demonstrated limitation, not merely because ESP-IDF is lower-level.

Do not let the firmware become one large sketch with all behavior in `setup()` and `loop()`. Separate code by responsibility as each responsibility becomes real.

A possible future structure is:

```text
firmware/
|-- src/
|   |-- app/
|   |-- display/
|   |-- input/
|   |-- sensors/
|   |-- lighting/
|   |-- audio/
|   |-- network/
|   `-- main.cpp
|-- include/
|-- test/
`-- platformio.ini
```

This is conceptual. Do not create every directory before it is useful.

Likely abstractions may eventually include a display service, screen/view abstraction, sensor service, input manager, LED controller, notification model, application state, and event queue. Add them only when current behavior justifies them. Do not build a fake frontend framework in C++.

Embedded UI design must account for limited RAM and flash, rendering cost, timing, and hardware failure modes.

## Desktop Companion

The likely desktop stack is Vue, TypeScript, and Tauri unless a better option is justified by actual requirements.

Potential data sources include:

- Local development scripts and Git repositories
- GitHub
- Spotify
- Calendar
- System metrics
- AI coding tools
- Custom local integrations

## Device Communication

Start with USB serial because it is easy to observe and debug. Introduce Wi-Fi communication later, choosing WebSocket, HTTP, MQTT, or a small custom TCP protocol according to real requirements.

The ESP32 should receive structured events without knowing which external service produced them. Conceptual examples, not finalized schemas:

```json
{
  "type": "notification",
  "source": "github",
  "title": "Pull request approved",
  "message": "Feature branch is ready",
  "priority": "normal"
}
```

```json
{
  "type": "development-status",
  "status": "building",
  "label": "accelerator-panel",
  "progress": 72
}
```

Define the smallest protocol needed for the active milestone. Do not introduce Protobuf, MQTT, an event broker, or a complex plugin system speculatively.

## Repository and Configuration

The user works from home and work, so use Git from the beginning. The target repository shape is:

```text
aura/
|-- firmware/
|-- desktop/
|-- docs/
|-- hardware/
|-- assets/
`-- README.md
```

Not every directory needs to exist or contain files immediately.

Never commit secrets such as Wi-Fi credentials. Use ignored local files or environment-specific configuration when credentials become necessary.

### Current Repository Structure

The current implemented structure is:

```text
aura/
|-- .ai/
|   |-- 01-project-vision.md
|   |-- 02-hardware.md
|   |-- 03-system-architecture.md
|   |-- 04-roadmap.md
|   |-- 05-engineering-standards.md
|   |-- 06-agent-guidelines.md
|   |-- aura-esp32-st7789-wiring-map.md
|   `-- README.md
|-- assets/
|   `-- aura-logo.svg
|-- bridge/
|   |-- src/
|   |   |-- index.js
|   |   |-- protocol.js
|   |   |-- serial-transport.js
|   |   `-- state-store.js
|   |-- test/
|   |   |-- protocol.test.js
|   |   `-- state-store.test.js
|   |-- package-lock.json
|   `-- package.json
|-- docs/
|   `-- opencode-verification.md
|-- firmware/
|   |-- include/
|   |   |-- aura_boot_logo.h
|   |   |-- aura_face.h
|   |   |-- aura_protocol.h
|   |   `-- boot_animation.h
|   |-- src/
|   |   |-- aura_face.cpp
|   |   |-- aura_protocol.cpp
|   |   |-- boot_animation.cpp
|   |   `-- main.cpp
|   |-- .gitignore
|   `-- platformio.ini
|-- opencode/
|   |-- aura-activity.js
|   `-- README.md
|-- .gitignore
|-- aura.code-workspace
`-- README.md
```

`firmware/`, the narrow OpenCode serial bridge, its tracked plugin, and its verification documentation are implemented application areas. `desktop/` and `hardware/` remain part of the target shape and should be created only when an active milestone requires them.

Current firmware responsibilities are intentionally small:

- `main.cpp` configures SPI and the ST7789 display, coordinates parsed host events, plays the boot animation, and updates the face.
- `boot_animation.*` owns the startup logo animation.
- `aura_face.*` owns idle, loading, waiting, and error eye rendering, movement, and blinking.
- `aura_protocol.*` owns bounded, non-blocking parsing of newline-delimited serial commands and legacy command compatibility.
- `aura_boot_logo.h` stores the generated RGB565 boot-logo bitmap in program memory.
- `platformio.ini` configures the generic `esp32dev` Arduino environment and Adafruit GFX/ST7789 dependencies.

### OpenCode Activity Bridge

OpenCode activity uses the current USB-first communication strategy:

```text
global OpenCode plugin
  -> HTTP on 127.0.0.1:43110
  -> persistent Node.js bridge
  -> CP210x USB serial at 115200 baud
  -> ESP32 face state
```

The host protocol is intentionally small:

```text
AURA:OPENCODE:BUSY
AURA:OPENCODE:IDLE
AURA:OPENCODE:ERROR
```

These legacy commands remain accepted. The generic protocol now supports state,
activity, permission attention, metric, todo progress, and file-summary messages.
The active plugin currently uses generic permission events while ordinary session
states continue through the legacy `/state` endpoint during migration.

`AURA:HEARTBEAT` is non-visual: it refreshes firmware host liveness without
replacing the current state, activity, or permission expression. Visual lifecycle
timestamps are refreshed only by state, activity, attention, and heartbeat
commands; metric, progress, and summary messages do not prolong an old face.

The bridge uses the cross-platform `serialport` package, discovers the CP210x adapter by USB vendor ID, and supports `AURA_SERIAL_PORT` as an explicit override. It owns the serial connection so individual OpenCode events do not repeatedly open the port and reset the ESP32.

The OpenCode plugin is installed globally but tracked under `opencode/` so it can be reviewed and reproduced. It listens for `session.status`, `session.idle`, `session.error`, `permission.asked`, and `permission.replied`. Bridge failures are ignored by the plugin so Aura cannot interrupt OpenCode. A permission request puts Aura into its distinct waiting face; heartbeat timeouts in both the bridge and firmware restore the idle face after a host crash or lost connection.
