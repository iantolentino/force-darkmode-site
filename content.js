function applyDarkMode() {
  document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
  document.body.style.backgroundColor = "#111";
}

function removeDarkMode() {
  document.documentElement.style.filter = "";
  document.body.style.backgroundColor = "";
}

// On load, check site preference
const hostname = window.location.hostname;
chrome.storage.sync.get(hostname, (result) => {
  if (result[hostname]) {
    applyDarkMode();
  }
});

// Listen for toggle from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "toggleDarkMode") {
    if (msg.enabled) {
      applyDarkMode();
    } else {
      removeDarkMode();
    }
  }
});
