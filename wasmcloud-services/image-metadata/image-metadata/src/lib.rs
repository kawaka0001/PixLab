use wasmcloud_component::http;
use serde::{Deserialize, Serialize};

struct Component;

http::export!(Component);

#[derive(Serialize, Deserialize)]
struct ImageMetadata {
    size_bytes: usize,
    format: String,
    message: String,
}

impl http::Server for Component {
    fn handle(
        request: http::IncomingRequest,
    ) -> http::Result<http::Response<impl http::OutgoingBody>> {
        // まずは簡単にメソッドとパスを取得
        let path = request.uri().path();
        let method = request.method();

        let metadata = ImageMetadata {
            size_bytes: 0,
            format: "jpeg".to_string(),
            message: format!("Image Metadata API - Method: {}, Path: {}", method, path),
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
