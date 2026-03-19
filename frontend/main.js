const controls = {
  tabsList: document.getElementById("tabs-list"),
  newTabBtn: document.getElementById("new-tab-btn"),
  backBtn: document.getElementById("back-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  urlInput: document.getElementById("url-input"),
  goBtn: document.getElementById("go-btn"),
  homeView: document.getElementById("home-view"),
  webviewHost: document.getElementById("webview-host"),
  webviewStatus: document.getElementById("webview-status"),
  homeSearchForm: document.getElementById("home-search-form"),
  homeSearchInput: document.getElementById("home-search-input"),
  quickLinks: document.querySelectorAll("[data-url]"),
  currentPageLabel: document.getElementById("current-page-label"),
  summarizeBtn: document.getElementById("summarize-btn"),
  bookmarkBtn: document.getElementById("bookmark-btn"),
  researchModeToggle: document.getElementById("research-mode-toggle"),
  runResearchBtn: document.getElementById("run-research-btn"),
  summaryOutput: document.getElementById("summary-output"),
  researchOutput: document.getElementById("research-output"),
  bookmarksList: document.getElementById("bookmarks-list"),
  noteForm: document.getElementById("note-form"),
  noteInput: document.getElementById("note-input"),
  notesList: document.getElementById("notes-list"),
  settingsBtn: document.getElementById("settings-btn"),
  settingsBackdrop: document.getElementById("settings-backdrop"),
  settingsPopup: document.getElementById("settings-popup"),
  apiKeyInput: document.getElementById("api-key-input"),
  apiKeyStatus: document.getElementById("api-key-status"),
  saveApiKeyBtn: document.getElementById("save-api-key-btn"),
  clearApiKeyBtn: document.getElementById("clear-api-key-btn"),
  closeSettingsBtn: document.getElementById("close-settings-btn"),
};

const tauri = window.__TAURI__;
const invoke = tauri?.core?.invoke;
const listen = tauri?.event?.listen;

const SEARCH_ENGINE = "https://www.google.com/search?q=";
const ZAI_BASE_ENDPOINT = "https://api.z.ai/api/coding/paas/v4";
const ZAI_CHAT_ENDPOINT = `${ZAI_BASE_ENDPOINT}/chat/completions`;
const ZAI_MODEL = "zai/glm-4.7";
const API_KEY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const STORAGE_KEYS = {
  settings: "apna-browser-ai-settings",
  bookmarks: "apna-browser-smart-bookmarks",
  notesByUrl: "apna-browser-page-notes",
  summariesByUrl: "apna-browser-page-summaries",
  researchByUrl: "apna-browser-page-research",
  researchMode: "apna-browser-research-mode",
};

const state = {
  tabs: [],
  activeTabId: null,
  nextTabNumber: 1,
  bookmarks: [],
  notesByUrl: {},
  summariesByUrl: {},
  researchByUrl: {},
  researchModeEnabled: false,
  pageContentCache: {},
  settingsOpen: false,
  browserLoading: false,
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function persistJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeInputToUrl(rawInput) {
  const value = rawInput.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes(" ")) return `${SEARCH_ENGINE}${encodeURIComponent(value)}`;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/:?#].*)?$/i.test(value)) return `https://${value}`;
  return `${SEARCH_ENGINE}${encodeURIComponent(value)}`;
}

function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Unknown error";
}

function setStatus(message) {
  if (!controls.webviewStatus) return;
  controls.webviewStatus.textContent = message;
  controls.webviewStatus.classList.toggle("is-hidden", !message);
}

function setAssistantLoading(element, message) {
  if (!element) return;
  element.textContent = message;
}

function getApiSettings() {
  const data = loadJson(STORAGE_KEYS.settings, null);
  if (!data || typeof data !== "object") return null;
  const expiresAt = Number(data.expiresAt || 0);
  if (!expiresAt || expiresAt <= Date.now()) {
    localStorage.removeItem(STORAGE_KEYS.settings);
    return null;
  }
  const apiKey = String(data.apiKey || "").trim();
  if (!apiKey) return null;
  return { apiKey, expiresAt };
}

