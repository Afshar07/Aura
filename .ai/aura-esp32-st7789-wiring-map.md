# Aura — ESP32 to ST7789 TFT Wiring Map

## Hardware

- **ESP32-WROOM-32**, 38-pin development board
- **1.69-inch ST7789V TFT**, SPI interface
- TFT pin labels:
  - `GND`
  - `VCC`
  - `SCL`
  - `SDA`
  - `RES`
  - `DC`
  - `CS`
  - `BLK`

> On this ESP32 board, labels such as `G18` mean **GPIO 18**.

---

## Wiring Table

| TFT pin | ESP32 printed label | Purpose |
|---|---|---|
| `GND` | `GND` | Shared ground |
| `VCC` | `3V3` | TFT controller power |
| `SCL` | `G18` | SPI clock / SCK |
| `SDA` | `G23` | SPI data / MOSI |
| `RES` | `G17` | Display reset |
| `DC` | `G16` | Data/command selection |
| `CS` | `G5` | SPI chip select |
| `BLK` | `3V3` | Backlight power |

---

## Direct Map

```text
ST7789 TFT        ESP32
──────────        ─────
GND       ──────> GND
VCC       ──────> 3V3
SCL       ──────> G18
SDA       ──────> G23
RES       ──────> G17
DC        ──────> G16
CS        ──────> G5
BLK       ──────> 3V3
```

---

## Breadboard Power-Rail Setup

Both `VCC` and `BLK` connect to the same `3V3` supply.

```text
ESP32 3V3 ──────> Breadboard positive rail
ESP32 GND ──────> Breadboard ground rail

TFT VCC   ──────> Breadboard positive rail
TFT BLK   ──────> Breadboard positive rail
TFT GND   ──────> Breadboard ground rail
```

The remaining TFT signal pins connect to individual ESP32 pins:

```text
TFT SCL ──────> ESP32 G18
TFT SDA ──────> ESP32 G23
TFT RES ──────> ESP32 G17
TFT DC  ──────> ESP32 G16
TFT CS  ──────> ESP32 G5
```

---

## Matching Firmware Pin Constants

```cpp
constexpr int TFT_CS_PIN = 5;
constexpr int TFT_DC_PIN = 16;
constexpr int TFT_RESET_PIN = 17;

constexpr int TFT_SCK_PIN = 18;
constexpr int TFT_MOSI_PIN = 23;
```

SPI initialization:

```cpp
SPI.begin(
  TFT_SCK_PIN,
  -1,            // MISO is not used by this display
  TFT_MOSI_PIN,
  TFT_CS_PIN
);
```

---

## Important Notes

- Use **`3V3`**, not `VIN` or `5V`, for this tested setup.
- `SCL` and `SDA` on this TFT are **SPI labels**, not I²C:
  - `SCL` = SCK / clock
  - `SDA` = MOSI / data
- Unplug USB power before changing any connection.
- Do not use ESP32 pins marked `SD0`, `SD1`, `SD2`, `SD3`, `CMD`, or `CLK`; they are associated with the board's flash memory.
- Powering the ESP32 through its USB port with a normal phone charger is fine.
