/// Rotate image 90 degrees clockwise
pub fn rotate_90_cw(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
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

    // New dimensions: width and height are swapped
    // For 90° CW: new_pixel[y][new_width - 1 - x] = old_pixel[x][y]
    // In 1D array: (x, y) -> (y, height - 1 - x) with swapped dimensions
    for y in 0..height {
        for x in 0..width {
            let src_idx = (y * width + x) * 4;
            let new_x = y;
            let new_y = width - 1 - x;
            let dst_idx = (new_y * height + new_x) * 4;

            // Copy RGBA pixel
            output[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
        }
    }

    Ok(output)
}

/// Rotate image 180 degrees
pub fn rotate_180(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
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

    // For 180°: (x, y) -> (width - 1 - x, height - 1 - y)
    for y in 0..height {
        for x in 0..width {
            let src_idx = (y * width + x) * 4;
            let new_x = width - 1 - x;
            let new_y = height - 1 - y;
            let dst_idx = (new_y * width + new_x) * 4;

            // Copy RGBA pixel
            output[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
        }
    }

    Ok(output)
}

/// Rotate image 270 degrees clockwise (= 90 degrees counter-clockwise)
pub fn rotate_270_cw(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
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

    // New dimensions: width and height are swapped
    // For 270° CW (= 90° CCW): (x, y) -> (height - 1 - y, x) with swapped dimensions
    for y in 0..height {
        for x in 0..width {
            let src_idx = (y * width + x) * 4;
            let new_x = height - 1 - y;
            let new_y = x;
            let dst_idx = (new_y * height + new_x) * 4;

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
    fn test_rotate_90_cw() {
        // 2x1 RGBA image: [Red][Blue]
        let data = vec![
            255, 0, 0, 255,   // Red
            0, 0, 255, 255,   // Blue
        ];

        let result = rotate_90_cw(&data, 2, 1);
        assert!(result.is_ok());

        let output = result.unwrap();
        // After 90° CW rotation, becomes 1x2 (height x width):
        // [Blue]
        // [Red]
        assert_eq!(&output[0..4], &[0, 0, 255, 255]); // Blue
        assert_eq!(&output[4..8], &[255, 0, 0, 255]); // Red
    }

    #[test]
    fn test_rotate_180() {
        // 2x1 RGBA image: [Red][Blue]
        let data = vec![
            255, 0, 0, 255,   // Red
            0, 0, 255, 255,   // Blue
        ];

        let result = rotate_180(&data, 2, 1);
        assert!(result.is_ok());

        let output = result.unwrap();
        // After 180° rotation: [Blue][Red]
        assert_eq!(&output[0..4], &[0, 0, 255, 255]); // Blue
        assert_eq!(&output[4..8], &[255, 0, 0, 255]); // Red
    }

    #[test]
    fn test_rotate_270_cw() {
        // 2x1 RGBA image: [Red][Blue]
        let data = vec![
            255, 0, 0, 255,   // Red
            0, 0, 255, 255,   // Blue
        ];

        let result = rotate_270_cw(&data, 2, 1);
        assert!(result.is_ok());

        let output = result.unwrap();
        // After 270° CW (= 90° CCW), becomes 1x2:
        // [Red]
        // [Blue]
        assert_eq!(&output[0..4], &[255, 0, 0, 255]); // Red
        assert_eq!(&output[4..8], &[0, 0, 255, 255]); // Blue
    }

    #[test]
    fn test_rotate_2x2() {
        // 2x2 RGBA image:
        // [R][G]
        // [B][Y]
        let data = vec![
            255, 0, 0, 255,     // R (0,0)
            0, 255, 0, 255,     // G (1,0)
            0, 0, 255, 255,     // B (0,1)
            255, 255, 0, 255,   // Y (1,1)
        ];

        // 90° CW:
        // [B][R]
        // [Y][G]
        let result = rotate_90_cw(&data, 2, 2);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert_eq!(&output[0..4], &[0, 0, 255, 255]);   // B
        assert_eq!(&output[4..8], &[255, 0, 0, 255]);   // R
        assert_eq!(&output[8..12], &[255, 255, 0, 255]); // Y
        assert_eq!(&output[12..16], &[0, 255, 0, 255]);  // G

        // 180°:
        // [Y][B]
        // [G][R]
        let result = rotate_180(&data, 2, 2);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert_eq!(&output[0..4], &[255, 255, 0, 255]); // Y
        assert_eq!(&output[4..8], &[0, 0, 255, 255]);   // B
        assert_eq!(&output[8..12], &[0, 255, 0, 255]);  // G
        assert_eq!(&output[12..16], &[255, 0, 0, 255]); // R
    }

    #[test]
    fn test_invalid_dimensions() {
        let data = vec![255, 0, 0, 255];
        let result = rotate_90_cw(&data, 2, 2); // Wrong dimensions
        assert!(result.is_err());

        let result = rotate_180(&data, 2, 2);
        assert!(result.is_err());

        let result = rotate_270_cw(&data, 2, 2);
        assert!(result.is_err());
    }
}
