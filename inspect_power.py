
import json
from pathlib import Path

file_path = Path(
    "data/raw/nasa_power_story_county_point_2020_2025.json"
)

with file_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

print("=== NASA POWER IOWA INSPECTION ===")

header = data.get("header", {})
parameters = data.get("properties", {}).get("parameter", {})

print("\nLocation metadata:")
print(json.dumps(header, indent=2))

print("\nAvailable variables:")

for name, records in parameters.items():
    values = list(records.values())

    valid = []
    missing = []

    for value in values:
        try:
            number = float(value)
            if number <= -999:
                missing.append(value)
            else:
                valid.append(number)
        except (TypeError, ValueError):
            missing.append(value)

    print(f"\nVariable: {name}")
    print("Total records:", len(values))
    print("Valid records:", len(valid))
    print("Missing records:", len(missing))
    print("First 3 records:", list(records.items())[:3])

print("\n=== INSPECTION COMPLETE ===")
