/**
 * Content script for https://gemini.google.com/*
 * Built against Gemini's live DOM:
 * - Supports both >=960px (under-input bard-mode-switcher + nested popover="manual" submenu)
 *   and <=959px (top-header bard-mode-switcher + inline .expand-content accordion).
 * - Matches thinking level strictly by .label ("Low", "Medium", "High" / "低", "中", "高")
 *   so .sublabel never collides across options.
 * - Keeps all Periodic Table UI labels and toast notifications in clean English.
 * - Responsively scales and positions the Periodic Table so it never overlaps the prompt bar
 *   and never overflows the viewport at any window size.
 */
(function () {
  const POPOVER_HOST_ID = "gpt-gemini-popover-host";
  const TOAST_ID = "gpt-gemini-status-toast";

  const MODEL_MATCHERS = {
    1: /\bHydrogen\b/i,
    6: /\bCarbon\b/i,
    18: /\bArgon\b/i,
    "flash-lite": /Flash-Lite/i,
    "3.1-pro": /3\.1\s*Pro/i,
  };

  const ENGLISH_MODEL_NAMES = {
    1: "Gemini 4 Hydrogen",
    6: "Gemini 4 Carbon",
    18: "Gemini 4 Argon",
    "flash-lite": "3.5 Flash-Lite",
    "3.1-pro": "3.1 Pro",
  };

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
  let lastKnownLocked = [];
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

  /**
   * Finds the visible Gemini model switcher button across both responsive layouts:
   * - >=960px: button[data-test-id="bard-mode-menu-button"] inside .input-area
   * - <=959px: gem-button[data-test-id="bard-mode-menu-button"] > button in top header
   */
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

  function mapPureLabelToThinkingKey(label) {
    if (!label) return null;
    const t = label.trim();
    if (/^(低|Low|Fast)$/i.test(t)) return "Low";
    if (/^(中|Medium|Balanced|标准|均衡)$/i.test(t)) return "Medium";
    if (/^(高|High|Deep)$/i.test(t)) return "High";
    return null;
  }

  /**
   * Reads both active model and active thinking level directly from Gemini's live button DOM.
   */
  function parseActiveStateFromButton(btn) {
    if (!btn) return { modelKey: null, thinkingLevel: null, rawText: "" };

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
    if (MODEL_MATCHERS[1].test(combined)) modelKey = 1;
    else if (MODEL_MATCHERS[6].test(combined)) modelKey = 6;
    else if (MODEL_MATCHERS[18].test(combined)) modelKey = 18;
    else if (MODEL_MATCHERS["flash-lite"].test(combined)) modelKey = "flash-lite";
    else if (MODEL_MATCHERS["3.1-pro"].test(combined)) modelKey = "3.1-pro";

    const remainder = combined
      .replace(
        /打开模式选择器|当前模式为|Open mode picker|current mode is|Gemini|Hydrogen|Argon|Carbon|Flash-Lite|Pro|3\.5|3\.1|4|[“”"'，,。.\s]/gi,
        " "
      )
      .trim();

    let thinkingLevel = null;
    if (/\bHigh\b|高/i.test(remainder)) {
      thinkingLevel = "High";
    } else if (/\bMedium\b|\bBalanced\b|中/i.test(remainder)) {
      thinkingLevel = "Medium";
    } else if (/\bLow\b|低/i.test(remainder)) {
      thinkingLevel = "Low";
    } else if (modelKey === 1 || modelKey === 6 || modelKey === 18) {
      // Gemini omits the suffix on the button when the default Low ("低") level is active
      thinkingLevel = "Low";
    }

    return { modelKey, thinkingLevel, rawText: visibleText };
  }

  /**
   * Responsively positions and scales the Periodic Table popover so it:
   * 1. Never overlaps the prompt input bar (.input-area / .text-input-field)
   * 2. Never overflows or clips against any edge of the viewport (even at narrow/short sizes)
   */
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

  function readMainMenuMetadata(rootMenu) {
    const items = getModelItemsFromMenu(rootMenu);
    const lockedModels = [];

    for (const num of [1, 6, 18]) {
      const matcher = MODEL_MATCHERS[num];
      const item = items.find((el) => {
        const sub = (el.querySelector(".sublabel")?.textContent || "").trim();
        const full = (el.textContent || "").trim();
        return matcher.test(sub) || matcher.test(full);
      });
      if (item && isItemLocked(item)) {
        lockedModels.push(num);
      }
    }

    return { lockedModels, items };
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

    if (rootMenu) {
      rootMenu.dispatchEvent(escEvent());
    }
    if (document.activeElement) {
      document.activeElement.dispatchEvent(escEvent());
    }
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

  /**
   * Opens the "Thinking level" (thinking_level) options across both responsive breakpoints:
   * - Mobile / Narrow (<=959px): gem-menu-item[value="thinking_level"].expandable -> click()
   *   expands inline .expand-content > gem-menu-item[role="menuitemradio"]
   * - Desktop (>=960px): gem-menu-item[value="thinking_level"][aria-haspopup="true"] ->
   *   mouseenter / ArrowRight opens nested .submenu-container > gem-menu > gem-menu-item[role="menuitemradio"]
   */
  async function openAndGetThinkingItems(rootMenu) {
    if (!rootMenu) return [];
    const trigger = rootMenu.querySelector('gem-menu-item[value="thinking_level"]');
    if (!trigger || isItemLocked(trigger)) return [];

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

  /**
   * Reads the thinking level items strictly by their .label ("Low"/"Medium"/"High" or "低"/"中"/"高"),
   * while keeping button display labels in clean English ("Low", "Medium", "High").
   */
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
        label: key, // Always keep English label ("Low", "Medium", "High")
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

      const { lockedModels, items } = readMainMenuMetadata(rootMenu);
      lastKnownLocked = lockedModels;

      if (periodicTable) {
        periodicTable.syncExternalState({
          lockedModels: lastKnownLocked,
        });
      }

      // 1. Switch model if target model differs from current model
      if (targetModelKey !== null && targetModelKey !== initialBtnState.modelKey) {
        const matcher = MODEL_MATCHERS[targetModelKey];
        const targetItem = items.find((el) => {
          const sub = (el.querySelector(".sublabel")?.textContent || "").trim();
          const full = (el.textContent || "").trim();
          return matcher && (matcher.test(sub) || matcher.test(full));
        });

        if (!targetItem) {
          showToast("Model not found in Gemini menu");
          periodicTable?.syncExternalState({
            modelKey: initialBtnState.modelKey,
            thinkingLevel: initialBtnState.thinkingLevel,
            lockedModels: lastKnownLocked,
          });
          return;
        }

        if (isItemLocked(targetItem)) {
          const modelTitle = ENGLISH_MODEL_NAMES[targetModelKey] || "Selected model";
          showToast(`${modelTitle} is locked on your current plan`);
          periodicTable?.syncExternalState({
            modelKey: initialBtnState.modelKey,
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

      // 2. Switch Thinking level if requested, or read real options/active level after model change
      let thinkingBlockedReason = null;
      let checkedThinkingFromMenu = null;
      const switchedToReleasedModel =
        targetModelKey !== null &&
        targetModelKey !== initialBtnState.modelKey &&
        (targetModelKey === 1 || targetModelKey === 6 || targetModelKey === 18);

      if (
        (targetThinkingLevel &&
          (targetModelKey === 1 || targetModelKey === 6 || targetModelKey === 18)) ||
        switchedToReleasedModel
      ) {
        const refreshedBtn = findNativeModelButton();
        rootMenu = await openNativeMenu(refreshedBtn);
        if (rootMenu) {
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

      // 3. Close any remaining native menu and read back actual state from the button
      await closeNativeMenu();
      const actual = parseActiveStateFromButton(findNativeModelButton());
      const resolvedThinking = actual.thinkingLevel || checkedThinkingFromMenu || null;

      if (periodicTable) {
        periodicTable.syncExternalState({
          modelKey: actual.modelKey,
          thinkingLevel: resolvedThinking,
          lockedModels: lastKnownLocked,
          thinkingOptions: lastKnownThinkingOptions,
        });
      }

      const displayModel =
        ENGLISH_MODEL_NAMES[actual.modelKey] || actual.rawText || "Gemini";

      if (thinkingBlockedReason) {
        showToast(`${displayModel} — ${thinkingBlockedReason}`);
      } else {
        const thinkingSuffix = resolvedThinking
          ? ` · Thinking: ${resolvedThinking}`
          : "";
        showToast(`Switched to ${displayModel}${thinkingSuffix}`);
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
            thinkingOptions: lastKnownThinkingOptions,
          });
          positionPopoverHost();
          requestAnimationFrame(() => positionPopoverHost());
        }
      },
      onSelectModel: ({ type, element, otherModel, thinkingLevel }) => {
        if (type === "other" && otherModel) {
          switchRealGeminiModel(otherModel.id, null);
          return;
        }
        if (type === "element" && element) {
          if (!element.released) {
            const actual = parseActiveStateFromButton(findNativeModelButton());
            showToast(`${element.name} (${element.symbol}) is coming soon`);
            if (actual.modelKey) {
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
      onSelectThinking: ({ element, thinkingLevel }) => {
        if (element && element.released) {
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
    if (actual.modelKey && periodicTable) {
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
      if (st.modelKey && periodicTable) {
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
