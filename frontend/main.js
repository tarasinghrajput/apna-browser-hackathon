const controls = {
  backBtn: document.getElementById("back-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  goBtn: document.getElementById("go-btn"),
  notesToggleBtn: document.getElementById("notes-toggle-btn"),
  urlInput: document.getElementById("url-input"),
  homeSearchForm: document.getElementById("home-search-form"),
  homeSearchInput: document.getElementById("home-search-input"),
  homeView: document.getElementById("home-view"),
  webviewHost: document.getElementById("webview-host"),
  webviewStatus: document.getElementById("webview-status"),
  notesPanel: document.getElementById("notes-panel"),
  notesTextarea: document.getElementById("notes-textarea"),
  content: document.querySelector(".content"),
  quickLinks: document.querySelectorAll(".quick-link"),
};

const tauri = window.__TAURI__;
const WebviewClass = tauri?.webview?.Webview;
const currentWindow = tauri?.window?.getCurrentWindow?.();

const NOTES_KEY = "apna-browser-notes";
const state = {
  nativeWebview: null,
  webviewCounter: 0,
  history: [],
  historyIndex: -1,
  currentUrl: "",
  homeVisible: true,
  notesVisible: false,
};

let relayoutTimer = null;

function buildSearchUrl(query) {
  return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
}

function normalizeInputToUrl(rawInput) {
  const value = rawInput.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes(" ")) return buildSearchUrl(value);
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(value)) return `https://${value}`;
  return buildSearchUrl(value);
}

function setStatus(message) {
  if (!controls.webviewStatus) return;
  controls.webviewStatus.textContent = message;
  controls.webviewStatus.classList.toggle("is-hidden", !message);
}

function getHostBounds() {
  const hostRect = controls.webviewHost?.getBoundingClientRect();
  if (!hostRect) return null;

  const width = Math.round(hostRect.width);
  const height = Math.round(hostRect.height);
  if (width < 20 || height < 20) return null;

  return {
    x: Math.round(hostRect.left),
    y: Math.round(hostRect.top),
    width,
    height,
  };
}

async function destroyNativeWebview() {
  if (!state.nativeWebview) return;
  try {
    await state.nativeWebview.close();
  } catch (error) {
    console.error("Failed to close webview:", error);
  } finally {
    state.nativeWebview = null;
  }
}

async function mountNativeWebview(url) {
  if (!WebviewClass || !currentWindow) {
    setStatus("Native Tauri WebView API is unavailable. Enable app.withGlobalTauri in tauri.conf.json.");
    return false;
  }

  const bounds = getHostBounds();
  if (!bounds) {
    setStatus("WebView host area is not ready yet.");
    return false;
  }

  await destroyNativeWebview();

  const label = `browser-webview-${++state.webviewCounter}`;
  try {
    const webview = new WebviewClass(currentWindow, label, {
      url,
      ...bounds,
    });

    state.nativeWebview = webview;
    setStatus("");

    webview.once("tauri://error", (event) => {
      console.error("Native webview creation failed:", event);
      const details =
        event?.payload?.toString?.() || event?.error?.toString?.() || "Unknown WebView error.";
      setStatus(`Unable to render this page in native WebView. ${details}`);
    });

    return true;
  } catch (error) {
    console.error("Failed to create native webview:", error);
    setStatus("Failed to create native WebView. Check permissions in capabilities/default.json.");
    return false;
  }
}

function setHomeVisible(visible) {
  state.homeVisible = visible;
  controls.homeView?.classList.toggle("is-hidden", !visible);
  controls.webviewHost?.classList.toggle("is-hidden", visible);
}

function setNotesVisible(visible) {
  state.notesVisible = visible;
  controls.notesPanel?.classList.toggle("is-hidden", !visible);
  controls.content?.classList.toggle("notes-open", visible);
  controls.notesToggleBtn.textContent = visible ? "Hide Notes" : "Notes";
}

function updateToolbarState() {
  controls.backBtn.disabled = state.historyIndex <= 0 || state.homeVisible;
  controls.forwardBtn.disabled =
    state.historyIndex < 0 || state.historyIndex >= state.history.length - 1 || state.homeVisible;
  controls.refreshBtn.disabled = state.homeVisible || !state.currentUrl;
}

function rememberHistory(url) {
  if (!url) return;
  const onLatest = state.history[state.historyIndex] === url;
  if (onLatest) return;

  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }
  state.history.push(url);
  state.historyIndex = state.history.length - 1;
}

async function showHome() {
  state.currentUrl = "";
  controls.urlInput.value = "";
  setHomeVisible(true);
  updateToolbarState();
  setStatus("");
  await destroyNativeWebview();
}

async function loadUrl(url, options = { pushHistory: true }) {
  if (!url) {
    await showHome();
    return;
  }

  if (options.pushHistory) {
    rememberHistory(url);
  }

  state.currentUrl = url;
  controls.urlInput.value = url;
  setHomeVisible(false);
  updateToolbarState();
  await mountNativeWebview(url);
}

async function navigateFromInput(rawValue) {
  const url = normalizeInputToUrl(rawValue);
  await loadUrl(url, { pushHistory: true });
}

function scheduleRelayout() {
  if (state.homeVisible || !state.currentUrl) return;
  if (relayoutTimer) {
    clearTimeout(relayoutTimer);
  }
  relayoutTimer = setTimeout(() => {
    void loadUrl(state.currentUrl, { pushHistory: false });
  }, 120);
}

controls.goBtn?.addEventListener("click", () => {
  void navigateFromInput(controls.urlInput?.value ?? "");
});

controls.urlInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void navigateFromInput(controls.urlInput.value);
  }
});

controls.backBtn?.addEventListener("click", () => {
  if (state.historyIndex <= 0) return;
  state.historyIndex -= 1;
  void loadUrl(state.history[state.historyIndex], { pushHistory: false });
});

controls.forwardBtn?.addEventListener("click", () => {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex += 1;
  void loadUrl(state.history[state.historyIndex], { pushHistory: false });
});

controls.refreshBtn?.addEventListener("click", () => {
  if (!state.currentUrl) return;
  void loadUrl(state.currentUrl, { pushHistory: false });
});

controls.quickLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-url") ?? "";
    void loadUrl(target, { pushHistory: true });
  });
});

controls.homeSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void navigateFromInput(controls.homeSearchInput?.value ?? "");
});

controls.notesToggleBtn?.addEventListener("click", () => {
  setNotesVisible(!state.notesVisible);
  scheduleRelayout();
});

controls.notesTextarea?.addEventListener("input", () => {
  localStorage.setItem(NOTES_KEY, controls.notesTextarea.value);
});

window.addEventListener("resize", () => {
  scheduleRelayout();
});

const savedNotes = localStorage.getItem(NOTES_KEY);
if (savedNotes && controls.notesTextarea) {
  controls.notesTextarea.value = savedNotes;
}

setNotesVisible(false);
setHomeVisible(true);
updateToolbarState();
