#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Url};

const BROWSER_WEBVIEW_LABEL: &str = "browser-webview";

fn get_browser_webview(app: &tauri::AppHandle) -> Result<tauri::Webview, String> {
  app
    .get_webview(BROWSER_WEBVIEW_LABEL)
    .ok_or_else(|| "Browser webview is not initialized yet.".to_string())
}

#[tauri::command]
fn navigate_browser_webview(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let parsed_url = Url::parse(&url).map_err(|error| format!("Invalid URL: {error}"))?;
  let webview = get_browser_webview(&app)?;
  webview.navigate(parsed_url).map_err(|error| error.to_string())
}

#[tauri::command]
fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
  let webview = get_browser_webview(&app)?;
  webview
    .eval("window.history.back();")
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
  let webview = get_browser_webview(&app)?;
  webview
    .eval("window.history.forward();")
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn browser_reload(app: tauri::AppHandle) -> Result<(), String> {
  let webview = get_browser_webview(&app)?;
  webview.reload().map_err(|error| error.to_string())
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
