# System Architecture

Apna Browser uses Tauri.

Architecture:

Frontend
HTML + CSS + Vanilla JS

Backend
Rust (Tauri)

Rendering Engine
System WebView (WebKit/Chromium depending on OS)

Components

Browser UI
- URL bar
- Navigation buttons

Main Webview Window
- Renders the Browser UI (toolbar, tab strip, homepage, AI workspace)

Secondary Native Browser Webview Window
- Created from Rust using `WebviewWindowBuilder`
- Reused for browsing (single native window reused across tabs/actions)
- Loads external URLs and handles Back / Forward / Refresh
- Main UI tabs remain in the current window and control this browser window

Feature Modules
- AI workspace (summaries, research mode, bookmarks, notes)
