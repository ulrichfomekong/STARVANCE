# Project instructions

FIELD SHIFT is a Story County, Iowa exploratory crop-rotation application.

## Data and agronomic scope

- Use the approved NASA POWER and SoilGrids inputs under `data/processed/`.
- Treat environmental and soil values as reference-point data, not county-wide or field-level measurements.
- Keep rotation comparisons descriptive. Do not activate unvalidated decision rules, scores, rankings, or recommendations.
- Preserve source attribution, units, periods, and spatial limitations when adding data flows.

## Application structure

- The React/Vite frontend lives in `src/`.
- The Python rotation engine and local HTTP API are `rotation_engine.py` and `backend_api.py`.
- Run the API with `npm run dev:api` and the frontend with `npm run dev`.
- Vite proxies `/api` requests to the local API on port 8765.
- Run backend tests with `npm run test:backend` and validate the frontend with `npm run build`.
