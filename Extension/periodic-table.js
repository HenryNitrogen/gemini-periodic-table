/**
 * Reusable "Periodic Table for Gemini" Popover Controller
 * - Dynamically renders any released element models (matching all 118 elements)
 *   and any non-element "Other models" discovered from Gemini's live DOM.
 * - Shows Thinking level controls when supported by the model, or an accurate
 *   unavailable note when Gemini disables Thinking level for that model.
 * - Hover never mutates the active/selected model (click-only selection).
 */
(function (global) {
  const { ELEMENTS, RELEASED_MODELS, OTHER_MODELS } = global.GEMINI_PERIODIC_DATA;

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const SPARKLE_SVG = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gptSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="55%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#818cf8"/>
        </linearGradient>
      </defs>
      <path d="M12 2C12.7 7.2 16.8 11.3 22 12C16.8 12.7 12.7 16.8 12 22C11.3 16.8 7.2 12.7 2 12C7.2 11.3 11.3 7.2 12 2Z" fill="url(#gptSparkleGrad)"/>
    </svg>
  `;

  const CHEVRON_SVG = `
    <svg class="gpt-pill-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 7.75L10 12.25L14.5 7.75" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const CLOSE_SVG = `
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
    </svg>
  `;

  const LOCK_SVG = `
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  class GeminiPeriodicTable {
    constructor(options) {
      this.pillMount = options.pillMount || null;
      this.popoverMount = options.popoverMount || null;
      this.externalPillAnchor = options.externalPillAnchor || null;
      this.persistState = options.persistState !== false;

      this.onChange = options.onChange || (() => {});
      this.onSelectModel = options.onSelectModel || (() => {});
      this.onSelectThinking = options.onSelectThinking || (() => {});
      this.onOpenChange = options.onOpenChange || (() => {});

      this.isOpen = false;
      this.hoverHideTimer = null;
      this.hoverIntentTimer = null;
      this.activeCardElement = null;
      this.activeCardOther = null;
      this.activeTileNode = null;
      this.lockedModels = new Set(options.lockedModels || []);
      this.modelMeta = {};
      this.thinkingOptions = null;

      // Dynamic model registries (start with fallback defaults, overwritten by live Gemini DOM)
      this.releasedMap = { ...RELEASED_MODELS };
      this.otherModels = OTHER_MODELS.map((m) => ({ ...m }));

      this.state = {
        selectedType: "element", // "element" | "other"
        selectedNumber: 1,
        selectedOtherId: null,
        thinkingLevels: this.persistState
          ? {
              1: "Medium",
              6: "Low",
              18: "Low",
            }
          : {},
      };

      const initDone = () => {
        this.renderPill();
        this.onChange(this.getSelectionSummary());
      };

      if (this.persistState) {
        this._loadState().then(initDone);
      } else {
        initDone();
      }

      this._handleDocClick = (e) => {
        if (!this.isOpen || global.__gptInternalAutomation) return;
        const inPill = this.pillMount && this.pillMount.contains(e.target);
        const inPopover = this.popoverMount && this.popoverMount.contains(e.target);
        const extAnchor =
          typeof this.externalPillAnchor === "function"
            ? this.externalPillAnchor()
            : this.externalPillAnchor;
        const inExt = extAnchor && extAnchor.contains(e.target);
        if (!inPill && !inPopover && !inExt) {
          this.close();
        }
      };
      document.addEventListener("mousedown", this._handleDocClick, true);
    }

    destroy() {
      this._clearTimers();
      document.removeEventListener("mousedown", this._handleDocClick, true);
    }

    _clearTimers() {
      if (this.hoverHideTimer) {
        clearTimeout(this.hoverHideTimer);
        this.hoverHideTimer = null;
      }
      if (this.hoverIntentTimer) {
        clearTimeout(this.hoverIntentTimer);
        this.hoverIntentTimer = null;
      }
    }

    _getElementView(rawEl) {
      const rel = this.releasedMap[rawEl.number] || null;
      return {
        ...rawEl,
        released: Boolean(rel),
        model: rel,
      };
    }

    async _loadState() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          const res = await new Promise((resolve) =>
            chrome.storage.local.get(["gptState"], (data) => resolve(data))
          );
          if (res && res.gptState) {
            this.state = {
              ...this.state,
              ...res.gptState,
              thinkingLevels: {
                ...this.state.thinkingLevels,
                ...(res.gptState.thinkingLevels || {}),
              },
            };
          }
        } else if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem("gemini_periodic_table_state");
          if (raw) {
            const parsed = JSON.parse(raw);
            this.state = {
              ...this.state,
              ...parsed,
              thinkingLevels: {
                ...this.state.thinkingLevels,
                ...(parsed.thinkingLevels || {}),
              },
            };
          }
        }
      } catch (_) {
        // Ignore storage errors
      }
    }

    _saveState() {
      if (!this.persistState) return;
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ gptState: this.state });
        } else if (typeof localStorage !== "undefined") {
          localStorage.setItem("gemini_periodic_table_state", JSON.stringify(this.state));
        }
      } catch (_) {
        // Ignore storage errors
      }
    }

    syncExternalState({
      modelKey,
      thinkingLevel,
      lockedModels,
      modelMeta,
      thinkingOptions,
      discoveredReleased,
      discoveredOthers,
    } = {}) {
      let topologyChanged = false;

      if (discoveredReleased && Object.keys(discoveredReleased).length > 0) {
        const prevSig = Object.entries(this.releasedMap)
          .map(([k, v]) => `${k}:${v.title}:${v.supportsThinking}`)
          .join("|");
        const nextSig = Object.entries(discoveredReleased)
          .map(([k, v]) => `${k}:${v.title}:${v.supportsThinking}`)
          .join("|");
        this.releasedMap = { ...discoveredReleased };
        if (prevSig !== nextSig) topologyChanged = true;
      }

      if (Array.isArray(discoveredOthers) && discoveredOthers.length > 0) {
        const prevIds = this.otherModels
          .map((m) => `${m.id}:${m.name}:${m.supportsThinking}`)
          .join("|");
        const nextIds = discoveredOthers
          .map((m) => `${m.id}:${m.name}:${m.supportsThinking}`)
          .join("|");
        this.otherModels = discoveredOthers.map((m) => ({ ...m }));
        if (prevIds !== nextIds) topologyChanged = true;
      }

      if (Array.isArray(lockedModels) || lockedModels instanceof Set) {
        this.lockedModels = new Set(lockedModels);
      }
      if (modelMeta && typeof modelMeta === "object") {
        this.modelMeta = { ...this.modelMeta, ...modelMeta };
      }
      if (Array.isArray(thinkingOptions) && thinkingOptions.length > 0) {
        this.thinkingOptions = thinkingOptions;
      }

      if (typeof modelKey === "string") {
        this.state.selectedType = "other";
        this.state.selectedOtherId = modelKey;
        if (thinkingLevel !== undefined) {
          this.state.thinkingLevels[modelKey] = thinkingLevel;
        }
      } else if (typeof modelKey === "number") {
        this.state.selectedType = "element";
        this.state.selectedNumber = modelKey;
        this.state.selectedOtherId = null;
        if (thinkingLevel !== undefined) {
          this.state.thinkingLevels[modelKey] = thinkingLevel;
        }
      } else if (thinkingLevel !== undefined) {
        const activeKey =
          this.state.selectedType === "other"
            ? this.state.selectedOtherId
            : this.state.selectedNumber;
        if (activeKey !== null && activeKey !== undefined) {
          this.state.thinkingLevels[activeKey] = thinkingLevel;
        }
      }

      this.renderPill();
      if (this.isOpen && topologyChanged) {
        this.renderPopover();
      } else {
        this._syncPopoverState();
      }
      this.onChange(this.getSelectionSummary());
    }

    _syncPopoverState() {
      if (!this.isOpen || !this.popoverMount) return;

      const releasedCountEl = this.popoverMount.querySelector(".gpt-released-count");
      if (releasedCountEl) {
        releasedCountEl.textContent = `${Object.keys(this.releasedMap).length} released`;
      }

      this.popoverMount.querySelectorAll(".gpt-tile").forEach((tile) => {
        const num = Number(tile.dataset.number);
        const rel = this.releasedMap[num];
        const isSel = this.state.selectedType === "element" && this.state.selectedNumber === num;
        tile.classList.remove("accent-blue", "accent-purple", "accent-teal");
        if (rel && rel.accent) {
          tile.classList.add(`accent-${rel.accent}`);
        }
        tile.classList.toggle("is-selected", isSel);
        tile.classList.toggle("is-locked", this.lockedModels.has(num));
      });

      this.popoverMount.querySelectorAll(".gpt-other-btn").forEach((btn) => {
        const isSel =
          this.state.selectedType === "other" && this.state.selectedOtherId === btn.dataset.id;
        btn.classList.toggle("is-selected", isSel);
        btn.classList.toggle("is-locked", this.lockedModels.has(btn.dataset.id));
      });

      const activeKey = this.activeCardOther
        ? this.activeCardOther.id
        : this.activeCardElement && this.activeCardElement.released
        ? this.activeCardElement.number
        : null;

      if (activeKey !== null) {
        const defaultThink =
          this.activeCardElement && this.activeCardElement.model
            ? this.activeCardElement.model.defaultThinking
            : null;
        const currentThinking = this.persistState
          ? this.state.thinkingLevels[activeKey] || defaultThink
          : this.state.thinkingLevels[activeKey] || null;
        const optMap = new Map(
          (this.thinkingOptions || []).map((o) => [o.key, o])
        );
        this.popoverMount.querySelectorAll(".gpt-thinking-btn").forEach((btn) => {
          const lvl = btn.dataset.level;
          const opt = optMap.get(lvl);
          if (opt && opt.label) {
            const span = btn.querySelector("span");
            if (span) span.textContent = opt.label;
          }
          btn.classList.toggle("is-active", Boolean(currentThinking && lvl === currentThinking));
          btn.classList.toggle("is-locked", Boolean(opt && opt.locked));
        });
      }
    }

    getSelectionSummary() {
      if (this.state.selectedType === "other") {
        const other =
          this.otherModels.find((m) => m.id === this.state.selectedOtherId) ||
          this.otherModels[0] ||
          OTHER_MODELS[0];
        const thinkingLevel =
          other && other.supportsThinking !== false
            ? this.state.thinkingLevels[other.id] || null
            : null;
        return {
          type: "other",
          otherModel: other,
          label: other ? other.name : "Flash-Lite",
          released: true,
          thinkingLevel,
        };
      }
      const rawEl =
        ELEMENTS.find((e) => e.number === this.state.selectedNumber) || ELEMENTS[0];
      const el = this._getElementView(rawEl);
      return {
        type: "element",
        element: el,
        label: el.name,
        released: el.released,
        thinkingLevel: el.released
          ? this.state.thinkingLevels[el.number] ||
            (this.persistState ? el.model.defaultThinking : null)
          : null,
      };
    }

    renderPill() {
      if (!this.pillMount) return;
      const summary = this.getSelectionSummary();
      const showHollowDot = summary.type === "element" && !summary.released;

      this.pillMount.innerHTML = "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `gpt-selector-pill${this.isOpen ? " is-open" : ""}`;
      btn.setAttribute("aria-expanded", String(this.isOpen));
      btn.innerHTML = `
        ${showHollowDot ? '<span class="gpt-pill-dot-hollow" aria-hidden="true"></span>' : ""}
        <span class="gpt-pill-label">${escapeHtml(summary.label)}${
          summary.thinkingLevel
            ? ` <span style="opacity:0.65;font-weight:400;">· ${escapeHtml(
                summary.thinkingLevel
              )}</span>`
            : ""
        }</span>
        ${CHEVRON_SVG}
      `;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });
      this.pillMount.appendChild(btn);
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.renderPill();
      this.renderPopover();
      this.onOpenChange(true);
    }

    close() {
      if (!this.isOpen) return;
      this._clearTimers();
      this.isOpen = false;
      this.activeCardElement = null;
      this.activeCardOther = null;
      this.activeTileNode = null;
      this.renderPill();
      if (this.popoverMount) {
        this.popoverMount.innerHTML = "";
      }
      this.onOpenChange(false);
    }

    selectElement(rawEl, keepOpen = true) {
      const el = this._getElementView(rawEl);
      this.state.selectedType = "element";
      this.state.selectedNumber = el.number;
      this.state.selectedOtherId = null;
      this._saveState();
      this.renderPill();
      this._syncPopoverState();
      this.onChange(this.getSelectionSummary());
      if (!keepOpen) {
        this.close();
      }
    }

    selectOtherModel(modelId, keepOpen = true) {
      this.state.selectedType = "other";
      this.state.selectedOtherId = modelId;
      this._saveState();
      this.renderPill();
      this._syncPopoverState();
      const summary = this.getSelectionSummary();
      this.onChange(summary);
      if (!keepOpen) {
        this.close();
      }
    }

    setThinkingLevel(modelKey, level) {
      this.state.thinkingLevels[modelKey] = level;
      this._saveState();
      this.renderPill();
      this._syncPopoverState();
      this.onChange(this.getSelectionSummary());
    }

    renderPopover() {
      if (!this.popoverMount) return;
      this.popoverMount.innerHTML = "";

      const root = document.createElement("div");
      root.className = "gpt-popover-root";

      const card = document.createElement("div");
      card.className = "gpt-popover-card";

      // Header
      const header = document.createElement("div");
      header.className = "gpt-popover-header";
      header.innerHTML = `
        <div class="gpt-popover-title">
          ${SPARKLE_SVG}
          <span>Model periodic table</span>
        </div>
      `;
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "gpt-close-btn";
      closeBtn.setAttribute("aria-label", "Close model periodic table");
      closeBtn.innerHTML = CLOSE_SVG;
      closeBtn.addEventListener("click", () => this.close());
      header.appendChild(closeBtn);
      card.appendChild(header);

      // Column labels 1..18
      const colLabels = document.createElement("div");
      colLabels.className = "gpt-col-labels";
      for (let c = 1; c <= 18; c++) {
        const lbl = document.createElement("div");
        lbl.className = "gpt-col-label";
        lbl.textContent = String(c);
        colLabels.appendChild(lbl);
      }
      card.appendChild(colLabels);

      // Grid Wrapper
      const gridWrapper = document.createElement("div");
      gridWrapper.className = "gpt-grid-wrapper";

      const grid = document.createElement("div");
      grid.className = "gpt-grid";

      const releasedCount = Object.keys(this.releasedMap).length;
      const centerHero = document.createElement("div");
      centerHero.className = "gpt-center-hero";
      centerHero.innerHTML = `
        <div class="gpt-hero-brand">Gemini</div>
        <div class="gpt-hero-legend">
          <span class="gpt-legend-item"><span class="gpt-dot-released"></span><span class="gpt-released-count">${releasedCount} released</span></span>
          <span class="gpt-legend-item"><span class="gpt-dot-soon"></span>Coming soon</span>
        </div>
      `;
      grid.appendChild(centerHero);

      const detailSlot = document.createElement("div");
      detailSlot.className = "gpt-detail-slot";

      const scheduleHide = () => {
        if (this.hoverHideTimer) clearTimeout(this.hoverHideTimer);
        this.hoverHideTimer = setTimeout(() => {
          const bridge = detailSlot.querySelector(".gpt-detail-card-bridge");
          const hoveredBridge = bridge && bridge.matches(":hover");
          const hoveredActiveTile = this.activeTileNode && this.activeTileNode.matches(":hover");
          if (!hoveredBridge && !hoveredActiveTile) {
            detailSlot.innerHTML = "";
            this.activeCardElement = null;
            this.activeCardOther = null;
            this.activeTileNode = null;
          }
        }, 140);
      };

      ELEMENTS.forEach((rawEl) => {
        const el = this._getElementView(rawEl);
        const tile = document.createElement("button");
        tile.type = "button";
        tile.dataset.number = String(el.number);
        const gridRow = el.row >= 8 ? el.row + 1 : el.row;
        tile.style.gridRow = String(gridRow);
        tile.style.gridColumn = String(el.col);

        let cls = "gpt-tile";
        if (el.released && el.model) {
          cls += ` accent-${el.model.accent || "blue"}`;
        }
        if (this.lockedModels.has(el.number)) {
          cls += " is-locked";
        }
        if (this.state.selectedType === "element" && this.state.selectedNumber === el.number) {
          cls += " is-selected";
        }
        tile.className = cls;
        tile.title = `${el.number} ${el.name}`;
        tile.innerHTML = `
          <span class="gpt-tile-num">${el.number}</span>
          <span class="gpt-tile-sym">${el.symbol}</span>
        `;

        tile.addEventListener("mouseenter", () => {
          this._clearTimers();
          const currentEl = this._getElementView(rawEl);
          const protectingOpenThinkingCard =
            (this.activeCardElement &&
              this.activeCardElement.released &&
              this.activeCardElement.number !== currentEl.number) ||
            Boolean(this.activeCardOther);

          if (protectingOpenThinkingCard) {
            this.hoverIntentTimer = setTimeout(() => {
              this.hoverIntentTimer = null;
              if (tile.matches(":hover")) {
                this._showDetailCard(
                  detailSlot,
                  gridWrapper,
                  tile,
                  this._getElementView(rawEl),
                  scheduleHide
                );
              }
            }, 220);
          } else {
            this._showDetailCard(detailSlot, gridWrapper, tile, currentEl, scheduleHide);
          }
        });

        tile.addEventListener("mouseleave", () => {
          if (this.hoverIntentTimer) {
            clearTimeout(this.hoverIntentTimer);
            this.hoverIntentTimer = null;
          }
          scheduleHide();
        });

        tile.addEventListener("click", (e) => {
          e.stopPropagation();
          this._clearTimers();
          const currentEl = this._getElementView(rawEl);
          this.selectElement(currentEl, true);
          this._showDetailCard(detailSlot, gridWrapper, tile, currentEl, scheduleHide);
          const thinkingLevel =
            currentEl.released && this.persistState
              ? this.state.thinkingLevels[currentEl.number] ||
                currentEl.model.defaultThinking
              : null;
          this.onSelectModel({
            type: "element",
            element: currentEl,
            thinkingLevel,
          });
        });

        grid.appendChild(tile);
      });

      gridWrapper.appendChild(grid);
      gridWrapper.appendChild(detailSlot);
      card.appendChild(gridWrapper);

      // Footer: Other models (dynamically populated from Gemini DOM)
      const footer = document.createElement("div");
      footer.className = "gpt-popover-footer";
      const footerLabel = document.createElement("span");
      footerLabel.className = "gpt-footer-label";
      footerLabel.textContent = "Other models";
      footer.appendChild(footerLabel);

      this.otherModels.forEach((m) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.id = m.id;
        const isSel = this.state.selectedType === "other" && this.state.selectedOtherId === m.id;
        btn.className = `gpt-other-btn${isSel ? " is-selected" : ""}`;
        btn.textContent = m.name;

        btn.addEventListener("mouseenter", () => {
          this._clearTimers();
          this._showOtherDetailCard(detailSlot, gridWrapper, btn, m, scheduleHide);
        });

        btn.addEventListener("mouseleave", () => {
          scheduleHide();
        });

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._clearTimers();
          this.selectOtherModel(m.id, true);
          this._showOtherDetailCard(detailSlot, gridWrapper, btn, m, scheduleHide);
          this.onSelectModel({
            type: "other",
            otherModel: m,
            thinkingLevel: null,
          });
        });
        footer.appendChild(btn);
      });

      card.appendChild(footer);
      root.appendChild(card);
      this.popoverMount.appendChild(root);
    }

    _buildThinkingSectionHtml(supportsThinking, currentThinking, thinkingOpts) {
      if (supportsThinking === false) {
        return `
          <div class="gpt-thinking-section">
            <div class="gpt-thinking-label">Thinking level</div>
            <div style="font-size:11px;color:#6b7280;padding:4px 2px;">Not adjustable for this model</div>
          </div>
        `;
      }
      return `
        <div class="gpt-thinking-section">
          <div class="gpt-thinking-label">Thinking level</div>
          <div class="gpt-thinking-pills">
            ${thinkingOpts
              .map(
                (opt) =>
                  `<button type="button" class="gpt-thinking-btn${
                    currentThinking === opt.key ? " is-active" : ""
                  }${opt.locked ? " is-locked" : ""}" data-level="${escapeHtml(opt.key)}">${
                    opt.locked ? LOCK_SVG : ""
                  }<span>${escapeHtml(opt.label)}</span></button>`
              )
              .join("")}
          </div>
        </div>
      `;
    }

    _showOtherDetailCard(slot, container, btnNode, otherModel, scheduleHide) {
      slot.innerHTML = "";
      this.activeCardElement = null;
      this.activeCardOther = otherModel;
      this.activeTileNode = btnNode;

      const bridge = document.createElement("div");
      bridge.className = "gpt-detail-card-bridge";

      const isLocked = this.lockedModels.has(otherModel.id);
      const card = document.createElement("div");
      card.className = "gpt-detail-card accent-blue";

      const currentThinking = this.state.thinkingLevels[otherModel.id] || null;
      const thinkingOpts = this.thinkingOptions || [
        { key: "Low", label: "Low", locked: false },
        { key: "Medium", label: "Medium", locked: false },
        { key: "High", label: "High", locked: false },
      ];

      const badgeText =
        otherModel.name.match(/\d+(\.\d+)?/)?.[0] ||
        otherModel.name.slice(0, 2).toUpperCase();

      card.innerHTML = `
        <div class="gpt-card-head">
          <div class="gpt-card-badge">
            <span class="sym" style="margin-top:0;font-size:11.5px;">${escapeHtml(badgeText)}</span>
          </div>
          <div class="gpt-card-meta">
            <div class="gpt-card-title-row">
              <span class="gpt-card-title">${escapeHtml(otherModel.name)}</span>
              ${
                isLocked
                  ? `<span class="gpt-locked-badge">${LOCK_SVG}<span>Locked</span></span>`
                  : ""
              }
            </div>
            <div class="gpt-card-subtitle">${escapeHtml(
              otherModel.subtitle || "Gemini model"
            )}</div>
          </div>
        </div>
        ${this._buildThinkingSectionHtml(
          otherModel.supportsThinking,
          currentThinking,
          thinkingOpts
        )}
      `;

      card.querySelectorAll(".gpt-thinking-btn").forEach((tBtn) => {
        tBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const level = tBtn.dataset.level;
          this.selectOtherModel(otherModel.id, true);
          this.setThinkingLevel(otherModel.id, level);
          card.querySelectorAll(".gpt-thinking-btn").forEach((b) => {
            b.classList.toggle("is-active", b.dataset.level === level);
          });
          this.onSelectThinking({
            otherModel,
            thinkingLevel: level,
          });
        });
      });

      bridge.addEventListener("mouseenter", () => this._clearTimers());
      bridge.addEventListener("mouseleave", () => {
        if (scheduleHide) scheduleHide();
      });

      bridge.appendChild(card);
      slot.appendChild(bridge);

      const containerRect = container.getBoundingClientRect();
      const btnRect = btnNode.getBoundingClientRect();
      const bridgeRect = bridge.getBoundingClientRect();

      const scaleX = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;
      const scaleY = container.offsetHeight > 0 ? containerRect.height / container.offsetHeight : 1;

      const btnLeft = (btnRect.left - containerRect.left) / scaleX;
      const btnTop = (btnRect.top - containerRect.top) / scaleY;
      const btnW = btnRect.width / scaleX;
      const bridgeW = bridgeRect.width / scaleX;
      const bridgeH = bridgeRect.height / scaleY;
      const containerW = containerRect.width / scaleX;

      let left = btnLeft + btnW / 2 - bridgeW / 2;
      left = Math.max(-8, Math.min(left, containerW - bridgeW + 8));
      const top = btnTop - bridgeH + 4;

      bridge.style.left = `${left}px`;
      bridge.style.top = `${top}px`;
    }

    _showDetailCard(slot, container, tile, el, scheduleHide) {
      slot.innerHTML = "";
      this.activeCardOther = null;
      this.activeCardElement = el;
      this.activeTileNode = tile;

      const bridge = document.createElement("div");
      bridge.className = el.released
        ? "gpt-detail-card-bridge"
        : "gpt-detail-card-bridge is-soon";

      const card = document.createElement("div");
      if (el.released && el.model) {
        const isLocked = this.lockedModels.has(el.number);
        card.className = `gpt-detail-card accent-${el.model.accent || "blue"}`;
        const currentThinking = this.persistState
          ? this.state.thinkingLevels[el.number] || el.model.defaultThinking
          : this.state.thinkingLevels[el.number] || null;
        const dynamicMeta = this.modelMeta[el.number] || {};
        const cardTitle = dynamicMeta.title || el.model.title || el.name;
        const cardSubtitle = dynamicMeta.subtitle || el.model.subtitle || "";
        const thinkingOpts = this.thinkingOptions || [
          { key: "Low", label: "Low", locked: false },
          { key: "Medium", label: "Medium", locked: false },
          { key: "High", label: "High", locked: false },
        ];

        card.innerHTML = `
          <div class="gpt-card-head">
            <div class="gpt-card-badge">
              <span class="num">${escapeHtml(el.number)}</span>
              <span class="sym">${escapeHtml(el.symbol)}</span>
            </div>
            <div class="gpt-card-meta">
              <div class="gpt-card-title-row">
                <span class="gpt-card-title">${escapeHtml(cardTitle)}</span>
                ${
                  isLocked
                    ? `<span class="gpt-locked-badge">${LOCK_SVG}<span>Locked</span></span>`
                    : ""
                }
              </div>
              <div class="gpt-card-subtitle">${escapeHtml(cardSubtitle)}</div>
            </div>
          </div>
          ${this._buildThinkingSectionHtml(
            el.model.supportsThinking,
            currentThinking,
            thinkingOpts
          )}
        `;

        card.querySelectorAll(".gpt-thinking-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const level = btn.dataset.level;
            this.selectElement(el, true);
            this.setThinkingLevel(el.number, level);
            card.querySelectorAll(".gpt-thinking-btn").forEach((b) => {
              b.classList.toggle("is-active", b.dataset.level === level);
            });
            this.onSelectThinking({
              element: el,
              thinkingLevel: level,
            });
          });
        });

        bridge.addEventListener("mouseenter", () => {
          this._clearTimers();
        });
        bridge.addEventListener("mouseleave", () => {
          if (scheduleHide) scheduleHide();
        });
      } else {
        card.className = "gpt-detail-card is-soon";
        card.innerHTML = `
          <div class="gpt-card-head">
            <div class="gpt-card-badge">
              <span class="num">${escapeHtml(el.number)}</span>
              <span class="sym">${escapeHtml(el.symbol)}</span>
            </div>
            <div class="gpt-card-meta">
              <div class="gpt-card-title">${escapeHtml(el.name)}</div>
              <div class="gpt-card-soon-label">Coming soon</div>
            </div>
          </div>
        `;
      }

      bridge.appendChild(card);
      slot.appendChild(bridge);

      const containerRect = container.getBoundingClientRect();
      const tileRect = tile.getBoundingClientRect();
      const bridgeRect = bridge.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      const scaleX = container.offsetWidth > 0 ? containerRect.width / container.offsetWidth : 1;
      const scaleY = container.offsetHeight > 0 ? containerRect.height / container.offsetHeight : 1;

      const tileLeft = (tileRect.left - containerRect.left) / scaleX;
      const tileTop = (tileRect.top - containerRect.top) / scaleY;
      const tileBottom = (tileRect.bottom - containerRect.top) / scaleY;
      const tileW = tileRect.width / scaleX;
      const bridgeW = bridgeRect.width / scaleX;
      const bridgeH = bridgeRect.height / scaleY;
      const containerW = containerRect.width / scaleX;

      let left = tileLeft + tileW / 2 - bridgeW / 2;
      left = Math.max(-8, Math.min(left, containerW - bridgeW + 8));

      const placeBelow = tileRect.top - cardRect.height - 8 < 8;
      let top;
      if (placeBelow) {
        bridge.classList.add("is-below");
        top = el.released ? tileBottom - 4 : tileBottom + 6;
      } else {
        top = el.released ? tileTop - bridgeH + 4 : tileTop - bridgeH - 6;
      }

      bridge.style.left = `${left}px`;
      bridge.style.top = `${top}px`;
    }
  }

  global.GeminiPeriodicTable = GeminiPeriodicTable;
})(typeof window !== "undefined" ? window : globalThis);
