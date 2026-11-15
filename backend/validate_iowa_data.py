
import json
import calendar
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MONTHLY_FILE = ROOT / "data" / "processed" / "iowa_monthly_environmental.json"
SOIL_FILE = ROOT / "data" / "processed" / "iowa_soil_context.json"

EXPECTED_LATITUDE = 42.0361668
EXPECTED_LONGITUDE = -93.4650441

def load_json(path):
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def check(condition, message):
    if not condition:
        raise ValueError(message)

def is_finite_number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def validate_monthly_data():
    data = load_json(MONTHLY_FILE)
    metadata = data["metadata"]
    records = data["monthly_records"]

    check(metadata["state"] == "Iowa", "Wrong state")
    check(metadata["county"] == "Story County", "Wrong county")
    check(
        abs(metadata["latitude"] - EXPECTED_LATITUDE) < 0.000001,
        "Unexpected latitude"
    )
    check(
        abs(metadata["longitude"] - EXPECTED_LONGITUDE) < 0.000001,
        "Unexpected longitude"
    )

    check(len(records) == 72, "Expected 72 monthly records")
    check(metadata["record_count"] == len(records),
          "record_count does not match monthly records")

    expected_months = []
    for year in range(2020, 2026):
        for month in range(1, 13):
            expected_months.append(f"{year}-{month:02d}")

    actual_months = [record["month"] for record in records]
    check(actual_months == expected_months,
          "Months are missing, duplicated, or out of order")

    for record in records:
        month = record["month"]
        year, month_number = map(int, month.split("-"))
        expected_days = calendar.monthrange(year, month_number)[1]

        check(record["days_in_source"] == expected_days,
              f"{month}: unexpected source day count")

        check(
            record["valid_precipitation_days"] <= expected_days,
            f"{month}: invalid precipitation coverage"
        )

        for field in [
            "temperature_mean_c",
            "temperature_max_mean_c",
            "temperature_min_mean_c",
            "precipitation_total_mm",
            "relative_humidity_mean_percent",
        ]:
            check(
                is_finite_number(record[field]),
                f"{month}: invalid value for {field}"
            )

        check(
            record["precipitation_total_mm"] >= 0,
            f"{month}: negative precipitation"
        )

        check(
            0 <= record["relative_humidity_mean_percent"] <= 100,
            f"{month}: humidity outside 0-100%"
        )

        check(
            record["temperature_max_mean_c"]
            >= record["temperature_mean_c"],
            f"{month}: maximum temperature mean below mean temperature"
        )

        check(
            record["temperature_mean_c"]
            >= record["temperature_min_mean_c"],
            f"{month}: mean temperature below minimum temperature mean"
        )

    aggregation = metadata.get("aggregation", {})
    check(aggregation.get("time_step") == "monthly",
          "Monthly aggregation metadata missing")

    print("PASS: Iowa monthly environmental data")
    print(f"      Records: {len(records)}")
    print(f"      Period: {actual_months[0]} to {actual_months[-1]}")


def validate_soil_data():
    data = load_json(SOIL_FILE)
    location = data["location"]
    properties = data["properties"]

    check(location["state"] == "Iowa", "Wrong soil state")
    check(location["country"] == "USA", "Wrong soil country")

    check(
        abs(location["latitude"] - EXPECTED_LATITUDE) < 0.000001,
        "Unexpected soil latitude"
    )
    check(
        abs(location["longitude"] - EXPECTED_LONGITUDE) < 0.000001,
        "Unexpected soil longitude"
    )

    expected_properties = {"clay", "nitrogen", "phh2o", "soc"}
    check(set(properties.keys()) == expected_properties,
          "Unexpected or missing soil properties")

    expected_units = {
        "clay": "%",
        "nitrogen": "g/kg",
        "phh2o": "pH",
        "soc": "g/kg",
    }

    for name, expected_unit in expected_units.items():
        item = properties[name]

        check(item["unit"] == expected_unit,
              f"{name}: unexpected output unit")

        check(is_finite_number(item["value"]),
              f"{name}: invalid converted value")

        check(is_finite_number(item["raw_value"]),
              f"{name}: invalid raw value")

        check(item["depth_interval"] == "0-5 cm",
              f"{name}: unexpected depth interval")

        check(item["statistic"] == "mean",
              f"{name}: unexpected statistic")

    check(data["source"] == "ISRIC SoilGrids 2.0",
          "Unexpected soil data source")

    check(
        data["source_type"] == "Modelled soil property estimates",
        "Soil estimates must be identified as modelled"
    )

    print("PASS: Iowa SoilGrids data")
    print(f"      Properties: {len(properties)}")
    print("      Depth: 0-5 cm")


if __name__ == "__main__":
    validate_monthly_data()
    validate_soil_data()
    print("\nAll Iowa processed-data checks passed.")
    print("Note: structural checks do not independently verify scientific accuracy.")
