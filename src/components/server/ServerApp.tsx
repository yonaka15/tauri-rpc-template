import React from 'react';
import { useServer } from '../../hooks/useServer';
import ServerStatus from './ServerStatus';
import LogViewer from './LogViewer';
import ApiExamples from './ApiExamples';

const ServerApp: React.FC = () => {
  const {
    serverRunning,
    serverUrl,
    errorMessage,
    logs,
    showLogs,
    autoRefreshLogs,
    setShowLogs,
    setAutoRefreshLogs,
    fetchLogs,
    clearLogs,
    startServer,
    stopServer,
    formatTimestamp,
    formatJSON
  } = useServer();

  return (
    <div className="max-w-4xl mx-auto p-8 overflow-y-auto flex-grow">
      <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">
        Tauri JSON-RPC サーバー
      </h1>

      <ServerStatus
        isRunning={serverRunning}
        serverUrl={serverUrl}
        errorMessage={errorMessage}
        onStart={startServer}
        onStop={stopServer}
      />

      <LogViewer
        logs={logs}
        showLogs={showLogs}
        autoRefreshLogs={autoRefreshLogs}
        setShowLogs={setShowLogs}
        setAutoRefreshLogs={setAutoRefreshLogs}
        onRefresh={fetchLogs}
        onClear={clearLogs}
        formatTimestamp={formatTimestamp}
        formatJSON={formatJSON}
      />

      <ApiExamples />
    </div>
  );
};

export default ServerApp;
