
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
INPUT_FILE = ROOT / "data" / "processed" / "environmental.json"
OUTPUT_FILE = ROOT / "data" / "processed" / "monthly_environmental.json"

with INPUT_FILE.open("r", encoding="utf-8") as f:
    data = json.load(f)

months = defaultdict(lambda: defaultdict(list))

for record in data["records"]:
    month = record["date"][:7]

    for variable in [
        "temperature_mean_c",
        "temperature_max_c",
        "temperature_min_c",
        "precipitation_mm_day",
        "relative_humidity_percent",
    ]:
        value = record.get(variable)

        if value is not None:
            months[month][variable].append(value)

monthly_records = []

for month in sorted(months):
    values = months[month]

    def average(name):
        items = values[name]
        return round(sum(items) / len(items), 2) if items else None

    precipitation = values["precipitation_mm_day"]

    monthly_records.append({
        "month": month,
        "mean_temperature_c": average("temperature_mean_c"),
        "mean_daily_max_temperature_c": average("temperature_max_c"),
        "mean_daily_min_temperature_c": average("temperature_min_c"),
        "total_precipitation_mm": (
            round(sum(precipitation), 2)
            if precipitation else None
        ),
        "mean_relative_humidity_percent": average(
            "relative_humidity_percent"
        ),
        "days_with_precipitation_data": len(precipitation),
    })

output = {
    "location": data["location"],
    "source": data["source"],
    "method": {
        "temperature": "Monthly average of valid daily values",
        "precipitation": "Sum of valid daily precipitation values",
        "humidity": "Monthly average of valid daily values",
    },
    "record_count": len(monthly_records),
    "records": monthly_records,
}

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("=== MONTHLY AGGREGATION COMPLETE ===")
print("Monthly records:", len(monthly_records))
print("Output:", OUTPUT_FILE)
print("\nFirst 3 months:")

for record in monthly_records[:3]:
    print(json.dumps(record, indent=2))
