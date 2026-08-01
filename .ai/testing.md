# Testing Conventions

- Node bridge and OpenCode plugin tests use Node's built-in `node:test` and target public behavior.
- OpenCode plugin files intended for global loading export only their plugin entry functions. Test private behavior through the hook and a mocked `fetch` boundary rather than adding production exports.
- Restore mocked globals in `finally` blocks, use a fresh plugin instance per test, and do not use real serial, hardware, or network connections in unit tests.
- Firmware behavior should be covered by native tests where practical, plus PlatformIO builds and the manual hardware verification matrix.
