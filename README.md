# Tauri JSON-RPC サーバーテンプレート

このプロジェクトは、Tauri フレームワークを使用して JSON-RPC サーバー機能を備えたデスクトップアプリケーションを構築するためのテンプレートです。React、TypeScript、TailwindCSS を使用してフロントエンドを構築し、Rust で実装されたバックエンドで JSON-RPC サーバーを提供します。

## 機能

- **JSON-RPC 2.0 サーバー**: 標準に準拠した JSON-RPC サーバーを内蔵
- **クロスプラットフォーム**: Windows、macOS、Linux で実行可能
- **アクセスログ機能**: リクエストとレスポンスをリアルタイムで監視
- **シンプルな管理 UI**: サーバーの起動、停止、ログ表示を簡単に操作

## 実装されている RPC メソッド

1. **echo**: 送信された文字列パラメータをそのまま返します

   ```json
   { "jsonrpc": "2.0", "method": "echo", "params": ["Hello, world!"], "id": 1 }
   ```

2. **system_info**: システム情報（OS、アーキテクチャなど）を返します
   ```json
   { "jsonrpc": "2.0", "method": "system_info", "params": [], "id": 1 }
   ```

## 開発環境のセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v18 以降)
- [Rust](https://www.rust-lang.org/) (最新の安定版)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### インストール

1. リポジトリをクローン:

   ```bash
   git clone https://github.com/yourusername/tauri-jsonrpc-template.git
   cd tauri-jsonrpc-template
   ```

2. 依存関係をインストール:

   ```bash
   npm install
   ```

3. 開発モードで起動:
   ```bash
   npm run tauri dev
   ```

## 使い方

1. アプリケーションを起動します。
2. 「起動」ボタンをクリックして JSON-RPC サーバーを開始します。
3. 別のアプリケーションから `http://127.0.0.1:3030` に JSON-RPC リクエストを送信します。
4. サーバーに送信されたリクエストとそのレスポンスがログパネルに表示されます。

### cURL からの使用例

**Echo メソッド**:

```bash
curl -X POST http://127.0.0.1:3030 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "echo", "params": ["Hello, world!"], "id": 1}'
```

**System Info メソッド**:

```bash
curl -X POST http://127.0.0.1:3030 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "system_info", "params": [], "id": 1}'
```

## プロジェクト構造

```
app-with-rpc/
├── src/                     # フロントエンド (React/TypeScript)
│   ├── App.tsx              # メインUIコンポーネント
│   └── ...
├── src-tauri/               # バックエンド (Rust)
│   ├── src/
│   │   ├── main.rs          # Tauriエントリーポイント
│   │   ├── lib.rs           # Tauriコマンド定義
│   │   └── server.rs        # JSON-RPCサーバー実装
│   └── ...
└── ...
```

## カスタマイズ

### 新しい RPC メソッドの追加

新しい RPC メソッドを追加するには、`src-tauri/src/server.rs` の `start()` メソッド内で `io.add_method()` を使用します:

```rust
io.add_method("your_method_name", move |params: Params| {
    // パラメータの処理
    // ...

    async move {
        // メソッドの実装
        // ...

        Ok(Value::String("Your result".to_string()))
    }
});
```

## ビルド

リリース用のビルドを作成するには:

```bash
npm run tauri build
```

これにより、`src-tauri/target/release` に実行可能ファイルが生成されます。

## ライセンス

MIT

## クレジット

- [Tauri](https://tauri.app/) - デスクトップアプリケーションフレームワーク
- [jsonrpc-core](https://github.com/paritytech/jsonrpc) - Rust JSON-RPC 実装
- [React](https://reactjs.org/) - UI ライブラリ
- [TailwindCSS](https://tailwindcss.com/) - CSS フレームワーク
