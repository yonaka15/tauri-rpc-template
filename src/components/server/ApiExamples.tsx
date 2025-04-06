import React from 'react';

const ApiExamples: React.FC = () => {
  // Sample requests for demo
  const notesListExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "notes_list", "params": {}, "id": 1}'`;

  const notesGetExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "notes_get", "params": {"id": "NOTE_ID_HERE"}, "id": 1}'`;

  const notesCreateExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "notes_create", "params": {"title": "New Note Title", "content": "Note content goes here"}, "id": 1}'`;

  const notesUpdateExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "notes_update", "params": {"id": "NOTE_ID_HERE", "title": "Updated Title", "content": "Updated content"}, "id": 1}'`;

  const notesDeleteExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "notes_delete", "params": {"id": "NOTE_ID_HERE"}, "id": 1}'`;

  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">
        メモ帳 RPC API
      </h2>

      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">メモ一覧取得</h3>
        <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          {notesListExample}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">メモ取得</h3>
        <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          {notesGetExample}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">メモ作成</h3>
        <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          {notesCreateExample}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">メモ更新</h3>
        <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          {notesUpdateExample}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">メモ削除</h3>
        <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
          {notesDeleteExample}
        </pre>
      </div>
      
      <h3 className="font-medium text-slate-700 mb-2">利用可能なメソッド</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <span className="font-semibold text-slate-800">notes_list</span> - すべてのメモのリストを取得
        </li>
        <li>
          <span className="font-semibold text-slate-800">notes_get</span> - 指定したIDのメモを取得
        </li>
        <li>
          <span className="font-semibold text-slate-800">notes_create</span> - 新しいメモを作成
        </li>
        <li>
          <span className="font-semibold text-slate-800">notes_update</span> - 既存のメモを更新
        </li>
        <li>
          <span className="font-semibold text-slate-800">notes_delete</span> - 指定したIDのメモを削除
        </li>
        <li>
          <span className="font-semibold text-slate-800">echo</span> - 送信した文字列をそのまま返す
        </li>
        <li>
          <span className="font-semibold text-slate-800">system_info</span> - システム情報を返す
        </li>
      </ul>
    </div>
  );
};

export default ApiExamples;
