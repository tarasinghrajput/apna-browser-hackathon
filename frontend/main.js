const controls = {
  backBtn: document.getElementById("back-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  goBtn: document.getElementById("go-btn"),
  notesToggleBtn: document.getElementById("notes-toggle-btn"),
  searchEngineSelect: document.getElementById("search-engine-select"),
  urlInput: document.getElementById("url-input"),
  homeSearchForm: document.getElementById("home-search-form"),
  homeSearchInput: document.getElementById("home-search-input"),
  homeSearchEngineSelect: document.getElementById("home-search-engine-select"),
  homeView: document.getElementById("home-view"),
  webviewHost: document.getElementById("webview-host"),
  webviewStatus: document.getElementById("webview-status"),
  notesPanel: document.getElementById("notes-panel"),
  notesTextarea: document.getElementById("notes-textarea"),
  content: document.querySelector(".content"),
  homeLinks: document.querySelectorAll("[data-url]"),
};

const tauri = window.__TAURI__;
const WebviewClass = tauri?.webview?.Webview;
const currentWindow = tauri?.window?.getCurrentWindow?.();
const invoke = tauri?.core?.invoke;

const NOTES_KEY = "apna-browser-notes";
const SEARCH_ENGINE_KEY = "apna-browser-search-engine";
const WEBVIEW_LABEL = "browser-webview";
const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};
const DEFAULT_SEARCH_ENGINE = "google";

const state = {
  nativeWebview: null,
  currentUrl: "",
  homeVisible: true,
  notesVisible: false,
  searchEngine: DEFAULT_SEARCH_ENGINE,
};

let relayoutTimer = null;

function normalizeSearchEngine(engine) {
  return Object.prototype.hasOwnProperty.call(SEARCH_ENGINES, engine)
    ? engine
    : DEFAULT_SEARCH_ENGINE;
}

function setSearchEngine(engine, options = { persist: true }) {
  const selectedEngine = normalizeSearchEngine(engine);
  state.searchEngine = selectedEngine;

  if (controls.searchEngineSelect) {
    controls.searchEngineSelect.value = selectedEngine;
  }
  if (controls.homeSearchEngineSelect) {
    controls.homeSearchEngineSelect.value = selectedEngine;
  }

  if (options.persist) {
    localStorage.setItem(SEARCH_ENGINE_KEY, selectedEngine);
  }
}

function buildSearchUrl(query) {
  const baseUrl = SEARCH_ENGINES[state.searchEngine] ?? SEARCH_ENGINES[DEFAULT_SEARCH_ENGINE];
  return `${baseUrl}${encodeURIComponent(query)}`;
}

function normalizeInputToUrl(rawInput) {
  const value = rawInput.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes(" ")) return buildSearchUrl(value);
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(value)) return `https://${value}`;
  return buildSearchUrl(value);
}

function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Unknown error";
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

async function invokeBackend(command, args = {}) {
  if (!invoke) {
    setStatus("Native invoke API is unavailable. Enable app.withGlobalTauri in tauri.conf.json.");
    return false;
  }

  try {
    await invoke(command, args);
    setStatus("");
    return true;
  } catch (error) {
    console.error(`Failed command: ${command}`, error);
    setStatus(getErrorMessage(error));
    return false;
  }
}

async function ensureNativeWebview(initialUrl) {
  if (state.nativeWebview) return false;

  if (!WebviewClass || !currentWindow) {
    setStatus("Native Tauri WebView API is unavailable. Enable app.withGlobalTauri in tauri.conf.json.");
    return null;
  }

  const bounds = getHostBounds();
  if (!bounds) {
    setStatus("WebView host area is not ready yet.");
    return null;
  }

  try {
    const webview = new WebviewClass(currentWindow, WEBVIEW_LABEL, {
      url: initialUrl,
      ...bounds,
    });

    state.nativeWebview = webview;
    setStatus("");

    webview.once("tauri://created", () => {
      setStatus("");
      void syncWebviewBounds();
    });

    webview.once("tauri://error", (event) => {
      console.error("Native webview creation failed:", event);
      const details = getErrorMessage(event?.payload ?? event?.error ?? event);
      state.nativeWebview = null;
      setStatus(`Unable to render this page in native WebView. ${details}`);
    });

    return true;
  } catch (error) {
    console.error("Failed to create native webview:", error);
    setStatus("Failed to create native WebView. Check permissions in capabilities/default.json.");
    return null;
  }
}

