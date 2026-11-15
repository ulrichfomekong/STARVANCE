
import json
from pathlib import Path

RAW_FILE = Path(
    "data/raw/nasa_power_story_county_point_2020_2025.json"
)

OUTPUT_FILE = Path(
    "data/processed/iowa_environmental.json"
)

LATITUDE = 42.0361668
LONGITUDE = -93.4650441

with RAW_FILE.open("r", encoding="utf-8") as f:
    raw_data = json.load(f)

header = raw_data.get("header", {})
parameters = raw_data["properties"]["parameter"]
metadata = raw_data.get("parameters", {})

fill_value = header.get("fill_value", -999.0)

# Check that the downloaded coordinates match our intended pilot point.
geometry = raw_data.get("geometry", {})
coordinates = geometry.get("coordinates", [])

if coordinates:
    actual_longitude, actual_latitude = coordinates[:2]

    if (
        abs(actual_latitude - LATITUDE) > 0.001
        or abs(actual_longitude - LONGITUDE) > 0.001
    ):
        raise ValueError(
            "Downloaded coordinates do not match the intended "
            "Story County pilot point."
        )

dates = sorted(parameters["T2M"].keys())
daily_records = []

for date in dates:
    record = {
        "date": f"{date[:4]}-{date[4:6]}-{date[6:8]}"
    }

    variable_mapping = {
        "T2M": "temperature_mean_c",
        "T2M_MAX": "temperature_max_c",
        "T2M_MIN": "temperature_min_c",
        "PRECTOTCORR": "precipitation_mm_day",
        "RH2M": "relative_humidity_percent",
    }

    for source_name, output_name in variable_mapping.items():
        value = parameters[source_name].get(date)

        if value is None or float(value) <= fill_value:
            record[output_name] = None
        else:
            record[output_name] = round(float(value), 2)

    daily_records.append(record)

output = {
    "metadata": {
        "project": "FIELD SHIFT",
        "state": "Iowa",
        "county": "Story County",
        "location_description": (
            "NASA POWER point extraction near Story County centroid"
        ),
        "spatial_scope": (
            "Single grid point; not a county-wide average "
            "or field-level measurement"
        ),
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "source": "NASA POWER Daily API",
        "api_version": header.get("api", {}).get("version"),
        "source_components": header.get("sources", []),
        "community": "AG",
        "time_standard": header.get("time_standard"),
        "start_date": "2020-01-01",
        "end_date": "2025-12-31",
        "record_count": len(daily_records),
        "variables": {
            name: {
                "description": metadata[name]["longname"],
                "unit": metadata[name]["units"],
            }
            for name in variable_mapping
        },
        "limitations": [
            "Point extraction does not represent a county-wide average.",
            "Data are environmental estimates, not field measurements.",
            "These variables alone do not establish crop yield or irrigation demand.",
        ],
    },
    "daily_records": daily_records,
}

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(output, f, indent=2)

print("IOWA PROCESSING COMPLETE")
print("Output:", OUTPUT_FILE)
print("Daily records:", len(daily_records))
print("First record:")
print(json.dumps(daily_records[0], indent=2))
print("Last record:")
print(json.dumps(daily_records[-1], indent=2))
