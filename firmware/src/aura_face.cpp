#include "aura_face.h"

#include <Arduino.h>
#include <math.h>

namespace
{
constexpr int LEFT_EYE_X = 0;
constexpr int RIGHT_EYE_X = 105;
constexpr int EYE_Y = 4;

constexpr int EYE_WIDTH = 65;
constexpr int EYE_HEIGHT = 90;
constexpr int EYE_RADIUS = 25;

constexpr int FACE_X = 35;
constexpr int FACE_Y = 81;

constexpr int PUPIL_RADIUS = 14;
constexpr int PUPIL_MOVE_X = 13;
constexpr int PUPIL_MOVE_Y = 18;

constexpr float EYE_MOVEMENT_SPEED = 0.12f;
constexpr float WAITING_MOVEMENT_SPEED = 0.025f;

constexpr unsigned long FRAME_INTERVAL_MS = 30;

constexpr unsigned long LOOK_INTERVAL_MIN_MS = 900;
constexpr unsigned long LOOK_INTERVAL_MAX_MS = 2400;

constexpr unsigned long BLINK_INTERVAL_MIN_MS = 2200;
constexpr unsigned long BLINK_INTERVAL_MAX_MS = 5500;
constexpr unsigned long BLINK_DURATION_MS = 220;
constexpr unsigned long WAITING_BLINK_INTERVAL_MIN_MS = 3200;
constexpr unsigned long WAITING_BLINK_INTERVAL_MAX_MS = 7000;

constexpr float LOADING_CYCLE_MS = 1100.0f;
constexpr float TWO_PI_RADIANS = 6.28318530718f;
}

AuraFace::AuraFace(Adafruit_ST7789& display)
  : display_(display),
    faceCanvas_(CANVAS_WIDTH, CANVAS_HEIGHT)
{
}

void AuraFace::begin()
{
  randomSeed(analogRead(34));

  const unsigned long now = millis();

  currentLookX_ = 0.0f;
  currentLookY_ = 0.0f;

  targetLookX_ = 0.0f;
  targetLookY_ = 0.0f;

  lastFrameTime_ = now;
  nextLookTime_ = now + 800;
  nextBlinkTime_ = now + 1800;

  isBlinking_ = false;

  drawFace();
}

void AuraFace::update()
{
  const unsigned long now = millis();

  if (state_ == State::Loading)
  {
    updateLoadingMovement(now);
  }
  else if (state_ == State::Waiting)
  {
    updateWaitingMovement(now);
  }
  else if (state_ == State::Error)
  {
    currentLookX_ = 0.0f;
    currentLookY_ = 0.7f;
  }
  else if (hasTimeElapsed(now, nextLookTime_))
  {
    chooseNewLookDirection();
  }

  if (
    (state_ == State::Idle || state_ == State::Waiting) &&
    !isBlinking_ &&
    hasTimeElapsed(now, nextBlinkTime_)
  )
  {
    startBlink();
  }

  if (now - lastFrameTime_ < FRAME_INTERVAL_MS)
  {
    return;
  }

  lastFrameTime_ = now;

  if (state_ == State::Idle)
  {
    updateEyeMovement();
  }

  drawFace();
}

void AuraFace::setState(const State state)
{
  if (state_ == state)
  {
    return;
  }

  state_ = state;
  isBlinking_ = false;

  if (state_ == State::Idle)
  {
    const unsigned long now = millis();
    nextLookTime_ = now + 500;
    nextBlinkTime_ = now + 1500;
  }
  else if (state_ == State::Waiting)
  {
    const unsigned long now = millis();
    currentLookX_ = 0.0f;
    currentLookY_ = 0.0f;
    targetLookX_ = 0.0f;
    targetLookY_ = 0.0f;
    nextLookTime_ = now + 3000;
    nextBlinkTime_ = now + 2200;
  }
}

void AuraFace::chooseNewLookDirection()
{
  targetLookX_ =
    static_cast<float>(random(-100, 101)) /
    100.0f;

  targetLookY_ =
    static_cast<float>(random(-65, 66)) /
    100.0f;

  nextLookTime_ =
    millis() +
    randomLookInterval();
}

void AuraFace::startBlink()
{
  isBlinking_ = true;
  blinkStartTime_ = millis();
}

void AuraFace::updateEyeMovement()
{
  currentLookX_ +=
    (targetLookX_ - currentLookX_) *
    EYE_MOVEMENT_SPEED;

  currentLookY_ +=
    (targetLookY_ - currentLookY_) *
    EYE_MOVEMENT_SPEED;
}

