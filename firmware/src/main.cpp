#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>
#include "boot_animation.h"

constexpr int TFT_CS_PIN = 5;
constexpr int TFT_DC_PIN = 16;
constexpr int TFT_RESET_PIN = 17;

constexpr int TFT_SCK_PIN = 18;
constexpr int TFT_MOSI_PIN = 23;

constexpr int TFT_WIDTH = 240;
constexpr int TFT_HEIGHT = 280;

constexpr int LEFT_EYE_X = 0;
constexpr int RIGHT_EYE_X = 105;
constexpr int EYE_Y = 4;

constexpr int EYE_WIDTH = 65;
constexpr int EYE_HEIGHT = 90;
constexpr int EYE_RADIUS = 25;

constexpr int FACE_X = 35;
constexpr int FACE_Y = 81;
constexpr int FACE_WIDTH = 170;
constexpr int FACE_HEIGHT = 98;

constexpr int PUPIL_RADIUS = 14;
constexpr int PUPIL_MOVE_X = 13;
constexpr int PUPIL_MOVE_Y = 18;

constexpr unsigned long FRAME_INTERVAL_MS = 30;
constexpr unsigned long LOOK_INTERVAL_MIN_MS = 900;
constexpr unsigned long LOOK_INTERVAL_MAX_MS = 2400;

Adafruit_ST7789 display(
    TFT_CS_PIN,
    TFT_DC_PIN,
    TFT_RESET_PIN);

// Render both eyes into RAM before sending them to the TFT.
GFXcanvas16 faceCanvas(FACE_WIDTH, FACE_HEIGHT);

float currentLookX = 0.0f;
float currentLookY = 0.0f;

float targetLookX = 0.0f;
float targetLookY = 0.0f;

unsigned long lastFrameTime = 0;
unsigned long nextLookTime = 0;
unsigned long nextBlinkTime = 0;
unsigned long blinkStartTime = 0;

bool isBlinking = false;

unsigned long randomLookInterval()
{
  return random(
      LOOK_INTERVAL_MIN_MS,
      LOOK_INTERVAL_MAX_MS);
}

unsigned long randomBlinkInterval()
{
  return random(2200, 5500);
}

void chooseNewLookDirection()
{
  targetLookX = random(-100, 101) / 100.0f;
  targetLookY = random(-65, 66) / 100.0f;

  nextLookTime = millis() + randomLookInterval();
}

void startBlink()
{
  isBlinking = true;
  blinkStartTime = millis();
}

float getBlinkAmount()
{
  if (!isBlinking)
  {
    return 0.0f;
  }

  const unsigned long elapsed = millis() - blinkStartTime;
  constexpr unsigned long blinkDuration = 220;

  if (elapsed >= blinkDuration)
  {
    isBlinking = false;
    nextBlinkTime = millis() + randomBlinkInterval();

    return 0.0f;
  }

  const float progress =
      static_cast<float>(elapsed) /
      static_cast<float>(blinkDuration);

  if (progress < 0.5f)
  {
    return progress * 2.0f;
  }

  return (1.0f - progress) * 2.0f;
}

void drawEye(
    GFXcanvas16 &canvas,
    const int eyeX,
    const float lookX,
    const float lookY,
    const float blinkAmount)
{
  canvas.fillRoundRect(
      eyeX,
      EYE_Y,
      EYE_WIDTH,
      EYE_HEIGHT,
      EYE_RADIUS,
      ST77XX_WHITE);

  const int pupilCenterX =
      eyeX +
      EYE_WIDTH / 2 +
      static_cast<int>(lookX * PUPIL_MOVE_X);

  const int pupilCenterY =
      EYE_Y +
      EYE_HEIGHT / 2 +
      static_cast<int>(lookY * PUPIL_MOVE_Y);

  canvas.fillCircle(
      pupilCenterX,
      pupilCenterY,
      PUPIL_RADIUS,
      ST77XX_BLACK);

  const int eyelidHeight =
      static_cast<int>(
          blinkAmount * EYE_HEIGHT / 2);

  if (eyelidHeight > 0)
  {
    canvas.fillRect(
        eyeX,
        EYE_Y,
        EYE_WIDTH,
        eyelidHeight,
        ST77XX_BLACK);

    canvas.fillRect(
        eyeX,
        EYE_Y + EYE_HEIGHT - eyelidHeight,
        EYE_WIDTH,
        eyelidHeight,
        ST77XX_BLACK);
  }
}

void drawFace()
{
  const float blinkAmount = getBlinkAmount();

  // Clear the off-screen buffer, not the physical display.
  faceCanvas.fillScreen(ST77XX_BLACK);

  drawEye(
      faceCanvas,
      LEFT_EYE_X,
      currentLookX,
      currentLookY,
      blinkAmount);

  drawEye(
      faceCanvas,
      RIGHT_EYE_X,
      currentLookX,
      currentLookY,
      blinkAmount);

  // Transfer the completed frame to the TFT.
  display.drawRGBBitmap(
      FACE_X,
      FACE_Y,
      faceCanvas.getBuffer(),
      FACE_WIDTH,
      FACE_HEIGHT);
}

void updateEyeMovement()
{
  constexpr float movementSpeed = 0.12f;

  currentLookX +=
      (targetLookX - currentLookX) *
      movementSpeed;

  currentLookY +=
      (targetLookY - currentLookY) *
      movementSpeed;
}

void setup()
{
  Serial.begin(115200);
  delay(500);

  Serial.println("Starting animated Aura eyes...");

  randomSeed(analogRead(34));

  SPI.begin(
      TFT_SCK_PIN,
      -1,
      TFT_MOSI_PIN,
      TFT_CS_PIN);

  display.init(TFT_WIDTH, TFT_HEIGHT);
  display.setRotation(0);
  display.fillScreen(ST77XX_BLACK);

  playBootAnimation(display);

  nextLookTime = millis() + 800;
  nextBlinkTime = millis() + 1800;

  drawFace();

  drawFace();

  Serial.println("Aura eyes are alive.");
}

void loop()
{
  const unsigned long now = millis();

  if (now >= nextLookTime)
  {
    chooseNewLookDirection();
  }

  if (!isBlinking && now >= nextBlinkTime)
  {
    startBlink();
  }

  if (now - lastFrameTime >= FRAME_INTERVAL_MS)
  {
    lastFrameTime = now;

    updateEyeMovement();
    drawFace();
  }
}