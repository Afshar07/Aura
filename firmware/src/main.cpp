#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

#include "aura_face.h"
#include "boot_animation.h"
#include "aura_protocol.h"
#include "aura_buzzer.h"

namespace
{
  constexpr int TFT_CS_PIN = 5;
  constexpr int TFT_DC_PIN = 16;
  constexpr int TFT_RESET_PIN = 17;
  constexpr int BUZZER_PIN = 25;
  constexpr bool BUZZER_ENABLED = true;

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
AuraBuzzer auraBuzzer(BUZZER_PIN);

namespace
{
  unsigned long lastSerialStateTime = 0;
  aura_protocol::Parser serialParser;
  bool attentionLatched = false;
  aura_protocol::Attention latchedAttention = aura_protocol::Attention::Unknown;

  const char *stateName(const aura_protocol::State state)
  {
    switch (state)
    {
      case aura_protocol::State::Idle: return "idle";
      case aura_protocol::State::Thinking: return "thinking";
      case aura_protocol::State::Working: return "working";
      case aura_protocol::State::Waiting: return "waiting";
      case aura_protocol::State::Error: return "error";
      case aura_protocol::State::Success: return "success";
      default: return "unknown";
    }
  }

  const char *activityName(const aura_protocol::Activity activity)
  {
    switch (activity)
    {
      case aura_protocol::Activity::Read: return "read";
      case aura_protocol::Activity::Search: return "search";
      case aura_protocol::Activity::Edit: return "edit";
      case aura_protocol::Activity::Shell: return "shell";
      case aura_protocol::Activity::Test: return "test";
      case aura_protocol::Activity::Other: return "other";
      default: return "unknown";
    }
  }

  const char *attentionName(const aura_protocol::Attention attention)
  {
    switch (attention)
    {
      case aura_protocol::Attention::Permission: return "permission";
      case aura_protocol::Attention::UserInput: return "user_input";
      case aura_protocol::Attention::Confirmation: return "confirmation";
      case aura_protocol::Attention::Authentication: return "authentication";
      case aura_protocol::Attention::ManualAction: return "manual_action";
      default: return "unknown";
    }
  }

  void applySerialEvent(const aura_protocol::ParseResult &event)
  {
    if (!event.accepted)
    {
      Serial.println("Aura event rejected: malformed");
      return;
    }

    switch (event.category)
    {
      case aura_protocol::Category::State:
        if (event.state == aura_protocol::State::Idle || event.state == aura_protocol::State::Success)
          auraFace.setState(AuraFace::State::Idle);
        else if (event.state == aura_protocol::State::Error)
          auraFace.setState(AuraFace::State::Error);
        else if (event.state == aura_protocol::State::Waiting)
          auraFace.setState(AuraFace::State::Waiting);
        else
          auraFace.setState(AuraFace::State::Loading);
        Serial.print("Aura event: state/");
        Serial.println(stateName(event.state));
        if (event.state != aura_protocol::State::Waiting) attentionLatched = false;
        break;
      case aura_protocol::Category::Activity:
        auraFace.setState(AuraFace::State::Loading);
        Serial.print("Aura event: activity/");
        Serial.println(activityName(event.activity));
        attentionLatched = false;
        break;
      case aura_protocol::Category::Attention:
        auraFace.setState(AuraFace::State::Waiting);
        Serial.print("Aura event: attention/");
        Serial.println(attentionName(event.attention));
        if (!attentionLatched || latchedAttention != event.attention)
        {
          if (BUZZER_ENABLED)
          {
            auraBuzzer.playChime();
          }
          attentionLatched = true;
          latchedAttention = event.attention;
        }
        break;
      case aura_protocol::Category::Heartbeat:
        break;
      default:
        break;
    }

    if (event.category == aura_protocol::Category::State ||
        event.category == aura_protocol::Category::Activity ||
        event.category == aura_protocol::Category::Attention ||
        event.category == aura_protocol::Category::Heartbeat)
    {
      lastSerialStateTime = millis();
    }
  }

  void readSerialCommands()
  {
    aura_protocol::ParseResult event;
    while (serialParser.process(Serial, event))
    {
      applySerialEvent(event);
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
  if (BUZZER_ENABLED)
  {
    auraBuzzer.begin();
  }

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
    attentionLatched = false;
    lastSerialStateTime = 0;
    Serial.println("Aura host timeout");
  }

  auraFace.update();
  if (BUZZER_ENABLED)
  {
    auraBuzzer.update();
  }
}
