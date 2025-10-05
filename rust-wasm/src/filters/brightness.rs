/// Apply brightness adjustment to image data
/// Adjustment range: -255.0 (darker) to +255.0 (brighter)
pub fn apply(image_data: &[u8], width: u32, height: u32, adjustment: f32) -> Result<Vec<u8>, String> {
    // Validate input
    let expected_len = (width * height * 4) as usize;
    if image_data.len() != expected_len {
        return Err(format!(
            "Invalid image data length: expected {}, got {}",
            expected_len,
            image_data.len()
        ));
    }

    // Clamp adjustment to valid range
    let adjustment = adjustment.clamp(-255.0, 255.0);

    // Create output buffer
    let mut output = Vec::with_capacity(image_data.len());

    // Process each pixel
    for chunk in image_data.chunks_exact(4) {
        let r = chunk[0];
        let g = chunk[1];
        let b = chunk[2];
        let a = chunk[3];

        // Apply brightness adjustment with clamping
        let new_r = ((r as f32 + adjustment).clamp(0.0, 255.0)) as u8;
        let new_g = ((g as f32 + adjustment).clamp(0.0, 255.0)) as u8;
        let new_b = ((b as f32 + adjustment).clamp(0.0, 255.0)) as u8;

        output.push(new_r);
        output.push(new_g);
        output.push(new_b);
        output.push(a); // Alpha channel unchanged
    }

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_brightness_increase() {
        // 2x2 RGBA image with dark pixels
        let data = vec![
            50, 50, 50, 255,   // Dark gray
            100, 100, 100, 255, // Medium gray
            150, 150, 150, 255, // Light gray
            200, 200, 200, 255, // Very light gray
        ];

        let result = apply(&data, 2, 2, 50.0);
        assert!(result.is_ok());

        let output = result.unwrap();
        assert_eq!(output.len(), data.len());

        // First pixel should be brighter (50 + 50 = 100)
        assert_eq!(output[0], 100);
        assert_eq!(output[1], 100);
        assert_eq!(output[2], 100);
        assert_eq!(output[3], 255); // Alpha unchanged
    }

    #[test]
    fn test_brightness_decrease() {
        let data = vec![200, 200, 200, 255];
        let result = apply(&data, 1, 1, -100.0);

        assert!(result.is_ok());
        let output = result.unwrap();

        // Should be darker (200 - 100 = 100)
        assert_eq!(output[0], 100);
        assert_eq!(output[1], 100);
        assert_eq!(output[2], 100);
    }

    #[test]
    fn test_brightness_clamping() {
        // Test upper clamp
        let bright = vec![250, 250, 250, 255];
        let result = apply(&bright, 1, 1, 100.0);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert_eq!(output[0], 255); // Clamped to 255

        // Test lower clamp
        let dark = vec![10, 10, 10, 255];
        let result = apply(&dark, 1, 1, -100.0);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert_eq!(output[0], 0); // Clamped to 0
    }

    #[test]
    fn test_invalid_dimensions() {
        let data = vec![255, 0, 0, 255];
        let result = apply(&data, 2, 2, 0.0); // Wrong dimensions
        assert!(result.is_err());
    }
}
