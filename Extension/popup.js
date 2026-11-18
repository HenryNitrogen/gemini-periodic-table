(function () {
  const toggleGemini = document.getElementById("toggleGemini");
  const openDemoBtn = document.getElementById("openDemoBtn");

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["gptEnabledOnGemini"], (res) => {
      toggleGemini.checked = res.gptEnabledOnGemini !== false;
    });

    toggleGemini.addEventListener("change", () => {
      chrome.storage.local.set({ gptEnabledOnGemini: toggleGemini.checked });
    });
  }

  openDemoBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL("demo.html") });
    } else {
      window.open("demo.html", "_blank");
    }
  });
})();
