// This script is preloaded into the webview.
// Its purpose is to defeat "frame-busting" scripts on websites
// that try to prevent themselves from being embedded.

const defeatFrameBusters = () => {
  try {
    // Many frame-busters check if `window.top` is different from `window.self`.
    // By overriding `top` and `parent` to point to `self`, we can trick these scripts.
    // We make the properties writable so that other scripts don't crash.
    Object.defineProperty(window, 'top', {
      value: window.self,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'parent', {
      value: window.self,
      writable: true,
      configurable: true,
    });

    console.log('[FrameBuster] Preload script executed successfully.');
  } catch (e) {
    console.error('[FrameBuster] Error executing preload script:', e);
  }
};

// The key fix: Do not run the script immediately. Instead, wait for the DOM
// to be loaded. This prevents a race condition that was crashing the renderer.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', defeatFrameBusters);
} else {
  // The DOM is already loaded, run it now.
  defeatFrameBusters();
}
