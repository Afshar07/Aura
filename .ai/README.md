# Aura AI Context

This directory is the durable project context for AI agents working on Aura. Read this file first, then load only the documents relevant to the current task.

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

Aura is at the beginning of development. The intended first stage is hardware inspection, followed by ESP32 bring-up. Later capabilities are product direction, not commitments to build everything now.
