import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from backend_api import create_server


class BackendApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = create_server(port=0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        host, port = cls.server.server_address
        cls.base_url = f"http://{host}:{port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def test_context_uses_approved_sources_and_point_data(self):
        with urlopen(f"{self.base_url}/api/context") as response:
            context = json.loads(response.read())

        self.assertEqual(context["pilot_geography"]["county"], "Story County")
        self.assertEqual(
            context["environmental_dataset"]["metadata"]["source"],
            "NASA POWER Daily API",
        )
        self.assertIn(
            "relative_humidity_mean_percent",
            context["environmental_dataset"]["monthly_records"][-1],
        )
        self.assertEqual(context["soil_dataset"]["source"], "ISRIC SoilGrids 2.0")
        self.assertEqual(context["soil_dataset"]["properties"]["soc"]["value"], 24.5)
        self.assertEqual(len(context["environmental_dataset"]["monthly_records"]), 72)

    def test_compare_returns_descriptive_result_without_scores(self):
        payload = {
            "rotations": [
                {
                    "rotation_id": "a",
                    "name": "Scenario A",
                    "seasons": [
                        {"year": 1, "season": "Season 1", "crop": "Corn"},
                        {"year": 2, "season": "Season 2", "crop": "Soybean"},
                    ],
                },
                {
                    "rotation_id": "b",
                    "name": "Scenario B",
                    "seasons": [
                        {"year": 1, "season": "Season 1", "crop": "Corn"},
                        {"year": 2, "season": "Season 2", "crop": "Oats"},
                    ],
                },
            ]
        }
        request = Request(
            f"{self.base_url}/api/compare",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request) as response:
            result = json.loads(response.read())

        self.assertIsNone(result["scores"])
        self.assertIsNone(result["ranking"])
        self.assertIsNone(result["recommendation"])
        self.assertEqual(result["rotation_summaries"][0]["season_count"], 2)

    def test_compare_rejects_invalid_input_with_client_error(self):
        request = Request(
            f"{self.base_url}/api/compare",
            data=b'{"rotations": []}',
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code, 400)
        response_body = error.exception.read().decode()
        error.exception.close()
        self.assertIn("at least two rotations", response_body)


if __name__ == "__main__":
    unittest.main()
