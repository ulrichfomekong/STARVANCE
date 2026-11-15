"""Local HTTP API for SOSCOPE's approved project context and comparison."""

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any
from urllib.parse import urlsplit

from ai_comparison import AIComparisonError, generate_comparison_insights
from rotation_engine import (
    APPROVED_ENVIRONMENTAL_FILE,
    APPROVED_SOIL_FILE,
    compare_rotations,
    load_project_context,
)

MAX_REQUEST_BYTES = 1_000_000


class FieldShiftHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        route = urlsplit(self.path).path
        if route == "/api/health":
            self._send_json(200, {"status": "ok"})
            return
        if route == "/api/context":
            try:
                context = load_project_context(
                    APPROVED_ENVIRONMENTAL_FILE,
                    APPROVED_SOIL_FILE,
                )
            except (OSError, ValueError) as error:
                self._send_json(503, {"error": f"Approved project data unavailable: {error}"})
                return
            self._send_json(200, context)
            return
        self._send_json(404, {"error": "API route not found."})

    def do_POST(self) -> None:
        route = urlsplit(self.path).path
        if route not in {"/api/compare", "/api/compare/insights"}:
            self._send_json(404, {"error": "API route not found."})
            return
        if self.headers.get_content_type() != "application/json":
            self._send_json(415, {"error": "Content-Type must be application/json."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._send_json(400, {"error": "A valid Content-Length header is required."})
            return
        if content_length < 0:
            self._send_json(400, {"error": "Content-Length cannot be negative."})
            return
        if content_length > MAX_REQUEST_BYTES:
            self._send_json(413, {"error": "Request body exceeds the 1 MB limit."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Request body must be valid JSON."})
            return
        if not isinstance(payload, dict):
            self._send_json(400, {"error": "Request body must be a JSON object."})
            return

        if route == "/api/compare/insights":
            rotations = payload.get("rotations")
            if not isinstance(rotations, list) or len(rotations) != 2:
                self._send_json(
                    400,
                    {"error": "Provide exactly two rotations for AI insights."},
                )
                return

        try:
            result = compare_rotations(
                payload,
                environmental_path=APPROVED_ENVIRONMENTAL_FILE,
                soil_path=APPROVED_SOIL_FILE,
            )
        except OSError as error:
            self._send_json(503, {"error": f"Approved project data unavailable: {error}"})
            return
        except ValueError as error:
            self._send_json(400, {"error": str(error)})
            return

        if route == "/api/compare":
            self._send_json(200, result)
            return

        try:
            project_context = load_project_context(
                APPROVED_ENVIRONMENTAL_FILE,
                APPROVED_SOIL_FILE,
            )
        except (OSError, ValueError) as error:
            self._send_json(503, {"error": f"Approved project data unavailable: {error}"})
            return

        try:
            insights = generate_comparison_insights(result, project_context)
        except AIComparisonError as error:
            self._send_json(
                error.status_code,
                {"error": str(error), "code": error.error_code},
            )
            return

        self._send_json(
            200,
            {
                **insights,
                "deterministic_comparison": result,
            },
        )


def create_server(host: str = "127.0.0.1", port: int = 8765) -> HTTPServer:
    return HTTPServer((host, port), FieldShiftHandler)


def main() -> None:
    host = os.environ.get(
        "SOSCOPE_API_HOST",
        os.environ.get("FIELD_SHIFT_API_HOST", "127.0.0.1"),
    )
    port = int(
        os.environ.get(
            "PORT",
            os.environ.get(
                "SOSCOPE_API_PORT",
                os.environ.get("FIELD_SHIFT_API_PORT", "8765"),
            ),
        )
    )
    server = create_server(host=host, port=port)
    print(f"SOSCOPE API listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping SOSCOPE API.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
