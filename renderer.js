const webview = document.getElementById('webview');
const homepage = document.getElementById('homepage');
const urlBar = document.getElementById('url-bar');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const notesToggle = document.getElementById('notes-toggle');
const notesPanel = document.getElementById('notes-panel');
const closeNotes = document.getElementById('close-notes');
const notesInput = document.getElementById('notes-input');
const saveNotesBtn = document.getElementById('save-notes');
const clearNotesBtn = document.getElementById('clear-notes');

let currentUrl = 'homepage.html';
let isHomepage = true;

console.log('Apna Browser initializing...');

// Load saved notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('apnaBrowserNotes');
    if (savedNotes) {
        notesInput.value = savedNotes;
    }
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem('apnaBrowserNotes', notesInput.value);
    alert('Notes saved successfully!');
}

// Clear notes
function clearNotes() {
    if (confirm('Are you sure you want to clear all notes?')) {
        notesInput.value = '';
        localStorage.removeItem('apnaBrowserNotes');
    }
}

// Navigate to homepage
function goToHomepage() {
    currentUrl = 'homepage.html';
    isHomepage = true;
    homepage.style.display = 'block';
    webview.style.display = 'none';
    urlBar.value = currentUrl;
    updateNavButtons();
}

// Navigate to URL
function navigateToUrl(url) {
    if (!url || url.trim() === '') return;

    url = url.trim();

    // Check if it's the homepage
    if (url === 'homepage.html') {
        goToHomepage();
        return;
    }

    // Check if it's a URL or search query
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
        } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
        }
    }

    currentUrl = url;
    isHomepage = false;
    homepage.style.display = 'none';
    webview.style.display = 'block';
    webview.src = url;
    urlBar.value = url;
}

// Update navigation buttons
function updateNavButtons() {
    if (isHomepage) {
        backBtn.disabled = true;
        forwardBtn.disabled = true;
        refreshBtn.disabled = false;
    } else {
        webview.canGoBack().then((canGoBack) => {
            backBtn.disabled = !canGoBack;
        });

        webview.canGoForward().then((canGoForward) => {
            forwardBtn.disabled = !canGoForward;
        });
        refreshBtn.disabled = false;
    }
}

// WebView event listeners
webview.addEventListener('dom-ready', () => {
    console.log('WebView dom-ready event fired');
    console.log('WebView URL:', webview.getURL());
});

webview.addEventListener('did-start-loading', () => {
    console.log('WebView started loading');
    urlBar.value = 'Loading...';
});

webview.addEventListener('did-stop-loading', () => {
    console.log('WebView stopped loading');
    currentUrl = webview.getURL();
    urlBar.value = currentUrl;
    updateNavButtons();
});

webview.addEventListener('did-navigate', (e) => {
    console.log('Navigated to:', e.url);
    currentUrl = e.url;
    urlBar.value = currentUrl;
    updateNavButtons();
});

webview.addEventListener('did-navigate-in-page', (e) => {
    currentUrl = e.url;
    urlBar.value = currentUrl;
    updateNavButtons();
});

webview.addEventListener('did-fail-load', (e) => {
    console.error('WebView failed to load:', e);
    alert('Failed to load page: ' + e.errorDescription);
});

webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    console.log('New window requested:', e.url);
    navigateToUrl(e.url);
});

// Homepage iframe event listener
homepage.addEventListener('load', () => {
    console.log('Homepage loaded');
    urlBar.value = 'homepage.html';
    isHomepage = true;
    updateNavButtons();
});

// Button event listeners
goBtn.addEventListener('click', () => {
    navigateToUrl(urlBar.value);
});

urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        navigateToUrl(urlBar.value);
    }
});

urlBar.addEventListener('focus', () => {
    urlBar.select();
});

backBtn.addEventListener('click', () => {
    if (!isHomepage && webview.canGoBack()) {
        webview.goBack();
    }
});

forwardBtn.addEventListener('click', () => {
    if (!isHomepage && webview.canGoForward()) {
        webview.goForward();
    }
});

refreshBtn.addEventListener('click', () => {
    if (isHomepage) {
        homepage.src = 'homepage.html';
    } else {
        webview.reload();
    }
});

homeBtn.addEventListener('click', goToHomepage);

// Notes panel event listeners
notesToggle.addEventListener('click', () => {
    notesPanel.classList.toggle('open');
    notesToggle.classList.toggle('active');
    if (notesPanel.classList.contains('open')) {
        notesInput.focus();
    }
});

closeNotes.addEventListener('click', () => {
    notesPanel.classList.remove('open');
    notesToggle.classList.remove('active');
});

saveNotesBtn.addEventListener('click', saveNotes);
clearNotesBtn.addEventListener('click', clearNotes);

// Auto-save notes every 30 seconds
setInterval(() => {
    if (notesInput.value.trim() !== '') {
        localStorage.setItem('apnaBrowserNotes', notesInput.value);
        console.log('Notes auto-saved');
    }
}, 30000);

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    loadNotes();
    updateNavButtons();
    urlBar.value = 'homepage.html';
    goToHomepage();
});

// Handle window resize
window.addEventListener('resize', () => {
    console.log('Window resized');
});
