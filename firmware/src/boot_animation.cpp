#include "boot_animation.h"

#include <Arduino.h>
#include "aura_boot_logo.h"

namespace
{
constexpr int REVEAL_STEP_HEIGHT = 8;
constexpr unsigned long REVEAL_STEP_DELAY_MS = 18;
constexpr unsigned long LOGO_HOLD_MS = 1500;
constexpr unsigned long EXIT_STEP_DELAY_MS = 10;

void revealLogo(Adafruit_ST7789& display)
{
  for (
    int y = 0;
    y < AURA_BOOT_LOGO_HEIGHT;
    y += REVEAL_STEP_HEIGHT
  )
  {
    const int remainingHeight = AURA_BOOT_LOGO_HEIGHT - y;
    const int stripHeight =
      remainingHeight < REVEAL_STEP_HEIGHT
        ? remainingHeight
        : REVEAL_STEP_HEIGHT;

    const uint16_t* strip =
      AURA_BOOT_LOGO +
      (y * AURA_BOOT_LOGO_WIDTH);

    display.drawRGBBitmap(
      0,
      y,
      strip,
      AURA_BOOT_LOGO_WIDTH,
      stripHeight
    );

    delay(REVEAL_STEP_DELAY_MS);
  }
}

void clearLogo(Adafruit_ST7789& display)
{
  for (
    int inset = 0;
    inset < AURA_BOOT_LOGO_HEIGHT / 2;
    inset += REVEAL_STEP_HEIGHT
  )
  {
    const int bottomY =
      AURA_BOOT_LOGO_HEIGHT -
      inset -
      REVEAL_STEP_HEIGHT;

    display.fillRect(
      0,
      inset,
      AURA_BOOT_LOGO_WIDTH,
      REVEAL_STEP_HEIGHT,
      ST77XX_BLACK
    );

    display.fillRect(
      0,
      bottomY,
      AURA_BOOT_LOGO_WIDTH,
      REVEAL_STEP_HEIGHT,
      ST77XX_BLACK
    );

    delay(EXIT_STEP_DELAY_MS);
  }

  display.fillScreen(ST77XX_BLACK);
}
}

void playBootAnimation(Adafruit_ST7789& display)
{
  display.fillScreen(ST77XX_BLACK);

  revealLogo(display);
  delay(LOGO_HOLD_MS);
  clearLogo(display);
}
