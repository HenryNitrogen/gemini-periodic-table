"use client";

import React, { useState } from "react";
import {
  Download,
  ArrowUpRight,
  Copy,
  Check,
  Terminal,
  Layers,
  Cpu,
  ShieldCheck,
  FileCode,
  FolderGit2,
  MonitorSmartphone,
} from "lucide-react";
import { FloatingNavbar } from "@/components/floating-navbar";
import { PeriodicTablePlayground } from "@/components/periodic-table-playground";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function GitHubMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const REPO_URL = "https://github.com/HenryNitrogen/gemini-periodic-table";

const SOURCE_FILES = [
  {
    path: "Extension/manifest.json",
    desc: "Chrome Extension Manifest V3 configuration & host permissions",
    lines: "32 lines",
    href: `${REPO_URL}/blob/main/Extension/manifest.json`,
  },
  {
    path: "Extension/content.js",
    desc: "Live gemini.google.com DOM observer, responsive scaler & native menu driver",
    lines: "560+ lines",
    href: `${REPO_URL}/blob/main/Extension/content.js`,
  },
  {
    path: "Extension/periodic-table.js",
    desc: "118-element Periodic Table popover UI, hover bridge & 220ms intent guard",
    lines: "680+ lines",
    href: `${REPO_URL}/blob/main/Extension/periodic-table.js`,
  },
  {
    path: "Extension/elements-data.js",
    desc: "Complete 118 chemical elements coordinate matrix & Gemini 4 model mappings",
    lines: "190+ lines",
    href: `${REPO_URL}/blob/main/Extension/elements-data.js`,
  },
  {
    path: "Extension/periodic-table.css",
    desc: "Obsidian dark-mode popover styling, accent glows & top-layer overrides",
    lines: "620+ lines",
    href: `${REPO_URL}/blob/main/Extension/periodic-table.css`,
  },
  {
    path: "web/src/app/page.tsx",
    desc: "Next.js + Tailwind CSS + shadcn/ui open-source documentation & playground",
    lines: "360+ lines",
    href: `${REPO_URL}/blob/main/web/src/app/page.tsx`,
  },
];

