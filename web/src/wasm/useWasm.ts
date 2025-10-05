import { useState, useEffect } from 'react'
import logger from '../utils/logger'

/**
 * ⚠️ CRITICAL: Single Source of Truth (SSOT) Pattern
 *
 * This module imports WASM types DIRECTLY from wasm-bindgen generated definitions.
 *
 * DO NOT create hand-written type definitions for WASM functions.
 * They will become out of sync when Rust code changes, causing deployment failures.
 *
 * Correct dependency flow:
 *   Rust Code (SSOT) → wasm-pack build → Generated .d.ts → TypeScript
 *
 * See CLAUDE.md for details on past deployment failures caused by type mismatches.
 */
import type * as WasmModule from '../../../rust-wasm/pkg/pixlab_wasm'

interface UseWasmResult {
  wasmModule: typeof WasmModule | null
  isLoading: boolean
  error: Error | null
}

export function useWasm(): UseWasmResult {
  const [wasmModule, setWasmModule] = useState<typeof WasmModule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadWasm() {
      try {
        logger.info('Loading WASM module...', {
          action: 'WASM_LOAD_START',
        })

        // Dynamic import of WASM module
        // Import both the init function and the module
        const wasmModule = await import('../../../rust-wasm/pkg/pixlab_wasm.js')

        // Initialize WASM (this is crucial!)
        await wasmModule.default()

        logger.info('WASM module initialized successfully!', {
          action: 'WASM_LOAD_COMPLETE',
        })

        if (mounted) {
          setWasmModule(wasmModule)
          setIsLoading(false)
        }
      } catch (err) {
        logger.error('Failed to load WASM module', {
          action: 'WASM_LOAD_ERROR',
          error: err instanceof Error ? err.message : String(err),
        })
        if (mounted) {
          setError(err as Error)
          setIsLoading(false)
        }
      }
    }

    loadWasm()

    return () => {
      mounted = false
    }
  }, [])

  return { wasmModule, isLoading, error }
}