function renderApiKeyStatus(message = "") {
  const settings = getApiSettings();
  if (message) {
    controls.apiKeyStatus.textContent = message;
    return;
  }

  if (!settings) {
    controls.apiKeyStatus.textContent = "No API key saved.";
    controls.apiKeyInput.value = "";
    return;
  }

  const expiry = new Date(settings.expiresAt).toLocaleString();
  controls.apiKeyStatus.textContent = `API key saved. Expires: ${expiry}`;
  controls.apiKeyInput.value = settings.apiKey;
}

function saveApiKey(apiKey) {
  const payload = {
    apiKey,
    expiresAt: Date.now() + API_KEY_TTL_MS,
  };
  persistJson(STORAGE_KEYS.settings, payload);
}

function clearApiKey() {
  localStorage.removeItem(STORAGE_KEYS.settings);
}

function openSettings() {
  state.settingsOpen = true;
  controls.settingsBackdrop.classList.remove("is-hidden");
  controls.settingsPopup.classList.remove("is-hidden");
  renderApiKeyStatus();
  controls.apiKeyInput.focus();
}

function closeSettings() {
  state.settingsOpen = false;
  controls.settingsBackdrop.classList.add("is-hidden");
  controls.settingsPopup.classList.add("is-hidden");
}

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null;
}

function getActiveUrl() {
  return getActiveTab()?.url ?? "";
}

function setHomeVisible(visible) {
  controls.homeView?.classList.toggle("is-hidden", !visible);
  controls.webviewHost?.classList.toggle("is-hidden", visible);
}

function updateToolbarState() {
  const activeTab = getActiveTab();
  const canBrowse = Boolean(activeTab?.url);

  controls.backBtn.disabled = !canBrowse;
  controls.forwardBtn.disabled = !canBrowse;
  controls.refreshBtn.disabled = !canBrowse;

  controls.urlInput.value = activeTab?.url ?? "";
  controls.urlInput.placeholder = activeTab?.url ? "Search or enter address" : "Search the web or enter address";
}

async function invokeBackend(command, args = {}) {
  if (!invoke) {
    setStatus("Tauri invoke API is unavailable.");
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

function setLoadingState(isLoading) {
  state.browserLoading = isLoading;
  if (isLoading) {
    setStatus("Loading...");
    return;
  }
  if (controls.webviewStatus?.textContent === "Loading...") {
    setStatus("");
  }
}

function syncActiveTabUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return;

  const activeTab = getActiveTab();
  if (!activeTab) return;

  activeTab.url = normalized;
  if (!activeTab.title || activeTab.title === "New Tab") {
    activeTab.title = buildTabTitle(normalized);
  } else {
    activeTab.title = buildTabTitle(normalized);
  }

  renderTabs();
  updateToolbarState();
  refreshWorkspacePanels();
}

function syncActiveTabTitle(title) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) return;

  const activeTab = getActiveTab();
  if (!activeTab) return;

  activeTab.title = cleanTitle;
  renderTabs();
  refreshWorkspacePanels();
}

function attachBrowserEventListeners() {
  if (!listen) return;

  void listen("browser-loading", (event) => {
    setLoadingState(Boolean(event.payload));
  });

  void listen("browser-url-changed", (event) => {
    syncActiveTabUrl(event.payload);
  });

  void listen("browser-title-changed", (event) => {
    syncActiveTabTitle(event.payload);
  });
}

function showBrowserPanel() {
  setHomeVisible(false);
  setLoadingState(true);
}

async function hideBrowserPanel() {
  setLoadingState(false);
  const hidden = await invokeBackend("hide_browser_webview");
  if (!hidden) {
    setStatus("Failed to hide browser window.");
  }
}

function buildTabTitle(url) {
  if (!url) return "New Tab";
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "") || parsed.href;
  } catch {
    return url;
  }
}

function renderTabs() {
  controls.tabsList.textContent = "";

  state.tabs.forEach((tab) => {
    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = `tab-item ${tab.id === state.activeTabId ? "active" : ""}`;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", String(tab.id === state.activeTabId));
    tabButton.dataset.tabId = tab.id;

    const title = document.createElement("span");
    title.className = "tab-title";
    title.textContent = tab.title;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "tab-close material-symbols-outlined";
    closeButton.textContent = "close";
    closeButton.setAttribute("aria-label", `Close ${tab.title}`);
    closeButton.dataset.closeId = tab.id;

    tabButton.append(title, closeButton);
    controls.tabsList.appendChild(tabButton);
  });
}

