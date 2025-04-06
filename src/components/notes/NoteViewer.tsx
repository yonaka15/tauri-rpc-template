import React from 'react';
import { Note } from '../../types/notes';

interface NoteViewerProps {
  note: Note | null;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  formatTimestamp: (timestamp: number) => string;
}

const NoteViewer: React.FC<NoteViewerProps> = ({
  note,
  onEdit,
  onDelete,
  onCreateNew,
  formatTimestamp
}) => {
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <p>メモが選択されていません</p>
        <button 
          onClick={onCreateNew}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新規メモ作成
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold">{note.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            削除
          </button>
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto whitespace-pre-wrap">
        {note.content || <span className="text-gray-400">（内容はありません）</span>}
      </div>
      <div className="p-4 text-xs text-gray-500 border-t">
        作成: {formatTimestamp(note.created_at)}
        {note.updated_at > note.created_at && (
          <> | 更新: {formatTimestamp(note.updated_at)}</>
        )}
      </div>
    </div>
  );
};

export default NoteViewer;
