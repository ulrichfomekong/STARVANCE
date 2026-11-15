
import json
from pathlib import Path

import rasterio

# Project reference point: Story County, Iowa
LATITUDE = 42.0361668
LONGITUDE = -93.4650441

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "data" / "processed"

# Conversion factors documented for SoilGrids 2.0
SOIL_PROPERTIES = {
    "clay": {
        "file": "soilgrids_clay_0-5cm_mean_story_tile.tif",
        "raw_unit": "g/kg",
        "unit": "%",
        "factor": 10,
        "description": "Clay content",
    },
    "nitrogen": {
        "file": "soilgrids_nitrogen_0-5cm_mean_story_tile.tif",
        "raw_unit": "cg/kg",
        "unit": "g/kg",
        "factor": 100,
        "description": "Total nitrogen content",
    },
    "phh2o": {
        "file": "soilgrids_phh2o_0-5cm_mean_story_tile.tif",
        "raw_unit": "pH x 10",
        "unit": "pH",
        "factor": 10,
        "description": "Soil pH measured in water",
    },
    "soc": {
        "file": "soilgrids_soc_0-5cm_mean_story_tile.tif",
        "raw_unit": "dg/kg",
        "unit": "g/kg",
        "factor": 10,
        "description": "Soil organic carbon content",
    },
}

results = {}

for property_name, config in SOIL_PROPERTIES.items():
    raster_path = RAW_DIR / config["file"]

    if not raster_path.exists():
        raise FileNotFoundError(f"Missing raster: {raster_path}")

    with rasterio.open(raster_path) as dataset:
        if dataset.crs is None:
            raise ValueError(f"Missing CRS: {raster_path}")

        # Transform the reference point if the raster uses another CRS.
        if dataset.crs.to_epsg() == 4326:
            x, y = LONGITUDE, LATITUDE
        else:
            from rasterio.warp import transform
            x_values, y_values = transform(
                "EPSG:4326",
                dataset.crs,
                [LONGITUDE],
                [LATITUDE],
            )
            x, y = x_values[0], y_values[0]

        row, col = dataset.index(x, y)

        if not (0 <= row < dataset.height and 0 <= col < dataset.width):
            raise ValueError(
                f"Story County reference point is outside {raster_path.name}"
            )

        raw_value = dataset.read(1)[row, col].item()

        if dataset.nodata is not None and raw_value == dataset.nodata:
            raise ValueError(f"NoData value at reference point: {property_name}")

        if raw_value is None:
            raise ValueError(f"Missing value: {property_name}")

        converted_value = raw_value / config["factor"]

        results[property_name] = {
            "description": config["description"],
            "raw_value": raw_value,
            "raw_unit": config["raw_unit"],
            "value": round(converted_value, 4),
            "unit": config["unit"],
            "conversion_factor": config["factor"],
            "depth_interval": "0-5 cm",
            "statistic": "mean",
            "pixel": {
                "row": row,
                "column": col,
            },
            "crs": str(dataset.crs),
            "source_file": config["file"],
        }

        print(
            f"{property_name}: raw={raw_value}, "
            f"converted={converted_value:.4f} {config['unit']}"
        )

output = {
    "location": {
        "name": "Story County reference point",
        "state": "Iowa",
        "country": "USA",
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
    },
    "source": "ISRIC SoilGrids 2.0",
    "source_type": "Modelled soil property estimates",
    "depth_interval": "0-5 cm",
    "statistic": "mean",
    "properties": results,
    "limitations": [
        "Values are modelled estimates, not local laboratory measurements.",
        "Values represent the raster cells sampled at the reference point.",
        "A single reference point does not represent the whole county.",
        "The selected files contain mean predictions, not prediction uncertainty intervals.",
        "The data describe the 0-5 cm soil depth interval only.",
    ],
}

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

output_path = OUTPUT_DIR / "iowa_soil_context.json"

with output_path.open("w", encoding="utf-8") as file:
    json.dump(output, file, indent=2)

print("\nSoil processing completed.")
print(f"Output saved to: {output_path}")
