/// Apply horizontal flip (mirror left-right) to image data
pub fn apply_horizontal(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
    // Validate input
    let expected_len = (width * height * 4) as usize;
    if image_data.len() != expected_len {
        return Err(format!(
            "Invalid image data length: expected {}, got {}",
            expected_len,
            image_data.len()
        ));
    }

    let width = width as usize;
    let height = height as usize;
    let mut output = vec![0u8; image_data.len()];

    // Flip each row horizontally
    for y in 0..height {
        for x in 0..width {
            let src_idx = (y * width + x) * 4;
            let dst_idx = (y * width + (width - 1 - x)) * 4;

            // Copy RGBA pixel
            output[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
        }
    }

    Ok(output)
}

/// Apply vertical flip (mirror top-bottom) to image data
pub fn apply_vertical(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
    // Validate input
    let expected_len = (width * height * 4) as usize;
    if image_data.len() != expected_len {
        return Err(format!(
            "Invalid image data length: expected {}, got {}",
            expected_len,
            image_data.len()
        ));
    }

    let width = width as usize;
    let height = height as usize;
    let mut output = vec![0u8; image_data.len()];

    // Flip each column vertically
    for y in 0..height {
        for x in 0..width {
            let src_idx = (y * width + x) * 4;
            let dst_idx = ((height - 1 - y) * width + x) * 4;

            // Copy RGBA pixel
            output[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
        }
    }

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_horizontal_flip() {
        // 2x1 RGBA image: [Red][Blue]
        let data = vec![
            255, 0, 0, 255,   // Red
            0, 0, 255, 255,   // Blue
        ];

        let result = apply_horizontal(&data, 2, 1);
        assert!(result.is_ok());

        let output = result.unwrap();
        // Should be: [Blue][Red]
        assert_eq!(&output[0..4], &[0, 0, 255, 255]); // Blue
        assert_eq!(&output[4..8], &[255, 0, 0, 255]); // Red
    }

    #[test]
    fn test_vertical_flip() {
        // 1x2 RGBA image: [Red] on top, [Blue] on bottom
        let data = vec![
            255, 0, 0, 255,   // Red
            0, 0, 255, 255,   // Blue
        ];

        let result = apply_vertical(&data, 1, 2);
        assert!(result.is_ok());

        let output = result.unwrap();
        // Should be: [Blue] on top, [Red] on bottom
        assert_eq!(&output[0..4], &[0, 0, 255, 255]); // Blue
        assert_eq!(&output[4..8], &[255, 0, 0, 255]); // Red
    }

    #[test]
    fn test_horizontal_flip_2x2() {
        // 2x2 RGBA image:
        // [R][G]
        // [B][Y]
        let data = vec![
            255, 0, 0, 255,     // R
            0, 255, 0, 255,     // G
            0, 0, 255, 255,     // B
            255, 255, 0, 255,   // Y (yellow)
        ];

        let result = apply_horizontal(&data, 2, 2);
        assert!(result.is_ok());

        let output = result.unwrap();
        // Should be:
        // [G][R]
        // [Y][B]
        assert_eq!(&output[0..4], &[0, 255, 0, 255]);   // G
        assert_eq!(&output[4..8], &[255, 0, 0, 255]);   // R
        assert_eq!(&output[8..12], &[255, 255, 0, 255]); // Y
        assert_eq!(&output[12..16], &[0, 0, 255, 255]);  // B
    }

    #[test]
    fn test_invalid_dimensions() {
        let data = vec![255, 0, 0, 255];
        let result = apply_horizontal(&data, 2, 2); // Wrong dimensions
        assert!(result.is_err());

        let result = apply_vertical(&data, 2, 2); // Wrong dimensions
        assert!(result.is_err());
    }
}
