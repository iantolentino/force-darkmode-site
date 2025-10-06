(() => {
  const HOSTNAME = window.location.hostname;
  const STYLE_ID = "smart-monochrome-style";

  const MONOCHROME_CSS = `
/* Smart Monochrome forced dark mode */
html, body, #__next, .app, .root {
  background: #000 !important;
  color: #fff !important;
}

/* Force readable text and neutral backgrounds */
*,
*::before,
*::after {
  color: #fff !important;
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  border-color: #333 !important;
}

/* Set common container backgrounds to black */
html, body, div, section, article, header, footer, main, nav, aside, ul, li, p, span, table, tr, td, th, figure {
  background-color: #000 !important;
  color: #fff !important;
}

/* Links — keep readable but monochrome */
a { color: #ddd !important; text-decoration-color: #555 !important; }

/* Inputs and controls */
input, textarea, select, button {
  background-color: #111 !important;
  color: #fff !important;
  border: 1px solid #333 !important;
  caret-color: #fff !important;
}

/* Pre/code areas */
pre, code, kbd {
  background: #040404 !important;
  color: #fff !important;
  border: 1px solid #222 !important;
}

/* Images, video, canvas, svgs — convert to grayscale and dim so they don't clash */
img, picture, video, canvas {
  filter: grayscale(100%) contrast(0.95) brightness(0.6) !important;
  opacity: 0.95 !important;
  background: transparent !important;
}

/* SVG strokes/fills */
svg, svg * { fill: #fff !important; stroke: #fff !important; }

/* Remove distracting backgrounds like gradients or images */
*[style*="background"], *[style*="background-image"] {
  background-image: none !important;
  background-color: #000 !important;
}

/* Keep pseudo-element text visible */
*::before, *::after { color: inherit !important; background: transparent !important; }

/* Keep media controls readable */
video::-webkit-media-controls { filter: none !important; }

/* Prevent some sites from hiding content by forcing black */
html, body { background-color: #000 !important; }
`;

  function injectMonochrome() {
    if (document.getElementById(STYLE_ID)) return;
    try {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = MONOCHROME_CSS;
      (document.head || document.documentElement).appendChild(s);
    } catch (err) {
      // Fail silently if DOM is restricted
      console.warn("Monochrome inject failed:", err);
    }
  }

  function removeMonochrome() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  // Apply if stored for this hostname
  chrome.storage.sync.get(HOSTNAME, (res) => {
    if (res && res[HOSTNAME]) injectMonochrome();
  });

  // Listen for popup messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === "toggleMonochrome") {
      if (msg.enabled) injectMonochrome();
      else removeMonochrome();
      sendResponse({ok: true});
    }
  });

  // React to storage changes (so multiple windows sync)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes[HOSTNAME]) {
      if (changes[HOSTNAME].newValue) injectMonochrome();
      else removeMonochrome();
    }
  });
})();
