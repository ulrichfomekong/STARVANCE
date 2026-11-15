"""
FIELD SHIFT — descriptive crop-rotation comparison foundation.

This module does NOT calculate crop suitability, yield, risk scores, or recommend
a rotation. It may attach directly sourced, study-scoped research observations
to matching transitions; those observations are not local predictions.

Python standard library only.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
APPROVED_ENVIRONMENTAL_PATH = "data/processed/iowa_monthly_environmental.json"
APPROVED_SOIL_PATH = "data/processed/iowa_soil_context.json"
APPROVED_ENVIRONMENTAL_FILE = (ROOT / APPROVED_ENVIRONMENTAL_PATH).resolve()
APPROVED_SOIL_FILE = (ROOT / APPROVED_SOIL_PATH).resolve()
APPROVED_GEO = {
    "country": "USA",
    "state": "Iowa",
    "county": "Story County",
}
APPROVED_COORDINATES = {
    "latitude": 42.0361668,
    "longitude": -93.4650441,
}
RESEARCH_OBSERVATIONS = {
    ("corn", "soybean"): {
        "rule_id": "OBS_CORN_AFTER_SOYBEAN",
        "statement": (
            "In the cited Iowa State Nashua experiment, first-year corn after "
            "soybean had higher yield and lower nitrogen response than corn "
            "after corn."
        ),
        "source": {
            "id": "S01",
            "title": (
                "Increasing the frequency of corn in crop sequences: "
                "Grain yield and response to nitrogen"
            ),
            "url": (
                "https://crops.extension.iastate.edu/encyclopedia/"
                "increasing-frequency-corn-crop-sequences-grain-yield-and-"
                "response-nitrogen-research"
            ),
        },
        "limitations": (
            "This is a study-specific observation from one research location, "
            "not a field-level yield prediction or fertilizer-rate recommendation."
        ),
    },
    ("corn", "corn"): {
        "rule_id": "OBS_CORN_AFTER_CORN",
        "statement": (
            "In the cited Iowa State Nashua experiment, corn after corn had "
            "lower yield and higher nitrogen response than first-year corn "
            "after soybean."
        ),
        "source": {
            "id": "S01",
            "title": (
                "Increasing the frequency of corn in crop sequences: "
                "Grain yield and response to nitrogen"
            ),
            "url": (
                "https://crops.extension.iastate.edu/encyclopedia/"
                "increasing-frequency-corn-crop-sequences-grain-yield-and-"
                "response-nitrogen-research"
            ),
        },
        "limitations": (
            "This is a study-specific observation from one research location, "
            "not a field-level yield prediction or fertilizer-rate recommendation."
        ),
    },
}
COVER_CROP_OBSERVATIONS = {
    ("cereal rye", "corn"): {
        "rule_id": "OBS_CEREAL_RYE_BEFORE_CORN",
        "statement": (
            "An Iowa State Extension article reports that terminating cereal "
            "rye 10 to 14 days before corn planting greatly minimizes the "
            "chance of a negative impact."
        ),
        "source": {
            "id": "S13",
            "title": "Cereal Rye Cover Crops, Allelopathy and Corn",
            "url": (
                "https://crops.extension.iastate.edu/cropnews/2014/04/"
                "cereal-rye-cover-crops-allelopathy-and-corn"
            ),
        },
        "limitations": (
            "This is extension guidance published in 2014. The article notes "
            "that the causes and relative importance of rye-related effects "
            "vary by field; this is not field-specific advice."
        ),
    },
    ("cereal rye", "soybean"): {
        "rule_id": "OBS_CEREAL_RYE_BEFORE_SOYBEAN",
        "statement": (
            "In Iowa State's 2019-2020 Ames and Boone trials, cereal rye "
            "terminated at soybean planting suppressed weeds; the Boone trial "
            "reported no soybean emergence, canopy, or yield effect versus "
            "the no-cover treatment."
        ),
        "source": {
            "id": "S15",
            "title": (
                "Termination Timing of Cereal Rye Cover Crop for Improved "
                "Weed Control in Soybean"
            ),
            "url": (
                "https://crops.extension.iastate.edu/cropnews/2021/04/"
                "termination-timing-cereal-rye-cover-crop-improved-weed-"
                "control-soybean"
            ),
        },
        "limitations": (
            "These are results from specific 2019-2020 trials, not a general "
            "yield guarantee, insurance deadline, or substitute for other weed control."
        ),
    },
}
COVER_CROP_ALIASES = {
    "rye": "cereal rye",
    "cereal_rye": "cereal rye",
}

PLACEHOLDER_CROPS = {
    "CROP_NAME_PENDING_VALIDATION",
    "REPLACE_WITH_VALIDATED_CROP_NAME",
    "Crop A",
    "Crop B",
    "Crop C",
}


def _read_json(path: str | Path) -> dict[str, Any]:
    with Path(path).open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain a JSON object at its root.")
    return value


def _validate_approved_project_data(
    environmental_path: str | Path | None,
    soil_path: str | Path | None,
) -> None:
    for label, candidate in (
        ("environmental", environmental_path),
        ("soil", soil_path),
    ):
        if candidate is None:
            continue
        candidate_path = Path(candidate).resolve()
        approved_path = (
            APPROVED_ENVIRONMENTAL_FILE
            if label == "environmental"
            else APPROVED_SOIL_FILE
        )
        if candidate_path != approved_path:
            raise ValueError(
                f"{label} dataset must use the project-approved file "
                f"'{approved_path.relative_to(ROOT)}'; received '{candidate}'."
            )

        if not candidate_path.is_file():
            raise FileNotFoundError(f"Configured {label} dataset not found: {candidate_path}")

        data = _read_json(candidate_path)
        if label == "environmental":
            metadata = data.get("metadata")
            if not isinstance(metadata, dict):
                raise ValueError("Approved environmental dataset is missing metadata.")
            if metadata.get("source") != "NASA POWER Daily API":
                raise ValueError("Approved environmental dataset must identify NASA POWER.")
            location = metadata
        else:
            location = data.get("location")
            if data.get("source") != "ISRIC SoilGrids 2.0":
                raise ValueError("Approved soil dataset must identify ISRIC SoilGrids 2.0.")
            if not isinstance(location, dict):
                raise ValueError("Approved soil dataset is missing location metadata.")

        try:
            latitude = float(location["latitude"])
            longitude = float(location["longitude"])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError(
                f"Approved {label} dataset is missing valid reference coordinates."
            ) from error
        if (
            abs(latitude - APPROVED_COORDINATES["latitude"]) > 0.000001
            or abs(longitude - APPROVED_COORDINATES["longitude"]) > 0.000001
        ):
            raise ValueError(
                f"Approved {label} dataset coordinates do not match the project reference point."
            )


def _validate_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    pilot = payload.get("pilot")
    if pilot is not None:
        if not isinstance(pilot, dict):
            raise ValueError("Pilot geography must be an object.")
        for field, expected in APPROVED_GEO.items():
            if pilot.get(field) != expected:
                raise ValueError(
                    f"Pilot {field} must be '{expected}' for the current project."
                )

    rotations = payload.get("rotations")
    if not isinstance(rotations, list) or len(rotations) < 2:
        raise ValueError("Provide at least two rotations to compare.")

    seen_ids: set[str] = set()
    validated: list[dict[str, Any]] = []

    for rotation_index, rotation in enumerate(rotations, start=1):
        if not isinstance(rotation, dict):
            raise ValueError(f"Rotation {rotation_index} must be an object.")

        rotation_id = rotation.get("rotation_id")
        name = rotation.get("name")
        seasons = rotation.get("seasons")

        if not isinstance(rotation_id, str) or not rotation_id.strip():
            raise ValueError(f"Rotation {rotation_index} needs a rotation_id.")
        if rotation_id in seen_ids:
            raise ValueError(f"Duplicate rotation_id: {rotation_id}")
        seen_ids.add(rotation_id)

        if not isinstance(name, str) or not name.strip():
            raise ValueError(f"Rotation {rotation_id} needs a name.")
        if not isinstance(seasons, list) or not seasons:
            raise ValueError(f"Rotation {rotation_id} needs at least one season.")

        clean_seasons = []
        for season_index, season in enumerate(seasons, start=1):
            if not isinstance(season, dict):
                raise ValueError(
                    f"{rotation_id}, season {season_index} must be an object."
                )

            crop = season.get("crop")
            season_label = season.get("season")
            year = season.get("year", season_index)
            cover_crop = season.get("cover_crop")

            if not isinstance(crop, str) or not crop.strip():
                raise ValueError(
                    f"{rotation_id}, season {season_index} needs a crop name."
                )
            if crop.strip() in PLACEHOLDER_CROPS:
                raise ValueError(
                    f"{rotation_id}, season {season_index} still contains "
                    f"placeholder crop '{crop}'. Replace it with a crop name "
                    "confirmed by the team before running a comparison."
                )
            if not isinstance(season_label, str) or not season_label.strip():
                raise ValueError(
                    f"{rotation_id}, season {season_index} needs a season label."
                )
            if not isinstance(year, (int, str)) or isinstance(year, bool):
                raise ValueError(
                    f"{rotation_id}, season {season_index} has an invalid year."
                )
            if cover_crop is not None and (
                not isinstance(cover_crop, str) or not cover_crop.strip()
            ):
                raise ValueError(
                    f"{rotation_id}, season {season_index} has an invalid cover_crop."
                )

            clean_season: dict[str, Any] = {
                "year": year,
                "season": season_label.strip(),
                "crop": crop.strip(),
            }
            if cover_crop is not None:
                clean_season["cover_crop"] = cover_crop.strip()
            clean_seasons.append(clean_season)

        validated.append({
            "rotation_id": rotation_id,
            "name": name.strip(),
            "seasons": clean_seasons,
        })

    return validated


def _dataset_context(
    environmental_path: str | Path | None,
    soil_path: str | Path | None,
) -> dict[str, Any]:
    context: dict[str, Any] = {
        "pilot_geography": dict(APPROVED_GEO),
        "environmental_dataset": {"available": False},
        "soil_dataset": {"available": False},
        "approved_reference_coordinates": dict(APPROVED_COORDINATES),
        "project_data_priority": [
            "Use the current project-approved NASA POWER and SoilGrids inputs.",
            "Reject contradictory or draft Person 3 data until approved by the project contract.",
        ],
        "interpretation_limit": (
            "The available environmental extraction is a single NASA POWER "
            "reference point, not a county-wide or field-level measurement. "
            "SoilGrids values are modelled estimates at one reference pixel "
            "and 0-5 cm depth, not laboratory measurements."
        ),
    }

    if environmental_path and Path(environmental_path).exists():
        env = _read_json(environmental_path)
        metadata = env.get("metadata", {})
        context["environmental_dataset"] = {
            "available": True,
            "record_type": "monthly",
            "record_count": len(env.get("monthly_records", [])),
            "period_start": metadata.get("start_date"),
            "period_end": metadata.get("end_date"),
            "source": metadata.get("source"),
            "aggregation": metadata.get("aggregation"),
            "spatial_scope": metadata.get("spatial_scope"),
        }

    if soil_path and Path(soil_path).exists():
        soil = _read_json(soil_path)
        context["soil_dataset"] = {
            "available": True,
            "source": soil.get("source"),
            "spatial_scope": (
                "Single SoilGrids pixel at the Story County reference point; "
                "not county-wide or field-level."
            ),
            "depth": soil.get("depth_interval"),
            "statistic": soil.get("statistic"),
            "location": soil.get("location"),
            "properties": sorted(soil.get("properties", {}).keys())
            if isinstance(soil.get("properties"), dict)
            else None,
        }

    return context


def _transition_evidence(previous_crop: str, following_crop: str) -> list[dict[str, Any]]:
    key = (following_crop.strip().lower(), previous_crop.strip().lower())
    observation = RESEARCH_OBSERVATIONS.get(key)
    if observation is None:
        return []

    return [{
        **observation,
        "evidence_status": "source_reviewed_not_locally_validated",
    }]


def _cover_crop_evidence(cover_crop: str | None, planned_crop: str) -> list[dict[str, Any]]:
    if cover_crop is None:
        return []
    normalized_cover_crop = cover_crop.strip().lower()
    normalized_cover_crop = COVER_CROP_ALIASES.get(
        normalized_cover_crop, normalized_cover_crop
    )
    observation = COVER_CROP_OBSERVATIONS.get(
        (normalized_cover_crop, planned_crop.strip().lower())
    )
    if observation is None:
        return []

    return [{
        **observation,
        "evidence_status": "source_reviewed_not_locally_validated",
    }]


def compare_rotations(
    payload: dict[str, Any],
    environmental_path: str | Path | None = None,
    soil_path: str | Path | None = None,
) -> dict[str, Any]:
    """
    Return descriptive sequence metrics only.

    No agronomic interpretation or ranking is performed.
    """
    _validate_approved_project_data(environmental_path, soil_path)
    rotations = _validate_payload(payload)
    summaries = []

    for rotation in rotations:
        crops = [item["crop"] for item in rotation["seasons"]]
        counts = Counter(crops)
        season_details = [
            {
                **season,
                "agronomic_evidence": _cover_crop_evidence(
                    season.get("cover_crop"), season["crop"]
                ),
            }
            for season in rotation["seasons"]
        ]
        transitions = []
        for index in range(len(crops) - 1):
            previous_crop = crops[index]
            following_crop = crops[index + 1]
            transitions.append({
                "from_crop": previous_crop,
                "to_crop": following_crop,
                "agronomic_evidence": _transition_evidence(
                    previous_crop, following_crop
                ),
            })

        summaries.append({
            "rotation_id": rotation["rotation_id"],
            "name": rotation["name"],
            "season_count": len(rotation["seasons"]),
            "distinct_crop_count": len(counts),
            "repeated_crop_occurrences": sum(count - 1 for count in counts.values()),
            "crop_sequence": crops,
            "crop_counts": dict(sorted(counts.items())),
            "transitions": transitions,
            "transition_count": len(transitions),
            "season_details": season_details,
        })

    season_counts = {item["season_count"] for item in summaries}
    warnings = []
    if len(season_counts) > 1:
        warnings.append(
            "Rotations have different numbers of seasons; descriptive "
            "counts are not directly like-for-like."
        )

    return {
        "schema_version": "1.0",
        "assessment_status": "descriptive_only_awaiting_agronomic_validation",
        "ranking": None,
        "scores": None,
        "recommendation": None,
        "agronomic_rule_status": {
            "mode": "reviewed_research_observations_only",
            "draft_decision_rules_activated": False,
            "sources_reviewed": ["S01", "S13", "S15"],
            "local_validation": "not_performed",
        },
        "comparison_warnings": warnings,
        "rotation_summaries": summaries,
        "data_context": _dataset_context(environmental_path, soil_path),
        "not_assessed": [
            "crop suitability",
            "yield or profitability",
            "pest, disease, or weed pressure",
            "soil nutrient response",
            "water stress",
            "climate adaptation",
            "field-specific rotation benefit or penalty",
        ],
        "validation_note": (
            "Research notes are limited to directly reviewed sources and "
            "retain their study limitations. They are not locally validated "
            "predictions or agronomic recommendations. No scores or rankings "
            "are calculated."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a descriptive FIELD SHIFT crop-rotation comparison."
    )
    parser.add_argument("--input", required=True, help="Rotation scenario JSON.")
    parser.add_argument(
        "--environmental",
        default=APPROVED_ENVIRONMENTAL_FILE,
        help="Optional monthly NASA POWER JSON path.",
    )
    parser.add_argument(
        "--soil",
        default=APPROVED_SOIL_FILE,
        help="Optional SoilGrids JSON path.",
    )
    parser.add_argument(
        "--output",
        default="data/processed/rotation_comparison_preview.json",
        help="Output JSON path.",
    )
    args = parser.parse_args()

    payload = _read_json(args.input)
    result = compare_rotations(
        payload,
        environmental_path=args.environmental,
        soil_path=args.soil,
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False, allow_nan=False)

    print("FIELD SHIFT DESCRIPTIVE ROTATION COMPARISON COMPLETE")
    print("Output:", output_path)
    print("Rotations compared:", len(result["rotation_summaries"]))
    print("Assessment:", result["assessment_status"])
    print("Agronomic scores: not calculated")


if __name__ == "__main__":
    main()
