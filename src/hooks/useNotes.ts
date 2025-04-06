import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Note } from '../types/notes';

// メモ管理のためのカスタムフック
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  
  // 選択中のノートIDを追跡する参照 - これをイベントリスナー内で使用
  const selectedNoteIdRef = useRef<string | null>(null);
  
  // 選択中のノートが変更されたら、参照も更新
  useEffect(() => {
    selectedNoteIdRef.current = selectedNote?.id || null;
  }, [selectedNote]);

  // メモの一覧を取得
  const fetchNotes = useCallback(async () => {
    try {
      const fetchedNotes = await invoke<Note[]>("list_notes");
      setNotes(fetchedNotes || []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  }, []);
  
  // 現在選択中のノートを更新する関数
  const refreshSelectedNote = useCallback(async () => {
    const currentSelectedId = selectedNoteIdRef.current;
    if (!currentSelectedId) return;
    
    try {
      const updatedNote = await invoke<Note | null>("get_note", { id: currentSelectedId });
      if (updatedNote) {
        setSelectedNote(updatedNote);
        // 編集モードでない場合のみタイトルと内容を更新
        if (!editMode) {
          setNoteTitle(updatedNote.title);
          setNoteContent(updatedNote.content);
        }
      }
    } catch (error) {
      console.error("Failed to refresh selected note:", error);
    }
  }, [editMode]); // editMode のみを依存配列に入れる

  // 初期化時にメモを取得し、イベントリスナーを設定
  useEffect(() => {
    fetchNotes();

    // メモ変更イベントのリスナーを設定
    let unlisten: (() => void) | undefined;
    
    async function setupEventListener() {
      try {
        // 'notes-changed' イベントのリスナーを登録
        unlisten = await listen('notes-changed', async () => {
          console.log('Notes changed event received, refreshing notes...');
          await fetchNotes();
          // 選択中のノートがあれば更新
          await refreshSelectedNote();
        });
      } catch (error) {
        console.error('Failed to set up notes-changed event listener:', error);
      }
    }

    setupEventListener();

    // クリーンアップ関数でイベントリスナーを解除
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [fetchNotes, refreshSelectedNote]); // refreshSelectedNote を依存配列に追加

  // メモを選択
  const selectNote = useCallback((note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setEditMode(false);
  }, []);

  // 新規メモ作成モードに切り替え
  const startNewNote = useCallback(() => {
    setSelectedNote(null);
    setNoteTitle("");
    setNoteContent("");
    setEditMode(true);
  }, []);

  // 選択中のメモを編集モードに切り替え
  const startEditNote = useCallback(() => {
    if (selectedNote) {
      setEditMode(true);
    }
  }, [selectedNote]);

  // 編集をキャンセル
  const cancelEdit = useCallback(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content);
    } else {
      setNoteTitle("");
      setNoteContent("");
    }
    setEditMode(false);
  }, [selectedNote]);

  // 新規メモを作成
  const createNote = useCallback(async () => {
    if (!noteTitle.trim()) {
      alert("タイトルを入力してください");
      return;
    }

    try {
      await invoke<Note>("create_note", {
        title: noteTitle,
        content: noteContent,
      });
      
      // メモのリストを更新
      await fetchNotes();
      
      // 入力フィールドをクリア
      setNoteTitle("");
      setNoteContent("");
      setEditMode(false);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }, [noteTitle, noteContent, fetchNotes]);

  // メモを更新
  const updateNote = useCallback(async () => {
    if (!selectedNote) return;
    
    try {
      await invoke<Note>("update_note", {
        id: selectedNote.id,
        title: noteTitle,
        content: noteContent,
      });
      
      // メモのリストとメモの情報を更新
      const updatedNote = await invoke<Note>("get_note", { id: selectedNote.id });
      setSelectedNote(updatedNote);
      
      await fetchNotes();
      setEditMode(false);
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  }, [selectedNote, noteTitle, noteContent, fetchNotes]);

  // メモを削除
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      console.log(`Attempting to delete note with ID: ${noteId}`);
      
      const result = await invoke<boolean>("delete_note", { id: noteId });
      
      console.log(`Delete result: ${result}`);
      
      if (result) {
        console.log("Note deleted successfully, updating list...");
        // メモのリストを更新
        await fetchNotes();
        
        // 削除したメモが選択中だった場合は選択を解除
        if (selectedNote && selectedNote.id === noteId) {
          setSelectedNote(null);
          setNoteTitle("");
          setNoteContent("");
          setEditMode(false);
        }
        return true;
      } else {
        console.warn(`Note with ID ${noteId} was not found or could not be deleted`);
        alert("メモの削除に失敗しました。メモが見つからないか、すでに削除されている可能性があります。");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert(`メモの削除中にエラーが発生しました: ${error}`);
      return false;
    }
  }, [selectedNote, fetchNotes]);

  // タイムスタンプをフォーマットする関数
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  return {
    notes,
    selectedNote,
    noteTitle,
    noteContent,
    editMode,
    setNoteTitle,
    setNoteContent,
    fetchNotes,
    selectNote,
    startNewNote,
    startEditNote,
    cancelEdit,
    createNote,
    updateNote,
    deleteNote,
    formatTimestamp
  };
}
