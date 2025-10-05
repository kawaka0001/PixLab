use wasmcloud_component::http;
use serde::{Deserialize, Serialize};
use std::io::{Read, Cursor};
use image::ImageReader;

struct Component;

http::export!(Component);

#[derive(Serialize, Deserialize)]
struct ImageMetadata {
    size_bytes: usize,
    format: String,
    width: Option<u32>,
    height: Option<u32>,
    message: String,
}

impl http::Server for Component {
    fn handle(
        request: http::IncomingRequest,
    ) -> http::Result<http::Response<impl http::OutgoingBody>> {
        let path = request.uri().path().to_string();
        let method = request.method().to_string();

        // HTTPボディからバイト列を読み取る
        let mut request_body = request.into_body();

        let mut body_bytes = vec![];
        if let Err(e) = request_body.read_to_end(&mut body_bytes) {
            let error_response = format!(r#"{{"error": "Failed to read body: {:?}"}}"#, e);
            let mut response = http::Response::new(error_response);
            response.headers_mut().insert(
                "content-type",
                "application/json".parse().unwrap(),
            );
            return Ok(response);
        }

        let size_bytes = body_bytes.len();

        // 画像解析
        let (format, width, height) = if size_bytes > 0 {
            match ImageReader::new(Cursor::new(&body_bytes)).with_guessed_format() {
                Ok(reader) => {
                    let format_str = reader.format()
                        .map(|f| format!("{:?}", f).to_lowercase())
                        .unwrap_or_else(|| "unknown".to_string());

                    match reader.decode() {
                        Ok(img) => {
                            let (w, h) = (img.width(), img.height());
                            (format_str, Some(w), Some(h))
                        }
                        Err(_) => (format_str, None, None)
                    }
                }
                Err(_) => ("unknown".to_string(), None, None)
            }
        } else {
            ("none".to_string(), None, None)
        };

        let metadata = ImageMetadata {
            size_bytes,
            format,
            width,
            height,
            message: format!("Received {} bytes - Method: {}, Path: {}", size_bytes, method, path),
        };

        let json = serde_json::to_string(&metadata)
            .unwrap_or_else(|_| r#"{"error": "Failed to serialize"}"#.to_string());

        let mut response = http::Response::new(json);
        response.headers_mut().insert(
            "content-type",
            "application/json".parse().unwrap(),
        );

        Ok(response)
    }
}
