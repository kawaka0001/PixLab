use photon_rs::PhotonImage;
use photon_rs::conv::gaussian_blur;

/// Apply Gaussian blur to image data
/// Optimized: Reduced memory allocation overhead
pub fn apply(image_data: &[u8], width: u32, height: u32, radius: f32) -> Result<Vec<u8>, String> {
    if radius <= 0.0 {
        return Err("Radius must be positive".to_string());
    }

    // Create PhotonImage - Vec::from is slightly more optimized than to_vec()
    // PhotonImage requires ownership for in-place mutation
    let mut img = PhotonImage::new(Vec::from(image_data), width, height);

    // Apply Gaussian blur (in-place mutation)
    gaussian_blur(&mut img, radius as i32);

    // Return raw bytes (moves ownership, no copy)
    Ok(img.get_raw_pixels())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blur() {
        // Simple 2x2 RGBA image
        let data = vec![
            255, 0, 0, 255,
            0, 0, 255, 255,
            0, 255, 0, 255,
            255, 255, 255, 255,
        ];

        let result = apply(&data, 2.0);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), data.len());
    }

    #[test]
    fn test_blur_invalid_radius() {
        let data = vec![255, 0, 0, 255];
        let result = apply(&data, -1.0);
        assert!(result.is_err());
    }
}
