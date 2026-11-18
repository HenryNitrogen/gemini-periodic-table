"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Mic, ChevronDown, X, BookOpen, Rocket, Lightbulb } from "lucide-react";

export interface ElementItem {
  number: number;
  symbol: string;
  name: string;
  row: number;
  col: number;
  released?: {
    title: string;
    subtitle: string;
    accent: "blue" | "purple" | "teal";
    defaultThinking: "Low" | "Medium" | "High";
  };
}

const RELEASED_MAP: Record<number, NonNullable<ElementItem["released"]>> = {
  1: {
    title: "Hydrogen",
    subtitle: "Everyday help",
    accent: "blue",
    defaultThinking: "Medium",
  },
  6: {
    title: "Carbon",
    subtitle: "Most complex work",
    accent: "purple",
    defaultThinking: "Low",
  },
  18: {
    title: "Argon",
    subtitle: "Code and analysis",
    accent: "teal",
    defaultThinking: "Low",
  },
};

const OTHER_MODELS_LIST = [
  { id: "flash-lite", name: "Flash-Lite", badge: "3.5", subtitle: "Fast answers" },
  { id: "3.1-pro", name: "3.1 Pro", badge: "3.1", subtitle: "Deep research" },
];

const RAW_ELEMENTS: [number, string, string, number, number][] = [
  [1, "H", "Hydrogen", 1, 1],
  [2, "He", "Helium", 1, 18],
  [3, "Li", "Lithium", 2, 1],
  [4, "Be", "Beryllium", 2, 2],
  [5, "B", "Boron", 2, 13],
  [6, "C", "Carbon", 2, 14],
  [7, "N", "Nitrogen", 2, 15],
  [8, "O", "Oxygen", 2, 16],
  [9, "F", "Fluorine", 2, 17],
  [10, "Ne", "Neon", 2, 18],
  [11, "Na", "Sodium", 3, 1],
  [12, "Mg", "Magnesium", 3, 2],
  [13, "Al", "Aluminum", 3, 13],
  [14, "Si", "Silicon", 3, 14],
  [15, "P", "Phosphorus", 3, 15],
  [16, "S", "Sulfur", 3, 16],
  [17, "Cl", "Chlorine", 3, 17],
  [18, "Ar", "Argon", 3, 18],
  [19, "K", "Potassium", 4, 1],
  [20, "Ca", "Calcium", 4, 2],
  [21, "Sc", "Scandium", 4, 3],
  [22, "Ti", "Titanium", 4, 4],
  [23, "V", "Vanadium", 4, 5],
  [24, "Cr", "Chromium", 4, 6],
  [25, "Mn", "Manganese", 4, 7],
  [26, "Fe", "Iron", 4, 8],
  [27, "Co", "Cobalt", 4, 9],
  [28, "Ni", "Nickel", 4, 10],
  [29, "Cu", "Copper", 4, 11],
  [30, "Zn", "Zinc", 4, 12],
  [31, "Ga", "Gallium", 4, 13],
  [32, "Ge", "Germanium", 4, 14],
  [33, "As", "Arsenic", 4, 15],
  [34, "Se", "Selenium", 4, 16],
  [35, "Br", "Bromine", 4, 17],
  [36, "Kr", "Krypton", 4, 18],
  [37, "Rb", "Rubidium", 5, 1],
  [38, "Sr", "Strontium", 5, 2],
  [39, "Y", "Yttrium", 5, 3],
  [40, "Zr", "Zirconium", 5, 4],
  [41, "Nb", "Niobium", 5, 5],
  [42, "Mo", "Molybdenum", 5, 6],
  [43, "Tc", "Technetium", 5, 7],
  [44, "Ru", "Ruthenium", 5, 8],
  [45, "Rh", "Rhodium", 5, 9],
  [46, "Pd", "Palladium", 5, 10],
  [47, "Ag", "Silver", 5, 11],
  [48, "Cd", "Cadmium", 5, 12],
  [49, "In", "Indium", 5, 13],
  [50, "Sn", "Tin", 5, 14],
  [51, "Sb", "Antimony", 5, 15],
  [52, "Te", "Tellurium", 5, 16],
  [53, "I", "Iodine", 5, 17],
  [54, "Xe", "Xenon", 5, 18],
  [55, "Cs", "Cesium", 6, 1],
  [56, "Ba", "Barium", 6, 2],
  [72, "Hf", "Hafnium", 6, 4],
  [73, "Ta", "Tantalum", 6, 5],
  [74, "W", "Tungsten", 6, 6],
  [75, "Re", "Rhenium", 6, 7],
  [76, "Os", "Osmium", 6, 8],
  [77, "Ir", "Iridium", 6, 9],
  [78, "Pt", "Platinum", 6, 10],
  [79, "Au", "Gold", 6, 11],
  [80, "Hg", "Mercury", 6, 12],
  [81, "Tl", "Thallium", 6, 13],
  [82, "Pb", "Lead", 6, 14],
  [83, "Bi", "Bismuth", 6, 15],
  [84, "Po", "Polonium", 6, 16],
  [85, "At", "Astatine", 6, 17],
  [86, "Rn", "Radon", 6, 18],
  [87, "Fr", "Francium", 7, 1],
  [88, "Ra", "Radium", 7, 2],
  [104, "Rf", "Rutherfordium", 7, 4],
  [105, "Db", "Dubnium", 7, 5],
  [106, "Sg", "Seaborgium", 7, 6],
  [107, "Bh", "Bohrium", 7, 7],
  [108, "Hs", "Hassium", 7, 8],
  [109, "Mt", "Meitnerium", 7, 9],
  [110, "Ds", "Darmstadtium", 7, 10],
  [111, "Rg", "Roentgenium", 7, 11],
  [112, "Cn", "Copernicium", 7, 12],
  [113, "Nh", "Nihonium", 7, 13],
  [114, "Fl", "Flerovium", 7, 14],
  [115, "Mc", "Moscovium", 7, 15],
  [116, "Lv", "Livermorium", 7, 16],
  [117, "Ts", "Tennessine", 7, 17],
  [118, "Og", "Oganesson", 7, 18],
  [57, "La", "Lanthanum", 8, 4],
  [58, "Ce", "Cerium", 8, 5],
  [59, "Pr", "Praseodymium", 8, 6],
  [60, "Nd", "Neodymium", 8, 7],
  [61, "Pm", "Promethium", 8, 8],
  [62, "Sm", "Samarium", 8, 9],
  [63, "Eu", "Europium", 8, 10],
  [64, "Gd", "Gadolinium", 8, 11],
  [65, "Tb", "Terbium", 8, 12],
  [66, "Dy", "Dysprosium", 8, 13],
  [67, "Ho", "Holmium", 8, 14],
  [68, "Er", "Erbium", 8, 15],
  [69, "Tm", "Thulium", 8, 16],
  [70, "Yb", "Ytterbium", 8, 17],
  [71, "Lu", "Lutetium", 8, 18],
  [89, "Ac", "Actinium", 9, 4],
  [90, "Th", "Thorium", 9, 5],
  [91, "Pa", "Protactinium", 9, 6],
  [92, "U", "Uranium", 9, 7],
  [93, "Np", "Neptunium", 9, 8],
  [94, "Pu", "Plutonium", 9, 9],
  [95, "Am", "Americium", 9, 10],
  [96, "Cm", "Curium", 9, 11],
  [97, "Bk", "Berkelium", 9, 12],
  [98, "Cf", "Californium", 9, 13],
  [99, "Es", "Einsteinium", 9, 14],
  [100, "Fm", "Fermium", 9, 15],
  [101, "Md", "Mendelevium", 9, 16],
  [102, "No", "Nobelium", 9, 17],
  [103, "Lr", "Lawrencium", 9, 18],
];

