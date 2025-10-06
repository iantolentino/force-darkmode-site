document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkToggle");
  const siteName = document.getElementById("siteName");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const hostname = url.hostname;
    siteName.textContent = hostname;

    // Load saved state
    chrome.storage.sync.get(hostname, (result) => {
      toggle.checked = result[hostname] || false;
    });

    toggle.addEventListener("change", () => {
      const enabled = toggle.checked;

      // Save preference
      chrome.runtime.sendMessage({ type: "setDarkMode", hostname, enabled });

      // Send toggle command to content script
      chrome.tabs.sendMessage(tabs[0].id, { type: "toggleDarkMode", enabled });
    });
  });
});
