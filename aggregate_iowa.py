import json
import math
import calendar
from pathlib import Path
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean

INPUT_FILE = Path("data/processed/iowa_environmental.json")
OUTPUT_FILE = Path("data/processed/iowa_monthly_environmental.json")

EXPECTED_START_DATE = date(2020, 1, 1)
EXPECTED_END_DATE = date(2025, 12, 31)
EXPECTED_DAILY_RECORDS = 2192
EXPECTED_MONTHLY_RECORDS = 72

NUMERIC_FIELDS = (
    "temperature_mean_c",
    "temperature_max_c",
    "temperature_min_c",
    "precipitation_mm_day",
    "relative_humidity_percent",
)


def is_valid_number(value):
    """True for finite numeric values; False for None, booleans, and non-finite values."""
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def load_and_validate_daily_data():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}. "
            "Run process_power.py first."
        )

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("Input JSON root must be an object.")

    if not isinstance(data.get("metadata"), dict):
        raise ValueError("Input JSON must contain a metadata object.")

    daily_records = data.get("daily_records")
    if not isinstance(daily_records, list) or not daily_records:
        raise ValueError("Input JSON must contain a non-empty daily_records list.")

    if len(daily_records) != EXPECTED_DAILY_RECORDS:
        raise ValueError(
            f"Expected {EXPECTED_DAILY_RECORDS} daily records, "
            f"found {len(daily_records)}."
        )

    parsed_dates = []
    seen_dates = set()

    for index, record in enumerate(daily_records):
        if not isinstance(record, dict):
            raise ValueError(f"Daily record {index} must be a JSON object.")

        date_text = record.get("date")
        if not isinstance(date_text, str):
            raise ValueError(f"Daily record {index} has no valid date string.")

        try:
            record_date = date.fromisoformat(date_text)
        except ValueError as error:
            raise ValueError(
                f"Daily record {index} has an invalid date: {date_text}"
            ) from error

        if record_date.isoformat() != date_text:
            raise ValueError(
                f"Daily record {index} date must use YYYY-MM-DD: {date_text}"
            )

        if record_date in seen_dates:
            raise ValueError(f"Duplicate daily date found: {date_text}")

        seen_dates.add(record_date)
        parsed_dates.append(record_date)

        for field in NUMERIC_FIELDS:
            if field not in record:
                raise ValueError(
                    f"Daily record {date_text} is missing field '{field}'."
                )

            value = record[field]
            if value is not None and not is_valid_number(value):
                raise ValueError(
                    f"Daily record {date_text} has a non-finite or "
                    f"non-numeric value in '{field}': {value!r}"
                )

    ordered_dates = sorted(parsed_dates)

    if ordered_dates[0] != EXPECTED_START_DATE:
        raise ValueError(
            f"Expected first date {EXPECTED_START_DATE}, "
            f"found {ordered_dates[0]}."
        )

    if ordered_dates[-1] != EXPECTED_END_DATE:
        raise ValueError(
            f"Expected last date {EXPECTED_END_DATE}, "
            f"found {ordered_dates[-1]}."
        )

    expected_dates = {
        EXPECTED_START_DATE + timedelta(days=offset)
        for offset in range(EXPECTED_DAILY_RECORDS)
    }

    if seen_dates != expected_dates:
        missing_dates = sorted(expected_dates - seen_dates)
        extra_dates = sorted(seen_dates - expected_dates)
        raise ValueError(
            "Daily date series is not complete. "
            f"Missing dates (first 5): {missing_dates[:5]}; "
            f"unexpected dates (first 5): {extra_dates[:5]}."
        )

    return data, daily_records


def average_or_none(values):
    return round(mean(values), 2) if values else None


def sum_or_none(values):
    return round(sum(values), 2) if values else None


