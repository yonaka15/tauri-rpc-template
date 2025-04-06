use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Manager, AppHandle, Emitter}; // Emitter トレイトを追加
use uuid::Uuid;

// メモのデータ構造
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: u64,
    pub updated_at: u64,
}

// メモの保管庫
#[derive(Debug)]
pub struct NoteStore {
    notes: Mutex<HashMap<String, Note>>,
    file_path: PathBuf,
    app_handle: AppHandle, // AppHandleを保持
}

// イベント名の定数
const EVENT_NOTES_CHANGED: &str = "notes-changed";

impl NoteStore {
    // 新しいメモ保管庫を作成
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        // アプリのデータディレクトリを取得
        // Tauri 2.0では Manager トレイトを通じてパス関連のAPIにアクセスする
        // app_data_dir()はResult<PathBuf, Error>を返すので、ok_or()は必要ない
        let app_data_dir = app_handle.path().app_data_dir()?;
        
        // データディレクトリが存在しない場合は作成
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)?;
        }
        
        // メモを保存するJSONファイルのパス
        let file_path = app_data_dir.join("notes.json");
        
        // ファイルが存在する場合は読み込み、存在しない場合は空のハッシュマップを作成
        let notes = if file_path.exists() {
            let file_content = fs::read_to_string(&file_path)?;
            let notes_vec: Vec<Note> = serde_json::from_str(&file_content).unwrap_or_default();
            notes_vec.into_iter().map(|note| (note.id.clone(), note)).collect()
        } else {
            HashMap::new()
        };
        
        Ok(Self {
            notes: Mutex::new(notes),
            file_path,
            app_handle: app_handle.clone(),
        })
    }
    
    // メモ全件取得
    pub fn list(&self) -> Vec<Note> {
        let notes = self.notes.lock().unwrap();
        notes.values().cloned().collect()
    }
    
    // 特定のメモを取得
    pub fn get(&self, id: &str) -> Option<Note> {
        let notes = self.notes.lock().unwrap();
        notes.get(id).cloned()
    }
    
    // 新規メモ作成
    pub fn create(&self, title: String, content: String) -> Result<Note, Box<dyn std::error::Error>> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let note = Note {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            created_at: now,
            updated_at: now,
        };
        
        {
            let mut notes = self.notes.lock().unwrap();
            notes.insert(note.id.clone(), note.clone());
        }
        
        self.save_to_file()?;
        
        // メモ変更イベントを発行
        self.emit_notes_changed_event();
        
        Ok(note)
    }
    
    // メモ更新
    pub fn update(&self, id: &str, title: Option<String>, content: Option<String>) -> Result<Option<Note>, Box<dyn std::error::Error>> {
        let mut updated_note = None;
        
        {
            let mut notes = self.notes.lock().unwrap();
            
            if let Some(note) = notes.get_mut(id) {
                if let Some(title) = title {
                    note.title = title;
                }
                
                if let Some(content) = content {
                    note.content = content;
                }
                
                note.updated_at = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
                
                updated_note = Some(note.clone());
            }
        }
        
        if updated_note.is_some() {
            self.save_to_file()?;
            
            // メモ変更イベントを発行
            self.emit_notes_changed_event();
        }
        
        Ok(updated_note)
    }
    
    // メモ削除
    pub fn delete(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let removed = {
            let mut notes = self.notes.lock().unwrap();
            notes.remove(id).is_some()
        };
        
        if removed {
            self.save_to_file()?;
            
            // メモ変更イベントを発行
            self.emit_notes_changed_event();
        }
        
        Ok(removed)
    }
    
    // ファイルに保存
    fn save_to_file(&self) -> Result<(), Box<dyn std::error::Error>> {
        let notes = self.notes.lock().unwrap();
        let notes_vec: Vec<Note> = notes.values().cloned().collect();
        let json = serde_json::to_string_pretty(&notes_vec)?;
        fs::write(&self.file_path, json)?;
        Ok(())
    }
    
    // メモ変更イベントを発行する関数
    fn emit_notes_changed_event(&self) {
        // Tauri 2.0では emit_all が emit に変更されています
        if let Err(e) = self.app_handle.emit(EVENT_NOTES_CHANGED, ()) {
            eprintln!("Failed to emit notes-changed event: {}", e);
        }
    }
}