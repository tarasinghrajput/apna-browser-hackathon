# AI Agent Instructions

You are helping build Apna Browser.

Guidelines:

1. Follow the PRD strictly.

2. The browser must support:
   - URL navigation
   - Back / forward
   - Refresh
   - Webview rendering

3. Implementation must be incremental.

Development order:

Step 1
Create the browser window using WebviewWindowBuilder.

Step 2
Implement the browser UI in the main window.

Step 3
Create the native webview window (NOT embedded in HTML).

Step 4
Implement navigation commands and event communication.

Step 5
Add a custom feature.

Do not skip steps.

Important: Tauri does NOT support embedding a webview inside HTML containers. The webview must be a separate native window created with WebviewWindowBuilder.