# wasmCloud Services for PixLab

wasmCloudを使った画像処理マイクロサービス群。

## 🎯 プロジェクト目的

PixLabの既存ブラウザWASM（`wasm-bindgen`）とは別に、wasmCloudでサーバーサイドWASMを学習・実験するためのサブプロジェクト。

### なぜwasmCloud？

- **新技術の学習**: WASI準拠のサーバーサイドWASM
- **分散実行**: 将来的にスケーラブルな画像処理
- **エッジコンピューティング**: ブラウザとサーバーのハイブリッド構成

## 📁 サービス一覧

### 1. image-metadata (実装中)

画像メタデータ抽出API

- **機能**: 画像ファイルのメタデータを取得
- **技術**: Rust + wasmCloud Component Model
- **ステータス**: 基本骨組み完成（2025-10-05）

**今後追加予定**:
- `image-optimizer`: リサイズ・WebP変換
- `batch-processor`: 複数画像の一括処理
- `ai-segmentation`: ONNX背景除去

## 🚀 クイックスタート

### 前提条件

```bash
# Rust & Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# wash CLI
cargo install wash-cli --locked

# WASI targetを追加
rustup target add wasm32-wasip2
```

### 開発サーバー起動

```bash
cd wasmcloud-services/image-metadata/image-metadata
wash dev
```

→ http://127.0.0.1:8000 でアクセス可能

### テスト

```bash
curl http://127.0.0.1:8000/api/metadata
```

**レスポンス例**:
```json
{
  "size_bytes": 0,
  "format": "jpeg",
  "message": "Image Metadata API - Method: GET, Path: /api/metadata"
}
```

## 🏗️ アーキテクチャ

```
PixLab (ブラウザ)
    ↓
    HTTP API呼び出し
    ↓
wasmCloud Services (サーバー)
    ├── NATS (メッセージング)
    ├── wadm (アプリケーション管理)
    └── WASMコンポーネント群
```

## 🔍 ブラウザWASM vs wasmCloud

| 項目 | ブラウザWASM | wasmCloud |
|------|-------------|-----------|
| ビルドツール | `wasm-pack` | `wash` |
| ターゲット | `wasm32-unknown-unknown` | `wasm32-wasip2` |
| バインディング | `wasm-bindgen` | WASI標準API |
| 依存 | `web_sys`, `js_sys` | 標準ライブラリのみ |
| 実行環境 | ブラウザ | サーバー/エッジ |

## 📚 参考資料

- [wasmCloud公式ドキュメント](https://wasmcloud.com/docs/)
- [wash CLI](https://wasmcloud.com/docs/installation)
- [WASI仕様](https://github.com/WebAssembly/WASI)

## 🗓️ 開発履歴

- **2025-10-05**: プロジェクト開始、image-metadata基本実装
