(function () {
  const pillMount = document.getElementById("pillMount");
  const popoverMount = document.getElementById("popoverMount");
  const promptForm = document.getElementById("promptForm");
  const promptInput = document.getElementById("promptInput");
  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  const selector = new window.GeminiPeriodicTable({
    pillMount,
    popoverMount,
  });

  // Mode tabs (Chat / Task)
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mode-tab").forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
    });
  });

  // Starter prompt click
  document.querySelectorAll(".starter-item").forEach((item) => {
    item.addEventListener("click", () => {
      const prompt = item.dataset.prompt;
      promptInput.value = prompt;
      promptInput.focus();
    });
  });

  // Attachment & voice demo buttons
  document.querySelectorAll(".icon-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showToast("Preview mode — install the extension on gemini.google.com for attachments and voice.");
    });
  });

  // Submit prompt feedback
  promptForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = promptInput.value.trim();
    if (!text) return;
    const summary = selector.getSelectionSummary();
    if (summary.type === "element" && !summary.released) {
      showToast(`${summary.label} is Coming soon — only 3 elements released in Gemini 4.`);
      return;
    }
    const thinking = summary.thinkingLevel ? ` (${summary.thinkingLevel} thinking)` : "";
    showToast(`Sent to ${summary.label}${thinking}: "${text}"`);
    promptInput.value = "";
  });
})();
