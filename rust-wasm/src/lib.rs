mod filters;

use wasm_bindgen::prelude::*;
use log::info;
use web_sys::window;

// Note: wee_alloc is removed in favor of default allocator
// Modern WASM runtime allocators are already quite efficient

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

/// Apply brightness adjustment
/// adjustment: -255.0 (darker) to +255.0 (brighter)
#[wasm_bindgen]
pub fn apply_brightness(image_data: &[u8], width: u32, height: u32, adjustment: f32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting brightness adjustment ({}), size: {} bytes ({}x{})", adjustment, image_data.len(), width, height);

    let result = filters::brightness::apply(image_data, width, height, adjustment)
        .map_err(|e| JsValue::from_str(&format!("Brightness error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Brightness adjustment completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Apply horizontal flip (mirror left-right)
#[wasm_bindgen]
pub fn apply_flip_horizontal(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting horizontal flip, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::flip::apply_horizontal(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Horizontal flip error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Horizontal flip completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Apply vertical flip (mirror top-bottom)
#[wasm_bindgen]
pub fn apply_flip_vertical(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting vertical flip, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::flip::apply_vertical(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Vertical flip error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("Vertical flip completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Rotate image 90 degrees clockwise
#[wasm_bindgen]
pub fn apply_rotate_90_cw(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting 90° CW rotation, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::rotate::rotate_90_cw(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Rotate 90° CW error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("90° CW rotation completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Rotate image 180 degrees
#[wasm_bindgen]
pub fn apply_rotate_180(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting 180° rotation, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::rotate::rotate_180(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Rotate 180° error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("180° rotation completed in {:.2}ms", elapsed);

    Ok(result)
}

/// Rotate image 270 degrees clockwise (90 degrees counter-clockwise)
#[wasm_bindgen]
pub fn apply_rotate_270_cw(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let start = performance_now();
    info!("Starting 270° CW rotation, size: {} bytes ({}x{})", image_data.len(), width, height);

    let result = filters::rotate::rotate_270_cw(image_data, width, height)
        .map_err(|e| JsValue::from_str(&format!("Rotate 270° CW error: {}", e)))?;

    let elapsed = performance_now() - start;
    info!("270° CW rotation completed in {:.2}ms", elapsed);

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
