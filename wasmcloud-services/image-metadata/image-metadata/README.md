# Image Metadata Service

wasmCloudで動作する画像メタデータ抽出APIサービス。

## ✨ 機能（現在）

- [x] HTTPリクエストの受信
- [x] JSON形式でのレスポンス
- [x] リクエストメソッド・パスの取得
- [ ] 画像ファイルの受信（実装予定）
- [ ] 画像フォーマット検出（JPEG/PNG/GIF）
- [ ] 画像サイズ取得（width/height）
- [ ] EXIFデータ抽出

## 🚀 使い方

### 開発サーバー起動

```bash
wash dev
```

サーバーが http://127.0.0.1:8000 で起動します。

### APIテスト

```bash
# GET リクエスト
curl http://127.0.0.1:8000/api/metadata

# レスポンス例
{
  "size_bytes": 0,
  "format": "jpeg",
  "message": "Image Metadata API - Method: GET, Path: /api/metadata"
}
```

### ホットリロード

ファイルを編集すると自動的に再ビルド・再デプロイされます。

```bash
👀 Watching for file changes (press Ctrl+c to stop)...
   Compiling http-hello-world v0.1.0
✅ Successfully built project
🔁 (Fast-)Reloading component...
```

## 🏗️ アーキテクチャ

```
┌─────────────────┐
│   HTTP Client   │
└────────┬────────┘
         │ POST /api/metadata
         ↓
┌─────────────────────────────┐
│  wasmCloud Component        │
│  ┌─────────────────────┐   │
│  │  handle(request)    │   │
│  │  ↓                  │   │
│  │  parse image data   │   │
│  │  ↓                  │   │
│  │  extract metadata   │   │
│  │  ↓                  │   │
│  │  return JSON        │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
         ↓
┌─────────────────┐
│  HTTP Response  │
│  (JSON)         │
└─────────────────┘
```

## 📝 コード構造

```rust
// src/lib.rs
use wasmcloud_component::http;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ImageMetadata {
    size_bytes: usize,
    format: String,
    message: String,
}

impl http::Server for Component {
    fn handle(request: http::IncomingRequest)
        -> http::Result<http::Response<impl http::OutgoingBody>>
    {
        // リクエスト処理
        // メタデータ抽出
        // JSONレスポンス
    }
}
```

## 🔧 技術スタック

- **言語**: Rust (Edition 2021)
- **フレームワーク**: wasmCloud Component Model
- **ビルドツール**: wash CLI
- **ターゲット**: wasm32-wasip2
- **依存**:
  - `wasmcloud-component` 0.2.0
  - `serde` 1.0
  - `serde_json` 1.0

## Prerequisites

- `cargo` 1.90+
- [`wash`](https://wasmcloud.com/docs/installation) 0.39.0+
- `rustup target add wasm32-wasip2`

## Building

```bash
wash build
```

## Running with wasmCloud

```shell
wash dev
```

```shell
curl http://127.0.0.1:8000/api/metadata
```

## 🐛 トラブルシューティング

### ビルドエラー: `wasm32-wasip2` target not found

```bash
rustup target add wasm32-wasip2
```

### wash devが起動しない

```bash
# wash CLIのバージョン確認
wash --version

# 最新版をインストール
cargo install wash-cli --locked --force
```

### ポート8000が使用中

```bash
# 使用中のプロセスを確認
lsof -i :8000

# または別のポートを指定（wadm.yamlで設定）
```

## 📚 次のステップ

1. **画像データの受信**
   - `IncomingBody`のストリーム処理
   - バイト列→画像データ変換

2. **画像解析ライブラリ追加**
   ```toml
   [dependencies]
   image = "0.24"  # WASI互換性確認
   ```

3. **実際のメタデータ抽出**
   ```rust
   let img = image::load_from_memory(&body_bytes)?;
   ImageMetadata {
       width: img.width(),
       height: img.height(),
       format: format!("{:?}", img.color()),
   }
   ```

4. **PixLab UIとの統合**
   - React側でPOSTリクエスト実装
   - 画像ファイルのアップロード
   - メタデータ表示UI

## Adding Capabilities

To learn how to extend this example with additional capabilities, see the [Adding Capabilities](https://wasmcloud.com/docs/tour/adding-capabilities?lang=rust) section of the wasmCloud documentation.

## 🗓️ 開発ログ

### 2025-10-05
- ✅ プロジェクト作成（wash new）
- ✅ Hello World動作確認
- ✅ JSON APIの基本実装
- ✅ HTTPメソッド・パス取得
- 📝 課題: `IncomingBody`からバイト列取得方法の調査

---

**PixLab wasmCloud Services** - 画像処理をエッジで実行
