const controls = {
  tabsList: document.getElementById("tabs-list"),
  newTabBtn: document.getElementById("new-tab-btn"),
  homeBtn: document.getElementById("home-btn"),
  backBtn: document.getElementById("back-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  urlInput: document.getElementById("url-input"),
  goBtn: document.getElementById("go-btn"),
  homeContent: document.getElementById("home-content"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  quickLinks: document.querySelectorAll("[data-url]"),
};

const tauri = window.__TAURI__;
const invoke = tauri?.core?.invoke;
const listen = tauri?.event?.listen;

const SEARCH_ENGINE = "https://www.google.com/search?q=";

const state = {
  tabs: [],
  activeTabId: null,
  nextTabNumber: 1,
  isOnHome: true,
  currentUrl: "",
};

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

function showHome() {
  state.isOnHome = true;
  state.currentUrl = "";
  controls.homeContent.classList.remove("is-hidden");
  controls.urlInput.value = "";
  controls.urlInput.placeholder = "Search or enter address";
  updateToolbarState();
}

function hideHome() {
  state.isOnHome = false;
  controls.homeContent.classList.add("is-hidden");
}

function updateToolbarState() {
  controls.backBtn.disabled = state.isOnHome;
  controls.forwardBtn.disabled = state.isOnHome;
  controls.refreshBtn.disabled = state.isOnHome;
}

async function invokeBackend(command, args = {}) {
  if (!invoke) {
    console.error("Tauri invoke API is unavailable");
    return false;
  }

  try {
    await invoke(command, args);
    return true;
  } catch (error) {
    console.error(`Failed command: ${command}`, error);
    alert(`Error: ${getErrorMessage(error)}`);
    return false;
  }
}

async function navigateToUrl(url) {
  const normalizedUrl = normalizeInputToUrl(url);
  if (!normalizedUrl) {
    await invokeBackend("go_home");
    return;
  }

  hideHome();
  state.currentUrl = normalizedUrl;
  controls.urlInput.value = normalizedUrl;

  const success = await invokeBackend("navigate_browser", { url: normalizedUrl });
  if (success) {
    updateToolbarState();
  } else {
    showHome();
  }
}

async function goHome() {
  await invokeBackend("go_home");
  showHome();
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

function createTab() {
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
}

function closeTab(tabId) {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return;

  state.tabs.splice(index, 1);

  if (state.tabs.length === 0) {
    state.activeTabId = null;
    createTab();
    return;
  }

  if (state.activeTabId === tabId) {
    const nextTab = state.tabs[Math.max(0, index - 1)] ?? state.tabs[0];
    state.activeTabId = nextTab.id;
    renderTabs();
    return;
  }

  renderTabs();
}

function attachBrowserEventListeners() {
  // Listen for URL changes using DOM events
  window.addEventListener('popstate', () => {
    syncUrlState();
  });
  
  window.addEventListener('hashchange', () => {
    syncUrlState();
  });
  
  // Listen for title changes
  const titleObserver = new MutationObserver(() => {
    syncTitleState();
  });
  
  titleObserver.observe(document.querySelector('title'), {
    subtree: true,
    characterData: true,
    childList: true
  });
  
  // Initial sync
  setTimeout(() => {
    syncUrlState();
    syncTitleState();
  }, 100);
}

function syncUrlState() {
  const url = window.location.href;
  
  // Only update if we're not on the homepage
  if (url.includes('index.html') || url.endsWith('/')) {
    state.isOnHome = true;
    controls.homeContent.classList.remove("is-hidden");
    controls.urlInput.value = "";
    controls.urlInput.placeholder = "Search or enter address";
    updateToolbarState();
    return;
  }
  
  state.isOnHome = false;
  controls.homeContent.classList.add("is-hidden");
  state.currentUrl = url;
  controls.urlInput.value = url;
  updateToolbarState();
  
  // Update active tab
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
  if (activeTab) {
    activeTab.url = url;
    try {
      const urlObj = new URL(url);
      activeTab.title = urlObj.hostname.replace(/^www\./i, "") || url;
    } catch {
      activeTab.title = url;
    }
    renderTabs();
  }
}

function syncTitleState() {
  const title = document.title;
  const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
  if (activeTab && title) {
    activeTab.title = title;
    renderTabs();
  }
}

controls.tabsList.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-id]");
  if (closeButton) {
    event.stopPropagation();
    closeTab(closeButton.dataset.closeId ?? "");
    return;
  }

  const tabButton = event.target.closest("[data-tab-id]");
  if (!tabButton) return;
  const tabId = tabButton.dataset.tabId ?? "";
  const tab = state.tabs.find((t) => t.id === tabId);
  if (tab) {
    state.activeTabId = tab.id;
    renderTabs();
    if (tab.url) {
      navigateToUrl(tab.url);
    } else {
      goHome();
    }
  }
});

controls.newTabBtn.addEventListener("click", () => {
  createTab();
  goHome();
});

controls.homeBtn.addEventListener("click", () => {
  goHome();
});

controls.goBtn.addEventListener("click", () => {
  navigateToUrl(controls.urlInput.value);
});

controls.urlInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  navigateToUrl(controls.urlInput.value);
});

controls.backBtn.addEventListener("click", () => {
  invokeBackend("browser_go_back");
});

controls.forwardBtn.addEventListener("click", () => {
  invokeBackend("browser_go_forward");
});

controls.refreshBtn.addEventListener("click", () => {
  invokeBackend("browser_reload");
});

controls.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  navigateToUrl(controls.searchInput.value ?? "");
});

controls.quickLinks.forEach((button) => {
  button.addEventListener("click", () => {
    const targetUrl = button.getAttribute("data-url") ?? "";
    navigateToUrl(targetUrl);
  });
});

window.addEventListener("keydown", (event) => {
  const hasPrimaryModifier = event.ctrlKey || event.metaKey;
  if (!hasPrimaryModifier || event.altKey) return;

  const key = event.key.toLowerCase();

  if (key === "t") {
    event.preventDefault();
    createTab();
    goHome();
  }

  if (key === "l") {
    event.preventDefault();
    controls.urlInput.focus();
    controls.urlInput.select();
  }
});

attachBrowserEventListeners();
createTab();
showHome();