def main():
    data, daily_records = load_and_validate_daily_data()

    monthly_groups = defaultdict(list)

    for record in daily_records:
        month_key = record["date"][:7]
        monthly_groups[month_key].append(record)

    monthly_records = []

    for month, records in sorted(monthly_groups.items()):
        temperatures = [
            r["temperature_mean_c"]
            for r in records
            if r["temperature_mean_c"] is not None
        ]

        maximum_temperatures = [
            r["temperature_max_c"]
            for r in records
            if r["temperature_max_c"] is not None
        ]

        minimum_temperatures = [
            r["temperature_min_c"]
            for r in records
            if r["temperature_min_c"] is not None
        ]

        precipitation = [
            r["precipitation_mm_day"]
            for r in records
            if r["precipitation_mm_day"] is not None
        ]

        humidity = [
            r["relative_humidity_percent"]
            for r in records
            if r["relative_humidity_percent"] is not None
        ]

        year, month_number = (int(part) for part in month.split("-"))
        expected_days = calendar.monthrange(year, month_number)[1]

        if len(records) != expected_days:
            raise ValueError(
                f"{month} contains {len(records)} daily records; "
                f"expected {expected_days}."
            )

        monthly_records.append({
            "month": month,

            "temperature_mean_c": average_or_none(temperatures),

            "temperature_max_mean_c": average_or_none(
                maximum_temperatures
            ),

            "temperature_min_mean_c": average_or_none(
                minimum_temperatures
            ),

            "precipitation_total_mm": sum_or_none(precipitation),

            "relative_humidity_mean_percent": average_or_none(humidity),

            "days_in_source": len(records),
            "valid_precipitation_days": len(precipitation)
        })

    if len(monthly_records) != EXPECTED_MONTHLY_RECORDS:
        raise ValueError(
            f"Expected {EXPECTED_MONTHLY_RECORDS} monthly records, "
            f"found {len(monthly_records)}."
        )

    # Preserve existing source metadata and add explicit aggregation details.
    metadata = {
        **data["metadata"],
        "aggregation": {
            "time_step": "monthly",
            "temperature_method": "Average of valid daily values",
            "humidity_method": "Average of valid daily values",
            "precipitation_method": (
                "Sum of valid daily corrected precipitation values"
            ),
            "source_variable_units": {
                "T2M": "degrees Celsius (°C)",
                "T2M_MAX": "degrees Celsius (°C)",
                "T2M_MIN": "degrees Celsius (°C)",
                "PRECTOTCORR": "millimetres per day (mm/day)",
                "RH2M": "percent (%)"
            },
            "output_variable_units": {
                "temperature_mean_c": "degrees Celsius (°C)",
                "temperature_max_mean_c": "degrees Celsius (°C)",
                "temperature_min_mean_c": "degrees Celsius (°C)",
                "precipitation_total_mm": (
                    "millimetres accumulated over the month (mm/month)"
                ),
                "relative_humidity_mean_percent": "percent (%)"
            },
            "record_count_definition": (
                "record_count and monthly_record_count refer to monthly "
                "output records; source_daily_record_count refers to "
                "daily input records."
            ),
            "note": (
                "Monthly summaries are derived from a single NASA POWER "
                "point extraction at the Story County reference coordinates. "
                "They are not county-wide averages or field-level measurements."
            )
        },
        "record_count": len(monthly_records),
        "monthly_record_count": len(monthly_records),
        "source_daily_record_count": len(daily_records)
    }

    output = {
        "metadata": metadata,
        "monthly_records": monthly_records
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(output, file, indent=2, allow_nan=False)

    print("IOWA MONTHLY AGGREGATION COMPLETE")
    print("Output:", OUTPUT_FILE)
    print("Source daily records:", len(daily_records))
    print("Monthly records:", len(monthly_records))
    print("Period:", monthly_records[0]["month"], "to", monthly_records[-1]["month"])
    print("Monthly precipitation output unit: mm/month")

    print("\nFirst 3 months:")
    for record in monthly_records[:3]:
        print(json.dumps(record, indent=2))

    print("\nLast month:")
    print(json.dumps(monthly_records[-1], indent=2))

    print("\nVALIDATION PASSED: daily input and monthly output checks.")


if __name__ == "__main__":
    main()
