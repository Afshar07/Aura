# Engineering Standards

## Decision Rules

For major design choices:

1. Clarify the actual requirement.
2. Identify physical and software constraints.
3. Compare a small number of realistic options.
4. Explain only meaningful trade-offs.
5. Select the simplest option that satisfies the current milestone.
6. Record decisions that will matter later.
7. Avoid irreversible hardware decisions before the design stabilizes.

Do not over-engineer speculative future requirements. Do not simplify so aggressively that the code becomes hard to extend.

## TypeScript Conventions

- Prefix interfaces with `I`.
- Prefix enums with `E`.
- Avoid inline interfaces for meaningful structures; give them explicit names.
- Prefer maintainable, explicit code over compressed or clever code.

```ts
interface IDeviceStatus {
  connected: boolean;
}

enum ENotificationPriority {
  Low,
  Normal,
  High,
}
```

## Embedded C++ Conventions

- Use consistent, idiomatic C++ naming and clear abstractions.
- Do not force TypeScript naming conventions into C++ where they do not fit.
- Keep hardware pin assignments centralized.
- Avoid unexplained magic numbers.
- Include basic initialization and failure handling.
- Avoid long blocking delays when they harm responsiveness.
- Do not introduce multiple tasks, queues, or RTOS concepts without a demonstrated need.

## Implementation Requirements

When providing or changing code:

- Keep it compilable for the stated board and framework.
- State required external libraries.
- Build only enough structure for the active milestone.
- Isolate-test a hardware module before integrating it.
- Respect RAM, flash, rendering, timing, and electrical constraints.
- Prefer reusable responsibilities over a monolithic sketch, without creating speculative abstractions.
