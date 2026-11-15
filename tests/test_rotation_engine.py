import unittest

from rotation_engine import (
    APPROVED_ENVIRONMENTAL_FILE,
    APPROVED_SOIL_FILE,
    compare_rotations,
)


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
        self.assertFalse(result["agronomic_rule_status"]["draft_decision_rules_activated"])
        self.assertEqual(
            result["agronomic_rule_status"]["mode"],
            "reviewed_research_observations_only",
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

    def test_rejects_non_approved_environmental_dataset(self):
        with self.assertRaises(ValueError):
            compare_rotations(
                self.payload,
                environmental_path="Story-County/Story-County/clean/power_42.03_-93.62_daily.csv",
            )

    def test_rejects_non_approved_soil_dataset(self):
        with self.assertRaises(ValueError):
            compare_rotations(
                self.payload,
                soil_path="Story-County/Story-County/clean/ssurgo_IA169_mapunit.csv",
            )

    def test_approved_datasets_report_project_soilgrids_provenance(self):
        result = compare_rotations(
            self.payload,
            environmental_path=APPROVED_ENVIRONMENTAL_FILE,
            soil_path=APPROVED_SOIL_FILE,
        )
        soil = result["data_context"]["soil_dataset"]
        self.assertTrue(soil["available"])
        self.assertEqual(soil["source"], "ISRIC SoilGrids 2.0")
        self.assertEqual(soil["depth"], "0-5 cm")
        self.assertEqual(soil["location"]["latitude"], 42.0361668)

    def test_adds_study_scoped_evidence_to_supported_transitions(self):
        payload = {
            "rotations": [
                {
                    "rotation_id": "corn-soy",
                    "name": "Corn after soybean",
                    "seasons": [
                        {"year": 1, "season": "Year 1", "crop": "soybean"},
                        {"year": 2, "season": "Year 2", "crop": "corn"},
                    ],
                },
                {
                    "rotation_id": "continuous-corn",
                    "name": "Corn after corn",
                    "seasons": [
                        {"year": 1, "season": "Year 1", "crop": "corn"},
                        {"year": 2, "season": "Year 2", "crop": "corn"},
                    ],
                },
            ]
        }

        result = compare_rotations(payload)
        soybean_transition = result["rotation_summaries"][0]["transitions"][0]
        corn_transition = result["rotation_summaries"][1]["transitions"][0]

        self.assertEqual(
            soybean_transition["agronomic_evidence"][0]["rule_id"],
            "OBS_CORN_AFTER_SOYBEAN",
        )
        self.assertEqual(
            soybean_transition["agronomic_evidence"][0]["evidence_status"],
            "source_reviewed_not_locally_validated",
        )
        self.assertEqual(
            corn_transition["agronomic_evidence"][0]["rule_id"],
            "OBS_CORN_AFTER_CORN",
        )
        self.assertIsNone(result["scores"])
        self.assertIsNone(result["recommendation"])

    def test_unmatched_transition_has_no_agronomic_evidence(self):
        result = compare_rotations(self.payload)
        transition = result["rotation_summaries"][0]["transitions"][0]
        self.assertEqual(transition["agronomic_evidence"], [])

    def test_adds_reviewed_cereal_rye_context_without_recommendation(self):
        payload = {
            "rotations": [
                {
                    "rotation_id": "rye-corn",
                    "name": "Rye before corn",
                    "seasons": [
                        {
                            "year": 1,
                            "season": "Year 1",
                            "crop": "corn",
                            "cover_crop": "cereal_rye",
                        }
                    ],
                },
                {
                    "rotation_id": "rye-soybean",
                    "name": "Rye before soybean",
                    "seasons": [
                        {
                            "year": 1,
                            "season": "Year 1",
                            "crop": "soybean",
                            "cover_crop": "cereal rye",
                        }
                    ],
                },
            ]
        }

        result = compare_rotations(payload)
        corn_note = result["rotation_summaries"][0]["season_details"][0][
            "agronomic_evidence"
        ][0]
        soybean_note = result["rotation_summaries"][1]["season_details"][0][
            "agronomic_evidence"
        ][0]

        self.assertEqual(corn_note["source"]["id"], "S13")
        self.assertEqual(soybean_note["source"]["id"], "S15")
        self.assertEqual(
            corn_note["evidence_status"],
            "source_reviewed_not_locally_validated",
        )
        self.assertIsNone(result["scores"])
        self.assertIsNone(result["recommendation"])

    def test_rejects_conflicting_pilot_geography(self):
        payload = dict(self.payload, pilot={
            "country": "USA",
            "state": "Texas",
            "county": "Lubbock County",
        })
        with self.assertRaises(ValueError):
            compare_rotations(payload)


if __name__ == "__main__":
    unittest.main()
