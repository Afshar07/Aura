#include <Arduino.h>

namespace {
constexpr unsigned long SERIAL_BAUD_RATE = 115200;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 250;
constexpr char STARTUP_MESSAGE[] = "AURA MILESTONE 1 STARTUP: ESP32 ONLINE";
constexpr char HEARTBEAT_MESSAGE[] = "AURA HEARTBEAT";

unsigned long lastHeartbeatMs = 0;
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  Serial.println(STARTUP_MESSAGE);
}

void loop() {
  const unsigned long currentTimeMs = millis();

  if (currentTimeMs - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = currentTimeMs;
    // Serial.println(HEARTBEAT_MESSAGE);
  }
}
