# Apna Browser - Verification Checklist

## Pre-Launch Checklist

Before running the browser, verify these items:

### Files Present
- [ ] `package.json` - Project configuration
- [ ] `main.js` - Electron main process
- [ ] `index.html` - Browser UI
- [ ] `homepage.html` - Custom homepage
- [ ] `renderer.js` - Browser logic
- [ ] `README.md` - Documentation
- [ ] `USER_GUIDE.md` - User guide

### Dependencies
- [ ] Node.js installed (v14+)
- [ ] npm installed
- [ ] Electron installed (`npm install` completed)
- [ ] `node_modules/` directory exists

## Browser Functionality Checklist

After launching the browser, verify these features work:

### Basic Browser Interface
- [ ] Toolbar appears at the top
- [ ] Back button (←) is visible
- [ ] Forward button (→) is visible
- [ ] Refresh button (↻) is visible
- [ ] Home button (🏠) is visible
- [ ] URL bar is visible and editable
- [ ] Go button (→) is visible
- [ ] Notes button (📝) is visible

### Homepage
- [ ] Custom homepage loads automatically
- [ ] Apna Browser logo is visible
- [ ] Search box is visible and functional
- [ ] 8 quick link cards are visible:
  - [ ] Wikipedia
  - [ ] YouTube
  - [ ] Khan Academy
  - [ ] GitHub
  - [ ] Stack Overflow
  - [ ] Coursera
  - [ ] Udemy
  - [ ] Google
- [ ] Hover effects work on cards
- [ ] Clicking cards navigates to sites

### URL Navigation
- [ ] Clicking in URL bar selects all text
- [ ] Typing a URL (e.g., `wikipedia.org`) works
- [ ] Pressing Enter navigates to URL
- [ ] Clicking Go button navigates to URL
- [ ] Search queries work (e.g., "test search")
- [ ] HTTPS is automatically added to URLs
- [ ] Google search works for queries

### Navigation Controls
- [ ] Back button works (after navigating)
- [ ] Forward button works (after going back)
- [ ] Refresh button reloads current page
- [ ] Home button returns to homepage
- [ ] Buttons are disabled when not available

### External Sites
- [ ] Wikipedia loads in WebView
- [ ] GitHub loads in WebView
- [ ] Other quick links work
- [ ] Page loads complete
- [ ] URL bar updates to show current URL

### Notes Panel
- [ ] Clicking 📝 button opens notes panel
- [ ] Panel slides in from right
- [ ] Notes header is visible
- [ ] Text area is editable
- [ ] Save button works
- [ ] Clear button works with confirmation
- [ ] Clicking ✕ closes panel
- [ ] Clicking 📝 again opens panel
- [ ] Notes persist during session
- [ ] Notes auto-save every 30 seconds (check console)

### UI/UX
- [ ] Responsive layout
- [ ] Smooth animations
- [ ] Clean, modern design
- [ ] Good color contrast
- [ ] Intuitive controls
- [ ] No obvious visual bugs

## Testing Scenarios

### Test 1: Basic Navigation
1. Start browser
2. Type `wikipedia.org` in URL bar
3. Press Enter
4. Verify Wikipedia loads
5. Click Back button
6. Verify homepage loads
7. Click Forward button
8. Verify Wikipedia loads again

### Test 2: Search
1. Start at homepage
2. Type "learn programming" in URL bar
3. Press Enter
4. Verify Google search results appear
5. Click on a result
6. Verify site loads

### Test 3: Quick Links
1. Start at homepage
2. Click Khan Academy card
3. Verify Khan Academy loads
4. Click Home button
5. Verify homepage loads
6. Click YouTube card
7. Verify YouTube loads

### Test 4: Notes Feature
1. Start browser
2. Click 📝 button
3. Type test notes: "Test notes for demo"
4. Click Save button
5. Verify success message appears
6. Click ✕ to close panel
7. Navigate to a site (e.g., Wikipedia)
8. Click 📝 button again
9. Verify notes are still there
10. Click Clear button
11. Confirm clear
12. Verify notes are empty

### Test 5: Multiple Pages
1. Navigate to Wikipedia
2. Navigate to GitHub
3. Navigate to YouTube
4. Use Back button to go back through history
5. Use Forward button to go forward
6. Verify navigation works correctly

## Known Limitations

These are expected behaviors, not bugs:
- Some sites may not load due to security restrictions (X-Frame-Options, CSP)
- Notes are stored in localStorage (not cloud sync)
- No bookmark system (yet)
- No history panel (yet)
- DevTools is open by default (can be disabled in main.js)

## Troubleshooting Quick Fixes

### Browser won't start
```bash
rm -rf node_modules
npm install
npm start
```

### Homepage blank
- Check `homepage.html` exists
- Check DevTools console for errors

### Notes not saving
- Check browser console for errors
- Ensure localStorage is enabled

### Sites not loading
- Some sites block embedding by default
- Try different sites (Wikipedia, GitHub usually work)

## Success Criteria

The browser is working correctly if:
- ✅ All files are present
- ✅ Homepage loads with all elements
- ✅ URL bar accepts input and navigates
- ✅ Back/Forward/Refresh/Home buttons work
- ✅ Quick links navigate correctly
- ✅ Notes panel opens, saves, and clears
- ✅ External sites load in WebView
- ✅ UI is responsive and smooth
- ✅ No critical errors in console

## Demo Ready Checklist

Before demonstrating the browser:
- [ ] All core features work
- [ ] Homepage looks good
- [ ] Notes feature works smoothly
- [ ] No console errors
- [ ] Quick links are accessible
- [ ] Ready to navigate to demo sites
- [ ] Notes are cleared or prepared for demo

---

**If all items are checked, your browser is ready for the hackathon!** 🎉
