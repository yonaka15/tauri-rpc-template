import React, { useState, useCallback } from 'react';
import { useNotes } from '../../hooks/useNotes';
import NoteList from './NoteList';
import NoteViewer from './NoteViewer';
import NoteEditor from './NoteEditor';
import ConfirmDialog from '../common/ConfirmDialog';

const NotesApp: React.FC = () => {
  const {
    notes,
    selectedNote,
    noteTitle,
    noteContent,
    editMode,
    setNoteTitle,
    setNoteContent,
    selectNote,
    startNewNote,
    startEditNote,
    cancelEdit,
    createNote,
    updateNote,
    deleteNote,
    formatTimestamp
  } = useNotes();

  // 確認ダイアログの状態
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 確認ダイアログを開く関数
  const openConfirmDialog = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  // 確認ダイアログを閉じる関数
  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 削除確認を表示する処理
  const confirmDeleteNote = useCallback((noteId: string) => {
    openConfirmDialog(
      "削除の確認",
      "本当にこのメモを削除しますか？",
      async () => {
        await deleteNote(noteId);
        closeConfirmDialog();
      }
    );
  }, [openConfirmDialog, deleteNote, closeConfirmDialog]);

  return (
    <div className="flex flex-grow overflow-hidden">
      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
      />
      
      {/* メモリスト */}
      <NoteList 
        notes={notes}
        selectedNote={selectedNote}
        selectNote={selectNote}
        startNewNote={startNewNote}
        formatTimestamp={formatTimestamp}
      />

      {/* メモの詳細表示・編集エリア */}
      <div className="flex-grow">
        {editMode ? (
          <NoteEditor
            title={noteTitle}
            content={noteContent}
            isNewNote={!selectedNote}
            onTitleChange={setNoteTitle}
            onContentChange={setNoteContent}
            onSave={selectedNote ? updateNote : createNote}
            onCancel={cancelEdit}
          />
        ) : (
          <NoteViewer
            note={selectedNote}
            onEdit={startEditNote}
            onDelete={confirmDeleteNote}
            onCreateNew={startNewNote}
            formatTimestamp={formatTimestamp}
          />
        )}
      </div>
    </div>
  );
};

export default NotesApp;