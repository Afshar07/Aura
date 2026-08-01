# Aura

<p align="center">
  <img src="assets/aura-logo.svg" alt="Aura logo" width="240" />
</p>

<p align="center"><strong>A smart desktop companion built around an ESP32.</strong></p>

Aura combines embedded firmware, a small display, environmental sensors, ambient lighting, physical controls, and eventually a desktop companion app.

## Current status

Aura is in its initial bring-up phase.

The first milestone is intentionally small:

- verify the ESP32 development environment
- upload the first firmware
- confirm serial communication
- bring up each hardware module one at a time

## Planned hardware

- ESP32 WROOM-32 DevKit
- 1.69-inch ST7789 TFT display
- BME280 environmental sensor
- DS3231 real-time clock
- 24-LED WS2812 ring
- INMP441 I²S microphone
- rotary encoder
- passive buzzer

## Development approach

Aura is being developed as a real embedded product rather than a single experimental sketch.

The project favors:

- small, testable milestones
- one hardware bring-up at a time
- modular firmware
- clear documentation
- understanding the underlying embedded concepts instead of treating libraries as black boxes

## Tooling

- PlatformIO
- ESP32 Arduino framework
- C++
- Git

## OpenCode activity integration

Aura can reflect OpenCode agent activity through a local cross-platform bridge:

```text
OpenCode plugin -> localhost HTTP -> Node.js bridge -> USB serial -> ESP32
```

The bridge supports Windows, Linux, and macOS through the `serialport` package. It automatically selects a Silicon Labs CP210x device or accepts an explicit `AURA_SERIAL_PORT` value.

Install and start it from the repository root:

```powershell
cd bridge
npm install
npm start
```

On Linux, the current user may need access to the serial device, commonly through the `dialout` group. To override device discovery:

```powershell
$env:AURA_SERIAL_PORT = "COM3"
npm start
```

Linux and macOS use the same variable with paths such as `/dev/ttyUSB0` or `/dev/cu.usbserial-*`.

The global OpenCode plugin is installed at `~/.config/opencode/plugin/aura-activity.js`. Restart OpenCode after installing or changing it. The plugin sends busy, idle, and error states; if the bridge or OpenCode stops unexpectedly, the bridge and firmware independently fall back to idle.

## Vision

Over time, Aura may grow into an ambient desktop interface for:

- environmental information
- notifications
- calendar and focus reminders
- GitHub and build status
- music and media state
- custom widgets
- Home Assistant integration

The goal is to create something useful, calm, expandable, and genuinely educational to build.
