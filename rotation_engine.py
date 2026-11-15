"""
FIELD SHIFT — descriptive crop-rotation comparison foundation.

This module deliberately does NOT calculate crop suitability, yield, risk scores,
or recommend a rotation. Those require agronomic rules validated by the project
agronomy lead (Person 3).

Python standard library only.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


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


def _validate_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
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

            clean_seasons.append({
                "year": year,
                "season": season_label.strip(),
                "crop": crop.strip(),
            })

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
        "pilot_geography": {
            "country": "USA",
            "state": "Iowa",
            "county": "Story County",
        },
        "environmental_dataset": {"available": False},
        "soil_dataset": {"available": False},
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
        metadata = soil.get("metadata", {})
        context["soil_dataset"] = {
            "available": True,
            "source": metadata.get("source"),
            "spatial_scope": metadata.get("spatial_scope"),
            "depth": metadata.get("depth"),
            "properties": sorted(soil.get("properties", {}).keys())
            if isinstance(soil.get("properties"), dict)
            else None,
        }

    return context


def compare_rotations(
    payload: dict[str, Any],
    environmental_path: str | Path | None = None,
    soil_path: str | Path | None = None,
) -> dict[str, Any]:
    """
    Return descriptive sequence metrics only.

    No agronomic interpretation or ranking is performed.
    """
    rotations = _validate_payload(payload)
    summaries = []

    for rotation in rotations:
        crops = [item["crop"] for item in rotation["seasons"]]
        counts = Counter(crops)
        transitions = [
            {"from_crop": crops[index], "to_crop": crops[index + 1]}
            for index in range(len(crops) - 1)
        ]

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
            "season_details": rotation["seasons"],
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
            "rotation benefit or penalty",
        ],
        "validation_note": (
            "Crop-specific interpretation must wait for agronomic rules and "
            "evidence validated by the project agronomy lead. Descriptive "
            "sequence metrics are not agronomic recommendations."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a descriptive FIELD SHIFT crop-rotation comparison."
    )
    parser.add_argument("--input", required=True, help="Rotation scenario JSON.")
    parser.add_argument(
        "--environmental",
        default="data/processed/iowa_monthly_environmental.json",
        help="Optional monthly NASA POWER JSON path.",
    )
    parser.add_argument(
        "--soil",
        default="data/processed/iowa_soil_context.json",
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
