# Apna Browser

A lightweight student browser built with Electron for the Apna Browser Hackathon.

## Features

- **Clean UI**: Modern, student-friendly interface
- **Web Navigation**: URL bar, back/forward buttons, refresh functionality
- **Custom Homepage**: Student-friendly start page with search and quick links
- **Notes Panel**: Take notes while browsing without leaving the page
- **True Browser**: Uses actual WebView for external websites

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation & Running

```bash
# Install dependencies (only need to do this once)
npm install

# Run the browser
npm start
```

## Browser Controls

### Toolbar Buttons
- **← Back**: Navigate back in history
- **→ Forward**: Navigate forward in history
- **↻ Refresh**: Reload current page
- **🏠 Home**: Return to custom homepage
- **→ Go**: Navigate to URL or search
- **📝 Notes**: Open/close notes panel

### Using the URL Bar
1. Type a URL (e.g., `wikipedia.org`) or search query (e.g., `learn programming`)
2. Press Enter or click the Go button
3. The browser will automatically add `https://` to URLs or search Google for queries

### Custom Homepage
The browser opens to a beautiful custom homepage featuring:
- Search box (Google search)
- 8 quick links to educational resources:
  - Wikipedia
  - YouTube
  - Khan Academy
  - GitHub
  - Stack Overflow
  - Coursera
  - Udemy
  - Google

### Notes Panel
1. Click the **📝 Notes** button in the toolbar
2. Panel slides in from the right side
3. Type your notes while browsing
4. Click **Save** to save notes to browser storage
5. Click **Clear** to clear all notes
6. Notes auto-save every 30 seconds
7. Click **✕** to close the panel

## Project Structure

```
apna-browser-hackathon/
├── index.html        - Main browser UI
├── homepage.html     - Custom start page
├── main.js           - Electron main process
├── renderer.js       - Browser logic and navigation
├── package.json      - Dependencies and scripts
├── README.md         - This file
└── PRD.md           - Original requirements document
```

## Technical Implementation

### How It Works
1. **Homepage**: Uses an iframe to load the custom homepage
2. **External Sites**: Uses Electron's `<webview>` tag to load external websites
3. **Navigation**: Automatically switches between iframe and webview based on URL
4. **Notes**: Saves to browser's localStorage for persistence

### Key Technologies
- **Framework**: Electron 28.0.0
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **WebView**: Electron's built-in webview tag
- **Storage**: localStorage for notes persistence

## Troubleshooting

### Browser won't start
Make sure you've installed dependencies:
```bash
npm install
```

### Homepage doesn't load
Check that `homepage.html` exists in the project directory

### External sites won't load
This is normal for some sites that block embedding. Try:
- Different websites
- Sites that allow embedding (Wikipedia, GitHub, etc.)

### Notes not saving
Make sure you click the Save button. Notes also auto-save every 30 seconds.

## Development

### Open DevTools for debugging
DevTools is open by default. To close it in production, edit `main.js` and comment out this line:
```javascript
// mainWindow.webContents.openDevTools();
```

### System Dependencies (Linux/WSL)
If you see errors about missing shared libraries:
```bash
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2
```

## Hackathon Deliverables

✅ Working browser prototype
✅ Source code on GitHub
✅ Custom homepage with search and quick links
✅ Student-focused feature (Notes Panel)
✅ Uses actual WebView for proper browsing
✅ Built with Electron

## Demo Preparation (2-3 Minutes)

1. **Introduction** (30s): "This is Apna Browser, built with Electron for the hackathon"
2. **Homepage** (45s): Show the custom homepage, demonstrate search and quick links
3. **Basic Navigation** (45s): Navigate to Wikipedia, show back/forward/refresh
4. **Notes Feature** (45s): Open notes panel, take a sample note, save it
5. **Conclusion** (15s): Summarize features and tech stack

## Future Enhancements

Potential features to add:
- Bookmark manager
- Browsing history
- Dark mode toggle
- Multiple tabs
- Password manager
- Download manager
- Extensions support

## License

Educational project for Apna Browser Hackathon
