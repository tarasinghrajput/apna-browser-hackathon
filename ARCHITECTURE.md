# System Architecture

Apna Browser uses Tauri with a two-window architecture.

## Overview

Apna Browser separates the browser UI from the web content display using two native windows:

1. **Main Window** - Browser UI (toolbar, tabs, AI workspace)
2. **Browser Window** - Native webview for displaying web content

## Technology Stack

- **Frontend**: HTML + CSS + Vanilla JS
- **Backend**: Rust (Tauri)
- **Rendering Engine**: System WebView (WebKit/Chromium depending on OS)

## Components

### Main Window (Control Panel)
- Renders the Browser UI (toolbar, tab strip, homepage, AI workspace)
- Handles user interactions and navigation commands
- Communicates with Rust backend via Tauri commands
- Listens to events from the browser window

### Browser Window (Native Webview)
- Created from Rust using `WebviewWindowBuilder`
- **NOT embedded in HTML** - it's a separate native window
- Reused for browsing (single native window reused across tabs/actions)
- Loads external URLs and handles Back / Forward / Refresh
- Emits events to the main window (loading state, URL changes, title changes)
- Main UI tabs remain in the current window and control this browser window

### Important: No Embedded Webview
The `#webview-host` element in the main window HTML is **NOT a webview container**. It's only a status indicator that displays a message when the native browser window is active. The actual web content is displayed in the separate native browser window.

## Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Window (UI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Toolbar    │  │    Tabs      │  │  AI Workspace    │  │
│  │              │  │              │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          │ Tauri Commands   │                    │
          │ invoke()         │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     Tauri Backend (Rust)                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  WebviewWindowBuilder creates browser window        │    │
│  │  Commands:                                         │    │
│  │  - navigate_browser_webview()                      │    │
│  │  - browser_go_back()                                │    │
│  │  - browser_go_forward()                             │    │
│  │  - browser_reload()                                 │    │
│  │  - hide_browser_webview()                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          │ Events (browser-loading, browser-url-changed, etc.)
          ▼
┌─────────────────────────────────────────────────────────────┐
│               Browser Window (Native Webview)                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Displays actual web content                       │    │
│  │  Handles navigation, page loads, etc.              │    │
│  │  Events:                                           │    │
│  │  - on_page_load (loading state, URL)               │    │
│  │  - on_document_title_changed (title)               │    │
│  │  - on_new_window (interception)                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Feature Modules

- **AI Workspace**: Summaries, research mode, bookmarks, notes
- **Tab Management**: Multi-tab interface with state tracking
- **Navigation**: Back, Forward, Refresh, URL input
- **Search Integration**: URL parsing and search engine integration

## Key Implementation Details

### Webview Creation
The browser webview is created programmatically in Rust using `WebviewWindowBuilder`. It's initialized as hidden and shown when needed.

### Event-Based Communication
The architecture uses a pub/sub pattern:
- Main window invokes commands (e.g., `navigate_browser_webview`)
- Browser window emits events (e.g., `browser-loading`, `browser-url-changed`)
- Main window listens to events and updates UI accordingly

### State Management
- Tab state (title, URL) is maintained in JavaScript
- Browser webview is shared across all tabs
- Switching tabs reuses the same webview by navigating to different URLs

## Future Enhancements

Potential improvements:
- Multiple webview windows (one per tab)
- Webview pooling for performance
- Session persistence
- Better window state management