async function syncWebviewBounds() {
  if (!state.nativeWebview || state.homeVisible) return;

  const bounds = getHostBounds();
  if (!bounds) return;

  try {
    await state.nativeWebview.setPosition({ x: bounds.x, y: bounds.y });
    await state.nativeWebview.setSize({ width: bounds.width, height: bounds.height });
  } catch (error) {
    console.error("Failed to resize native webview:", error);
  }
}

async function hideNativeWebview() {
  if (!state.nativeWebview) return;
  try {
    await state.nativeWebview.hide();
  } catch (error) {
    console.error("Failed to hide webview:", error);
  }
}

async function showNativeWebview() {
  if (!state.nativeWebview) return;
  try {
    await state.nativeWebview.show();
    await syncWebviewBounds();
  } catch (error) {
    console.error("Failed to show webview:", error);
  }
}

function setHomeVisible(visible) {
  state.homeVisible = visible;
  controls.homeView?.classList.toggle("is-hidden", !visible);
  controls.webviewHost?.classList.toggle("is-hidden", visible);

  if (visible) {
    void hideNativeWebview();
  } else {
    void showNativeWebview();
  }
}

function setNotesVisible(visible) {
  state.notesVisible = visible;
  controls.notesPanel?.classList.toggle("is-hidden", !visible);
  controls.content?.classList.toggle("notes-open", visible);
  controls.notesToggleBtn.textContent = visible ? "Hide Notes" : "Notes";
}

function updateToolbarState() {
  const browsingActive = !state.homeVisible;
  controls.backBtn.disabled = !browsingActive;
  controls.forwardBtn.disabled = !browsingActive;
  controls.refreshBtn.disabled = !browsingActive;
}

async function showHome() {
  state.currentUrl = "";
  controls.urlInput.value = "";
  setHomeVisible(true);
  updateToolbarState();
  setStatus("");
}

async function loadUrl(url) {
  if (!url) {
    await showHome();
    return;
  }

  state.currentUrl = url;
  controls.urlInput.value = url;
  setHomeVisible(false);
  updateToolbarState();

  const createdNow = await ensureNativeWebview(url);
  if (createdNow === null) return;

  await showNativeWebview();

  if (!createdNow) {
    await invokeBackend("navigate_browser_webview", { url });
  }
}

async function navigateFromInput(rawValue) {
  const url = normalizeInputToUrl(rawValue);
  await loadUrl(url);
}

function scheduleRelayout() {
  if (relayoutTimer) {
    clearTimeout(relayoutTimer);
  }
  relayoutTimer = setTimeout(() => {
    void syncWebviewBounds();
  }, 80);
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
  if (state.homeVisible) return;
  void invokeBackend("browser_go_back");
});

controls.forwardBtn?.addEventListener("click", () => {
  if (state.homeVisible) return;
  void invokeBackend("browser_go_forward");
});

controls.refreshBtn?.addEventListener("click", () => {
  if (state.homeVisible) return;
  void invokeBackend("browser_reload");
});

controls.homeLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-url") ?? "";
    void loadUrl(target);
  });
});

controls.homeSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void navigateFromInput(controls.homeSearchInput?.value ?? "");
});

controls.searchEngineSelect?.addEventListener("change", () => {
  setSearchEngine(controls.searchEngineSelect.value);
});

controls.homeSearchEngineSelect?.addEventListener("change", () => {
  setSearchEngine(controls.homeSearchEngineSelect.value);
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

const savedSearchEngine = localStorage.getItem(SEARCH_ENGINE_KEY);
setSearchEngine(savedSearchEngine ?? DEFAULT_SEARCH_ENGINE, { persist: false });

setNotesVisible(false);
setHomeVisible(true);
updateToolbarState();
