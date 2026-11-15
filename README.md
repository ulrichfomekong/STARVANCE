# SOSCOPE

SOSCOPE is an exploratory crop-rotation application for the Story County, Iowa pilot.

## Project layout

- `frontend/` contains the React/Vite app and builds to `frontend/dist/`.
- `backend/` contains the Python API, descriptive rotation engine, tests, approved datasets, data-processing scripts, and supporting research.
- Root package scripts preserve the current Figma Make preview workflow.

## Run locally

Install frontend dependencies once:

```powershell
npm install
```

Then use two terminals from the repository root:

```powershell
npm run dev:api
npm run dev
```

The Python API listens on `127.0.0.1:8765`; Vite proxies `/api` requests to it. Set `SOSCOPE_API_PORT` to change the API port and update the Vite proxy if using a different port. The previous `FIELD_SHIFT_API_PORT` name remains supported for existing setups.

## Data scope

- NASA POWER monthly environmental data: `backend/data/processed/iowa_monthly_environmental.json`
- SoilGrids soil context: `backend/data/processed/iowa_soil_context.json`
- API health and data endpoints: `/api/health`, `/api/context`, and `/api/compare`

Both data sources describe a single Story County reference point, not the whole county or an individual field. SoilGrids values are modelled estimates at 0–5 cm depth.

Rotation comparisons report sequence structure and attach only directly reviewed, study-scoped research observations where applicable. Draft agronomic rules remain disabled; the application does not calculate suitability, scores, rankings, yield, or recommendations.

## Validation

```powershell
npm run test:backend
npm run build
```

## Deployment

- Build the frontend with `npm run build`; publish the contents of `frontend/dist/`.
- Run the backend from the repository root with `python backend/backend_api.py`. Configure `SOSCOPE_API_HOST=0.0.0.0` and `PORT` for a hosted service. The previous `FIELD_SHIFT_API_HOST` name remains supported for existing setups.
- Production hosting must route `/api` requests from the frontend to the backend. The Vite proxy is for local development only.
