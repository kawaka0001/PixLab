import { useState, useEffect } from 'react'

interface WasmModule {
  greet: (name: string) => string
  apply_grayscale: (imageData: Uint8Array) => Uint8Array
  apply_blur: (imageData: Uint8Array, radius: number) => Uint8Array
}

interface UseWasmResult {
  wasmModule: WasmModule | null
  isLoading: boolean
  error: Error | null
}

export function useWasm(): UseWasmResult {
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadWasm() {
      try {
        console.log('Loading WASM module...')

        // Dynamic import of WASM module
        // Import both the init function and the module
        const wasmModule = await import('../../../rust-wasm/pkg/pixlab_wasm.js')

        // Initialize WASM (this is crucial!)
        await wasmModule.default()

        console.log('WASM module initialized successfully!')

        if (mounted) {
          setWasmModule(wasmModule as unknown as WasmModule)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load WASM module:', err)
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
