import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LogEntry } from '../types/server';

// サーバー管理のためのカスタムフック
export function useServer() {
  const [serverRunning, setServerRunning] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);

  // サーバーステータスをチェック
  const checkServerStatus = useCallback(async () => {
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
  }, []);

  // サーバーURLを取得
  const getServerUrl = useCallback(async () => {
    try {
      const url = await invoke<string>("get_server_url");
      setServerUrl(url);
    } catch (error) {
      setErrorMessage(`Failed to get server URL: ${error}`);
    }
  }, []);

  // ログを取得
  const fetchLogs = useCallback(async () => {
    try {
      const logsData = await invoke<LogEntry[]>("get_logs");
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  }, []);

  // ログをクリア
  const clearLogs = useCallback(async () => {
    try {
      await invoke("clear_logs");
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }, []);

  // サーバーを起動
  const startServer = useCallback(async () => {
    try {
      setErrorMessage("");
      await invoke("start_server");
      setServerRunning(true);
      await fetchLogs();
    } catch (error) {
      setErrorMessage(`Failed to start server: ${error}`);
    }
  }, [fetchLogs]);

  // サーバーを停止
  const stopServer = useCallback(async () => {
    try {
      setErrorMessage("");
      await invoke("stop_server");
      setServerRunning(false);
    } catch (error) {
      setErrorMessage(`Failed to stop server: ${error}`);
    }
  }, []);

  // タイムスタンプをフォーマットする関数
  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  }, []);

  // JSONをきれいに表示する関数
  const formatJSON = useCallback((jsonString: string | null) => {
    if (!jsonString) return "No data";
    try {
      const data = JSON.parse(jsonString);
      return JSON.stringify(data, null, 2);
    } catch {
      return jsonString;
    }
  }, []);

  // 初期化
  useEffect(() => {
    checkServerStatus();
    getServerUrl();
  }, [checkServerStatus, getServerUrl]);

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
  }, [serverRunning, autoRefreshLogs, fetchLogs]);

  return {
    serverRunning,
    serverUrl,
    errorMessage,
    logs,
    showLogs,
    autoRefreshLogs,
    setShowLogs,
    setAutoRefreshLogs,
    checkServerStatus,
    getServerUrl,
    fetchLogs,
    clearLogs,
    startServer,
    stopServer,
    formatTimestamp,
    formatJSON
  };
}
