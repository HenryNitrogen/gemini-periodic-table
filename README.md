# Periodic Table for Gemini

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install_Extension-black?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/periodic-table-for-gemini/akmnlllibcniifmopljohofbjkecggcm)
[![Website](https://img.shields.io/badge/Website-ptable.coldestwins.com-black)](https://ptable.coldestwins.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-black)](./Extension)
[![Next.js](https://img.shields.io/badge/Web-Next.js_%2B_shadcn%2Fui-black)](./web)

An open-source Chrome Extension (`Extension/`) and interactive showcase website (`web/`) that upgrades Google Gemini's (`gemini.google.com`) model selector into the viral **118-element Periodic Table** UI—with real-time model and Thinking Level (`Low` / `Medium` / `High`) switching.

Inspired by the Model Periodic Table UI concept by [`@UFO2002616`](https://x.com/UFO2002616/status/2122321834331005104).

---

## Repository Structure

```text
gemini-periodic-table/
├── Extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json       # MV3 extension manifest
│   ├── content.js          # Live gemini.google.com DOM integration & model/thinking switcher
│   ├── periodic-table.js   # Reusable 118-element Periodic Table popover controller
│   ├── periodic-table.css  # Dark-mode popover & hover-bridge styles
│   ├── elements-data.js    # Complete 118 chemical elements dataset & model mappings
│   ├── popup.html / .js    # Extension toolbar popup
│   └── demo.html / .js     # Standalone fullscreen replica
└── web/                    # Official Open-Source Showcase Website (Next.js + Tailwind + shadcn/ui)
    ├── src/app/            # App Router pages & layouts
    ├── src/components/     # Scroll-morphing navbar, interactive Periodic Table playground, shadcn UI
    └── public/             # Captured demo screenshots, videos & downloadable extension zip
```

---

## Key Features

- **Real-Time Model Switching on `gemini.google.com`**:
  - Directly binds to Gemini's native model picker (`[data-test-id="bard-mode-menu-button"]`) across both desktop (`>= 960px` bottom prompt bar) and narrow/mobile (`<= 959px` top header) layouts.
  - Dynamically discovers every model from Gemini's live menu—lighting up any released element models (like **Hydrogen** `1 H`, **Carbon** `6 C`, **Argon** `18 Ar`, plus future elements) and listing non-element models in `Other models`.
- **Real-Time Thinking Level Controls (`Low` / `Medium` / `High`)**:
  - Reads and switches Gemini's native Thinking Level submenu (`gem-menu-item[value="thinking_level"]`) on the fly.
- **Zero-Misclick Hover Bridge & Intent Guard**:
  - Uses a continuous hover bridge and a `220ms` hover-intent guard so moving your cursor to `Low / Medium / High` never triggers adjacent elements.
- **100% Local & Privacy-First**:
  - Zero external requests, zero analytics, and zero data collection.

---

## Quick Start

### Option 1: Install from Chrome Web Store (Recommended)

👉 **[Install Periodic Table for Gemini on Chrome Web Store](https://chromewebstore.google.com/detail/periodic-table-for-gemini/akmnlllibcniifmopljohofbjkecggcm)**

### Option 2: Load Unpacked from Source (`Extension/`)

```bash
git clone https://github.com/HenryNitrogen/gemini-periodic-table.git
```

1. Open `chrome://extensions/` in Chrome, Arc, Brave, or Edge.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `Extension/` directory.
4. Open [gemini.google.com](https://gemini.google.com/app) and click the model selector button!

### 2. Run the Showcase Website (`web/`)

```bash
cd web
pnpm install
pnpm dev
```

Open `http://localhost:3000` in your browser.

---

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).
