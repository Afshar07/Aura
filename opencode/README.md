# Aura OpenCode plugin

The tracked plugin is `opencode/aura-activity.js`. OpenCode loads global plugins
from `~/.config/opencode/plugin/`.

## Install

Copy the file when you want a self-contained installation:

```powershell
New-Item -ItemType Directory -Force "$HOME/.config/opencode/plugin"
Copy-Item .\opencode\aura-activity.js "$HOME/.config/opencode/plugin/aura-activity.js"
```

On macOS or Linux:

```sh
mkdir -p ~/.config/opencode/plugin
cp opencode/aura-activity.js ~/.config/opencode/plugin/aura-activity.js
```

Alternatively, create a symlink to keep the installed plugin in sync with this
checkout. On Windows, use a junction/symlink-capable shell or enable Developer
Mode:

```powershell
New-Item -ItemType SymbolicLink -Force `
  "$HOME/.config/opencode/plugin/aura-activity.js" `
  -Target (Resolve-Path .\opencode\aura-activity.js)
```

```sh
ln -sf "$PWD/opencode/aura-activity.js" ~/.config/opencode/plugin/aura-activity.js
```

Restart OpenCode after installing or changing the plugin. Copy installations
require manual re-copying; symlink installations follow this checkout.

The plugin is best-effort: a stopped or offline bridge is ignored, and its
short HTTP timeout cannot interrupt OpenCode. Session states continue to use
`/state`; `permission.asked` sends generic JSON events to `/event` in the order
`attention/permission`, then `state/waiting`. `permission.replied` sends
`state/working` so Aura leaves the waiting state immediately. Duplicate
lifecycle events are suppressed per plugin instance.
