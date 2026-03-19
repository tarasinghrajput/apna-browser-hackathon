# Quick Start Guide

## Running the Browser

### Development Mode
```bash
cd apna-browser-hackathon
npm run dev
```

This will:
1. Compile the Rust backend
2. Build the frontend
3. Launch the Tauri application in development mode
4. Enable hot reloading for frontend changes

### Production Build
```bash
npm run build
```

This will create a production build in `src-tauri/target/release/bundle/`

## How to Use

### Homepage
When the browser starts, you'll see:
- A custom homepage with the Apna Browser logo
- A search box
- Quick links to popular developer sites

### Navigation

#### Go to a URL
1. Click in the address bar (or press Ctrl+L)
2. Type a URL (e.g., `https://github.com` or just `github.com`)
3. Press Enter or click "Go"

#### Search the web
1. Click in the search box on the homepage
2. Type your search query
3. Press Enter

Or use the address bar:
1. Click in the address bar
2. Type your search query
3. Press Enter (it will automatically search)

#### Quick Links
Click any of the quick links on the homepage:
- GitHub
- MDN Docs
- Stack Overflow
- Web.dev

#### Navigation Controls
- **Home** (🏠 icon) - Return to the custom homepage
- **Back** (← icon) - Go back in history
- **Forward** (→ icon) - Go forward in history
- **Refresh** (↻ icon) - Reload the current page

### Tabs

#### Create a new tab
- Click the + button in the tab strip
- Or press Ctrl+T

#### Switch between tabs
- Click on a tab in the tab strip

#### Close a tab
- Click the X button on the tab

### Keyboard Shortcuts

- `Ctrl+L` - Focus the address bar
- `Ctrl+T` - Open a new tab
- `Enter` - Navigate to URL (when address bar is focused)

## Troubleshooting

### Browser won't start
- Make sure you have Node.js installed
- Run `npm install` to install dependencies
- Make sure Rust is installed (`rustc --version`)

### Pages won't load
- Check your internet connection
- Try a different URL
- Check the browser console for errors (F12)

### Styling issues
- Clear the cache and rebuild: `npm run dev`
- Check the browser console for CSS errors

### Events not firing
- Make sure Tauri is properly initialized
- Check the console for Tauri errors
- Verify the event listeners are attached

## Development

### Frontend Files
- `frontend/index.html` - Homepage structure
- `frontend/style.css` - Browser UI styles
- `frontend/main.js` - Navigation logic

### Backend Files
- `src-tauri/src/main.rs` - Rust backend
- `src-tauri/tauri.conf.json` - Tauri configuration

### Making Changes

#### Frontend changes
1. Edit HTML, CSS, or JavaScript files in `frontend/`
2. Save the file
3. The browser will automatically reload (in dev mode)

#### Backend changes
1. Edit `src-tauri/src/main.rs`
2. Save the file
3. The browser will automatically recompile and restart (in dev mode)

### Testing Changes

After making changes:
1. Test the specific feature you modified
2. Check the browser console for errors (F12)
3. Verify other features still work
4. Test navigation (back, forward, refresh, home)

## Architecture Overview

The browser uses a **single-window architecture**:
- Browser UI is a fixed overlay at the top
- Content area below shows either:
  - Custom homepage (when "home")
  - External web content (when navigating)
- Main webview handles everything
- No separate browser windows

See `NEW_ARCHITECTURE.md` for detailed architecture documentation.

## Features

### Current Features
- ✅ Custom homepage
- ✅ URL navigation
- ✅ Web search
- ✅ Back/Forward navigation
- ✅ Refresh
- ✅ Home button
- ✅ Quick links
- ✅ Basic tab management
- ✅ Keyboard shortcuts

### Future Features (Coming Soon)
- 📋 Bookmarks
- 📜 History
- ⬇️ Downloads
- 🔧 Settings
- 🤖 AI Workspace (summaries, research, notes)
- 🎨 Themes
- 🔒 Privacy mode

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review `NEW_ARCHITECTURE.md` for architecture details
3. Review `MIGRATION_SUMMARY.md` for recent changes
4. Check the browser console for errors (F12)
5. Check the terminal for Rust errors

## Tips

### Productivity Tips
1. Use keyboard shortcuts for faster navigation
2. Pin frequently used sites as quick links
3. Use Ctrl+L to quickly focus the address bar
4. Use tabs to keep multiple sites open

### Development Tips
1. Use the browser console (F12) for debugging
2. Check the terminal for backend errors
3. Test changes thoroughly before committing
4. Keep the code simple and maintainable

## Security Notes

- The browser uses your system's webview engine (WebKit on macOS, Chromium on Windows/Linux)
- External sites are loaded with normal web security (CORS, CSP, etc.)
- No additional security restrictions are applied by default
- Always be cautious when visiting unknown websites

## Performance

The browser is optimized for:
- Fast startup
- Quick navigation
- Low memory usage
- Smooth scrolling
- Responsive UI

If you notice performance issues:
1. Check if other applications are using resources
2. Try reducing the number of open tabs
3. Clear browser cache and restart
4. Check for extensions that might slow down the browser

## Compatibility

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+ (Catalina and later)
- ✅ Linux (most distributions)

### Browsers
This IS the browser - it uses the system webview:
- macOS: WebKit (same as Safari)
- Windows: WebView2 (Chromium-based)
- Linux: WebKitGTK or similar

## License

This project is open source. See LICENSE file for details.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Enjoy browsing with Apna Browser!** 🚀
