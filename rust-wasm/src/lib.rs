mod filters;

use wasm_bindgen::prelude::*;
use log::info;
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
pub fn apply_grayscale(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting grayscale conversion, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::grayscale::apply(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Grayscale error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Grayscale completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Apply Gaussian blur
#[wasm_bindgen]
pub fn apply_blur(image_data: &[u8], width: u32, height: u32, radius: f32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting blur (radius={}), size: {} bytes ({}x{})", radius, image_data.len(), width, height);

    let result = filters::blur::apply(image_data, width, height, radius)
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
