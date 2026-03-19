#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri::webview::{NewWindowResponse, PageLoadEvent};

const BROWSER_WINDOW_LABEL: &str = "browser-webview-window";
const BROWSER_START_URL: &str = "https://www.google.com/";
const SEARCH_ENGINE_BASE_URL: &str = "https://www.google.com/search";

fn parse_url(url: &str) -> Result<Url, String> {
  Url::parse(url).map_err(|error| format!("Invalid URL: {error}"))
}

fn build_search_url(query: &str) -> Result<Url, String> {
  let mut search_url = Url::parse(SEARCH_ENGINE_BASE_URL).map_err(|error| error.to_string())?;
  search_url.query_pairs_mut().append_pair("q", query);
  Ok(search_url)
}

fn looks_like_domain(value: &str) -> bool {
  let has_dot = value.contains('.');
  if !has_dot {
    return false;
  }

  value.chars().all(|ch| {
    ch.is_ascii_alphanumeric()
      || matches!(ch, '-' | '.' | ':' | '/' | '?' | '#' | '&' | '=' | '%' | '_')
  })
}

fn normalize_url_input(raw_input: &str) -> Result<Url, String> {
  let value = raw_input.trim();
  if value.is_empty() {
    return parse_url(BROWSER_START_URL);
  }

  if let Ok(parsed) = Url::parse(value) {
    if parsed.scheme() == "http" || parsed.scheme() == "https" {
      return Ok(parsed);
    }
  }

  if value.contains(' ') {
    return build_search_url(value);
  }

  if looks_like_domain(value) {
    return parse_url(&format!("https://{value}"));
  }

  build_search_url(value)
}

fn get_or_create_browser_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
  if let Some(window) = app.get_webview_window(BROWSER_WINDOW_LABEL) {
    eprintln!("Reusing existing browser window: {}", window.label());
    return Ok(window);
  }

  eprintln!("Creating new browser window");
  let start_url = normalize_url_input(BROWSER_START_URL)?;
  let app_handle = app.clone();
  let app_handle_for_new_window = app.clone();

  WebviewWindowBuilder::new(app, BROWSER_WINDOW_LABEL, WebviewUrl::External(start_url))
    .title("Apna Browser - Web")
    .inner_size(1200.0, 780.0)
    .visible(false)
    .accept_first_mouse(true)
    .on_page_load(move |_window, payload| {
      let is_loading = matches!(payload.event(), PageLoadEvent::Started);
      let _ = app_handle.emit("browser-loading", is_loading);
      let _ = app_handle.emit("browser-url-changed", payload.url().to_string());
    })
    .on_document_title_changed(|window, title| {
      let _ = window.app_handle().emit("browser-title-changed", title);
    })
    .on_new_window(move |url, _features| {
      eprintln!("New window request intercepted for: {}", url);
      if let Some(browser_window) = app_handle_for_new_window.get_webview_window(BROWSER_WINDOW_LABEL) {
        eprintln!("Redirecting to existing browser window");
        let _ = browser_window.navigate(url);
        let _ = browser_window.set_focus();
        if let Ok(false) = browser_window.is_visible() {
          let _ = browser_window.show();
        }
      } else {
        eprintln!("Browser window not found, cannot redirect");
      }
      NewWindowResponse::Deny
    })
    .build()
    .map_err(|error| error.to_string())
}

fn get_browser_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
  app
    .get_webview_window(BROWSER_WINDOW_LABEL)
    .ok_or_else(|| "Browser window is not initialized yet.".to_string())
}

fn eval_browser_script(app: &tauri::AppHandle, script: &'static str) -> Result<(), String> {
  let browser_window = get_browser_window(app)?;
  browser_window
    .eval(script)
    .map_err(|error| error.to_string())
}

#[tauri::command]
async fn navigate_browser_webview(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let normalized_url = normalize_url_input(&url)?;
  eprintln!("Navigating to: {}", normalized_url);
  
  let browser_window = get_or_create_browser_window(&app)?;

  if !browser_window.is_visible().map_err(|e| e.to_string())? {
    eprintln!("Browser window was hidden, showing it");
    browser_window.show().map_err(|error| error.to_string())?;
  }
  
  browser_window.navigate(normalized_url).map_err(|error| error.to_string())?;
  browser_window.set_focus().map_err(|error| error.to_string())?;

  Ok(())
}

#[tauri::command]
async fn hide_browser_webview(app: tauri::AppHandle) -> Result<(), String> {
  if let Some(window) = app.get_webview_window(BROWSER_WINDOW_LABEL) {
    window.hide().map_err(|error| error.to_string())?;
  }
  Ok(())
}

#[tauri::command]
async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
  eval_browser_script(&app, "window.history.back();")
}

#[tauri::command]
async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
  eval_browser_script(&app, "window.history.forward();")
}

#[tauri::command]
async fn browser_reload(app: tauri::AppHandle) -> Result<(), String> {
  let browser_window = get_browser_window(&app)?;
  browser_window.reload().map_err(|error| error.to_string())
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      get_or_create_browser_window(&app.handle()).map_err(|error| {
        let io_error = std::io::Error::other(error);
        Box::new(io_error) as Box<dyn std::error::Error>
      })?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      navigate_browser_webview,
      hide_browser_webview,
      browser_go_back,
      browser_go_forward,
      browser_reload
    ])
    .run(tauri::generate_context!())
    .expect("error while running Apna Browser");
}
