# Browser Architecture Options

## Current Problem
The implementation creates a separate browser window using `WebviewWindowBuilder`, which opens a new window every time you navigate. This is not the desired behavior.

## Solution: Single-Window Architecture

### How Traditional Browsers Work
Traditional browsers have ONE webview that displays:
1. Browser UI (toolbar, tabs, etc.)
2. Custom homepage
3. External web content

The UI is typically:
- A Chrome DevTools-style overlay
- Or dynamically injected into the page
- Or managed through a sidebar/frame

### Proposed Architecture

```
┌─────────────────────────────────────────┐
│         Main Window (Single Webview)    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Browser UI (Overlay/Injected)   │    │
│  │ - Toolbar                      │    │
│  │ - Tabs                         │    │
│  │ - Navigation buttons            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Content Area                   │    │
│  │ - Custom Homepage OR           │    │
│  │ - External Web Content         │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Implementation Options

#### Option A: Full-Page Navigation (Simplest)
- Main webview displays either homepage OR external content
- Browser UI is shown as an overlay on top
- When navigating to external URL, the entire page navigates
- Homepage is just another URL (can be file:// or local server)

**Pros:**
- Simple to implement
- No separate windows
- Traditional browser behavior

**Cons:**
- UI needs to be managed as overlay
- Homepage can't be shown simultaneously with external content

#### Option B: Frame-Based
- Use HTML `<frame>` or `<iframe>` for content area
- UI stays in main document
- Content loads in frame

**Pros:**
- UI always visible
- Familiar pattern

**Cons:**
- X-Frame-Options blocks many sites
- Limited browser features
- Deprecated technology

#### Option C: Dynamic UI Injection
- Main webview displays content (homepage or external)
- JavaScript injects UI overlay dynamically
- Communication through JavaScript bridge

**Pros:**
- Flexible
- Can maintain UI state across page loads
- Modern approach

**Cons:**
- Complex implementation
- UI needs to be re-injected on each page load

### Recommended Approach: Option A with Improved UX

1. **Use main webview for everything**
   - Homepage is a local file or embedded HTML
   - External content navigates the main webview

2. **Browser UI as overlay**
   - Fixed position overlay at top (toolbar, tabs)
   - Always visible
   - Styled to look like part of the page

3. **Homepage state**
   - When "home", show custom homepage HTML
   - When navigating, show external content
   - Back button returns to homepage

### Implementation Plan

1. Modify `tauri.conf.json`:
   - Remove separate browser window configuration
   - Use single window with full webview

2. Create homepage HTML file
   - Search functionality
   - Quick links
   - Modern design

3. Update JavaScript:
   - Navigate main webview instead of separate window
   - Manage UI overlay visibility
   - Handle navigation state

4. Update Rust backend:
   - Simplify to use main window navigation
   - Remove WebviewWindowBuilder
   - Add commands for main window control

This approach:
- ✅ No separate windows
- ✅ Custom homepage works
- ✅ External sites load in same window
- ✅ Traditional browser feel
- ✅ Simpler architecture
