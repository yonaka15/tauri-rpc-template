import { useState } from "react";
import NotesApp from "./components/notes/NotesApp";
import ServerApp from "./components/server/ServerApp";

function App() {
  const [showServerTab, setShowServerTab] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* タブ切り替え */}
      <div className="bg-gray-100 px-4 py-2 flex">
        <button
          onClick={() => setShowServerTab(false)}
          className={`px-4 py-2 rounded-t ${!showServerTab ? 'bg-white text-blue-600 font-semibold' : 'text-gray-600'}`}
        >
          メモ帳
        </button>
        <button
          onClick={() => setShowServerTab(true)}
          className={`px-4 py-2 rounded-t ${showServerTab ? 'bg-white text-blue-600 font-semibold' : 'text-gray-600'}`}
        >
          RPC サーバー
        </button>
      </div>

      {/* メインコンテンツ */}
      {!showServerTab ? <NotesApp /> : <ServerApp />}
    </div>
  );
}

export default App;
