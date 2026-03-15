#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

const BROWSER_WEBVIEW_LABEL: &str = "browser-webview";
const BROWSER_START_URL: &str = "about:blank";

fn create_browser_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
  let initial_url = Url::parse(BROWSER_START_URL)
    .map_err(|error| format!("Invalid browser start URL: {error}"))?;

  WebviewWindowBuilder::new(app, BROWSER_WEBVIEW_LABEL, WebviewUrl::External(initial_url))
    .title("Apna Browser - Web")
    .inner_size(1200.0, 780.0)
    .visible(false)
    .build()
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn navigate_browser_webview(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let parsed_url = Url::parse(&url).map_err(|error| format!("Invalid URL: {error}"))?;

  let browser_window = app
    .get_webview_window(BROWSER_WEBVIEW_LABEL)
    .map(Ok)
    .unwrap_or_else(|| create_browser_window(&app))?;

  browser_window
    .navigate(parsed_url)
    .map_err(|error| error.to_string())?;
  browser_window.show().map_err(|error| error.to_string())?;
  browser_window
    .set_focus()
    .map_err(|error| error.to_string())?;

  Ok(())
}

#[tauri::command]
async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
  let browser_window = app
    .get_webview_window(BROWSER_WEBVIEW_LABEL)
    .ok_or_else(|| "Browser window is not initialized yet.".to_string())?;

  browser_window
    .eval("window.history.back();")
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
  let browser_window = app
    .get_webview_window(BROWSER_WEBVIEW_LABEL)
    .ok_or_else(|| "Browser window is not initialized yet.".to_string())?;

  browser_window
    .eval("window.history.forward();")
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_reload(app: tauri::AppHandle) -> Result<(), String> {
  let browser_window = app
    .get_webview_window(BROWSER_WEBVIEW_LABEL)
    .ok_or_else(|| "Browser window is not initialized yet.".to_string())?;

  browser_window.reload().map_err(|error| error.to_string())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      navigate_browser_webview,
      browser_go_back,
      browser_go_forward,
      browser_reload
    ])
    .run(tauri::generate_context!())
    .expect("error while running Apna Browser");
}