export const ELEMENTS: ElementItem[] = RAW_ELEMENTS.map(
  ([number, symbol, name, row, col]) => ({
    number,
    symbol,
    name,
    row,
    col,
    released: RELEASED_MAP[number],
  })
);

export function PeriodicTablePlayground() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number>(18);
  const [selectedOther, setSelectedOther] = useState<string | null>(null);
  const [activeCardNumber, setActiveCardNumber] = useState<number | null>(18);
  const [activeCardOtherId, setActiveCardOtherId] = useState<string | null>(null);
  const [thinkingLevels, setThinkingLevels] = useState<
    Record<number, "Low" | "Medium" | "High">
  >({
    1: "Medium",
    6: "Low",
    18: "Low",
  });
  const [activeMode, setActiveMode] = useState<"Chat" | "Task">("Chat");
  const [promptText, setPromptText] = useState("");
  const [statusLog, setStatusLog] = useState(
    "Active: Argon · Thinking level: Low"
  );
  const hoverIntentRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (hoverIntentRef.current) {
        clearTimeout(hoverIntentRef.current);
      }
    };
  }, []);

  const clearHoverIntent = () => {
    if (hoverIntentRef.current) {
      clearTimeout(hoverIntentRef.current);
      hoverIntentRef.current = null;
    }
  };

  const selectedElement =
    ELEMENTS.find((e) => e.number === selectedNumber) || ELEMENTS[0];
  const activeCardEl =
    ELEMENTS.find((e) => e.number === activeCardNumber) || null;
  const activeCardOther =
    OTHER_MODELS_LIST.find((m) => m.id === activeCardOtherId) || null;

  const pillLabel = selectedOther
    ? OTHER_MODELS_LIST.find((m) => m.id === selectedOther)?.name || "Flash-Lite"
    : selectedElement.name;
  const pillThinking =
    !selectedOther && selectedElement.released
      ? thinkingLevels[selectedElement.number] ||
        selectedElement.released.defaultThinking
      : null;
  const isSelectedSoon = !selectedOther && !selectedElement.released;

  const handleTileHover = (el: ElementItem) => {
    if (hoverIntentRef.current) {
      clearTimeout(hoverIntentRef.current);
      hoverIntentRef.current = null;
    }
    const protectingReleased =
      activeCardEl && activeCardEl.released && activeCardEl.number !== el.number;
    if (protectingReleased) {
      hoverIntentRef.current = setTimeout(() => {
        setActiveCardOtherId(null);
        setActiveCardNumber(el.number);
      }, 180);
    } else {
      setActiveCardOtherId(null);
      setActiveCardNumber(el.number);
    }
  };

  const handleTileClick = (el: ElementItem) => {
    if (hoverIntentRef.current) {
      clearTimeout(hoverIntentRef.current);
      hoverIntentRef.current = null;
    }
    setSelectedOther(null);
    setActiveCardOtherId(null);
    setSelectedNumber(el.number);
    setActiveCardNumber(el.number);
    if (el.released) {
      const lvl = thinkingLevels[el.number] || el.released.defaultThinking;
      setStatusLog(`Switched to ${el.released.title} · Thinking level: ${lvl}`);
    } else {
      setStatusLog(`${el.name} (${el.symbol}) is Coming soon`);
    }
  };

  const handleThinkingChange = (
    el: ElementItem,
    level: "Low" | "Medium" | "High"
  ) => {
    setSelectedOther(null);
    setActiveCardOtherId(null);
    setSelectedNumber(el.number);
    setThinkingLevels((prev) => ({ ...prev, [el.number]: level }));
    if (el.released) {
      setStatusLog(`Switched to ${el.released.title} · Thinking level: ${level}`);
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = promptText.trim();
    if (!text) return;
    if (!selectedOther && !selectedElement.released) {
      setStatusLog(
        `${selectedElement.name} is Coming soon — not released yet.`
      );
      return;
    }
    const thinking =
      !selectedOther && selectedElement.released
        ? ` (${thinkingLevels[selectedElement.number] || selectedElement.released.defaultThinking} thinking)`
        : "";
    setStatusLog(`[${activeMode}] Preview prompt to ${pillLabel}${thinking}: "${text}"`);
    setPromptText("");
  };

  return (
    <div className="w-full">
      {/* Quick Preset Controls Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 mr-1">
            Quick Presets:
          </span>
          {[
            { num: 1, label: "1 H · Hydrogen (Blue)" },
            { num: 6, label: "6 C · Carbon (Purple)" },
            { num: 18, label: "18 Ar · Argon (Teal)" },
            { num: 48, label: "48 Cd · Cadmium (Coming soon)" },
          ].map((preset) => (
            <button
              key={preset.num}
              type="button"
              onClick={() => {
                setIsOpen(true);
                setHasOpenedOnce(true);
                const found = ELEMENTS.find((e) => e.number === preset.num);
                if (found) handleTileClick(found);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                activeCardNumber === preset.num && isOpen
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs text-zinc-500">{statusLog}</div>
      </div>

      {/* Dark Stage Window */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#06070a] text-zinc-100 shadow-2xl">
        {/* macOS Window Chrome */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0c0e14] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-mono text-zinc-400">
            gemini.google.com/app — Periodic Table for Gemini
          </div>
          <div className="text-[11px] font-mono text-zinc-500">v1.0.0</div>
        </div>

        {/* Radial Indigo Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 45% at 50% 45%, rgba(30, 58, 138, 0.34) 0%, rgba(17, 24, 56, 0.2) 48%, rgba(6, 7, 10, 0) 78%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-4 pt-10 pb-12">
          <h3 className="mb-6 text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            Where should we start?
          </h3>

          {/* Prompt Bar */}
          <form
            onSubmit={handlePromptSubmit}
            className="flex w-full max-w-xl items-center gap-2.5 rounded-full border border-white/10 bg-[#181a20]/90 px-3.5 py-2 shadow-xl backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() =>
                setStatusLog("Preview mode — install the extension on gemini.google.com for file attachments.")
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Add attachment"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              ref={promptInputRef}
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask Gemini"
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            />
            <div className="relative">
              {!isOpen && !hasOpenedOnce && (
                <>
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-blue-400/70 animate-ping" />
                  <div className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-950 shadow-lg">
                    Click to open the Periodic Table
                    <span className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-white" />
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen((v) => !v);
                  setHasOpenedOnce(true);
                }}
                className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-medium text-zinc-100 hover:bg-white/15 cursor-pointer"
              >
                {isSelectedSoon && (
                  <span className="h-2 w-2 rounded-full border-[1.5px] border-zinc-400" />
                )}
                <span>{pillLabel}</span>
                {pillThinking && (
                  <span className="text-zinc-400">{pillThinking}</span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                setStatusLog("Preview mode — install the extension on gemini.google.com for voice input.")
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
          </form>

          {/* Periodic Table Popover */}
          {isOpen ? (
            <div className="mt-3 w-full max-w-[680px] rounded-2xl border border-white/10 bg-[#181a20]/95 p-4 shadow-2xl backdrop-blur-xl">
              {/* Popover Header */}
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C12.7 7.2 16.8 11.3 22 12C16.8 12.7 12.7 16.8 12 22C11.3 16.8 7.2 12.7 2 12C7.2 11.3 11.3 7.2 12 2Z"
                      fill="#60a5fa"
                    />
                  </svg>
                  <span>Model periodic table</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Active Model Inspector Banner (mobile & desktop friendly) */}
              {activeCardOther ? (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-400/35 bg-blue-500/10 px-3.5 py-2.5 transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/50 bg-blue-500/20 text-xs font-bold text-blue-200">
                      {activeCardOther.badge}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {activeCardOther.name}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {activeCardOther.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Thinking level: <span className="text-zinc-500">Not adjustable for this model</span>
                  </div>
                </div>
              ) : activeCardEl && (
                <div
                  className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                    activeCardEl.released?.accent === "blue"
                      ? "border-blue-400/40 bg-blue-500/10"
                      : activeCardEl.released?.accent === "purple"
                      ? "border-purple-400/40 bg-purple-500/10"
                      : activeCardEl.released?.accent === "teal"
                      ? "border-emerald-400/40 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`relative flex h-9 w-9 flex-col items-center justify-center rounded-lg border text-xs font-semibold ${
                        activeCardEl.released?.accent === "blue"
                          ? "border-blue-400/60 bg-blue-500/20 text-blue-200"
                          : activeCardEl.released?.accent === "purple"
                          ? "border-purple-400/60 bg-purple-500/20 text-purple-200"
                          : activeCardEl.released?.accent === "teal"
                          ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                          : "border-white/15 bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span className="absolute top-0.5 left-1 text-[8px] opacity-75">
                        {activeCardEl.number}
                      </span>
                      <span className="mt-1 text-xs font-bold">
                        {activeCardEl.symbol}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {activeCardEl.released
                          ? activeCardEl.released.title
                          : activeCardEl.name}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {activeCardEl.released
                          ? activeCardEl.released.subtitle
                          : "Coming soon"}
                      </div>
                    </div>
                  </div>

                  {activeCardEl.released && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">
                        Thinking level:
                      </span>
                      <div className="inline-flex rounded-lg bg-black/40 p-0.5">
                        {(["Low", "Medium", "High"] as const).map((lvl) => {
                          const current =
                            thinkingLevels[activeCardEl.number] ||
                            activeCardEl.released!.defaultThinking;
                          const active = current === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() =>
                                handleThinkingChange(activeCardEl, lvl)
                              }
                              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                                active
                                  ? activeCardEl.released!.accent === "blue"
                                    ? "bg-blue-500/30 text-blue-100 ring-1 ring-blue-400/50"
                                    : activeCardEl.released!.accent === "purple"
                                    ? "bg-purple-500/30 text-purple-100 ring-1 ring-purple-400/50"
                                    : "bg-emerald-500/30 text-emerald-100 ring-1 ring-emerald-400/50"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Column Numbers 1..18 */}
              <div className="mb-1 grid grid-cols-18 gap-1">
                {Array.from({ length: 18 }, (_, i) => (
                  <div
                    key={i + 1}
                    className="text-center text-[8.5px] font-medium text-white/30"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* 18-Column Periodic Table Grid */}
              <div className="overflow-x-auto" onMouseLeave={clearHoverIntent}>
                <div
                  className="grid min-w-[560px] gap-1"
                  style={{
                    gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
                    gridTemplateRows: "repeat(7, 29px) 6px repeat(2, 29px)",
                  }}
                >
                  {/* Center Brand & Legend */}
                  <div
                    style={{ gridColumn: "3 / 13", gridRow: "1 / 4" }}
                    className="pointer-events-none flex flex-col items-center justify-center pb-1"
                  >
                    <div className="text-lg font-semibold tracking-tight text-white">
                      Gemini
                    </div>
                    <div className="mt-1 flex items-center gap-3.5 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                        3 released
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full border border-zinc-500" />
                        Coming soon
                      </span>
                    </div>
                  </div>

                  {ELEMENTS.map((el) => {
                    const gridRow = el.row >= 8 ? el.row + 1 : el.row;
                    const isSelected =
                      !selectedOther && selectedNumber === el.number;
                    const accent = el.released?.accent;

                    let tileClasses =
                      "relative flex flex-col items-center justify-center rounded-[5px] border transition-all cursor-pointer select-none ";
                    if (accent === "blue") {
                      tileClasses +=
                        "border-blue-400/65 bg-blue-500/25 text-blue-200 hover:bg-blue-500/35";
                    } else if (accent === "purple") {
                      tileClasses +=
                        "border-purple-400/65 bg-purple-500/25 text-purple-200 hover:bg-purple-500/35";
                    } else if (accent === "teal") {
                      tileClasses +=
                        "border-emerald-400/65 bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35";
                    } else {
                      tileClasses +=
                        "border-white/[0.06] bg-[#22252d] text-[#788090] hover:border-white/25 hover:bg-[#2c303a] hover:text-zinc-200";
                    }
                    if (isSelected) {
                      tileClasses += " ring-1 ring-white/70";
                    }

                    return (
                      <button
                        key={el.number}
                        type="button"
                        style={{ gridRow, gridColumn: el.col }}
                        onMouseEnter={() => handleTileHover(el)}
                        onMouseLeave={clearHoverIntent}
                        onClick={() => handleTileClick(el)}
                        className={tileClasses}
                        title={`${el.number} ${el.name}`}
                      >
                        <span className="absolute top-[2px] left-[3px] text-[7px] leading-none opacity-75">
                          {el.number}
                        </span>
                        <span className="mt-1 text-[11px] font-semibold leading-none">
                          {el.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Other models */}
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                <span className="text-[11px] text-zinc-400 mr-1">
                  Other models
                </span>
                {OTHER_MODELS_LIST.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseEnter={() => {
                      clearHoverIntent();
                      setActiveCardOtherId(m.id);
                    }}
                    onClick={() => {
                      clearHoverIntent();
                      setSelectedOther(m.id);
                      setActiveCardNumber(null);
                      setActiveCardOtherId(m.id);
                      setStatusLog(`Switched to ${m.name}`);
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedOther === m.id
                        ? "border-blue-400/60 bg-blue-500/20 text-blue-100"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center">
              <div className="flex items-center gap-2">
                {(["Chat", "Task"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveMode(tab)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      activeMode === tab
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-2 text-xs text-zinc-400">
                {[
                  {
                    icon: BookOpen,
                    text: "What subject am I closest to mastering?",
                  },
                  {
                    icon: Rocket,
                    text: "Test AI response speed",
                  },
                  {
                    icon: Lightbulb,
                    text: "Reset my focus in 5 minutes",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.text}
                      type="button"
                      onClick={() => {
                        setPromptText(item.text);
                        promptInputRef.current?.focus();
                      }}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-white/5 hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
