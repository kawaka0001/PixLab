# 🚀 Quick Start Guide

## Prerequisites Installation

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Add WebAssembly Target
```bash
rustup target add wasm32-unknown-unknown
```

### 3. Install wasm-pack
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### 4. Install cargo-watch (for hot reload)
```bash
cargo install cargo-watch
```

### 5. Verify installations
```bash
rustc --version
cargo --version
wasm-pack --version
cargo-watch --version
node --version  # Should be v18+
```

## Project Setup

### 1. Install all dependencies
```bash
npm run install:all
```

This will:
- Install root dependencies (concurrently)
- Install web dependencies (React, Vite, etc.)

### 2. Initial WASM build
```bash
npm run build:wasm
```

This creates the `rust-wasm/pkg/` directory with compiled WASM modules.

## Development

### Start development servers
```bash
npm run dev
```

This runs:
- **Rust watcher**: Auto-rebuilds WASM on file changes (~3 seconds)
- **Vite dev server**: React app with HMR (instant updates)

Access the app at: http://localhost:3000

### Development workflow
1. Edit Rust code → Auto-rebuild → Browser refresh
2. Edit React/TS code → Instant HMR update (no refresh)

## Building for Production

```bash
npm run build
```

Output:
- `rust-wasm/pkg/` - Optimized WASM modules
- `web/dist/` - Production-ready frontend

## Testing

```bash
# Run all tests
npm test

# Run Rust tests only
npm run test:rust

# Run TypeScript type checking only
npm run test:web
```

## Common Issues

### "Cannot find module pixlab_wasm.js"
**Solution**: Run `npm run build:wasm` first to generate WASM files.

### Cargo watch not working
**Solution**: Install cargo-watch: `cargo install cargo-watch`

### Port 3000 already in use
**Solution**: Edit `web/vite.config.ts` and change the port number.

### WASM initialization error
**Solution**: Check browser console for details. Make sure you're using a modern browser.

## Browser Requirements

- Chrome/Edge 91+
- Firefox 89+
- Safari 15+

All modern browsers support WebAssembly!

## What's Next?

1. Upload an image
2. Try the Grayscale filter
3. Experiment with Blur (adjust the radius)
4. Check the browser console to see WASM performance logs

Enjoy building with PixLab! 🎨
