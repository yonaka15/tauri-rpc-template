import React from 'react';

interface NoteEditorProps {
  title: string;
  content: string;
  isNewNote: boolean;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  title,
  content,
  isNewNote,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex justify-between items-center border-b">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="タイトル"
          className="text-xl font-semibold flex-grow mr-2 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!title.trim()}
          >
            {isNewNote ? '作成' : '更新'}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="メモの内容"
        className="flex-grow p-4 resize-none outline-none"
      />
    </div>
  );
};

export default NoteEditor;
