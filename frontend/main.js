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
const invoke = tauri?.core?.invoke;

const NOTES_KEY = "apna-browser-notes";
const SEARCH_ENGINE_KEY = "apna-browser-search-engine";
const SEARCH_ENGINES = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  bing: "https://www.bing.com/search?q=",
};
const DEFAULT_SEARCH_ENGINE = "google";

const state = {
  currentUrl: "",
  homeVisible: true,
  notesVisible: false,
  searchEngine: DEFAULT_SEARCH_ENGINE,
};

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

async function invokeBackend(command, args = {}) {
  if (!invoke) {
    setStatus("Native invoke API is unavailable. Enable app.withGlobalTauri in tauri.conf.json.");
    return false;
  }

  try {
    await invoke(command, args);
    return true;
  } catch (error) {
    console.error(`Failed command: ${command}`, error);
    setStatus(getErrorMessage(error));
    return false;
  }
}

function setHomeVisible(visible) {
  state.homeVisible = visible;
  controls.homeView?.classList.toggle("is-hidden", !visible);
  controls.webviewHost?.classList.toggle("is-hidden", visible);

  if (visible) {
    setStatus("");
  } else if (!controls.webviewStatus?.textContent) {
    setStatus("Pages open in a separate native browser window.");
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
}

async function loadUrl(url) {
  if (!url) {
    await showHome();
    return;
  }

  const loaded = await invokeBackend("navigate_browser_webview", { url });
  if (!loaded) return;

  state.currentUrl = url;
  controls.urlInput.value = url;
  setHomeVisible(false);
  updateToolbarState();
  setStatus("Page opened in a separate native browser window.");
}

async function navigateFromInput(rawValue) {
  const url = normalizeInputToUrl(rawValue);
  await loadUrl(url);
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
});

controls.notesTextarea?.addEventListener("input", () => {
  localStorage.setItem(NOTES_KEY, controls.notesTextarea.value);
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
