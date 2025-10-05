use photon_rs::PhotonImage;
use photon_rs::conv::gaussian_blur;

/// Apply Gaussian blur to image data
pub fn apply(image_data: &[u8], radius: f32) -> Result<Vec<u8>, String> {
    if radius <= 0.0 {
        return Err("Radius must be positive".to_string());
    }

    // Create PhotonImage from raw bytes
    let mut img = PhotonImage::new_from_byteslice(image_data.to_vec());

    // Apply Gaussian blur
    gaussian_blur(&mut img, radius as i32);

    // Return raw bytes
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
