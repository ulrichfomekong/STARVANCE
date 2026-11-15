# FIELD SHIFT

FIELD SHIFT is an exploratory crop-rotation application for the Story County, Iowa pilot.

## Run locally

Use two terminals from the repository root:

```powershell
npm run dev:api
npm run dev
```

The Python API listens on `127.0.0.1:8765`; Vite proxies `/api` requests to it. Set `FIELD_SHIFT_API_PORT` to change the API port and update the Vite proxy if using a different port.

## Data scope

- NASA POWER monthly environmental data: `data/processed/iowa_monthly_environmental.json`
- SoilGrids soil context: `data/processed/iowa_soil_context.json`
- API health and data endpoints: `/api/health`, `/api/context`, and `/api/compare`

Both data sources describe a single Story County reference point, not the whole county or an individual field. SoilGrids values are modelled estimates at 0–5 cm depth.

Rotation comparisons report sequence structure and attach only directly reviewed, study-scoped research observations where applicable. Draft agronomic rules remain disabled; the application does not calculate suitability, scores, rankings, yield, or recommendations.

## Validation

```powershell
npm run test:backend
npm run build
```
