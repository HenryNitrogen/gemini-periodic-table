# Periodic Table for Gemini

An interactive **118-element Periodic Table** model selector Chrome extension for Google Gemini (`gemini.google.com`), inspired by the viral Model Periodic Table UI concept by [`@UFO2002616`](https://x.com/UFO2002616/status/2122321834331005104).

## Features

- **Real-Time Model & Thinking Switching on `gemini.google.com`**:
  - Hooks directly into Gemini's native model picker across both desktop (`>= 960px` prompt bar) and narrow/mobile (`<= 959px` top header) layouts.
  - Dynamically discovers models directly from Gemini's live menu (including element-named models like `1 H` **Hydrogen**, `6 C` **Carbon**, `18 Ar` **Argon**, plus any future elements Google releases, and non-element models in `Other models`).
  - Supports real-time **Thinking level** (`Low`, `Medium`, `High`) switching and automatically syncs with your live Gemini session.
- **Full 118-Element Periodic Table**:
  - 18 columns × 7 periods + Lanthanide and Actinide f-block rows.
  - 3 highlighted released models + 115 interactive `Coming soon` elements.
- **Standalone Fullscreen Replica (`demo.html`)**:
  - Includes a standalone interactive demo replicating the original concept video.

## Installation (Unpacked)

1. Open `chrome://extensions/` in Chrome, Arc, Edge, or Brave.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select this folder.
