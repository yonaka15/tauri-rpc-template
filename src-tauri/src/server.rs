use jsonrpc_core::{IoHandler, Params, Value, Error};
use jsonrpc_http_server::{Server, ServerBuilder, RequestMiddleware, RequestMiddlewareAction, hyper};
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::VecDeque;

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
        // （後述するようにこれはhyperの設計上の制限）
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
}

impl JsonRpcServer {
    pub fn new() -> Self {
        Self {
            server: None,
            running: false,
            logger: Arc::new(Logger::new()),
        }
    }

    pub fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.running {
            return Err("Server is already running".into());
        }

        let mut io = IoHandler::default();
        
        // Echo method - リクエストの内容をログに記録するための拡張
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
                
                let params_array = match params {
                    Params::Array(array) => array,
                    _ => return Err(Error::invalid_params("Expected array params")),
                };
                
                let message = match params_array.get(0) {
                    Some(Value::String(s)) => s.clone(),
                    _ => return Err(Error::invalid_params("Expected string parameter")),
                };
                
                Ok(Value::String(message))
            }
        });

        // System info method
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