function renderCurrentPageMeta() {
  const tab = getActiveTab();
  if (!tab?.url) {
    controls.currentPageLabel.textContent = "No page loaded";
    return;
  }

  controls.currentPageLabel.textContent = `${tab.title} (${tab.url})`;
}

function renderSummary() {
  const url = getActiveUrl();
  if (!url) {
    controls.summaryOutput.textContent = "No summary generated yet.";
    return;
  }

  controls.summaryOutput.textContent =
    state.summariesByUrl[url] || "No summary generated for this page yet.";
}

function renderResearch() {
  const url = getActiveUrl();
  if (!url) {
    controls.researchOutput.textContent = "No research report yet.";
    return;
  }

  controls.researchOutput.textContent =
    state.researchByUrl[url] || "No research report generated for this page yet.";
}

function getNotesForUrl(url) {
  if (!url) return [];
  return Array.isArray(state.notesByUrl[url]) ? state.notesByUrl[url] : [];
}

function setNotesForUrl(url, notes) {
  if (!url) return;
  if (!notes.length) {
    delete state.notesByUrl[url];
  } else {
    state.notesByUrl[url] = notes;
  }
  persistJson(STORAGE_KEYS.notesByUrl, state.notesByUrl);
}

function renderNotes() {
  const url = getActiveUrl();
  const notes = getNotesForUrl(url);

  controls.notesList.textContent = "";

  if (!url) {
    const empty = document.createElement("p");
    empty.className = "meta-text";
    empty.textContent = "Open a page to manage notes.";
    controls.notesList.appendChild(empty);
    return;
  }

  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "meta-text";
    empty.textContent = "No notes for this page.";
    controls.notesList.appendChild(empty);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("article");
    item.className = "note-item";

    const top = document.createElement("div");
    top.className = "note-top";

    const noteText = document.createElement("p");
    noteText.className = "note-text";
    noteText.textContent = note.content;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "tiny-btn";
    editBtn.textContent = "Edit";
    editBtn.dataset.noteEdit = note.id;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tiny-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.noteDelete = note.id;

    actions.append(editBtn, deleteBtn);
    top.append(noteText, actions);
    item.append(top);

    controls.notesList.appendChild(item);
  });
}

function renderBookmarks() {
  controls.bookmarksList.textContent = "";

  if (!state.bookmarks.length) {
    const empty = document.createElement("p");
    empty.className = "meta-text";
    empty.textContent = "No bookmarks yet.";
    controls.bookmarksList.appendChild(empty);
    return;
  }

  const currentUrl = getActiveUrl();

  state.bookmarks
    .slice()
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .forEach((bookmark) => {
      const item = document.createElement("article");
      item.className = "bookmark-item";

      const top = document.createElement("div");
      top.className = "bookmark-top";

      const link = document.createElement("a");
      link.href = "#";
      link.className = "bookmark-link";
      link.dataset.bookmarkOpen = bookmark.id;
      link.textContent =
        bookmark.title + (bookmark.url === currentUrl ? " (Current)" : "");

      const actions = document.createElement("div");
      actions.className = "bookmark-actions";

      const recatBtn = document.createElement("button");
      recatBtn.type = "button";
      recatBtn.className = "tiny-btn";
      recatBtn.textContent = "Re-cat";
      recatBtn.dataset.bookmarkRecat = bookmark.id;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "tiny-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.dataset.bookmarkDelete = bookmark.id;

      actions.append(recatBtn, deleteBtn);
      top.append(link, actions);

      const meta = document.createElement("p");
      meta.className = "bookmark-meta";
      const reason = bookmark.categoryReason ? ` • ${bookmark.categoryReason}` : "";
      meta.textContent = `${bookmark.category || "Uncategorized"}${reason}`;

      item.append(top, meta);
      controls.bookmarksList.appendChild(item);
    });
}

function refreshWorkspacePanels() {
  renderCurrentPageMeta();
  renderSummary();
  renderResearch();
  renderNotes();
  renderBookmarks();
  controls.researchModeToggle.checked = state.researchModeEnabled;
}

