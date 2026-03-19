# Apna Browser - Single Window Architecture

## Overview

Apna Browser now uses a **single-window architecture** where the browser UI and content display in the same window using a main webview. This is how traditional browsers work.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Window                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Browser UI Overlay (Fixed Position)                │  │
│  │ - Tab Strip                                       │  │
│  │ - Toolbar (Home, Back, Forward, Refresh, URL)     │  │
│  │ ─────────────────────────────────────────────────── │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Content Area (Main Webview)                       │  │
│  │ - Custom Homepage OR                              │  │
│  │ - External Web Content                            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### Browser UI Overlay
- **Position**: Fixed at the top of the window
- **Purpose**: Controls for navigation and tab management
- **Visibility**: Always visible, doesn't scroll with content
- **Z-Index**: High (1000) to stay above content

### Content Area
- **Position**: Below the UI overlay
- **Purpose**: Displays either:
  - Custom homepage (when "home")
  - External web content (when navigating)
- **Implementation**: Main webview content

## How It Works

### Homepage State
1. Browser loads `index.html` (custom homepage)
2. UI overlay is visible at the top
3. Content area shows the homepage HTML with search and quick links
4. Navigation buttons (Back, Forward, Refresh) are disabled

### Navigation State
1. User enters URL in address bar or clicks a link
2. JavaScript calls `navigate_browser` Tauri command
3. Rust backend navigates the main webview to the URL
4. Homepage content is hidden
5. Navigation buttons become enabled
6. External web content loads in the main webview

### Home State
1. User clicks the Home button
2. JavaScript calls `go_home` Tauri command
3. Rust backend navigates to `index.html`
4. Homepage content becomes visible again
5. Navigation buttons are disabled

## Tauri Commands

### `navigate_browser(url: String)`
Navigates the main window to the specified URL.

**Rust Implementation:**
```rust
#[tauri::command]
async fn navigate_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let normalized_url = normalize_url_input(&url)?;
  let window = get_main_window(&app)?;
  window.navigate(normalized_url).map_err(|error| error.to_string())?;
  Ok(())
}
```

### `go_home()`
Navigates back to the custom homepage (`index.html`).

**Rust Implementation:**
```rust
#[tauri::command]
async fn go_home(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.navigate(WebviewUrl::App("index.html".into())).map_err(|error| error.to_string())?;
  Ok(())
}
```

### `browser_go_back()`
Goes back in browser history.

**Rust Implementation:**
```rust
#[tauri::command]
async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.eval("window.history.back();").map_err(|error| error.to_string())
}
```

### `browser_go_forward()`
Goes forward in browser history.

**Rust Implementation:**
```rust
#[tauri::command]
async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.eval("window.history.forward();").map_err(|error| error.to_string())
}
```

### `browser_reload()`
Reloads the current page.

**Rust Implementation:**
```rust
#[tauri::command]
async fn browser_reload(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.reload().map_err(|error| error.to_string())
}
```

## Events

### `browser-loading`
Emitted when page loading state changes.

**Payload:** `boolean` - `true` if loading, `false` if loaded

### `browser-url-changed`
Emitted when the URL changes.

**Payload:** `string` - The new URL

### `browser-title-changed`
Emitted when the document title changes.

**Payload:** `string` - The new title

## File Structure

```
apna-browser-hackathon/
├── frontend/
│   ├── index.html      # Custom homepage
│   ├── style.css       # UI overlay styles
│   └── main.js        # Navigation logic
├── src-tauri/
│   ├── src/
│   │   └── main.rs    # Rust backend
│   └── tauri.conf.json # Configuration
└── ARCHITECTURE.md    # This file
```

## Benefits of This Architecture

### ✅ Advantages
1. **No Separate Windows** - Everything in one window
2. **Traditional Browser Feel** - Works like Chrome/Firefox
3. **Simple Navigation** - Direct URL navigation in main webview
4. **Custom Homepage** - Easy to modify and extend
5. **Responsive UI** - Overlay stays visible during navigation
6. **Clean Architecture** - Less complex than multi-window approach

### ⚠️ Considerations
1. **UI Overlay** - Browser UI must be positioned as fixed overlay
2. **Z-Index Management** - UI must stay above content
3. **Content Visibility** - Homepage content hidden when navigating to external sites
4. **State Management** - JavaScript tracks current state (home vs. browsing)

## Testing the Browser

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testing Checklist
- [ ] Homepage loads correctly
- [ ] URL navigation works
- [ ] Back/Forward buttons work
- [ ] Refresh button works
- [ ] Home button returns to homepage
- [ ] Quick links navigate correctly
- [ ] Search functionality works
- [ ] Tab switching works (basic)
- [ ] Events fire correctly
- [ ] UI overlay stays visible during navigation

## Future Enhancements

1. **Full Tab Management** - Each tab maintains its own navigation history
2. **Bookmarks** - Save and manage bookmarks
3. **History** - Browse history with time and date
4. **Downloads** - Download manager
5. **Extensions** - Extension support
6. **DevTools** - Built-in developer tools
7. **Settings** - Browser settings customization
8. **Themes** - Dark/light mode and custom themes
9. **Privacy Mode** - Incognito/private browsing
10. **AI Features** - Summarization, research mode, notes

## Comparison: Old vs New Architecture

### Old Architecture (Multi-Window)
```
┌─────────────────────┐    ┌─────────────────────┐
│   Main Window       │    │   Browser Window    │
│   - Toolbar        │◄──►│   - Web Content    │
│   - Tabs           │    │   (Separate)       │
│   - AI Workspace   │    └─────────────────────┘
└─────────────────────┘
```
- ❌ Separate windows
- ❌ Complex window management
- ❌ Not traditional browser feel

### New Architecture (Single Window)
```
┌─────────────────────────────────────────┐
│         Main Window                    │
│  ┌─────────────────────────────────┐  │
│  │ Browser UI Overlay (Fixed)     │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │ Content (Homepage or Web)      │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```
- ✅ Single window
- ✅ Simple architecture
- ✅ Traditional browser feel
- ✅ Easy to understand and maintain

## Conclusion

The new single-window architecture provides a cleaner, more traditional browser experience. The browser UI is implemented as a fixed overlay, and the main webview handles both the custom homepage and external web content. This approach is simpler to implement, easier to understand, and provides a more familiar user experience.
