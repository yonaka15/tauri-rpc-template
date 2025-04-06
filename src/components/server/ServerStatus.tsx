import React from 'react';

interface ServerStatusProps {
  isRunning: boolean;
  serverUrl: string;
  errorMessage: string;
  onStart: () => void;
  onStop: () => void;
}

const ServerStatus: React.FC<ServerStatusProps> = ({
  isRunning,
  serverUrl,
  errorMessage,
  onStart,
  onStop
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">
        サーバーステータス
      </h2>
      
      <p className="flex items-center mb-2">
        <span className={`text-xl mr-2 ${isRunning ? "text-green-500" : "text-red-500"}`}>
          ●
        </span>
        <span className="font-medium">
          {isRunning ? "起動中" : "停止中"}
        </span>
      </p>
      
      <p className="mb-6">
        <span className="font-medium">URL:</span> {serverUrl}
      </p>

      <div className="flex gap-4 mb-6">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          起動
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
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
  );
};

export default ServerStatus;
