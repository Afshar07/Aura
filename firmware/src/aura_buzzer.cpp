#include "aura_buzzer.h"

#include <Arduino.h>
#include "esp32-hal-ledc.h"

AuraBuzzer::AuraBuzzer(const uint8_t pin) : pin_(pin)
{
}

void AuraBuzzer::begin()
{
    ledcSetup(PWM_CHANNEL, NOTE_ONE_FREQUENCY, PWM_RESOLUTION_BITS);
    ledcAttachPin(pin_, PWM_CHANNEL);
    ledcWriteTone(PWM_CHANNEL, 0);
}

void AuraBuzzer::playChime()
{
    startedAt_ = millis();
    playing_ = true;
    ledcWriteTone(PWM_CHANNEL, NOTE_ONE_FREQUENCY);
}

void AuraBuzzer::update()
{
    if (!playing_) return;

    const unsigned long elapsed = millis() - startedAt_;
    if (elapsed >= NOTE_ONE_DURATION_MS + NOTE_GAP_MS + NOTE_TWO_DURATION_MS)
    {
        stop();
    }
    else if (elapsed >= NOTE_ONE_DURATION_MS + NOTE_GAP_MS)
    {
        ledcWriteTone(PWM_CHANNEL, NOTE_TWO_FREQUENCY);
    }
    else if (elapsed >= NOTE_ONE_DURATION_MS)
    {
        ledcWriteTone(PWM_CHANNEL, 0);
    }
}

void AuraBuzzer::stop()
{
    ledcWriteTone(PWM_CHANNEL, 0);
    playing_ = false;
}
