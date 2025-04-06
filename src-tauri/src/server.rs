use jsonrpc_core::{IoHandler, Params, Value, Error};
use jsonrpc_http_server::{Server, ServerBuilder, RequestMiddleware, RequestMiddlewareAction, hyper};
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::VecDeque;
use tauri::{AppHandle, Manager};

// Notes型を使用しているが直接インポートせずにcrate::notes通してアクセス
// use crate::notes::{Note, NoteStore};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
    app_name: String,
    version: String,
    os: String,
    arch: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LogEntry {
    timestamp: u64,
    method: String,
    uri: String,
    headers: String,
    body: Option<String>,
    response: Option<String>,
}

// RPC用パラメータ構造体の定義
#[derive(Deserialize)]
struct EchoParams {
    message: String,
}

#[derive(Deserialize)]
struct NoteIdParams {
    id: String,
}

#[derive(Deserialize)]
struct CreateNoteParams {
    title: String,
    content: String,
}

#[derive(Deserialize)]
struct UpdateNoteParams {
    id: String,
    title: Option<String>,
    content: Option<String>,
}

// ログ記録用の構造体
struct Logger {
    logs: Mutex<VecDeque<LogEntry>>,
}

impl Logger {
    fn new() -> Self {
        Self {
            logs: Mutex::new(VecDeque::new()),
        }
    }

    fn log_request(&self, method: String, uri: String, headers: String, body: Option<String>) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let log_entry = LogEntry {
            timestamp,
            method,
            uri,
            headers,
            body,
            response: None,
        };
        
        let mut logs = self.logs.lock().unwrap();
        logs.push_back(log_entry);
        
        while logs.len() > 50 {
            logs.pop_front();
        }
    }

    fn log_response(&self, response_str: String) {
        let mut logs = self.logs.lock().unwrap();
        if let Some(last_entry) = logs.back_mut() {
            last_entry.response = Some(response_str);
        }
    }

    fn get_logs(&self) -> Vec<LogEntry> {
        let logs = self.logs.lock().unwrap();
        logs.iter().cloned().collect()
    }

    fn clear_logs(&self) {
        let mut logs = self.logs.lock().unwrap();
        logs.clear();
    }
}

// ロギングミドルウェアの実装
struct LoggingMiddleware {
    logger: Arc<Logger>,
}

// RequestMiddlewareトレイトの実装
impl RequestMiddleware for LoggingMiddleware {
    fn on_request(&self, request: hyper::Request<hyper::Body>) -> RequestMiddlewareAction {
        // リクエストの主要部分を取得
        let method = request.method().to_string();
        let uri = request.uri().to_string();
        
        // ヘッダーを文字列化
        let headers = {
            let mut header_str = String::new();
            for (key, value) in request.headers() {
                header_str.push_str(&format!("{}: {:?}, ", key, value));
            }
            header_str
        };
        
        // Bodyはこのミドルウェアでは取得できないため、Noneを設定
        self.logger.log_request(method, uri, headers, None);
        
        // 通常の処理を続行
        RequestMiddlewareAction::Proceed { 
            should_continue_on_invalid_cors: false,
            request 
        }
    }
}

pub struct JsonRpcServer {
    server: Option<Server>,
    running: bool,
    logger: Arc<Logger>,
    app_handle: Option<AppHandle>,
}

impl JsonRpcServer {
    pub fn new() -> Self {
        Self {
            server: None,
            running: false,
            logger: Arc::new(Logger::new()),
            app_handle: None,
        }
    }

    pub fn set_app_handle(&mut self, app_handle: AppHandle) {
        self.app_handle = Some(app_handle);
    }

    pub fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.running {
            return Err("Server is already running".into());
        }

        let app_handle = match &self.app_handle {
            Some(handle) => handle.clone(),
            None => return Err("App handle is not set".into()),
        };

        let mut io = IoHandler::default();
        
