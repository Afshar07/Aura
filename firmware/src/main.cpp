#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

#include "aura_face.h"
#include "boot_animation.h"

namespace
{
  constexpr int TFT_CS_PIN = 5;
  constexpr int TFT_DC_PIN = 16;
  constexpr int TFT_RESET_PIN = 17;

  constexpr int TFT_SCK_PIN = 18;
  constexpr int TFT_MOSI_PIN = 23;

  constexpr int TFT_WIDTH = 240;
  constexpr int TFT_HEIGHT = 280;

  constexpr unsigned long SERIAL_STATE_TIMEOUT_MS = 5000;
}

Adafruit_ST7789 display(
    TFT_CS_PIN,
    TFT_DC_PIN,
    TFT_RESET_PIN);

AuraFace auraFace(display);

namespace
{
  String serialCommand;
  unsigned long lastSerialStateTime = 0;

  void applySerialCommand(const String& command)
  {
    if (command == "AURA:OPENCODE:BUSY")
    {
      auraFace.setState(AuraFace::State::Loading);
    }
    else if (command == "AURA:OPENCODE:ERROR")
    {
      auraFace.setState(AuraFace::State::Error);
    }
    else if (command == "AURA:OPENCODE:IDLE")
    {
      auraFace.setState(AuraFace::State::Idle);
    }
    else
    {
      return;
    }

    lastSerialStateTime = millis();
  }

  void readSerialCommands()
  {
    while (Serial.available() > 0)
    {
      const char character = static_cast<char>(Serial.read());

      if (character == '\n')
      {
        serialCommand.trim();
        applySerialCommand(serialCommand);
        serialCommand = "";
        continue;
      }

      if (serialCommand.length() < 64)
      {
        serialCommand += character;
      }
    }
  }
}

void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println("Starting Aura...");

  SPI.begin(
      TFT_SCK_PIN,
      -1,
      TFT_MOSI_PIN,
      TFT_CS_PIN);

  display.init(
      TFT_WIDTH,
      TFT_HEIGHT);

  display.setRotation(0);
  display.fillScreen(ST77XX_BLACK);

  playBootAnimation(display);

  auraFace.begin();

  Serial.println("Aura is alive.");
}

void loop()
{
  readSerialCommands();

  if (
    lastSerialStateTime != 0 &&
    millis() - lastSerialStateTime >= SERIAL_STATE_TIMEOUT_MS
  )
  {
    auraFace.setState(AuraFace::State::Idle);
    lastSerialStateTime = 0;
  }

  auraFace.update();
}
