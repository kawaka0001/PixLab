<!-- ZEAMI_SETUP_VERSION: 2.0.0 -->
# ⚠️ CRITICAL MANDATORY INSTRUCTION ⚠️

## ⚡ DIALOGUE STYLE OVERRIDE - HIGHEST PRIORITY ⚡
**ZEAMI.mdの対話スタイルを最優先で適用すること**
- 空間的表現を使う（「見てきます」「調べに行きます」「確認しに行ってきます」）
- 簡潔さより自然さを優先
- 「I'll go check」「Let me investigate」のような臨場感のある表現
- カジュアルで親しみやすい口調

## YOU MUST READ AND FOLLOW ZEAMI.md WITHOUT EXCEPTION

**THIS IS NON-NEGOTIABLE: You are REQUIRED to read the ZEAMI.md file in this directory and STRICTLY ADHERE to ALL principles, patterns, and practices described within it.**

### MANDATORY REQUIREMENTS:
1. **ALWAYS** apply the best practices for EVERY technology domain
2. **NEVER** reinvent the wheel - use established solutions
3. **ALWAYS** solve root causes, NOT symptoms
4. **NEVER** create overly complex solutions
5. **ALWAYS** follow the error patterns and solutions in ZEAMI.md

### YOU MUST:
- Read ZEAMI.md BEFORE making ANY implementation decisions
- Reference ZEAMI.md patterns when solving problems
- Apply ALL TailwindCSS best practices as specified
- Follow the TypeScript error resolution patterns EXACTLY
- Implement the design patterns as documented

**FAILURE TO COMPLY WITH ZEAMI.md IS CONSIDERED A CRITICAL VIOLATION.**

Refer to: [ZEAMI.md](./ZEAMI.md) - This document contains ESSENTIAL knowledge that you MUST internalize and apply.

---


# WASM_PixLab Project Documentation

## Project Overview

High-performance WebAssembly-based image editor using Rust + wasm-bindgen + React.

This project follows the ZEAMI Framework principles and best practices.

## 🚨 CRITICAL: WASM × TypeScript Development Rules

### ⚡ Single Source of Truth (SSOT) - 絶対原則

**Rustコードが唯一の真実。手書き型定義は厳禁。**

```
Rust Code (唯一の真実)
    ↓ wasm-pack build
Generated .d.ts (自動生成 - 編集禁止)
    ↓ import type
TypeScript Code (自動追従)
```

#### ❌ 絶対にやってはいけないこと

```typescript
// BAD: 手書きでWASM関数の型を定義
interface WasmModule {
  apply_blur: (data: Uint8Array, radius: number) => Uint8Array
}
```

**理由**: Rust側を変更しても型が追従せず、型不整合によるデプロイ失敗が発生

#### ✅ 正しい方法

```typescript
// GOOD: 生成された型を直接import
import type * as WasmModule from '../../../rust-wasm/pkg/pixlab_wasm'

interface UseWasmResult {
  wasmModule: typeof WasmModule | null
}
```

### 🛡️ Canvas API × WASM の型変換

**Canvas APIの`ImageData.data`は`Uint8ClampedArray`、WASMは`Uint8Array`を期待**

```typescript
// ❌ BAD: 型エラーになる
const pixels = imageData.data  // Uint8ClampedArray
wasmModule.process(pixels)     // Uint8Array期待 → エラー

// ✅ GOOD: バッファを共有してゼロコピー変換
const pixels = new Uint8Array(imageData.data.buffer)
wasmModule.process(pixels)
```

### 📋 開発フロー（必須）

#### Rust側を変更したとき

```bash
# 1. WASMビルド（型定義を再生成）
npm run build:wasm

# 2. 型チェック（自動実行される）
# postbuild:wasm hookが自動的に実行

# 3. TypeScriptで型エラーが出たら対応
# Rust変更に合わせてTS側を修正
```

#### コミット前の必須チェック

**Git pre-commit hookが自動実行します**（.husky/pre-commit）

```bash
# 手動で確認する場合
cd web && npm run type-check
```

**型チェックが通らないコードはコミットできません。**

### 🚀 デプロイ前チェックリスト

- [ ] `npm run build:wasm` 実行済み
- [ ] `npm run type-check` がエラーなし
- [ ] `npm run build` がローカルで成功
- [ ] WASMファイルサイズ確認 (`ls -lh rust-wasm/pkg/*.wasm`)

### 🐛 過去のトラブル事例（教訓）

#### 2025-10-05: Vercel型エラー3連続

**問題1**: 手書き型定義がRustと不一致
- **原因**: `apply_grayscale`の引数が1個 → 実際は3個必要
- **修正**: 手書き型定義を削除、生成型をimport

**問題2**: Uint8ClampedArray vs Uint8Array
- **原因**: Canvas APIとWASMの型不一致
- **修正**: `new Uint8Array(imageData.data.buffer)`で変換

**問題3**: 型定義の二重管理
- **原因**: useWasm.tsで手書き型定義を管理
- **修正**: `import type * as WasmModule`でSSOT確立

**教訓**:
- ローカルの`npm run dev`は型エラーを警告で流す
- Vercelは`tsc --noEmit`相当で**厳格にチェック**
- **必ずコミット前に`npm run type-check`を実行**

## Project Structure

```
WASM_PixLab/
├── rust-wasm/              # Rust → WASM変換
│   ├── src/
│   │   ├── lib.rs         # WASM公開関数（SSOT）
│   │   └── filters/       # 画像処理フィルター
│   ├── pkg/               # 生成物（git管理）
│   │   ├── *.wasm         # WASMバイナリ
│   │   └── *.d.ts         # TypeScript型定義（自動生成）
│   └── Cargo.toml         # WASM最適化設定
│
├── web/                   # React フロントエンド
│   ├── src/
│   │   ├── wasm/
│   │   │   └── useWasm.ts # WASM型をimport（手書き禁止）
│   │   └── App.tsx        # メインアプリ
│   └── vite.config.ts     # Vite + WASM設定
│
├── .husky/
│   └── pre-commit         # 型チェック強制
│
└── package.json           # 自動化スクリプト
```

## Development Guidelines

### 型安全性の保証

1. **WASM型の変更時**: 必ず`npm run build:wasm`で型を再生成
2. **コミット時**: pre-commitフックが自動的に型チェック
3. **ビルド時**: `prebuild:web`で型チェック実行

### 自動化による防御

- **Git hooks**: 型エラーのあるコードはコミット不可
- **npm scripts**: WASM変更後に自動型チェック
- **Vercel**: 本番デプロイ前に厳格な型チェック

## Key Features

- Rust製高速画像処理（Grayscale、Blur）
- WebAssembly最適化（40%サイズ削減）
- React + TypeScript フロントエンド
- 型安全なWASM ↔ TS連携

## Testing

```bash
# 型チェック（最重要）
npm run type-check

# Rustテスト
npm run test:rust

# フルテスト
npm test
```

## Deployment

### Vercel自動デプロイ

- `git push` → 自動デプロイ
- ビルドコマンド: `npm run build:vercel`
- 出力ディレクトリ: `web/dist`

### トラブルシューティング

**型エラーでデプロイ失敗した場合:**

1. ローカルで`npm run type-check`を実行
2. エラー箇所を修正
3. `npm run build`でローカルビルド成功を確認
4. コミット → プッシュ

---

*Last updated: 2025-10-05*
*Critical lessons learned from production deployment failures.*
