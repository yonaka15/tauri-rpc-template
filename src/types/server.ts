// ログエントリの型定義
export interface LogEntry {
  timestamp: number;
  method: string;
  uri: string;
  headers: string;
  body: string | null;
  response: string | null;
}
