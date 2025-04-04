// Server module
mod server;
use server::{JsonRpcServer, LogEntry};
use std::sync::{Arc, Mutex};
use tauri::State;

// Server state managed by Tauri
struct ServerState(Arc<Mutex<JsonRpcServer>>);

// Tauri commands
#[tauri::command]
fn start_server(state: State<ServerState>) -> Result<(), String> {
    let mut server = state.0.lock().unwrap();
    server.start().map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_server(state: State<ServerState>) -> Result<(), String> {
    let mut server = state.0.lock().unwrap();
    server.stop().map_err(|e| e.to_string())
}

#[tauri::command]
fn is_server_running(state: State<ServerState>) -> bool {
    let server = state.0.lock().unwrap();
    server.is_running()
}

#[tauri::command]
fn get_server_url() -> String {
    "http://127.0.0.1:3030".to_string()
}

// 新しいコマンド: ログ取得
#[tauri::command]
fn get_logs(state: State<ServerState>) -> Vec<LogEntry> {
    let server = state.0.lock().unwrap();
    server.get_logs()
}

// 新しいコマンド: ログクリア
#[tauri::command]
fn clear_logs(state: State<ServerState>) -> Result<(), String> {
    let server = state.0.lock().unwrap();
    server.clear_logs();
    Ok(())
}

// Basic Tauri greet command (original example code)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Tauri application entry point
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let server_state = ServerState(Arc::new(Mutex::new(JsonRpcServer::new())));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(server_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            start_server,
            stop_server,
            is_server_running,
            get_server_url,
            get_logs,
            clear_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
