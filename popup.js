const STYLE_ID = "smart-monochrome-style";

/* Duplicate of the CSS used in content.js for fallback injection.
   Keep this in sync with content.js MONOCHROME_CSS. */
const MONOCHROME_CSS = `
/* Smart Monochrome forced dark mode */
html, body, #__next, .app, .root {
  background: #000 !important;
  color: #fff !important;
}
*,
*::before,
*::after {
  color: #fff !important;
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  border-color: #333 !important;
}
html, body, div, section, article, header, footer, main, nav, aside, ul, li, p, span, table, tr, td, th, figure {
  background-color: #000 !important;
  color: #fff !important;
}
a { color: #ddd !important; text-decoration-color: #555 !important; }
input, textarea, select, button {
  background-color: #111 !important;
  color: #fff !important;
  border: 1px solid #333 !important;
  caret-color: #fff !important;
}
pre, code, kbd {
  background: #040404 !important;
  color: #fff !important;
  border: 1px solid #222 !important;
}
img, picture, video, canvas {
  filter: grayscale(100%) contrast(0.95) brightness(0.6) !important;
  opacity: 0.95 !important;
  background: transparent !important;
}
svg, svg * { fill: #fff !important; stroke: #fff !important; }
*[style*="background"], *[style*="background-image"] {
  background-image: none !important;
  background-color: #000 !important;
}
*::before, *::after { color: inherit !important; background: transparent !important; }
video::-webkit-media-controls { filter: none !important; }
html, body { background-color: #000 !important; }
`;

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("darkToggle");
  const siteNameEl = document.getElementById("siteName");
  const statusEl = document.getElementById("status");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.url) {
      siteNameEl.textContent = "No active site";
      toggle.disabled = true;
      return;
    }

    let hostname;
    try {
      hostname = new URL(tab.url).hostname;
    } catch (e) {
      hostname = tab.url;
    }
    siteNameEl.textContent = hostname;

    // Load saved state
    chrome.storage.sync.get(hostname, (res) => {
      toggle.checked = !!(res && res[hostname]);
      statusEl.textContent = toggle.checked ? "Auto-applied on this site" : "Not applied";
    });

    toggle.addEventListener("change", () => {
      const enabled = toggle.checked;
      statusEl.textContent = enabled ? "Applying..." : "Removing...";

      // Save preference
      const obj = {};
      obj[hostname] = enabled;
      chrome.storage.sync.set(obj, () => {
        // Try to message content script first
        chrome.tabs.sendMessage(tab.id, { type: "toggleMonochrome", enabled }, (resp) => {
          if (chrome.runtime.lastError) {
            // content script not available (e.g., restricted page) -> fallback: inject style directly
            try {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (enabledInner, css) => {
                  const STYLE_ID = "smart-monochrome-style";
                  if (enabledInner) {
                    if (document.getElementById(STYLE_ID)) return;
                    const s = document.createElement("style");
                    s.id = STYLE_ID;
                    s.textContent = css;
                    (document.head || document.documentElement).appendChild(s);
                  } else {
                    const el = document.getElementById(STYLE_ID);
                    if (el) el.remove();
                  }
                },
                args: [enabled, MONOCHROME_CSS]
              }, () => {
                statusEl.textContent = enabled ? "Applied (fallback)" : "Removed (fallback)";
              });
            } catch (err) {
              console.warn("Fallback injection failed:", err);
              statusEl.textContent = "Could not apply on this page";
            }
          } else {
            // content script handled it
            statusEl.textContent = enabled ? "Applied" : "Removed";
          }
        });
      });
    });
  });
});
