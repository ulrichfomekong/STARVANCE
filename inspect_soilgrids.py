from pathlib import Path
import rasterio
from rasterio.warp import transform

DATA_DIR = Path("data/raw")
LAT = 42.0361668
LON = -93.4650441

files = sorted(DATA_DIR.glob("soilgrids_*.tif"))

if not files:
    raise SystemExit("No SoilGrids GeoTIFF files found in data/raw.")

for path in files:
    print("\n" + "=" * 75)
    print(f"FILE: {path.name}")

    try:
        with rasterio.open(path) as ds:
            print(f"Dimensions: {ds.width} columns x {ds.height} rows")
            print(f"Bands: {ds.count}")
            print(f"CRS: {ds.crs}")
            print(f"Bounds: {ds.bounds}")
            print(f"Resolution: {ds.res}")
            print(f"NoData value: {ds.nodata}")
            print(f"Band descriptions: {ds.descriptions}")
            print(f"Dataset tags: {ds.tags()}")
            print(f"Band 1 tags: {ds.tags(1)}")

            if ds.crs is None:
                print("Cannot sample: raster has no CRS.")
                continue

            # Transform the Story County point into the raster's CRS.
            if ds.crs.to_epsg() == 4326:
                x, y = LON, LAT
            else:
                x_values, y_values = transform(
                    "EPSG:4326", ds.crs, [LON], [LAT]
                )
                x, y = x_values[0], y_values[0]

            if not (
                ds.bounds.left <= x <= ds.bounds.right
                and ds.bounds.bottom <= y <= ds.bounds.top
            ):
                print("Story County reference point is outside this raster.")
                continue

            row, col = ds.index(x, y)
            sample = next(ds.sample([(x, y)], indexes=1, masked=True))

            if sample.mask:
                print(f"Sample at row {row}, column {col}: NoData")
            else:
                print(f"Sample at row {row}, column {col}: {sample[0]}")
                print("NOTE: This is the raw raster value, not a converted soil value.")

    except Exception as exc:
        print(f"ERROR reading raster: {exc}")

print("\nInspection complete.")
