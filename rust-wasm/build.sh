#!/bin/bash
export PATH="$HOME/.cargo/bin:$PATH"
wasm-pack build --target web --dev