void AuraFace::drawFace()
{
  const float blinkAmount = getBlinkAmount();

  faceCanvas_.fillScreen(ST77XX_BLACK);
  const uint16_t eyeColor = state_ == State::Error ? ST77XX_RED : ST77XX_WHITE;

  drawEye(
    LEFT_EYE_X,
    currentLookX_,
    currentLookY_,
    blinkAmount,
    eyeColor
  );

  drawEye(
    RIGHT_EYE_X,
    currentLookX_,
    currentLookY_,
    blinkAmount,
    eyeColor
  );

  if (state_ == State::Error)
  {
    faceCanvas_.fillRect(83, 39, 4, 23, ST77XX_YELLOW);
    faceCanvas_.fillCircle(85, 70, 3, ST77XX_YELLOW);
  }

  display_.drawRGBBitmap(
    FACE_X,
    FACE_Y,
    faceCanvas_.getBuffer(),
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
}

void AuraFace::drawEye(
  const int eyeX,
  const float lookX,
  const float lookY,
  const float blinkAmount,
  const uint16_t eyeColor
)
{
  faceCanvas_.fillRoundRect(
    eyeX,
    EYE_Y,
    EYE_WIDTH,
    state_ == State::Waiting ? 94 : EYE_HEIGHT,
    EYE_RADIUS,
    eyeColor
  );

  const int pupilCenterX =
    eyeX +
    EYE_WIDTH / 2 +
    static_cast<int>(lookX * PUPIL_MOVE_X);

  const int pupilCenterY =
    EYE_Y +
    (state_ == State::Waiting ? 94 : EYE_HEIGHT) / 2 +
    static_cast<int>(lookY * PUPIL_MOVE_Y);

  faceCanvas_.fillCircle(
    pupilCenterX,
    pupilCenterY,
    PUPIL_RADIUS,
    ST77XX_BLACK
  );

  const int eyelidHeight =
    static_cast<int>(
      blinkAmount *
      static_cast<float>(state_ == State::Waiting ? 94 : EYE_HEIGHT) /
      2.0f
    );

  if (eyelidHeight <= 0)
  {
    return;
  }

  faceCanvas_.fillRect(
    eyeX,
    EYE_Y,
    EYE_WIDTH,
    eyelidHeight,
    ST77XX_BLACK
  );

  faceCanvas_.fillRect(
    eyeX,
      EYE_Y + (state_ == State::Waiting ? 94 : EYE_HEIGHT) - eyelidHeight,
    EYE_WIDTH,
    eyelidHeight,
    ST77XX_BLACK
  );
}

float AuraFace::getBlinkAmount()
{
  if (!isBlinking_)
  {
    return 0.0f;
  }

  const unsigned long elapsed =
    millis() - blinkStartTime_;

  if (elapsed >= BLINK_DURATION_MS)
  {
    isBlinking_ = false;

    nextBlinkTime_ =
      millis() +
      randomBlinkInterval();

    return 0.0f;
  }

  const float progress =
    static_cast<float>(elapsed) /
    static_cast<float>(BLINK_DURATION_MS);

  if (progress < 0.5f)
  {
    return progress * 2.0f;
  }

  return (1.0f - progress) * 2.0f;
}

unsigned long AuraFace::randomLookInterval() const
{
  return random(
    LOOK_INTERVAL_MIN_MS,
    LOOK_INTERVAL_MAX_MS
  );
}

unsigned long AuraFace::randomBlinkInterval() const
{
  if (state_ == State::Waiting)
  {
    return random(WAITING_BLINK_INTERVAL_MIN_MS, WAITING_BLINK_INTERVAL_MAX_MS);
  }
  return random(BLINK_INTERVAL_MIN_MS, BLINK_INTERVAL_MAX_MS);
}

bool AuraFace::hasTimeElapsed(
  const unsigned long now,
  const unsigned long targetTime
)
{
  return static_cast<long>(now - targetTime) >= 0;
}

void AuraFace::updateLoadingMovement(const unsigned long now)
{
  const float cycleProgress =
    static_cast<float>(now % static_cast<unsigned long>(LOADING_CYCLE_MS)) /
    LOADING_CYCLE_MS;

  const float angle = cycleProgress * TWO_PI_RADIANS;
  currentLookX_ = cosf(angle);
  currentLookY_ = sinf(angle) * 0.75f;
}

void AuraFace::updateWaitingMovement(const unsigned long now)
{
  const float phase = static_cast<float>(now % 6000UL) / 6000.0f;
  currentLookX_ += (sinf(phase * TWO_PI_RADIANS) * 0.08f - currentLookX_) * WAITING_MOVEMENT_SPEED;
  currentLookY_ += (cosf(phase * TWO_PI_RADIANS) * 0.04f - currentLookY_) * WAITING_MOVEMENT_SPEED;
}
