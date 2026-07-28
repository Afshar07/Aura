# Hardware Context

## Primary Controller

The primary controller is an ESP32 development board with these reported characteristics:

- ESP32-WROOM-32
- 38-pin development board
- CP2102 USB-to-serial converter
- Built-in Wi-Fi and Bluetooth
- 3.3 V GPIO logic

The exact board definition and labels still need confirmation during hardware inspection.

## Newly Purchased Modules

### TFT Display

- 1.69-inch full-color TFT
- SPI interface
- ST7789V driver
- Likely 240 x 280 resolution; not yet confirmed
- Intended for dashboards, menus, notifications, timers, status, small animations, and expressions

### Environmental Sensor

- GY-BME280
- Temperature, relative humidity, and atmospheric pressure
- May support I2C or SPI depending on the module configuration
- Prefer I2C unless a concrete reason favors SPI

### Real-Time Clock

- DS3231 RTC module
- I2C interface
- Backup coin-cell support
- Renata CR2025 battery purchased

Inspect the exact board revision before installing or relying on the battery. Some inexpensive DS3231 modules contain a charging circuit intended for rechargeable cells and may be unsafe with a non-rechargeable CR2025.

### RGB Lighting

- Circular WS2812/WS2812B-compatible ring
- 24 individually addressable LEDs
- Likely 5 V power; confirm before connection
- Single digital data line

Do not power the ring from an ESP32 GPIO. Limit brightness in software during early testing.

### User Input

- FZ0534 rotary encoder module
- Clockwise and counter-clockwise rotation
- Integrated push button
- Intended interaction: rotate to navigate, press to select, long press for back or quick actions

Expect mechanical bounce and handle it deliberately.

### Audio Input

- INMP441 MEMS microphone
- I2S interface
- Possible later uses: noise visualization, clap or sound event detection, audio-reactive lighting, voice activity detection, and experimental local voice features
- Not required for early milestones

### Audio Output

- Passive buzzer
- Requires a generated waveform; it cannot simply be switched on like an active buzzer
- Possible uses: startup chime, UI feedback, timer sound, warnings, and short melodies

## Existing Components

The user owns most or all of the following:

- Arduino Uno R3
- STM32F103C8T6 Blue Pill
- Small SSD1306 OLED
- DHT11 temperature and humidity sensor
- LDR/photoresistor
- Touch sensor
- Sound sensor
- SRF05 ultrasonic distance sensor
- FC-51 infrared obstacle sensor
- SG90 micro servo
- RGB LEDs
- Breadboards, jumper wires, USB cables, and general prototyping parts

Reuse these only when they provide a real feature. Do not add a module merely because it is available.

## Electrical Safety

The ESP32 uses 3.3 V logic. Never assume that a 5 V-powered module has 3.3 V-safe signal pins.

- Unplug power before changing wiring.
- Verify module pin labels, polarity, voltage, and current requirements before power-up.
- Do not infer connections from wire colors alone; use labels and datasheets.
- Ask for clear photos and visible pin labels when a module revision matters or is uncertain.
- Never power the LED ring from an ESP32 GPIO.
- Use a suitable 5 V supply for the WS2812 ring and connect the supply ground to ESP32 ground.
- Start with limited LED brightness.
- Consider a logic-level shifter if WS2812 data reliability requires it.
- Use an appropriate series resistor on the WS2812 data line and a bulk capacitor near its power input when integrated.
- Do not power a servo directly from a weak ESP32 rail.
- Recalculate power needs before combining modules.

Warn about relevant voltage or power risks before providing wiring instructions, not afterward.

## Prototyping and Packaging

Use breadboards and jumper wires for the first version. Do not yet solder the full system, design a PCB, buy a fixed enclosure, or finalize component placement.

Consider soldering only after the breadboard prototype is stable, pin assignments are settled, the physical arrangement is understood, and a durable build is useful.

Expected physical progression:

1. Breadboard prototype
2. Perfboard prototype
3. 3D-printed or laser-cut enclosure
4. Custom PCB