        // Echo method - オブジェクトパラメータに対応
        let logger_clone = self.logger.clone();
        io.add_method("echo", move |params: Params| {
            let logger = logger_clone.clone();
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    // 直近のログエントリのbodyフィールドを更新
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str.clone());
                    }
                }
                
                // 構造体へのデシリアライズまたは後方互換性のある方法でパラメータを取得
                let message = match params {
                    // 新しいオブジェクト形式
                    Params::Map(map) => {
                        match map.get("message") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'message' parameter")),
                        }
                    },
                    // 後方互換性のための配列形式サポート
                    Params::Array(array) => {
                        match array.get(0) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter")),
                        }
                    },
                    _ => return Err(Error::invalid_params("Expected object or array params")),
                };
                
                Ok(Value::String(message))
            }
        });

        // System info method - パラメータはないのでそのまま
        let logger_clone = self.logger.clone();
        io.add_method("system_info", move |params: Params| {
            let logger = logger_clone.clone();
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    // 直近のログエントリのbodyフィールドを更新
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str.clone());
                    }
                }
                
                let system_info = SystemInfo {
                    app_name: env!("CARGO_PKG_NAME").to_string(),
                    version: env!("CARGO_PKG_VERSION").to_string(),
                    os: env::consts::OS.to_string(),
                    arch: env::consts::ARCH.to_string(),
                };
                
                Ok(serde_json::to_value(system_info).unwrap())
            }
        });

        // notes_list: すべてのメモをリスト表示 - パラメータはないのでそのまま
        let app_handle_clone = app_handle.clone();
        let logger_clone = self.logger.clone();
        io.add_method("notes_list", move |params: Params| {
            let logger = logger_clone.clone();
            let app_handle = app_handle_clone.clone();
            
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str);
                    }
                }
                
                // NoteStoreを取得
                let note_store = match app_handle.try_state::<crate::NotesState>() {
                    Some(state) => state.0.clone(),
                    None => return Err(Error::internal_error()),
                };
                
                // すべてのメモを取得
                let notes = note_store.list();
                
                // メモリストをJSONに変換して返す
                match serde_json::to_value(notes) {
                    Ok(value) => Ok(value),
                    Err(_) => Err(Error::internal_error()),
                }
            }
        });

        // notes_get: 指定されたIDのメモを取得 - オブジェクトパラメータに対応
        let app_handle_clone = app_handle.clone();
        let logger_clone = self.logger.clone();
        io.add_method("notes_get", move |params: Params| {
            let logger = logger_clone.clone();
            let app_handle = app_handle_clone.clone();
            
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str);
                    }
                }
                
                // パラメータからIDを取得
                let id = match params {
                    // 新しいオブジェクト形式
                    Params::Map(map) => {
                        match map.get("id") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'id' parameter")),
                        }
                    },
                    // 後方互換性のための配列形式サポート
                    Params::Array(array) => {
                        match array.get(0) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter for note ID")),
                        }
                    },
                    _ => return Err(Error::invalid_params("Expected object or array params")),
                };
                
                // NoteStoreを取得
                let note_store = match app_handle.try_state::<crate::NotesState>() {
                    Some(state) => state.0.clone(),
                    None => return Err(Error::internal_error()),
                };
                
                // メモを取得
                match note_store.get(&id) {
                    Some(note) => match serde_json::to_value(note) {
                        Ok(value) => Ok(value),
                        Err(_) => Err(Error::internal_error()),
                    },
                    None => Ok(Value::Null),
                }
            }
        });

        // notes_create: 新しいメモを作成 - オブジェクトパラメータに対応
        let app_handle_clone = app_handle.clone();
        let logger_clone = self.logger.clone();
        io.add_method("notes_create", move |params: Params| {
            let logger = logger_clone.clone();
            let app_handle = app_handle_clone.clone();
            
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str);
                    }
                }
                
                // パラメータからタイトルと内容を取得
                let (title, content) = match params {
                    // 新しいオブジェクト形式
                    Params::Map(map) => {
                        let title = match map.get("title") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'title' parameter")),
                        };
                        
                        let content = match map.get("content") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'content' parameter")),
                        };
                        
                        (title, content)
                    },
                    // 後方互換性のための配列形式サポート
                    Params::Array(array) => {
                        if array.len() < 2 {
                            return Err(Error::invalid_params("Expected title and content parameters"));
                        }
                        
                        let title = match array.get(0) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter for title")),
                        };
                        
                        let content = match array.get(1) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter for content")),
                        };
                        
                        (title, content)
                    },
                    _ => return Err(Error::invalid_params("Expected object or array params")),
                };
                
                // NoteStoreを取得
                let note_store = match app_handle.try_state::<crate::NotesState>() {
                    Some(state) => state.0.clone(),
                    None => return Err(Error::internal_error()),
                };
                
                // メモを作成
                match note_store.create(title, content) {
                    Ok(note) => match serde_json::to_value(note) {
                        Ok(value) => Ok(value),
                        Err(_) => Err(Error::internal_error()),
                    },
                    Err(_) => Err(Error::internal_error()),
                }
            }
        });

        // notes_update: メモを更新 - オブジェクトパラメータに対応
        let app_handle_clone = app_handle.clone();
        let logger_clone = self.logger.clone();
        io.add_method("notes_update", move |params: Params| {
            let logger = logger_clone.clone();
            let app_handle = app_handle_clone.clone();
            
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str);
                    }
                }
                
                // パラメータからID、タイトル、内容を取得
                let (id, title, content) = match params {
                    // 新しいオブジェクト形式
                    Params::Map(map) => {
                        let id = match map.get("id") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'id' parameter")),
                        };
                        
                        let title = match map.get("title") {
                            Some(Value::String(s)) => Some(s.clone()),
                            Some(Value::Null) => None,
                            None => None,
                            _ => return Err(Error::invalid_params("Invalid 'title' parameter")),
                        };
                        
                        let content = match map.get("content") {
                            Some(Value::String(s)) => Some(s.clone()),
                            Some(Value::Null) => None,
                            None => None,
                            _ => return Err(Error::invalid_params("Invalid 'content' parameter")),
                        };
                        
                        (id, title, content)
                    },
                    // 後方互換性のための配列形式サポート
                    Params::Array(array) => {
                        if array.len() < 3 {
                            return Err(Error::invalid_params("Expected id, title and content parameters"));
                        }
                        
                        let id = match array.get(0) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter for note ID")),
                        };
                        
                        let title = match array.get(1) {
                            Some(Value::String(s)) => Some(s.clone()),
                            Some(Value::Null) => None,
                            _ => return Err(Error::invalid_params("Expected string or null for title")),
                        };
                        
                        let content = match array.get(2) {
                            Some(Value::String(s)) => Some(s.clone()),
                            Some(Value::Null) => None,
                            _ => return Err(Error::invalid_params("Expected string or null for content")),
                        };
                        
                        (id, title, content)
                    },
                    _ => return Err(Error::invalid_params("Expected object or array params")),
                };
                
                // NoteStoreを取得
                let note_store = match app_handle.try_state::<crate::NotesState>() {
                    Some(state) => state.0.clone(),
                    None => return Err(Error::internal_error()),
                };
                
                // メモを更新
                match note_store.update(&id, title, content) {
                    Ok(Some(note)) => match serde_json::to_value(note) {
                        Ok(value) => Ok(value),
                        Err(_) => Err(Error::internal_error()),
                    },
                    Ok(None) => Ok(Value::Null),
                    Err(_) => Err(Error::internal_error()),
                }
            }
        });

        // notes_delete: メモを削除 - オブジェクトパラメータに対応
        let app_handle_clone = app_handle.clone();
        let logger_clone = self.logger.clone();
        io.add_method("notes_delete", move |params: Params| {
            let logger = logger_clone.clone();
            let app_handle = app_handle_clone.clone();
            
            async move {
                // パラメータの文字列表現を取得してログに追加
                if let Ok(params_str) = serde_json::to_string(&params) {
                    let mut logs = logger.logs.lock().unwrap();
                    if let Some(last_entry) = logs.back_mut() {
                        last_entry.body = Some(params_str);
                    }
                }
                
                // パラメータからIDを取得
                let id = match params {
                    // 新しいオブジェクト形式
                    Params::Map(map) => {
                        match map.get("id") {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Missing or invalid 'id' parameter")),
                        }
                    },
                    // 後方互換性のための配列形式サポート
                    Params::Array(array) => {
                        match array.get(0) {
                            Some(Value::String(s)) => s.clone(),
                            _ => return Err(Error::invalid_params("Expected string parameter for note ID")),
                        }
                    },
                    _ => return Err(Error::invalid_params("Expected object or array params")),
                };
                
                // NoteStoreを取得
                let note_store = match app_handle.try_state::<crate::NotesState>() {
                    Some(state) => state.0.clone(),
                    None => return Err(Error::internal_error()),
                };
                
                // メモを削除
                match note_store.delete(&id) {
                    Ok(true) => Ok(Value::Bool(true)),
                    Ok(false) => Ok(Value::Bool(false)),
                    Err(_) => Err(Error::internal_error()),
                }
            }
        });

        // ミドルウェアの準備
        let logger_clone = self.logger.clone();
        let middleware = LoggingMiddleware { 
            logger: logger_clone 
        };

        // Build server with middleware
        let server = ServerBuilder::new(io)
            .threads(1)
            .cors(jsonrpc_http_server::DomainsValidation::AllowOnly(vec![
                "http://localhost:1420".into(), // Development UI
                "tauri://localhost".into(),     // Tauri app
                "http://localhost:3000".into(), // For external testing
            ]))
            .request_middleware(middleware)
            .start_http(&"127.0.0.1:3030".parse()?)
            .map_err(|e| format!("Failed to start JSON-RPC server: {}", e))?;

        self.server = Some(server);
        self.running = true;
        
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if !self.running {
            return Err("Server is not running".into());
        }

        if let Some(server) = self.server.take() {
            server.close();
            self.running = false;
            Ok(())
        } else {
            Err("Server instance not found".into())
        }
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn get_logs(&self) -> Vec<LogEntry> {
        self.logger.get_logs()
    }

    pub fn clear_logs(&self) {
        // Arcの中のLoggerのメソッドを呼び出す（内部でMutexを使用）
        self.logger.clear_logs();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_init() {
        let server = JsonRpcServer::new();
        assert!(!server.is_running());
    }
}