const SHOWCASE_SLIDES = [
  {
    id: "argon",
    badge: "18 Ar · Released",
    title: "Gemini 4 Argon — Code & Analysis",
    description:
      "Selecting 18 Ar (Argon) switches your live Gemini session to 4 Argon and exposes real-time Thinking Level controls (Low, Medium, High).",
    src: "/screenshots/showcase-argon.png",
  },
  {
    id: "hydrogen",
    badge: "1 H · Released",
    title: "Gemini 4 Hydrogen — Everyday Help",
    description:
      "Anchored directly to Gemini's prompt bar, 1 H (Hydrogen) provides fast everyday assistance with instant Low / Medium / High depth switching.",
    src: "/screenshots/showcase-hydrogen.png",
  },
  {
    id: "carbon",
    badge: "6 C · Released",
    title: "Gemini 4 Carbon — Most Complex Work",
    description:
      "Deep-reasoning model slot at Group 14, Period 2 (6 C) with violet accent styling and seamless Thinking Level configuration.",
    src: "/screenshots/showcase-carbon.png",
  },
];

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const cloneCmd = `git clone ${REPO_URL}.git`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950">
      <FloatingNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-8 border-zinc-300 bg-white px-4 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
            <span>100% Open Source · MIT License · Chrome Extension MV3</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] text-zinc-950 leading-[1.06]">
            Periodic Table
            <br />
            <span className="text-zinc-400">for Gemini.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
            An open-source Chrome extension that replaces the standard model
            dropdown on{" "}
            <span className="font-mono text-sm text-zinc-900 underline decoration-zinc-300 underline-offset-4">
              gemini.google.com
            </span>{" "}
            with the viral 118-element Periodic Table—switching your real active
            Gemini model and Thinking Level on the fly.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="/periodic-table-for-gemini.zip"
              download
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-zinc-950 px-7 text-sm font-medium text-white hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Extension (.zip)</span>
            </a>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 rounded-full border border-zinc-300 bg-white px-7 text-sm font-medium text-zinc-950 hover:bg-zinc-100 transition-all"
            >
              <GitHubMark className="h-4 w-4" />
              <span>View Source on GitHub</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
            </a>
          </div>

          {/* Minimalist Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 border-y border-zinc-200/90 py-7 text-left">
            <div>
              <div className="font-mono text-2xl font-semibold text-zinc-950">
                118
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                Interactive Element Slots
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-zinc-950">
                Real-Time
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                Live DOM Model & Thinking Sync
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-zinc-950">
                0 KB
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                External Telemetry or Tracking
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-zinc-950">
                MIT
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                Free & Open-Source License
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PLAYGROUND SECTION */}
      <section id="demo" className="py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                01 / Interactive Playground
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Try the 118-Element Selector Live
              </h2>
            </div>
            <p className="max-w-md text-sm text-zinc-500">
              Click or hover over{" "}
              <strong className="text-zinc-900">1 H (Hydrogen)</strong>,{" "}
              <strong className="text-zinc-900">6 C (Carbon)</strong>, or{" "}
              <strong className="text-zinc-900">18 Ar (Argon)</strong> below to
              test Thinking Level switching right in your browser.
            </p>
          </div>

          <PeriodicTablePlayground />
        </div>
      </section>

      {/* BROWSER-CAPTURED VISUAL SHOWCASE */}
      <section
        id="showcase"
        className="py-24 sm:py-32 px-6 border-t border-zinc-200/80 bg-white"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                02 / Visual Showcase
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                Captured in Action
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {SHOWCASE_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    activeSlide === idx
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {slide.badge}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-lg">
              <img
                src={SHOWCASE_SLIDES[activeSlide].src}
                alt={SHOWCASE_SLIDES[activeSlide].title}
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="lg:col-span-4 space-y-5">
              <Badge variant="secondary" className="font-mono text-[11px]">
                {SHOWCASE_SLIDES[activeSlide].badge}
              </Badge>
              <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                {SHOWCASE_SLIDES[activeSlide].title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {SHOWCASE_SLIDES[activeSlide].description}
              </p>
              <div className="pt-2">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-950 hover:underline underline-offset-4"
                >
                  <span>Inspect implementation on GitHub</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE & FEATURES SECTION */}
      <section
        id="features"
        className="py-24 sm:py-32 px-6 border-t border-zinc-200/80"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              03 / Engineering & Architecture
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Not Just a Mockup. Built for Live Gemini DOM.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-500 leading-relaxed">
              Designed with precision DOM synchronization so every click in the
              Periodic Table drives Google Gemini&apos;s underlying model router
              and Thinking Level state in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                  <Cpu className="h-5 w-5 text-zinc-900" />
                </div>
                <CardTitle>Real-Time Native Model Switching</CardTitle>
                <CardDescription>
                  Hooks directly into{" "}
                  <code className="font-mono text-xs text-zinc-800">
                    [data-test-id=&quot;bard-mode-menu-button&quot;]
                  </code>{" "}
                  and drives{" "}
                  <code className="font-mono text-xs text-zinc-800">
                    gem-menu
                  </code>{" "}
                  items invisibly in the background—genuinely switching between
                  4 Hydrogen, 4 Argon, 4 Carbon, 3.5 Flash-Lite, and 3.1 Pro.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                  <Layers className="h-5 w-5 text-zinc-900" />
                </div>
                <CardTitle>Precision Thinking Level Sync</CardTitle>
                <CardDescription>
                  Reads and switches Gemini&apos;s native{" "}
                  <code className="font-mono text-xs text-zinc-800">
                    thinking_level
                  </code>{" "}
                  options (<code className="font-mono text-xs">Low</code>,{" "}
                  <code className="font-mono text-xs">Medium</code>,{" "}
                  <code className="font-mono text-xs">High</code>) by matching
                  pure <code className="font-mono text-xs">.label</code> nodes
                  and live button state across English and Chinese locales.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                  <MonitorSmartphone className="h-5 w-5 text-zinc-900" />
                </div>
                <CardTitle>Dual Responsive Breakpoint Engine</CardTitle>
                <CardDescription>
                  Automatically adapts across Gemini&apos;s{" "}
                  <code className="font-mono text-xs text-zinc-800">960px</code>{" "}
                  responsive breakpoint—supporting both desktop nested{" "}
                  <code className="font-mono text-xs">popover=&quot;manual&quot;</code>{" "}
                  submenus and mobile top-header inline{" "}
                  <code className="font-mono text-xs">.expand-content</code>{" "}
                  accordions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                  <ShieldCheck className="h-5 w-5 text-zinc-900" />
                </div>
                <CardTitle>Zero-Misclick Bridge & 100% Privacy</CardTitle>
                <CardDescription>
                  Features a continuous hit-area hover bridge and a{" "}
                  <code className="font-mono text-xs text-zinc-800">220ms</code>{" "}
                  hover-intent guard so moving toward Thinking Level pills never
                  triggers adjacent elements. Runs 100% locally with zero
                  telemetry.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* DEDICATED GITHUB & OPEN SOURCE CODE EXPLORER SECTION */}
      <section
        id="source"
        className="py-24 sm:py-32 px-6 border-t border-zinc-200/80 bg-white"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                04 / Open Source Repository
              </div>
              <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
                100% Open Source. Inspect Every Line.
              </h2>
              <p className="mt-3 max-w-xl text-sm sm:text-base text-zinc-500 leading-relaxed">
                Both the Chrome Extension (<code className="font-mono text-xs text-zinc-800">Extension/</code>)
                and this Next.js showcase website (<code className="font-mono text-xs text-zinc-800">web/</code>)
                are open-source under the MIT License on GitHub.
              </p>
            </div>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2.5 self-start rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 transition-all"
            >
              <GitHubMark className="h-4 w-4" />
              <span>HenryNitrogen/gemini-periodic-table</span>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </a>
          </div>

          {/* Clone Command Bar */}
          <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-[#FAFAFA] px-5 py-3.5">
            <div className="flex items-center gap-3 overflow-x-auto">
              <Terminal className="h-4 w-4 text-zinc-400 shrink-0" />
              <code className="font-mono text-xs sm:text-sm text-zinc-900 whitespace-nowrap">
                {cloneCmd}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Source File Explorer Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-6 py-3.5 text-xs font-medium text-zinc-500">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-zinc-700" />
                <span className="font-mono text-zinc-900 font-semibold">
                  HenryNitrogen / gemini-periodic-table
                </span>
                <Badge variant="secondary" className="ml-2 font-mono text-[10px]">
                  main
                </Badge>
              </div>
              <span>Browse Source Files</span>
            </div>

            <div className="divide-y divide-zinc-200/80">
              {SOURCE_FILES.map((file) => (
                <a
                  key={file.path}
                  href={file.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors shrink-0" />
                    <span className="font-mono text-xs sm:text-sm font-medium text-zinc-900 group-hover:underline underline-offset-4">
                      {file.path}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-zinc-500">
                    <span>{file.desc}</span>
                    <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                      {file.lines}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-950 transition-colors shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3-STEP INSTALLATION SECTION */}
      <section
        id="install"
        className="py-24 sm:py-32 px-6 border-t border-zinc-200/80"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              05 / Quick Installation
            </div>
            <h2 className="mt-2 text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Install in 30 Seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="font-mono text-xs font-semibold text-zinc-400">
                  STEP 01
                </div>
                <CardTitle className="mt-1">Download or Clone</CardTitle>
                <CardDescription>
                  Download{" "}
                  <a
                    href="/periodic-table-for-gemini.zip"
                    download
                    className="text-zinc-950 underline underline-offset-4 font-medium"
                  >
                    periodic-table-for-gemini.zip
                  </a>{" "}
                  and unzip it, or clone the repository from GitHub and locate
                  the <code className="font-mono text-xs text-zinc-800">Extension/</code>{" "}
                  directory.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-mono text-xs font-semibold text-zinc-400">
                  STEP 02
                </div>
                <CardTitle className="mt-1">Load Unpacked in Chrome</CardTitle>
                <CardDescription>
                  Open <code className="font-mono text-xs text-zinc-800">chrome://extensions/</code>,
                  toggle on <strong>Developer mode</strong> in the top-right
                  corner, and click <strong>Load unpacked</strong> to select the{" "}
                  <code className="font-mono text-xs text-zinc-800">Extension/</code> folder.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-mono text-xs font-semibold text-zinc-400">
                  STEP 03
                </div>
                <CardTitle className="mt-1">Open Google Gemini</CardTitle>
                <CardDescription>
                  Visit{" "}
                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-950 underline underline-offset-4 font-medium"
                  >
                    gemini.google.com
                  </a>{" "}
                  and click the model selector button in the prompt bar to
                  launch the Periodic Table.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* MINIMALIST FOOTER */}
      <footer className="border-t border-zinc-200/90 bg-white py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-950 text-white font-mono text-[10px] font-bold">
              Pt
            </span>
            <span className="font-semibold text-zinc-950">
              Periodic Table for Gemini
            </span>
            <span>·</span>
            <span>Open-Source under MIT License</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="/privacy"
              className="hover:text-zinc-950 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="mailto:ptable@coldestwins.com"
              className="hover:text-zinc-950 transition-colors"
            >
              ptable@coldestwins.com
            </a>
            <a
              href="https://x.com/UFO2002616/status/2122321834331005104"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-950 transition-colors"
            >
              Concept by @UFO2002616
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-zinc-950 hover:underline underline-offset-4"
            >
              <GitHubMark className="h-3.5 w-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
