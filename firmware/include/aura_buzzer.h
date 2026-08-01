#pragma once

#include <stdint.h>

class AuraBuzzer
{
public:
    explicit AuraBuzzer(uint8_t pin);

    void begin();
    void playChime();
    void update();

private:
    static constexpr uint8_t PWM_CHANNEL = 7;
    static constexpr uint8_t PWM_RESOLUTION_BITS = 8;
    static constexpr unsigned long NOTE_ONE_FREQUENCY = 784;
    static constexpr unsigned long NOTE_TWO_FREQUENCY = 988;
    static constexpr unsigned long NOTE_ONE_DURATION_MS = 110;
    static constexpr unsigned long NOTE_GAP_MS = 20;
    static constexpr unsigned long NOTE_TWO_DURATION_MS = 130;

    uint8_t pin_;
    unsigned long startedAt_ = 0;
    bool playing_ = false;

    void stop();
};
