use photon_rs::PhotonImage;
use photon_rs::monochrome::grayscale as photon_grayscale;

/// Apply grayscale filter to image data
pub fn apply(image_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, String> {
    // Create PhotonImage from raw RGBA pixels
    let mut img = PhotonImage::new(image_data.to_vec(), width, height);

    // Apply grayscale filter
    photon_grayscale(&mut img);

    // Return raw bytes
    Ok(img.get_raw_pixels())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grayscale() {
        // Simple 2x2 RGBA image (red and blue pixels)
        let data = vec![
            255, 0, 0, 255,  // Red
            0, 0, 255, 255,  // Blue
            0, 255, 0, 255,  // Green
            255, 255, 255, 255, // White
        ];

        let result = apply(&data);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), data.len());
    }
}
