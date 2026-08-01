# Development Roadmap

## Strategy

Build and validate one component at a time. Every hardware module must pass an isolated test before integration. Favor one complete, visible milestone over several partially implemented features.

This roadmap is ordered guidance, not permission to scaffold every future feature in advance.

## Milestone 0: Hardware Inspection

- Photograph and inspect each module
- Confirm exact pin labels and board revisions
- Identify display pins
- Inspect the DS3231 battery circuit
- Confirm the ESP32 USB connector and board definition

## Milestone 1: ESP32 Bring-Up

- Install the toolchain
- Connect the ESP32
- Upload a minimal program
- Verify serial output
- Confirm stable uploads and resets

## Milestone 2: Display Bring-Up

- Wire the ST7789 safely
- Show a solid color and render text
- Confirm dimensions, rotation, and offsets
- Verify backlight and brightness behavior

## Milestone 3: Minimal UI

- Build a home screen
- Show a clock placeholder
- Establish basic typography
- Add only one or two reusable visual elements
- Do not build a premature animation system

## Milestone 4: BME280

- Read temperature, humidity, and pressure
- Display the values
- Handle sensor initialization failure

## Milestone 5: DS3231

- Read and set time
- Detect lost-power state
- Display the real clock
- Verify backup-battery behavior

## Milestone 6: Rotary Encoder

- Read direction and button input
- Debounce input
- Navigate between two simple screens

## Milestone 7: LED Ring

- Establish a safe external 5 V power strategy if required
- Use a common ground
- Limit brightness
- Add basic status colors
- Add simple non-blocking animations

## Milestone 8: Passive Buzzer

- Generate basic tones
- Add UI feedback and timer-completion sounds
- Avoid blocking melody code

## Milestone 9: Wi-Fi

- Connect to local Wi-Fi without committing credentials
- Display connection state
- Obtain time through NTP
- Decide how NTP and the RTC cooperate

## Milestone 10: Desktop Communication

- Begin with USB serial
- Define a small message format
- Send a test notification
- Render it on the device

Current partial implementation: a global OpenCode plugin and cross-platform Node.js bridge send agent busy, idle, and error states over USB serial. This validates the communication path but does not complete the broader desktop-notification milestone.

## Later Candidates

- INMP441 audio input
- Presence detection
- Servo-based personality
- Weather
- OTA updates
- Desktop application
- Custom enclosure
- Perfboard or PCB
- Home Assistant
- Custom integrations

Do not pull these forward unless the user deliberately changes priorities or an earlier milestone creates a concrete need.