function getApiKeyOrThrow() {
  const settings = getApiSettings();
  if (!settings) {
    throw new Error("Configure your z.ai API key in Settings first.");
  }
  return settings.apiKey;
}

function normalizeModelContent(content) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          if (typeof part.text === "string") return part.text;
          if (typeof part.content === "string") return part.content;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function pickModelText(message, preferReasoning = false) {
  const contentText = normalizeModelContent(message?.content);
  const reasoningText = normalizeModelContent(
    message?.reasoning ||
      message?.reasoning_content ||
      message?.reasoningContent
  );

  if (preferReasoning) {
    return reasoningText || contentText;
  }
  return contentText || reasoningText;
}

async function callGlm(
  messages,
  { temperature = 0.25, maxTokens = 900, preferReasoning = false } = {}
) {
  const apiKey = getApiKeyOrThrow();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);

  try {
    const response = await fetch(ZAI_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: ZAI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiMessage =
        payload?.error?.message || payload?.message || `z.ai request failed (${response.status})`;
      throw new Error(apiMessage);
    }

    const text = pickModelText(payload?.choices?.[0]?.message, preferReasoning);
    if (!text) throw new Error("Model returned an empty response.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUrlText(url) {
  const normalized = String(url || "").trim();
  if (!normalized) return "";
  if (state.pageContentCache[normalized]) return state.pageContentCache[normalized];

  const readerUrl = `https://r.jina.ai/http://${normalized.replace(/^https?:\/\//i, "")}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(readerUrl, { signal: controller.signal });
    if (!response.ok) return "";

    const text = await response.text();
    const compact = text.replace(/\s+/g, " ").trim().slice(0, 9000);
    state.pageContentCache[normalized] = compact;
    return compact;
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function getPageContextForAI(tab) {
  const notes = getNotesForUrl(tab.url)
    .map((note) => `- ${note.content}`)
    .join("\n");
  const pageText = await fetchUrlText(tab.url);

  return [
    `URL: ${tab.url}`,
    `Title: ${tab.title}`,
    pageText ? `Page Content Snapshot: ${pageText}` : "Page Content Snapshot: (unavailable)",
    notes ? `User Notes:\n${notes}` : "User Notes: (none)",
  ].join("\n\n");
}

function guessCategory(url, title) {
  const source = `${url} ${title}`.toLowerCase();
  if (/docs|developer|mdn|api|reference/.test(source)) return "Documentation";
  if (/youtube|video|playlist/.test(source)) return "Video";
  if (/github|gitlab|stack ?overflow|community|forum/.test(source)) return "Community";
  if (/news|times|post|blog|medium/.test(source)) return "News";
  if (/learn|course|academy|tutorial/.test(source)) return "Learning";
  if (/tool|app|console|platform/.test(source)) return "Tools";
  return "Reference";
}

function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function autoCategorizeBookmark(tab, summaryText = "") {
  const fallback = {
    category: guessCategory(tab.url, tab.title),
    reason: "Heuristic category",
  };

  const settings = getApiSettings();
  if (!settings) return fallback;

  try {
    const result = await callGlm(
      [
        {
          role: "system",
          content:
            "Categorize web pages. Return strict JSON only: {\"category\":\"...\",\"reason\":\"...\"}. Categories: Documentation, Learning, News, Video, Tools, Reference, Community, Research, Other.",
        },
        {
          role: "user",
          content: `URL: ${tab.url}\nTitle: ${tab.title}\nSummary: ${summaryText || "N/A"}`,
        },
      ],
      { temperature: 0.1, maxTokens: 180 }
    );

    const parsed = extractFirstJsonObject(result);
    if (!parsed?.category) return fallback;
    return {
      category: String(parsed.category),
      reason: String(parsed.reason || "AI category"),
    };
  } catch {
    return fallback;
  }
}

async function summarizeCurrentPage() {
  const tab = getActiveTab();
  if (!tab?.url) {
    setStatus("Open a page first to summarize it.");
    return;
  }

  controls.summarizeBtn.disabled = true;
  setAssistantLoading(controls.summaryOutput, "Generating summary...");

  try {
    const context = await getPageContextForAI(tab);
    const summary = await callGlm(
      [
        {
          role: "system",
          content:
            "You summarize web pages for students. Keep it concise, factual, and structured with: Overview, Key Points, and Why It Matters.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      { temperature: 0.2, maxTokens: 700, preferReasoning: true }
    );

    state.summariesByUrl[tab.url] = summary;
    persistJson(STORAGE_KEYS.summariesByUrl, state.summariesByUrl);
    renderSummary();
    setStatus("Summary generated.");
  } catch (error) {
    controls.summaryOutput.textContent = `Summary failed: ${getErrorMessage(error)}`;
    setStatus(getErrorMessage(error));
  } finally {
    controls.summarizeBtn.disabled = false;
  }
}

async function runResearchForCurrentPage({ auto = false } = {}) {
  const tab = getActiveTab();
  if (!tab?.url) {
    if (!auto) setStatus("Open a page first to run research mode.");
    return;
  }

  controls.runResearchBtn.disabled = true;
  setAssistantLoading(controls.researchOutput, "Generating research report...");

  try {
    const context = await getPageContextForAI(tab);
    const report = await callGlm(
      [
        {
          role: "system",
          content:
            "You are an AI research assistant. Produce concise markdown with sections: 1) Core Idea, 2) Key Facts, 3) Open Questions, 4) Follow-up Search Queries (5 queries), 5) Practical Next Steps.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      { temperature: 0.3, maxTokens: 1000 }
    );

    state.researchByUrl[tab.url] = report;
    persistJson(STORAGE_KEYS.researchByUrl, state.researchByUrl);
    renderResearch();
    if (!auto) setStatus("Research report generated.");
  } catch (error) {
    controls.researchOutput.textContent = `Research failed: ${getErrorMessage(error)}`;
    if (!auto) setStatus(getErrorMessage(error));
  } finally {
    controls.runResearchBtn.disabled = false;
  }
}

async function saveSmartBookmark() {
  const tab = getActiveTab();
  if (!tab?.url) {
    setStatus("Open a page first to save a bookmark.");
    return;
  }

  controls.bookmarkBtn.disabled = true;

  try {
    const summaryText = state.summariesByUrl[tab.url] || "";
    const category = await autoCategorizeBookmark(tab, summaryText);

    const existingIndex = state.bookmarks.findIndex((bookmark) => bookmark.url === tab.url);
    const record = {
      id: existingIndex >= 0 ? state.bookmarks[existingIndex].id : `bm-${Date.now()}`,
      url: tab.url,
      title: tab.title,
      category: category.category,
      categoryReason: category.reason,
      summarySnippet: summaryText.slice(0, 220),
      createdAt:
        existingIndex >= 0
          ? state.bookmarks[existingIndex].createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      state.bookmarks[existingIndex] = record;
    } else {
      state.bookmarks.push(record);
    }

    persistJson(STORAGE_KEYS.bookmarks, state.bookmarks);
    renderBookmarks();
    setStatus("Bookmark saved with smart category.");
  } catch (error) {
    setStatus(`Bookmarking failed: ${getErrorMessage(error)}`);
  } finally {
    controls.bookmarkBtn.disabled = false;
  }
}

async function recategorizeBookmark(id) {
  const bookmark = state.bookmarks.find((item) => item.id === id);
  if (!bookmark) return;

  const category = await autoCategorizeBookmark(
    { url: bookmark.url, title: bookmark.title },
    bookmark.summarySnippet || ""
  );

  bookmark.category = category.category;
  bookmark.categoryReason = category.reason;
  bookmark.updatedAt = new Date().toISOString();
  persistJson(STORAGE_KEYS.bookmarks, state.bookmarks);
  renderBookmarks();
}

function deleteBookmark(id) {
  const next = state.bookmarks.filter((bookmark) => bookmark.id !== id);
  state.bookmarks = next;
  persistJson(STORAGE_KEYS.bookmarks, state.bookmarks);
  renderBookmarks();
}

function addNoteToCurrentPage(content) {
  const url = getActiveUrl();
  if (!url) {
    setStatus("Open a page first to add notes.");
    return;
  }

  const trimmed = content.trim();
  if (!trimmed) return;

  const notes = getNotesForUrl(url);
  notes.unshift({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content: trimmed,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  setNotesForUrl(url, notes);
  controls.noteInput.value = "";
  renderNotes();
  setStatus("Note added.");
}

function editNote(noteId) {
  const url = getActiveUrl();
  if (!url) return;

  const notes = getNotesForUrl(url);
  const note = notes.find((candidate) => candidate.id === noteId);
  if (!note) return;

  const edited = window.prompt("Edit note", note.content);
  if (edited === null) return;

  const trimmed = edited.trim();
  if (!trimmed) return;

  note.content = trimmed;
  note.updatedAt = new Date().toISOString();
  setNotesForUrl(url, notes);
  renderNotes();
  setStatus("Note updated.");
}

function deleteNote(noteId) {
  const url = getActiveUrl();
  if (!url) return;

  const next = getNotesForUrl(url).filter((note) => note.id !== noteId);
  setNotesForUrl(url, next);
  renderNotes();
  setStatus("Note deleted.");
}

async function createTab({ activate = true } = {}) {
  const tab = {
    id: `tab-${state.nextTabNumber++}`,
    title: "New Tab",
    url: "",
  };
  state.tabs.push(tab);

  if (!state.activeTabId) {
    state.activeTabId = tab.id;
  }

  renderTabs();
  if (activate) {
    await switchToTab(tab.id);
  } else {
    updateToolbarState();
    refreshWorkspacePanels();
  }
}

async function closeTab(tabId) {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return;

  state.tabs.splice(index, 1);

  if (state.tabs.length === 0) {
    state.activeTabId = null;
    await createTab({ activate: true });
    return;
  }

  if (state.activeTabId === tabId) {
    const nextTab = state.tabs[Math.max(0, index - 1)] ?? state.tabs[0];
    state.activeTabId = nextTab.id;
    renderTabs();
    await switchToTab(nextTab.id);
    return;
  }

  renderTabs();
  updateToolbarState();
  refreshWorkspacePanels();
}

async function openActiveTabUrl(url) {
  const activeTab = getActiveTab();
  if (!activeTab) return;

  showBrowserPanel();
  const loaded = await invokeBackend("navigate_browser_webview", { url });
  if (!loaded) {
    setHomeVisible(true);
    setLoadingState(false);
    return;
  }

  activeTab.url = url;
  activeTab.title = buildTabTitle(url);

  renderTabs();
  updateToolbarState();
  refreshWorkspacePanels();

  if (state.researchModeEnabled) {
    void runResearchForCurrentPage({ auto: true });
  }
}

async function switchToTab(tabId) {
  const tab = state.tabs.find((candidate) => candidate.id === tabId);
  if (!tab) return;

  state.activeTabId = tab.id;
  renderTabs();

  if (!tab.url) {
    setHomeVisible(true);
    setStatus("");
    await hideBrowserPanel();
    updateToolbarState();
    refreshWorkspacePanels();
    return;
  }

  showBrowserPanel();
  const loaded = await invokeBackend("navigate_browser_webview", { url: tab.url });

  if (!loaded) {
    setHomeVisible(true);
    setLoadingState(false);
    updateToolbarState();
    return;
  }

  updateToolbarState();
  refreshWorkspacePanels();
}

async function navigateFromInput(rawInput) {
  const activeTab = getActiveTab();
  if (!activeTab) return;

  const url = normalizeInputToUrl(rawInput);
  if (!url) {
    activeTab.url = "";
    activeTab.title = "New Tab";
    renderTabs();
    await switchToTab(activeTab.id);
    return;
  }

  await openActiveTabUrl(url);
}

function bootstrapState() {
  state.bookmarks = loadJson(STORAGE_KEYS.bookmarks, []);
  state.notesByUrl = loadJson(STORAGE_KEYS.notesByUrl, {});
  state.summariesByUrl = loadJson(STORAGE_KEYS.summariesByUrl, {});
  state.researchByUrl = loadJson(STORAGE_KEYS.researchByUrl, {});
  state.researchModeEnabled = Boolean(loadJson(STORAGE_KEYS.researchMode, false));
  controls.researchModeToggle.checked = state.researchModeEnabled;
  renderApiKeyStatus();
}

controls.tabsList.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-id]");
  if (closeButton) {
    event.stopPropagation();
    void closeTab(closeButton.dataset.closeId ?? "");
    return;
  }

  const tabButton = event.target.closest("[data-tab-id]");
  if (!tabButton) return;
  void switchToTab(tabButton.dataset.tabId ?? "");
});

controls.newTabBtn.addEventListener("click", () => {
  void createTab({ activate: true });
});

controls.goBtn.addEventListener("click", () => {
  void navigateFromInput(controls.urlInput.value);
});

controls.urlInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  void navigateFromInput(controls.urlInput.value);
});

window.addEventListener("keydown", (event) => {
  const hasPrimaryModifier = event.ctrlKey || event.metaKey;
  if (!hasPrimaryModifier || event.altKey) return;

  const key = event.key.toLowerCase();

  if (key === "t") {
    event.preventDefault();
    void createTab({ activate: true });
    return;
  }

  if (key === "w" && state.activeTabId) {
    event.preventDefault();
    void closeTab(state.activeTabId);
  }
});

controls.backBtn.addEventListener("click", () => {
  void invokeBackend("browser_go_back");
});

controls.forwardBtn.addEventListener("click", () => {
  void invokeBackend("browser_go_forward");
});

controls.refreshBtn.addEventListener("click", () => {
  void invokeBackend("browser_reload");
});

controls.homeSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void navigateFromInput(controls.homeSearchInput.value ?? "");
});

controls.quickLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const targetUrl = button.getAttribute("data-url") ?? "";
    void navigateFromInput(targetUrl);
  });
});

controls.summarizeBtn.addEventListener("click", () => {
  void summarizeCurrentPage();
});

controls.runResearchBtn.addEventListener("click", () => {
  void runResearchForCurrentPage({ auto: false });
});

controls.bookmarkBtn.addEventListener("click", () => {
  void saveSmartBookmark();
});

controls.researchModeToggle.addEventListener("change", () => {
  state.researchModeEnabled = controls.researchModeToggle.checked;
  persistJson(STORAGE_KEYS.researchMode, state.researchModeEnabled);
});

controls.bookmarksList.addEventListener("click", (event) => {
  const openLink = event.target.closest("[data-bookmark-open]");
  if (openLink) {
    event.preventDefault();
    const id = openLink.dataset.bookmarkOpen;
    const bookmark = state.bookmarks.find((item) => item.id === id);
    if (bookmark) {
      void navigateFromInput(bookmark.url);
    }
    return;
  }

  const deleteBtn = event.target.closest("[data-bookmark-delete]");
  if (deleteBtn) {
    deleteBookmark(deleteBtn.dataset.bookmarkDelete ?? "");
    return;
  }

  const recatBtn = event.target.closest("[data-bookmark-recat]");
  if (recatBtn) {
    void recategorizeBookmark(recatBtn.dataset.bookmarkRecat ?? "");
  }
});

controls.noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addNoteToCurrentPage(controls.noteInput.value);
});

controls.notesList.addEventListener("click", (event) => {
  const editBtn = event.target.closest("[data-note-edit]");
  if (editBtn) {
    editNote(editBtn.dataset.noteEdit ?? "");
    return;
  }

  const deleteBtn = event.target.closest("[data-note-delete]");
  if (deleteBtn) {
    deleteNote(deleteBtn.dataset.noteDelete ?? "");
  }
});

controls.settingsBtn.addEventListener("click", () => {
  if (state.settingsOpen) {
    closeSettings();
  } else {
    openSettings();
  }
});

controls.settingsBackdrop.addEventListener("click", () => {
  closeSettings();
});

controls.closeSettingsBtn.addEventListener("click", () => {
  closeSettings();
});

controls.saveApiKeyBtn.addEventListener("click", () => {
  const key = controls.apiKeyInput.value.trim();
  if (!key) {
    renderApiKeyStatus("Enter a valid API key.");
    return;
  }

  saveApiKey(key);
  renderApiKeyStatus("API key saved for 7 days.");
});

controls.clearApiKeyBtn.addEventListener("click", () => {
  clearApiKey();
  renderApiKeyStatus("API key cleared.");
});

bootstrapState();
attachBrowserEventListeners();
renderBookmarks();
refreshWorkspacePanels();
void createTab({ activate: true });
