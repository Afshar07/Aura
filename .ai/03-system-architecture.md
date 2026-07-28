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
