# Project Vision

## Overview

Aura is a long-term embedded-systems project for a polished, expandable smart desktop companion. It should become a real hardware/software product beside the user's monitor, not a one-off Arduino demonstration.

Aura may combine:

- ESP32 firmware
- Embedded UI
- Sensors and physical controls
- Wi-Fi and Bluetooth
- A desktop companion application
- Real-time communication
- Thoughtful hardware design
- Eventually, a custom enclosure and possibly a custom PCB

Development must stay enjoyable, incremental, and practical. Add features one at a time, and make each stage produce a visible working result.

## Product Role

Aura should eventually act as a physical extension of the user's computer and workspace. Utility comes first; personality may enhance the experience but must not interfere with usability.

### Ambient Dashboard

Potential information includes:

- Current time and date
- Indoor temperature, humidity, and air pressure
- Wi-Fi and device state
- Outdoor weather
- Upcoming calendar event

### Development Status

A desktop application may send events such as:

- Build started, succeeded, or failed
- Tests passed or failed
- AI coding agent running or finished
- Pull request approved
- Deployment completed

The TFT can show details while the LED ring communicates peripheral status. Candidate defaults are green for success, red for failure, blue for processing or AI activity, yellow for warnings or upcoming events, and purple for quiet or night mode. These mappings must remain configurable rather than deeply hard-coded.

### Focus Support

Potential ADHD-friendly utilities include:

- Pomodoro timer
- Break, hydration, or hyperfocus-interruption reminders
- Meeting countdown
- Quiet visual notifications
- Ambient-light warning
- Display sleep when the user leaves

These features should be supportive and non-intrusive.

### Presence and Personality

Presence detection may later use an ultrasonic or infrared sensor to wake, dim, or alter idle behavior. Add it only after the core system is stable.

Possible personality states include idle, sleeping, happy, busy, error, notification, and listening. They may use TFT expressions, LED animation, buzzer sounds, or servo motion.

## User Background

The user is an experienced frontend engineer who primarily works with Vue, Nuxt, TypeScript, JavaScript, Tailwind CSS, and Pinia. They also have backend experience with NestJS, Prisma, and PostgreSQL.

The user is relatively new to embedded systems and electronics. They want to understand underlying concepts rather than blindly follow tutorials. Connect embedded ideas to familiar software concepts when useful, but do not imply that hardware behaves exactly like web software.

The user values small trackable steps, clear reasoning, modular architecture, reusable code, strong technical opinions, honest criticism, minimal unnecessary complexity, and plans that are not overwhelming.
