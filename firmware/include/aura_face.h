#pragma once

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>

class AuraFace
{
public:
    enum class State
    {
        Idle,
        Loading,
        Error,
    };

    explicit AuraFace(Adafruit_ST7789 &display);

    void begin();
    void update();
    void setState(State state);

private:
    static constexpr int CANVAS_WIDTH = 170;
    static constexpr int CANVAS_HEIGHT = 98;

    Adafruit_ST7789 &display_;
    GFXcanvas16 faceCanvas_;

    float currentLookX_ = 0.0f;
    float currentLookY_ = 0.0f;

    float targetLookX_ = 0.0f;
    float targetLookY_ = 0.0f;

    unsigned long lastFrameTime_ = 0;
    unsigned long nextLookTime_ = 0;
    unsigned long nextBlinkTime_ = 0;
    unsigned long blinkStartTime_ = 0;

    bool isBlinking_ = false;
    State state_ = State::Idle;

    void chooseNewLookDirection();
    void startBlink();
    void updateEyeMovement();
    void updateLoadingMovement(unsigned long now);

    void drawFace();

    void drawEye(
        int eyeX,
        float lookX,
        float lookY,
        float blinkAmount);

    float getBlinkAmount();

    unsigned long randomLookInterval() const;
    unsigned long randomBlinkInterval() const;

    static bool hasTimeElapsed(
        unsigned long now,
        unsigned long targetTime);
};
