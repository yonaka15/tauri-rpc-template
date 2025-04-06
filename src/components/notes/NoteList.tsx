import React from 'react';
import { Note } from '../../types/notes';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  selectNote: (note: Note) => void;
  startNewNote: () => void;
  formatTimestamp: (timestamp: number) => string;
}

const NoteList: React.FC<NoteListProps> = ({ 
  notes, 
  selectedNote, 
  selectNote, 
  startNewNote, 
  formatTimestamp 
}) => {
  return (
    <div className="w-64 border-r overflow-y-auto flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">メモ一覧</h2>
        <button
          onClick={startNewNote}
          className="text-blue-500 hover:text-blue-700 text-lg font-bold"
        >
          ＋
        </button>
      </div>
      
      {notes.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          メモはありません
        </div>
      ) : (
        <div className="overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => selectNote(note)}
              className={`p-3 cursor-pointer border-b ${
                selectedNote?.id === note.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <h3 className="font-medium truncate">{note.title}</h3>
              <p className="text-sm text-gray-500 truncate">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatTimestamp(note.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteList;
