# Apna Browser - User Guide

## Getting Started

### Installation
1. Make sure you have Node.js installed (version 14 or higher)
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Run `npm start` to launch the browser

### First Launch
When you first start Apna Browser, you'll see:
- A toolbar at the top with navigation buttons
- A URL bar for entering websites
- A beautiful custom homepage with search and quick links

## Features

### 1. Custom Homepage

The homepage includes:
- **Apna Browser Logo**: Clean, modern branding
- **Search Box**: Search the web directly using Google
- **Quick Links**: 8 educational resource cards:
  - 📚 Wikipedia
  - ▶️ YouTube
  - 🎓 Khan Academy
  - 💻 GitHub
  - ❓ Stack Overflow
  - 🏫 Coursera
  - 📖 Udemy
  - 🔍 Google

**How to use:**
- Type a search query in the search box and press Enter
- Click on any quick link card to visit that site
- Hover over cards for visual feedback

### 2. Navigation Controls

**Toolbar Buttons:**
- **← (Back)**: Go back to the previous page
- **→ (Forward)**: Go forward to the next page (if available)
- **↻ (Refresh)**: Reload the current page
- **🏠 (Home)**: Return to the custom homepage
- **→ (Go)**: Navigate to the URL in the address bar
- **📝 (Notes)**: Toggle the notes panel

**URL Bar:**
- Click on the URL bar to select all text
- Type any website URL (e.g., `wikipedia.org`)
- Type search queries (e.g., `how to learn programming`)
- Press Enter or click Go to navigate

**Smart URL Detection:**
- Automatically adds `https://` to website URLs
- Converts search queries to Google searches
- Handles mixed input intelligently

### 3. Notes Panel (Custom Feature)

The notes panel is designed for students to take notes while browsing.

**Opening Notes Panel:**
- Click the 📝 button in the toolbar
- Panel slides in from the right side
- Focus automatically moves to the notes area

**Taking Notes:**
- Type your notes in the text area
- Notes persist as long as the browser is open
- Use the full width of the panel for your notes

**Saving Notes:**
- Click the **Save** button to save notes to browser storage
- Notes are saved to localStorage
- Notes will be available next time you open the browser

**Clearing Notes:**
- Click the **Clear** button to remove all notes
- You'll be asked to confirm before clearing
- Notes are permanently deleted from storage

**Auto-Save:**
- Notes automatically save every 30 seconds
- Check the console for auto-save confirmations
- No need to manually save frequently

**Closing Notes Panel:**
- Click the ✕ button in the panel header
- Click the 📝 button in the toolbar again
- Notes are preserved when panel is closed

## Usage Examples

### Example 1: Research a Topic
1. Type "machine learning basics" in the URL bar
2. Press Enter to search Google
3. Click on Wikipedia result from the homepage
4. Click 📝 to open notes panel
5. Take notes about key concepts
6. Click Save to preserve your notes

### Example 2: Visit Educational Site
1. Start at homepage
2. Click the Khan Academy card
3. Browse courses
4. Use back button to return to homepage
5. Click Coursera card for more courses

### Example 3: Quick Search
1. Click in URL bar
2. Type "JavaScript tutorials"
3. Press Enter
4. Browser navigates to Google search results
5. Click on a result to visit

### Example 4: Direct Navigation
1. Type "github.com" in URL bar
2. Press Enter
3. Browser adds https:// and loads GitHub
4. Use refresh button if needed

## Keyboard Shortcuts

Currently supported:
- **Enter**: Navigate to URL in address bar
- **Ctrl/Cmd + R**: Refresh page (browser default)

## Troubleshooting

### Page Won't Load
- Check your internet connection
- Try a different URL
- Some sites block embedding - try Wikipedia or GitHub

### Notes Not Saving
- Click the Save button manually
- Check browser console for errors
- Ensure localStorage is enabled

### Browser Crashes
- Close and restart the browser
- Check DevTools console for errors
- Ensure Node.js is properly installed

### Homepage Blank
- Check that `homepage.html` exists
- Reload the page
- Check DevTools console for errors

## Tips for Students

1. **Use the Notes Panel**: Take notes while learning without leaving the page
2. **Save Frequently**: Click Save button often to preserve your notes
3. **Use Quick Links**: Access educational resources directly from homepage
4. **Search First**: Use the search box to find information quickly
5. **Bookmark Good Pages**: Note URLs in your notes for later reference

## Best Practices

1. **Always Save Notes**: Before closing the browser, save your notes
2. **Use Descriptive Search Terms**: Get better Google search results
3. **Keep Homepage Open**: Use it as a hub for your research
4. **Check URLs**: Verify you're visiting the correct site
5. **Use Back/Forward**: Navigate efficiently through your history

## Feature Highlights

### What Makes Apna Browser Special?

1. **Student-Focused**: Built specifically for students and learning
2. **Clean Interface**: No clutter, just what you need
3. **Notes Integration**: Take notes without switching windows
4. **Educational Resources**: Quick access to learning platforms
5. **Fast and Lightweight**: Built with Electron for performance
6. **Open Source**: Learn from the code and customize it

### Technology Stack

- **Electron**: Desktop application framework
- **HTML5/CSS3**: Modern web technologies
- **JavaScript**: Vanilla JS for simplicity
- **LocalStorage**: Browser storage for notes

## Support

For issues or questions:
1. Check this user guide first
2. Look at the DevTools console (open by default)
3. Review the README.md file
4. Check the PRD.md for project requirements

---

**Happy Browsing!** 🌐
