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
- Renders the Browser UI (toolbar, homepage, notes)

Secondary Native Webview Window
- Created from Rust using `WebviewWindowBuilder`
- Loads and renders external websites
- Controlled by toolbar actions (Go / Back / Forward / Refresh) via Tauri commands

Feature Modules
- Notes
- Website blocker
- AI summarizer
