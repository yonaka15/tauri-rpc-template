// Server module
mod server;
use server::{JsonRpcServer, LogEntry};
use std::sync::{Arc, Mutex};
use tauri::{State, Manager};

// Notes module
mod notes;
use notes::{Note, NoteStore};

// Server state managed by Tauri
struct ServerState(Arc<Mutex<JsonRpcServer>>);

// Notes state managed by Tauri
struct NotesState(Arc<NoteStore>);

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

// メモ関連のコマンド
#[tauri::command]
fn list_notes(notes_state: State<NotesState>) -> Vec<Note> {
    notes_state.0.list()
}

#[tauri::command]
fn get_note(notes_state: State<NotesState>, id: String) -> Option<Note> {
    notes_state.0.get(&id)
}

#[tauri::command]
fn create_note(notes_state: State<NotesState>, title: String, content: String) -> Result<Note, String> {
    notes_state.0.create(title, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_note(notes_state: State<NotesState>, id: String, title: Option<String>, content: Option<String>) -> Result<Option<Note>, String> {
    notes_state.0.update(&id, title, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_note(notes_state: State<NotesState>, id: String) -> Result<bool, String> {
    notes_state.0.delete(&id).map_err(|e| e.to_string())
}

// Basic Tauri greet command (original example code)
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Tauri application entry point
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let server = JsonRpcServer::new();
    let server_state = ServerState(Arc::new(Mutex::new(server)));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // NoteStoreの初期化
            let note_store = NoteStore::new(&app.handle()).expect("Failed to initialize note store");
            app.manage(NotesState(Arc::new(note_store)));
            
            // サーバーにアプリハンドルを設定
            {
                // 一時的な値を変数に保存して、ライフタイムを延長する
                let server_state = app.try_state::<ServerState>().unwrap();
                let mut server = server_state.0.lock().unwrap();
                server.set_app_handle(app.handle().clone());
            }
            
            Ok(())
        })
        .manage(server_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            start_server,
            stop_server,
            is_server_running,
            get_server_url,
            get_logs,
            clear_logs,
            list_notes,
            get_note,
            create_note,
            update_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}