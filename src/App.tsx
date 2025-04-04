import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

// ログエントリの型定義
interface LogEntry {
  timestamp: number;
  method: string;
  uri: string;
  headers: string;
  body: string | null;
  response: string | null;
}

function App() {
  const [serverRunning, setServerRunning] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);

  // Sample requests for demo
  const echoExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "echo", "params": ["Hello, world!"], "id": 1}'`;

  const systemInfoExample = `curl -X POST http://127.0.0.1:3030 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc": "2.0", "method": "system_info", "params": [], "id": 1}'`;

  // Initialize
  useEffect(() => {
    checkServerStatus();
    getServerUrl();
  }, []);

  // ログの自動更新
  useEffect(() => {
    let interval: number | null = null;
    
    if (serverRunning && autoRefreshLogs) {
      interval = window.setInterval(() => {
        fetchLogs();
      }, 2000); // 2秒ごとに更新
    }

    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [serverRunning, autoRefreshLogs]);

  async function checkServerStatus() {
    try {
      const running = await invoke<boolean>("is_server_running");
      setServerRunning(running);
      
      // サーバーが起動している場合はログを取得
      if (running) {
        await fetchLogs();
      }
    } catch (error) {
      setErrorMessage(`Failed to check server status: ${error}`);
    }
  }

  async function getServerUrl() {
    try {
      const url = await invoke<string>("get_server_url");
      setServerUrl(url);
    } catch (error) {
      setErrorMessage(`Failed to get server URL: ${error}`);
    }
  }

  async function startServer() {
    try {
      setErrorMessage("");
      await invoke("start_server");
      setServerRunning(true);
      await fetchLogs();
    } catch (error) {
      setErrorMessage(`Failed to start server: ${error}`);
    }
  }

  async function stopServer() {
    try {
      setErrorMessage("");
      await invoke("stop_server");
      setServerRunning(false);
    } catch (error) {
      setErrorMessage(`Failed to stop server: ${error}`);
    }
  }

  async function fetchLogs() {
    try {
      const logsData = await invoke<LogEntry[]>("get_logs");
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }

  async function clearLogs() {
    try {
      await invoke("clear_logs");
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }

  // タイムスタンプをフォーマットする関数
  function formatTimestamp(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString();
  }

  // JSONをきれいに表示する関数
  function formatJSON(jsonString: string | null) {
    if (!jsonString) return "No data";
    try {
      const data = JSON.parse(jsonString);
      return JSON.stringify(data, null, 2);
    } catch {
      return jsonString;
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">
        Tauri JSON-RPC サーバー
      </h1>

      <div className="bg-gray-50 rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">
          サーバーステータス
        </h2>
        
        <p className="flex items-center mb-2">
          <span className={`text-xl mr-2 ${serverRunning ? "text-green-500" : "text-red-500"}`}>
            ●
          </span>
          <span className="font-medium">
            {serverRunning ? "起動中" : "停止中"}
          </span>
        </p>
        
        <p className="mb-6">
          <span className="font-medium">URL:</span> {serverUrl}
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={startServer}
            disabled={serverRunning}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            起動
          </button>
          <button
            onClick={stopServer}
            disabled={!serverRunning}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            停止
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border-l-4 border-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      {/* ログセクション */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-semibold text-slate-700">
            アクセスログ
          </h2>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-blue-500 hover:text-blue-700"
            >
              {showLogs ? "ログを隠す" : "ログを表示"}
            </button>
            
            {showLogs && (
              <>
                <button
                  onClick={fetchLogs}
                  className="text-blue-500 hover:text-blue-700"
                >
                  更新
                </button>
                <button
                  onClick={clearLogs}
                  className="text-red-500 hover:text-red-700"
                >
                  クリア
                </button>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefreshLogs}
                    onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">自動更新</span>
                </label>
              </>
            )}
          </div>
        </div>

        {showLogs && (
          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ログがありません</p>
            ) : (
              <div className="space-y-4">
                {logs.slice().reverse().map((log, index) => (
                  <div key={index} className="border rounded-md p-3 bg-white">
                    <div className="text-xs text-gray-500 mb-2">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-sm text-gray-700 mb-1">
                        {log.method} {log.uri}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        ヘッダー: {log.headers}
                      </div>
                    </div>
                    {log.body && (
                      <div className="mb-2">
                        <div className="font-medium text-sm text-gray-700 mb-1">リクエスト:</div>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {formatJSON(log.body)}
                        </pre>
                      </div>
                    )}
                    {log.response && (
                      <div>
                        <div className="font-medium text-sm text-gray-700 mb-1">レスポンス:</div>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {formatJSON(log.response)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">
          使用方法
        </h2>

        <div className="mb-6">
          <h3 className="font-medium text-slate-700 mb-2">Echo メソッド</h3>
          <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
            {echoExample}
          </pre>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-slate-700 mb-2">System Info メソッド</h3>
          <pre className="bg-slate-800 text-gray-100 p-4 rounded-md overflow-x-auto text-sm leading-relaxed">
            {systemInfoExample}
          </pre>
        </div>

        <h3 className="font-medium text-slate-700 mb-2">利用可能なメソッド</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <span className="font-semibold text-slate-800">echo</span> - 送信した文字列をそのまま返します
          </li>
          <li>
            <span className="font-semibold text-slate-800">system_info</span> - システム情報を返します
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
