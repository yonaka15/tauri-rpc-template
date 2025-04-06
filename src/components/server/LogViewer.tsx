import React from 'react';
import { LogEntry } from '../../types/server';

interface LogViewerProps {
  logs: LogEntry[];
  showLogs: boolean;
  autoRefreshLogs: boolean;
  setShowLogs: (show: boolean) => void;
  setAutoRefreshLogs: (auto: boolean) => void;
  onRefresh: () => void;
  onClear: () => void;
  formatTimestamp: (timestamp: number) => string;
  formatJSON: (json: string | null) => string;
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  showLogs,
  autoRefreshLogs,
  setShowLogs,
  setAutoRefreshLogs,
  onRefresh,
  onClear,
  formatTimestamp,
  formatJSON
}) => {
  return (
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
                onClick={onRefresh}
                className="text-blue-500 hover:text-blue-700"
              >
                更新
              </button>
              <button
                onClick={onClear}
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
  );
};

export default LogViewer;
