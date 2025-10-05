mod filters;

use wasm_bindgen::prelude::*;
use log::{info, debug};
use web_sys::window;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Initialize the WASM module
/// This should be called once when the module is loaded
#[wasm_bindgen(start)]
pub fn init() {
    // Set up panic hook for better error messages
    console_error_panic_hook::set_once();

    // Initialize logger
    wasm_logger::init(wasm_logger::Config::default());

    info!("PixLab WASM module initialized! 🎨");
}

/// Get a greeting message (test function)
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    info!("Greeting: {}", name);
    format!("Hello from PixLab, {}! 🚀", name)
}

/// Convert image to grayscale
#[wasm_bindgen]
pub fn grayscale(image_data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting grayscale conversion, size: {} bytes", image_data.len());

    let result = filters::grayscale::apply(image_data)
        .map_err(|e| JsValue::from_str(&format!("Grayscale error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Grayscale completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Apply Gaussian blur
#[wasm_bindgen]
pub fn blur(image_data: &[u8], radius: f32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting blur (radius={}), size: {} bytes", radius, image_data.len());

    let result = filters::blur::apply(image_data, radius)
        .map_err(|e| JsValue::from_str(&format!("Blur error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Blur completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Helper to get performance.now()
fn performance_now() -> f64 {
    window()
        .expect("should have window")
        .performance()
        .expect("should have performance")
        .now()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("Test");
        assert!(result.contains("Test"));
    }
}
