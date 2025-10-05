/// Crop image to specified rectangle
///
/// # Arguments
/// * `image_data` - RGBA pixel data (4 bytes per pixel)
/// * `orig_width` - Original image width
/// * `orig_height` - Original image height
/// * `x` - X coordinate of top-left corner of crop area
/// * `y` - Y coordinate of top-left corner of crop area
/// * `crop_width` - Width of crop area
/// * `crop_height` - Height of crop area
///
/// # Returns
/// Cropped image data as Vec<u8> in RGBA format
pub fn apply(
    image_data: &[u8],
    orig_width: u32,
    orig_height: u32,
    x: u32,
    y: u32,
    crop_width: u32,
    crop_height: u32,
) -> Result<Vec<u8>, String> {
    // Validate input dimensions
    let expected_len = (orig_width * orig_height * 4) as usize;
    if image_data.len() != expected_len {
        return Err(format!(
            "Invalid image data length: expected {}, got {}",
            expected_len,
            image_data.len()
        ));
    }

    // Validate crop area is within bounds
    if x + crop_width > orig_width {
        return Err(format!(
            "Crop area exceeds image width: x({}) + width({}) > {}",
            x, crop_width, orig_width
        ));
    }

    if y + crop_height > orig_height {
        return Err(format!(
            "Crop area exceeds image height: y({}) + height({}) > {}",
            y, crop_height, orig_height
        ));
    }

    // Validate crop dimensions are non-zero
    if crop_width == 0 || crop_height == 0 {
        return Err(format!(
            "Crop dimensions must be non-zero: {}x{}",
            crop_width, crop_height
        ));
    }

    let orig_width = orig_width as usize;
    let crop_width = crop_width as usize;
    let crop_height = crop_height as usize;
    let x = x as usize;
    let y = y as usize;

    // Allocate output buffer
    let mut output = vec![0u8; crop_width * crop_height * 4];

    // Copy pixels row by row (cache-efficient)
    for row in 0..crop_height {
        let src_start = ((y + row) * orig_width + x) * 4;
        let src_end = src_start + crop_width * 4;
        let dst_start = row * crop_width * 4;
        let dst_end = dst_start + crop_width * 4;

        output[dst_start..dst_end].copy_from_slice(&image_data[src_start..src_end]);
    }

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crop_basic() {
        // 4x4 image, crop to 2x2 at (1, 1)
        // R G B W
        // Y M C K
        // r g b w
        // y m c k
        let data = vec![
            255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255, // Row 0
            255, 255, 0, 255, 255, 0, 255, 255, 0, 255, 255, 255, 0, 0, 0, 255, // Row 1
            128, 0, 0, 255, 0, 128, 0, 255, 0, 0, 128, 255, 128, 128, 128, 255, // Row 2
            128, 128, 0, 255, 128, 0, 128, 255, 0, 128, 128, 255, 0, 0, 0, 255, // Row 3
        ];

        let result = apply(&data, 4, 4, 1, 1, 2, 2);
        assert!(result.is_ok());

        let output = result.unwrap();
        // Should extract:
        // M C
        // g b
        assert_eq!(output.len(), 2 * 2 * 4);

        // M (Magenta)
        assert_eq!(&output[0..4], &[255, 0, 255, 255]);
        // C (Cyan)
        assert_eq!(&output[4..8], &[0, 255, 255, 255]);
        // g (dark green)
        assert_eq!(&output[8..12], &[0, 128, 0, 255]);
        // b (dark blue)
        assert_eq!(&output[12..16], &[0, 0, 128, 255]);
    }

    #[test]
    fn test_crop_full_image() {
        // Crop entire image (should be identity operation)
        let data = vec![255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255];

        let result = apply(&data, 2, 2, 0, 0, 2, 2);
        assert!(result.is_ok());

        let output = result.unwrap();
        assert_eq!(output, data);
    }

    #[test]
    fn test_crop_single_pixel() {
        let data = vec![255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255];

        let result = apply(&data, 2, 2, 1, 1, 1, 1);
        assert!(result.is_ok());

        let output = result.unwrap();
        assert_eq!(output.len(), 4);
        assert_eq!(&output[..], &[255, 255, 255, 255]); // White pixel
    }

    #[test]
    fn test_crop_out_of_bounds_x() {
        let data = vec![255, 0, 0, 255, 0, 255, 0, 255];
        let result = apply(&data, 2, 1, 1, 0, 2, 1); // x=1, width=2 exceeds 2
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds image width"));
    }

    #[test]
    fn test_crop_out_of_bounds_y() {
        let data = vec![255, 0, 0, 255, 0, 255, 0, 255];
        let result = apply(&data, 1, 2, 0, 1, 1, 2); // y=1, height=2 exceeds 2
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("exceeds image height"));
    }

    #[test]
    fn test_crop_zero_dimensions() {
        let data = vec![255, 0, 0, 255];
        let result = apply(&data, 1, 1, 0, 0, 0, 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("must be non-zero"));
    }

    #[test]
    fn test_invalid_data_length() {
        let data = vec![255, 0, 0]; // Only 3 bytes instead of 4
        let result = apply(&data, 1, 1, 0, 0, 1, 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid image data length"));
    }
}
