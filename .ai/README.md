# Aura AI Context

This directory is the durable project context for AI agents working on Aura. Read this file first, then load only the documents relevant to the current task.

## Learning-First Principle (Non-Negotiable)

Aura's primary goal includes deep embedded-systems learning, not merely shipping. Libraries, frameworks, and abstractions must not hide important concepts by default. When relevant, pause to explain the internals and why abstractions exist for SPI, I2C, UART, PWM, interrupts, DMA, timers, FreeRTOS, memory management, rendering pipelines, and protocols. The objective is understanding, not reimplementation: prefer mature libraries, and do not replace them without genuine engineering reasons.

Introduce low-level detail gradually and only for the active milestone; avoid overwhelming or unrelated deep dives. Always distinguish **what we are using**, **what it does internally**, and **why we chose it**. Optimize decisions for maintainable product quality and increasing user understanding. Never accept “the library works” as sufficient reason to sacrifice understanding.

## Context Map

| File | Read when working on |
| --- | --- |
| [01-project-vision.md](./01-project-vision.md) | Product goals, intended capabilities, scope, and user background |
| [02-hardware.md](./02-hardware.md) | Components, wiring, power, electrical safety, soldering, or packaging |
| [03-system-architecture.md](./03-system-architecture.md) | Firmware, desktop app, communication, repository structure, or toolchain |
| [04-roadmap.md](./04-roadmap.md) | Current sequencing, milestones, and deciding what to build next |
| [05-engineering-standards.md](./05-engineering-standards.md) | Code conventions, implementation principles, and design decisions |
| [06-agent-guidelines.md](./06-agent-guidelines.md) | How to explain, plan, and collaborate with the user |

## Usage Rules

1. Treat these files as standing project constraints unless the user explicitly overrides them.
2. Read `02-hardware.md` before giving wiring or power instructions.
3. Read `04-roadmap.md` before proposing a new feature or broad implementation plan.
4. Read `05-engineering-standards.md` before changing code or architecture.
5. Read `06-agent-guidelines.md` before presenting a substantial answer or tutorial.
6. Clearly distinguish confirmed facts from assumptions. Do not silently turn likely hardware details or future ideas into settled decisions.
7. Update the relevant context file when the user makes a durable decision. Do not use these files as a session log.

## Current Project State

Aura has an implemented PlatformIO firmware project, shared logo asset, tracked OpenCode plugin, and cross-platform Node.js USB serial bridge. ESP32 and ST7789 code initializes the display, plays a boot animation, parses a bounded generic activity protocol, and renders an animated face with idle, OpenCode loading, permission-waiting, and red error states. The exact current repository tree and responsibilities are recorded in `03-system-architecture.md`.

The permission-waiting face, red error face, legacy states, and host-disconnection fallback have been physically verified on the ESP32 and TFT.

The desktop app, sensors, input, lighting, audio, networking, enclosure, and PCB remain future work. Later capabilities are product direction, not commitments to build everything now.
