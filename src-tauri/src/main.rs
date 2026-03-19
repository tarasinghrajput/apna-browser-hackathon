#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, WebviewWindow};

const BROWSER_START_URL: &str = "https://www.google.com/";
const SEARCH_ENGINE_BASE_URL: &str = "https://www.google.com/search";

fn get_main_window(app: &tauri::AppHandle) -> Result<WebviewWindow, String> {
  app
    .get_webview_window("main")
    .ok_or_else(|| "Main window not found".to_string())
}

#[tauri::command]
async fn navigate_browser(app: tauri::AppHandle, url: String) -> Result<(), String> {
  let value = url.trim();
  
  let window = get_main_window(&app)?;
  
  // Handle navigation using JavaScript
  if value.is_empty() {
    let js = format!("window.location.href = '{}';", BROWSER_START_URL);
    window.eval(&js).map_err(|error| error.to_string())?;
  } else if value.starts_with("http://") || value.starts_with("https://") {
    let js = format!("window.location.href = '{}';", value);
    window.eval(&js).map_err(|error| error.to_string())?;
  } else if value.contains(' ') || !value.contains('.') {
    // Search query
    let encoded = urlencoding::encode(value);
    let search_url = format!("{}?q={}", SEARCH_ENGINE_BASE_URL, encoded);
    let js = format!("window.location.href = '{}';", search_url);
    window.eval(&js).map_err(|error| error.to_string())?;
  } else {
    // Domain name
    let https_url = format!("https://{}", value);
    let js = format!("window.location.href = '{}';", https_url);
    window.eval(&js).map_err(|error| error.to_string())?;
  }
  
  Ok(())
}

#[tauri::command]
async fn go_home(app: tauri::AppHandle) -> Result<(), String> {
  eprintln!("Going to homepage");
  
  let window = get_main_window(&app)?;
  let js = "window.location.href = 'index.html';";
  window.eval(js).map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_go_back(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.eval("window.history.back();").map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_go_forward(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.eval("window.history.forward();").map_err(|error| error.to_string())
}

#[tauri::command]
async fn browser_reload(app: tauri::AppHandle) -> Result<(), String> {
  let window = get_main_window(&app)?;
  window.eval("window.location.reload();").map_err(|error| error.to_string())
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let _window = get_main_window(&app.handle()).map_err(|e| {
        let io_error = std::io::Error::other(e);
        Box::new(io_error) as Box<dyn std::error::Error>
      })?;
      
      // Note: In Tauri v2, we use JavaScript-based event detection
      // The frontend JavaScript will handle URL and title changes
      // by listening to DOM events
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      navigate_browser,
      go_home,
      browser_go_back,
      browser_go_forward,
      browser_reload
    ])
    .run(tauri::generate_context!())
    .expect("error while running Apna Browser");
}
