import unittest

from rotation_engine import compare_rotations


class RotationEngineTests(unittest.TestCase):
    def setUp(self):
        self.payload = {
            "rotations": [
                {
                    "rotation_id": "r1",
                    "name": "Scenario 1",
                    "seasons": [
                        {"year": 1, "season": "S1", "crop": "Crop X"},
                        {"year": 2, "season": "S2", "crop": "Crop Y"},
                        {"year": 3, "season": "S3", "crop": "Crop X"},
                    ],
                },
                {
                    "rotation_id": "r2",
                    "name": "Scenario 2",
                    "seasons": [
                        {"year": 1, "season": "S1", "crop": "Crop Z"},
                        {"year": 2, "season": "S2", "crop": "Crop Y"},
                        {"year": 3, "season": "S3", "crop": "Crop W"},
                    ],
                },
            ]
        }

    def test_descriptive_metrics_are_returned(self):
        result = compare_rotations(self.payload)
        first = result["rotation_summaries"][0]
        self.assertEqual(first["season_count"], 3)
        self.assertEqual(first["distinct_crop_count"], 2)
        self.assertEqual(first["repeated_crop_occurrences"], 1)
        self.assertEqual(first["transition_count"], 2)

    def test_no_scores_or_recommendation_are_created(self):
        result = compare_rotations(self.payload)
        self.assertIsNone(result["scores"])
        self.assertIsNone(result["ranking"])
        self.assertIsNone(result["recommendation"])
        self.assertEqual(
            result["assessment_status"],
            "descriptive_only_awaiting_agronomic_validation",
        )

    def test_requires_at_least_two_rotations(self):
        with self.assertRaises(ValueError):
            compare_rotations({"rotations": self.payload["rotations"][:1]})

    def test_rejects_placeholder_crop(self):
        payload = {
            "rotations": [
                {
                    "rotation_id": "r1",
                    "name": "A",
                    "seasons": [{"year": 1, "season": "S1", "crop": "Crop A"}],
                },
                {
                    "rotation_id": "r2",
                    "name": "B",
                    "seasons": [{"year": 1, "season": "S1", "crop": "Crop Z"}],
                },
            ]
        }
        with self.assertRaises(ValueError):
            compare_rotations(payload)

    def test_flags_different_sequence_lengths(self):
        payload = {
            "rotations": [
                {
                    "rotation_id": "r1",
                    "name": "A",
                    "seasons": [{"year": 1, "season": "S1", "crop": "Crop X"}],
                },
                {
                    "rotation_id": "r2",
                    "name": "B",
                    "seasons": [
                        {"year": 1, "season": "S1", "crop": "Crop Y"},
                        {"year": 2, "season": "S2", "crop": "Crop Z"},
                    ],
                },
            ]
        }
        result = compare_rotations(payload)
        self.assertTrue(result["comparison_warnings"])


if __name__ == "__main__":
    unittest.main()
