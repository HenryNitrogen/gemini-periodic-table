/**
 * Content script for https://gemini.google.com/*
 * 100% Dynamic Model & Thinking-Level Discovery against Gemini's live DOM:
 * - Reads all model entries directly from gem-menu[data-test-id="gem-mode-menu"]
 *   and dynamically maps any of the 118 chemical elements (Hydrogen, Helium, Carbon,
 *   Argon, or any future element Gemini releases) onto the Periodic Table, while
 *   placing non-element models (Flash-Lite, 3.1 Pro, etc.) into "Other models".
 * - Dynamically checks gem-menu-item[value="thinking_level"] availability and
 *   switches Thinking level ("Low", "Medium", "High") on any model that supports it.
 * - Handles both >=960px (under-input switcher + nested popover="manual" submenu)
 *   and <=959px (top-header switcher + inline .expand-content accordion).
 */
(function () {
  const POPOVER_HOST_ID = "gpt-gemini-popover-host";
  const TOAST_ID = "gpt-gemini-status-toast";

  const { ELEMENTS } = window.GEMINI_PERIODIC_DATA;
  const ELEMENT_ACCENTS = {
    1: "blue",
    6: "purple",
    18: "teal",
  };
  const FALLBACK_ACCENTS = ["blue", "purple", "teal"];
  const THINKING_KEYS = ["Low", "Medium", "High"];

  let isEnabled = true;
  let periodicTable = null;
  let popoverHost = null;
  let toastNode = null;
  let toastTimer = null;
  let activeButton = null;
  let buttonObserver = null;
  let syncInterval = null;
  let automationQueue = Promise.resolve();
  let hasProbedLiveMenu = false;

  let lastKnownLocked = [];
  let lastKnownReleased = null;
  let lastKnownOthers = null;
  let lastKnownThinkingOptions = [
    { key: "Low", label: "Low", locked: false },
    { key: "Medium", label: "Medium", locked: false },
    { key: "High", label: "High", locked: false },
  ];

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitFor(predicate, timeoutMs = 700, intervalMs = 25) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = predicate();
      if (result) return result;
      await sleep(intervalMs);
    }
    return null;
  }

  function showToast(message) {
    if (!toastNode) {
      toastNode = document.createElement("div");
      toastNode.id = TOAST_ID;
      toastNode.className = "gpt-gemini-status-toast";
      document.body.appendChild(toastNode);
    }
    toastNode.textContent = message;
    toastNode.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastNode) toastNode.classList.remove("is-visible");
    }, 2600);
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findNativeModelButton() {
    const byTestId = document.querySelectorAll('[data-test-id="bard-mode-menu-button"]');
    for (const node of byTestId) {
      if (!isElementVisible(node) || node.closest(`#${POPOVER_HOST_ID}`)) continue;
      if (node.tagName.toLowerCase() === "button") return node;
      const innerBtn = node.querySelector("button");
      if (innerBtn && isElementVisible(innerBtn)) return innerBtn;
      return node;
    }

    const fallback = document.querySelectorAll("bard-mode-switcher button");
    for (const btn of fallback) {
      if (isElementVisible(btn) && !btn.closest(`#${POPOVER_HOST_ID}`)) {
        return btn;
      }
    }
    return null;
  }

  function matchChemicalElement(text) {
    if (!text) return null;
    for (const el of ELEMENTS) {
      const re = new RegExp(`\\b${el.name}\\b`, "i");
      if (re.test(text)) return el;
    }
    return null;
  }

  function mapPureLabelToThinkingKey(label) {
    if (!label) return null;
    const t = label.trim();
    if (/^(低|Low|Fast)$/i.test(t)) return "Low";
    if (/^(中|Medium|Balanced|标准|均衡)$/i.test(t)) return "Medium";
    if (/^(高|High|Deep)$/i.test(t)) return "High";
    return null;
  }

  /**
   * Reads active model (element OR non-element) and active thinking level from the live button DOM.
   */
  function parseActiveStateFromButton(btn) {
    if (!btn) return { modelKey: null, thinkingLevel: null, rawText: "", displayName: "" };

    const host = btn.closest('[data-test-id="bard-mode-menu-button"]') || btn;
    const ariaLabel =
      btn.getAttribute("aria-label") || host.getAttribute("aria-label") || "";
    const labelContainer =
      host.querySelector('[data-test-id="logo-pill-label-container"]') || btn;

    const textParts = [];
    labelContainer
      .querySelectorAll(".picker-primary-text, .picker-secondary-text")
      .forEach((el) => {
        const t = (el.textContent || "").trim();
        if (t) textParts.push(t);
      });

    const visibleText = textParts.length
      ? textParts.join(" ")
      : (labelContainer.textContent || "").trim();
    const combined = `${visibleText} ${ariaLabel}`;

    let modelKey = null;
    let displayName = visibleText;

    // 1. Check against all 118 chemical elements dynamically
    const matchedEl = matchChemicalElement(combined);
    if (matchedEl) {
      modelKey = matchedEl.number;
      displayName = matchedEl.name;
    } else if (lastKnownOthers && lastKnownOthers.length > 0) {
      // 2. Check against dynamically discovered "Other models"
      for (const other of lastKnownOthers) {
        const cleanOther = other.name.replace(/^[\d.]+\s*/, "").trim();
        if (
          combined.toLowerCase().includes(other.name.toLowerCase()) ||
          (cleanOther && combined.toLowerCase().includes(cleanOther.toLowerCase()))
        ) {
          modelKey = other.id;
          displayName = other.name;
          break;
        }
      }
    }

    // 3. Fallback if menu hasn't been probed yet on page load
    if (modelKey === null) {
      if (/Flash-Lite/i.test(combined)) {
        modelKey = "flash-lite";
        displayName = "Flash-Lite";
      } else if (/3\.1\s*Pro|\bPro\b/i.test(combined)) {
        modelKey = "3.1-pro";
        displayName = "3.1 Pro";
      }
    }

    // Isolate thinking-level suffix (e.g., "Hydrogen 中" -> "中", "Hydrogen High" -> "High")
    let remainder = combined
      .replace(
        /打开模式选择器|当前模式为|Open mode picker|current mode is|Gemini|Flash-Lite|Pro|3\.5|3\.1|4|[“”"'，,。.\s]/gi,
        " "
      );
    if (matchedEl) {
      remainder = remainder.replace(new RegExp(`\\b${matchedEl.name}\\b`, "gi"), " ");
    }
    remainder = remainder.trim();

    let thinkingLevel = null;
    if (/\bHigh\b|高/i.test(remainder)) {
      thinkingLevel = "High";
    } else if (/\bMedium\b|\bBalanced\b|中/i.test(remainder)) {
      thinkingLevel = "Medium";
    } else if (/\bLow\b|低/i.test(remainder)) {
      thinkingLevel = "Low";
    } else if (typeof modelKey === "number") {
      // Gemini omits the suffix when default Low ("低") is active on thinking-capable models
      const meta = lastKnownReleased && lastKnownReleased[modelKey];
      if (!meta || meta.supportsThinking !== false) {
        thinkingLevel = "Low";
      }
    }

    return { modelKey, thinkingLevel, rawText: visibleText, displayName };
  }

  function positionPopoverHost() {
    if (!popoverHost) return;
    const card = popoverHost.querySelector(".gpt-popover-card");
    if (!card) return;

    card.style.transform = "none";
    card.style.transformOrigin = "top left";

    const naturalW = card.offsetWidth || 680;
    const naturalH = card.offsetHeight || 390;
    const margin = 12;
    const gap = 10;
    const availW = Math.max(260, window.innerWidth - margin * 2);

    const btn = findNativeModelButton();
    if (!btn) {
      const scale = Math.min(1, availW / naturalW, (window.innerHeight - 100) / naturalH);
      const scaledW = naturalW * scale;
      const scaledH = naturalH * scale;
      card.style.transform = scale < 0.999 ? `scale(${scale})` : "none";
      popoverHost.style.left = `${Math.max(margin, (window.innerWidth - scaledW) / 2)}px`;
      popoverHost.style.top = `${Math.max(margin, window.innerHeight - scaledH - 80)}px`;
      popoverHost.style.bottom = "auto";
      return;
    }

    const btnRect = btn.getBoundingClientRect();
    const isHeaderMode = Boolean(
      btn.closest(".in-header, .mode-picker-in-header") || btnRect.top < 110
    );
    const inputBox = isHeaderMode
      ? btn
      : btn.closest(".text-input-field, .input-area-fieldset, .input-area") || btn;
    const anchorRect = inputBox.getBoundingClientRect();

    const spaceAbove = anchorRect.top - gap - margin;
    const spaceBelow = window.innerHeight - anchorRect.bottom - gap - margin;

    let side;
    if (isHeaderMode) {
      side = "below";
    } else if (spaceAbove >= naturalH) {
      side = "above";
    } else if (spaceBelow >= naturalH) {
      side = "below";
    } else {
      side = spaceBelow >= spaceAbove ? "below" : "above";
    }

    const availH = Math.max(180, side === "above" ? spaceAbove : spaceBelow);
    const targetH = side === "above" ? naturalH + 16 : naturalH;
    const scale = Math.max(0.45, Math.min(1, availW / naturalW, availH / targetH));

    card.style.transformOrigin = "top left";
    card.style.transform = scale < 0.999 ? `scale(${scale})` : "none";

    const scaledW = naturalW * scale;
    const scaledH = naturalH * scale;

    let left = isHeaderMode ? btnRect.left : btnRect.right - scaledW;
    left = Math.max(margin, Math.min(left, window.innerWidth - scaledW - margin));

    let top;
    if (side === "above") {
      top = Math.max(margin, anchorRect.top - gap - scaledH);
    } else {
      top = Math.min(window.innerHeight - scaledH - margin, anchorRect.bottom + gap);
      top = Math.max(margin, top);
    }

    popoverHost.style.left = `${left}px`;
    popoverHost.style.top = `${top}px`;
    popoverHost.style.bottom = "auto";
  }

  function setAutomating(active) {
    window.__gptInternalAutomation = active;
    document.documentElement.classList.toggle("gpt-automating-menu", active);
  }

  function getRootGemMenu() {
    const menus = document.querySelectorAll(
      'gem-menu[data-test-id="gem-mode-menu"], .popover-menu gem-menu[role="menu"]'
    );
    for (const m of menus) {
      if (m.getAttribute("data-visible") === "true" || isElementVisible(m)) {
        return m;
      }
    }
    return null;
  }

  function getModelItemsFromMenu(rootMenu) {
    if (!rootMenu) return [];
    return Array.from(
      rootMenu.querySelectorAll(
        ':scope > gem-menu-item[role="menuitemradio"], :scope > [data-test-id^="bard-mode-option-"]'
      )
    );
  }

  function isItemLocked(item) {
    if (!item) return false;
    if (item.getAttribute("aria-disabled") === "true" || item.disabled) return true;
    if (
      item.querySelector('mat-icon[fonticon="lock"], [data-mat-icon-name="lock"]')
    ) {
      return true;
    }
    const modeId = item.getAttribute("data-mode-id") || "";
    if (/upsell/i.test(modeId)) return true;
    return false;
  }

  /**
   * Dynamically discovers EVERY model currently listed in Gemini's live menu DOM.
   * Zero hardcoded model names: if Google adds/renames models, they appear automatically.
   */
  function discoverModelsFromMenu(rootMenu) {
    const items = getModelItemsFromMenu(rootMenu);
    const discoveredReleased = {};
    const discoveredOthers = [];
    const lockedModels = [];
    let checkedKey = null;
    let elementColorIdx = 0;

    items.forEach((item) => {
      const label = (item.querySelector(".label")?.textContent || "").trim();
      const sublabel = (item.querySelector(".sublabel")?.textContent || "").trim();
      const modeId = item.getAttribute("data-mode-id") || "";
      const fullText = `${sublabel} ${label}`.trim();
      const locked = isItemLocked(item);
      const checked =
        item.getAttribute("aria-checked") === "true" ||
        item.classList.contains("selected");

      const matchedEl = matchChemicalElement(sublabel) || matchChemicalElement(fullText);

      if (matchedEl) {
        const accent =
          ELEMENT_ACCENTS[matchedEl.number] ||
          FALLBACK_ACCENTS[elementColorIdx % FALLBACK_ACCENTS.length];
        elementColorIdx += 1;

        discoveredReleased[matchedEl.number] = {
          number: matchedEl.number,
          symbol: matchedEl.symbol,
          name: matchedEl.name,
          title: sublabel || matchedEl.name,
          subtitle: label || "",
          accent,
          modeId,
          defaultThinking: "Low",
          supportsThinking: true,
        };
        if (locked) lockedModels.push(matchedEl.number);
        if (checked) checkedKey = matchedEl.number;
      } else {
        const id = modeId || sublabel.toLowerCase().replace(/[^a-z0-9]+/g, "-") || label;
        const name = sublabel || label || "Model";
        discoveredOthers.push({
          id,
          name,
          subtitle: label || "",
          modeId,
          supportsThinking: !/flash-lite/i.test(name),
        });
        if (locked) lockedModels.push(id);
        if (checked) checkedKey = id;
      }
    });

    // Also detect whether the currently active model has Thinking level enabled in this menu
    const thinkingTrigger = rootMenu.querySelector('gem-menu-item[value="thinking_level"]');
    const currentSupportsThinking = Boolean(
      thinkingTrigger && !isItemLocked(thinkingTrigger) && isElementVisible(thinkingTrigger)
    );

    if (checkedKey !== null) {
      if (typeof checkedKey === "number" && discoveredReleased[checkedKey]) {
        discoveredReleased[checkedKey].supportsThinking = currentSupportsThinking;
      } else if (typeof checkedKey === "string") {
        const other = discoveredOthers.find((o) => o.id === checkedKey);
        if (other) other.supportsThinking = currentSupportsThinking;
      }
    }

    return {
      items,
      discoveredReleased,
      discoveredOthers,
      lockedModels,
      checkedKey,
      currentSupportsThinking,
    };
  }

  async function closeNativeMenu() {
    const rootMenu = getRootGemMenu();
    const openPopovers = document.querySelectorAll(
      'bard-mode-switcher .cdk-overlay-popover[popover], gem-popover .cdk-overlay-popover[popover]'
    );
    if (!rootMenu && openPopovers.length === 0) return;

    const escEvent = () =>
      new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      });

    if (rootMenu) rootMenu.dispatchEvent(escEvent());
    if (document.activeElement) document.activeElement.dispatchEvent(escEvent());
    document.dispatchEvent(escEvent());
    window.dispatchEvent(escEvent());
    await sleep(35);

    if (getRootGemMenu()) {
      const shield = document.querySelector(".popover-click-shield");
      if (shield) {
        shield.click();
        await sleep(35);
      }
    }
  }

  async function openNativeMenu(btn) {
    const existing = getRootGemMenu();
    if (existing) return existing;
    if (!btn) return null;

    btn.click();
    return waitFor(() => getRootGemMenu(), 650, 20);
  }

  async function openAndGetThinkingItems(rootMenu) {
    if (!rootMenu) return [];
    const trigger = rootMenu.querySelector('gem-menu-item[value="thinking_level"]');
    if (!trigger || isItemLocked(trigger) || !isElementVisible(trigger)) return [];

    const isMobileExpandable =
      trigger.classList.contains("expandable") ||
      trigger.getAttribute("aria-haspopup") === "false";

    const findItems = () => {
      const inlineItems = Array.from(
        trigger.querySelectorAll('.expand-content gem-menu-item[role="menuitemradio"]')
      ).filter(isElementVisible);
      if (inlineItems.length > 0) return inlineItems;

      const controlsId = trigger.getAttribute("aria-controls");
      if (controlsId) {
        const subMenu = document.getElementById(controlsId);
        if (subMenu) {
          const items = Array.from(
            subMenu.querySelectorAll('gem-menu-item[role="menuitemradio"]')
          ).filter(isElementVisible);
          if (items.length > 0) return items;
        }
      }

      return Array.from(
        document.querySelectorAll(
          '.submenu-container gem-menu-item[role="menuitemradio"]'
        )
      ).filter(isElementVisible);
    };

    const alreadyOpen = findItems();
    if (alreadyOpen.length > 0) return alreadyOpen;

    if (isMobileExpandable) {
      trigger.click();
      return (await waitFor(() => {
        const list = findItems();
        return list.length > 0 ? list : null;
      }, 500, 20)) || [];
    }

    const r = trigger.getBoundingClientRect();
    const evInit = {
      bubbles: true,
      cancelable: true,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
    };
    trigger.dispatchEvent(new PointerEvent("pointerenter", evInit));
    trigger.dispatchEvent(new MouseEvent("mouseenter", evInit));
    trigger.dispatchEvent(new MouseEvent("mouseover", evInit));
    trigger.dispatchEvent(new PointerEvent("pointermove", evInit));

    let items = await waitFor(() => {
      const list = findItems();
      return list.length > 0 ? list : null;
    }, 220, 20);

    if (!items) {
      trigger.focus?.();
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          code: "ArrowRight",
          keyCode: 39,
          which: 39,
          bubbles: true,
          cancelable: true,
        })
      );
      trigger.click();
      items = await waitFor(() => {
        const list = findItems();
        return list.length > 0 ? list : null;
      }, 450, 20);
    }

    return items || [];
  }

  function parseThinkingItems(rawItems) {
    const options = [];
    const itemsByKey = {};
    let activeKey = null;

    rawItems.forEach((item, idx) => {
      const pureLabel = (
        item.querySelector(".label")?.textContent ||
        item.textContent ||
        ""
      ).trim();
      let key = mapPureLabelToThinkingKey(pureLabel);
      if (!key && rawItems.length === 3 && idx < THINKING_KEYS.length) {
        key = THINKING_KEYS[idx];
      }
      if (!key) return;

      const locked = isItemLocked(item);
      const checked =
        item.getAttribute("aria-checked") === "true" ||
        item.classList.contains("selected");
      if (checked) activeKey = key;

      options.push({
        key,
        label: key,
        locked,
      });
      itemsByKey[key] = {
        key,
        label: key,
        locked,
        checked,
        el: item,
      };
    });

    return { options, activeKey, itemsByKey };
  }

  function enqueueAutomation(taskFn) {
    automationQueue = automationQueue
      .catch(() => {})
      .then(async () => {
        setAutomating(true);
        try {
          return await taskFn();
        } finally {
          await closeNativeMenu();
          setAutomating(false);
        }
      });
    return automationQueue;
  }

  function findTargetItemInMenu(items, targetModelKey) {
    if (typeof targetModelKey === "number") {
      const meta = lastKnownReleased && lastKnownReleased[targetModelKey];
      if (meta && meta.modeId) {
        const byMode = items.find(
          (el) => el.getAttribute("data-mode-id") === meta.modeId
        );
        if (byMode) return byMode;
      }
      const elObj = ELEMENTS.find((e) => e.number === targetModelKey);
      if (elObj) {
        const re = new RegExp(`\\b${elObj.name}\\b`, "i");
        return items.find((el) => re.test(el.textContent || ""));
      }
      return null;
    }

    const otherMeta =
      lastKnownOthers && lastKnownOthers.find((o) => o.id === targetModelKey);
    if (otherMeta && otherMeta.modeId) {
      const byMode = items.find(
        (el) => el.getAttribute("data-mode-id") === otherMeta.modeId
      );
      if (byMode) return byMode;
    }
    if (otherMeta && otherMeta.name) {
      return items.find((el) =>
        (el.textContent || "").toLowerCase().includes(otherMeta.name.toLowerCase())
      );
    }
    if (targetModelKey === "flash-lite") {
      return items.find((el) => /Flash-Lite/i.test(el.textContent || ""));
    }
    if (targetModelKey === "3.1-pro") {
      return items.find((el) => /3\.1\s*Pro/i.test(el.textContent || ""));
    }
    return null;
  }

  /**
   * Probes live Gemini menu once when opening Periodic Table so models & locks
   * reflect the user's real Gemini account and any newly released Google models.
   */
  async function probeLiveModelsOnce() {
    if (hasProbedLiveMenu) return;
    hasProbedLiveMenu = true;
    return enqueueAutomation(async () => {
      const btn = findNativeModelButton();
      if (!btn) return;
      const rootMenu = await openNativeMenu(btn);
      if (!rootMenu) return;

      const discovered = discoverModelsFromMenu(rootMenu);
      lastKnownReleased = discovered.discoveredReleased;
      lastKnownOthers = discovered.discoveredOthers;
      lastKnownLocked = discovered.lockedModels;

      let checkedThinking = null;
      if (discovered.currentSupportsThinking) {
        const rawThinking = await openAndGetThinkingItems(rootMenu);
        if (rawThinking.length > 0) {
          const parsed = parseThinkingItems(rawThinking);
          if (parsed.options.length > 0) lastKnownThinkingOptions = parsed.options;
          checkedThinking = parsed.activeKey;
        }
      }

      const actual = parseActiveStateFromButton(findNativeModelButton());
      periodicTable?.syncExternalState({
        modelKey: discovered.checkedKey ?? actual.modelKey,
        thinkingLevel: discovered.currentSupportsThinking
          ? actual.thinkingLevel || checkedThinking
          : null,
        lockedModels: lastKnownLocked,
        discoveredReleased: lastKnownReleased,
        discoveredOthers: lastKnownOthers,
        thinkingOptions: lastKnownThinkingOptions,
      });
    });
  }

  async function switchRealGeminiModel(targetModelKey, targetThinkingLevel) {
    return enqueueAutomation(async () => {
      const btn = findNativeModelButton();
      if (!btn) {
        showToast("Could not find Gemini model selector button");
        return;
      }

      const initialBtnState = parseActiveStateFromButton(btn);
      let rootMenu = await openNativeMenu(btn);
      if (!rootMenu) {
        showToast("Could not open Gemini model menu");
        return;
      }

      const discovered = discoverModelsFromMenu(rootMenu);
      lastKnownReleased = discovered.discoveredReleased;
      lastKnownOthers = discovered.discoveredOthers;
      lastKnownLocked = discovered.lockedModels;

      periodicTable?.syncExternalState({
        lockedModels: lastKnownLocked,
        discoveredReleased: lastKnownReleased,
        discoveredOthers: lastKnownOthers,
      });

      const currentLiveKey = discovered.checkedKey ?? initialBtnState.modelKey;

      // 1. Switch model if target differs from currently active model
      if (targetModelKey !== null && targetModelKey !== currentLiveKey) {
        const targetItem = findTargetItemInMenu(discovered.items, targetModelKey);

        if (!targetItem) {
          showToast("Model not found in Gemini menu");
          periodicTable?.syncExternalState({
            modelKey: currentLiveKey,
            thinkingLevel: initialBtnState.thinkingLevel,
            lockedModels: lastKnownLocked,
          });
          return;
        }

        if (isItemLocked(targetItem)) {
          const title = (targetItem.querySelector(".sublabel")?.textContent || "").trim();
          showToast(`${title || "Selected model"} is locked on your current plan`);
          periodicTable?.syncExternalState({
            modelKey: currentLiveKey,
            thinkingLevel: initialBtnState.thinkingLevel,
            lockedModels: lastKnownLocked,
          });
          return;
        }

        targetItem.click();
        await waitFor(
          () =>
            !getRootGemMenu() ||
            parseActiveStateFromButton(findNativeModelButton()).modelKey === targetModelKey,
          600,
          20
        );
        await closeNativeMenu();
        await sleep(60);
      }

      // 2. Inspect or switch Thinking level on ANY model that Gemini allows
      let thinkingBlockedReason = null;
      let checkedThinkingFromMenu = null;
      let modelSupportsThinking = true;

      if (targetThinkingLevel || targetModelKey !== currentLiveKey) {
        const refreshedBtn = findNativeModelButton();
        rootMenu = await openNativeMenu(refreshedBtn);
        if (rootMenu) {
          const refreshedDiscovery = discoverModelsFromMenu(rootMenu);
          lastKnownReleased = refreshedDiscovery.discoveredReleased;
          lastKnownOthers = refreshedDiscovery.discoveredOthers;
          modelSupportsThinking = refreshedDiscovery.currentSupportsThinking;

          if (!modelSupportsThinking) {
            if (targetThinkingLevel) {
              thinkingBlockedReason = "Thinking level is not adjustable for this model";
            }
          } else {
            const rawThinkingItems = await openAndGetThinkingItems(rootMenu);
            if (rawThinkingItems.length === 0) {
              if (targetThinkingLevel) {
                thinkingBlockedReason = "Thinking level options unavailable";
              }
            } else {
              const parsed = parseThinkingItems(rawThinkingItems);
              if (parsed.options.length > 0) {
                lastKnownThinkingOptions = parsed.options;
              }
              checkedThinkingFromMenu = parsed.activeKey;

              if (targetThinkingLevel) {
                const subTarget = parsed.itemsByKey[targetThinkingLevel];
                if (!subTarget) {
                  thinkingBlockedReason = `Thinking level ${targetThinkingLevel} not found`;
                } else if (subTarget.locked) {
                  thinkingBlockedReason = `Thinking level ${targetThinkingLevel} is locked`;
                } else {
                  subTarget.el.click();
                  await waitFor(
                    () =>
                      !getRootGemMenu() ||
                      parseActiveStateFromButton(findNativeModelButton()).thinkingLevel ===
                        targetThinkingLevel,
                    600,
                    20
                  );
                  await sleep(50);
                }
              }
            }
          }
        }
      }

      // 3. Close any remaining native menu and read back actual state
      await closeNativeMenu();
      const actual = parseActiveStateFromButton(findNativeModelButton());
      const resolvedThinking = modelSupportsThinking
        ? actual.thinkingLevel || checkedThinkingFromMenu || null
        : null;

      periodicTable?.syncExternalState({
        modelKey: actual.modelKey,
        thinkingLevel: resolvedThinking,
        lockedModels: lastKnownLocked,
        discoveredReleased: lastKnownReleased,
        discoveredOthers: lastKnownOthers,
        thinkingOptions: lastKnownThinkingOptions,
      });

      const resolvedModelName =
        (typeof actual.modelKey === "number" &&
          lastKnownReleased &&
          lastKnownReleased[actual.modelKey]?.title) ||
        (typeof actual.modelKey === "string" &&
          lastKnownOthers &&
          lastKnownOthers.find((o) => o.id === actual.modelKey)?.name) ||
        actual.displayName ||
        actual.rawText ||
        "Gemini";

      if (thinkingBlockedReason) {
        showToast(`${resolvedModelName} — ${thinkingBlockedReason}`);
      } else {
        const thinkingSuffix = resolvedThinking
          ? ` · Thinking: ${resolvedThinking}`
          : "";
        showToast(`Switched to ${resolvedModelName}${thinkingSuffix}`);
      }
    });
  }

  function ensurePopoverHost() {
    if (!popoverHost) {
      popoverHost = document.createElement("div");
      popoverHost.id = POPOVER_HOST_ID;
      popoverHost.className = "gpt-gemini-popover-host";
      document.body.appendChild(popoverHost);
    }
    return popoverHost;
  }

  function initPeriodicTable() {
    if (periodicTable) return;
    const host = ensurePopoverHost();

    periodicTable = new window.GeminiPeriodicTable({
      pillMount: null,
      popoverMount: host,
      persistState: false,
      lockedModels: lastKnownLocked,
      externalPillAnchor: () => {
        const btn = findNativeModelButton();
        return (btn && btn.closest("bard-mode-switcher")) || btn;
      },
      onOpenChange: (open) => {
        if (open) {
          closeNativeMenu();
          const btn = findNativeModelButton();
          const actual = parseActiveStateFromButton(btn);
          periodicTable.syncExternalState({
            modelKey: actual.modelKey,
            thinkingLevel: actual.thinkingLevel,
            lockedModels: lastKnownLocked,
            discoveredReleased: lastKnownReleased,
            discoveredOthers: lastKnownOthers,
            thinkingOptions: lastKnownThinkingOptions,
          });
          positionPopoverHost();
          requestAnimationFrame(() => positionPopoverHost());
          if (!hasProbedLiveMenu) {
            setTimeout(() => {
              if (periodicTable && periodicTable.isOpen) {
                probeLiveModelsOnce();
              }
            }, 35);
          }
        }
      },
      onSelectModel: ({ type, element, otherModel, thinkingLevel }) => {
        if (type === "other" && otherModel) {
          switchRealGeminiModel(otherModel.id, thinkingLevel);
          return;
        }
        if (type === "element" && element) {
          if (!element.released) {
            const actual = parseActiveStateFromButton(findNativeModelButton());
            showToast(`${element.name} (${element.symbol}) is coming soon`);
            if (actual.modelKey !== null) {
              setTimeout(() => {
                periodicTable?.syncExternalState({
                  modelKey: actual.modelKey,
                  thinkingLevel: actual.thinkingLevel,
                });
              }, 260);
            }
            return;
          }
          switchRealGeminiModel(element.number, thinkingLevel);
        }
      },
      onSelectThinking: ({ element, otherModel, thinkingLevel }) => {
        if (otherModel) {
          switchRealGeminiModel(otherModel.id, thinkingLevel);
        } else if (element && element.released) {
          switchRealGeminiModel(element.number, thinkingLevel);
        }
      },
    });
  }

  function attachButtonObserver() {
    const btn = findNativeModelButton();
    if (btn === activeButton) return;
    activeButton = btn;

    if (buttonObserver) {
      buttonObserver.disconnect();
      buttonObserver = null;
    }

    if (!btn) return;

    const actual = parseActiveStateFromButton(btn);
    if (actual.modelKey !== null && periodicTable) {
      periodicTable.syncExternalState({
        modelKey: actual.modelKey,
        thinkingLevel: actual.thinkingLevel,
      });
    }

    const observeTarget = btn.closest("bard-mode-switcher") || btn;
    buttonObserver = new MutationObserver(() => {
      if (window.__gptInternalAutomation) return;
      const curBtn = findNativeModelButton();
      const st = parseActiveStateFromButton(curBtn);
      if (st.modelKey !== null && periodicTable) {
        periodicTable.syncExternalState({
          modelKey: st.modelKey,
          thinkingLevel: st.thinkingLevel,
        });
      }
    });
    buttonObserver.observe(observeTarget, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "aria-expanded"],
    });
  }

  function handleGlobalClickCapture(e) {
    if (!isEnabled || window.__gptInternalAutomation) return;
    const btn = findNativeModelButton();
    if (!btn) return;
    const switcher = btn.closest('[data-test-id="bard-mode-menu-button"]') || btn;
    if (!switcher.contains(e.target) && !btn.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    initPeriodicTable();
    periodicTable.toggle();
    if (periodicTable.isOpen) {
      positionPopoverHost();
      requestAnimationFrame(() => positionPopoverHost());
    }
  }

  function handleGlobalKeydownCapture(e) {
    if (!isEnabled || window.__gptInternalAutomation) return;
    const isShortcut =
      (e.metaKey || e.ctrlKey) &&
      e.shiftKey &&
      (e.key || "").toLowerCase() === "m";
    const btn = findNativeModelButton();
    if (!btn) return;

    const switcher = btn.closest('[data-test-id="bard-mode-menu-button"]') || btn;
    const focusedOnButton =
      document.activeElement &&
      (switcher.contains(document.activeElement) || btn.contains(document.activeElement));
    const isActivateKey = focusedOnButton && (e.key === "Enter" || e.key === " ");

    if (!isShortcut && !isActivateKey) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    initPeriodicTable();
    periodicTable.toggle();
    if (periodicTable.isOpen) {
      positionPopoverHost();
      requestAnimationFrame(() => positionPopoverHost());
    }
  }

  function handleWindowResize() {
    attachButtonObserver();
    if (periodicTable && periodicTable.isOpen) {
      positionPopoverHost();
    }
  }

  function mountController() {
    initPeriodicTable();
    attachButtonObserver();
    if (!syncInterval) {
      syncInterval = setInterval(attachButtonObserver, 800);
    }
  }

  function unmountController() {
    if (periodicTable) {
      periodicTable.close();
      periodicTable.destroy();
      periodicTable = null;
    }
    if (popoverHost) {
      popoverHost.remove();
      popoverHost = null;
    }
    if (buttonObserver) {
      buttonObserver.disconnect();
      buttonObserver = null;
    }
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    activeButton = null;
  }

  function syncVisibility() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["gptEnabledOnGemini"], (res) => {
        isEnabled = res.gptEnabledOnGemini !== false;
        if (isEnabled) mountController();
        else unmountController();
      });
    } else {
      isEnabled = true;
      mountController();
    }
  }

  document.addEventListener("click", handleGlobalClickCapture, true);
  document.addEventListener("keydown", handleGlobalKeydownCapture, true);
  window.addEventListener("resize", handleWindowResize);

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.gptEnabledOnGemini) {
        isEnabled = changes.gptEnabledOnGemini.newValue !== false;
        if (isEnabled) mountController();
        else unmountController();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncVisibility);
  } else {
    syncVisibility();
  }
})();
