# SOSCOPE backend

The backend contains the local HTTP API, descriptive rotation engine, approved Story County context data, data-processing utilities, tests, and supporting research.

## Run locally

From the repository root:

```powershell
python backend/backend_api.py
```

Or use the root convenience script:

```powershell
npm run dev:api
```

The API reads the approved preprocessed files under `backend/data/processed/`. The engine and API use only the Python standard library. The SoilGrids processing utility additionally requires `rasterio`.

## Hosted service

Start the API with `python backend_api.py` when the service working directory is `backend/`, or `python backend/backend_api.py` from the repository root. Set `SOSCOPE_API_HOST=0.0.0.0` and let the hosting platform provide `PORT`. The previous `FIELD_SHIFT_API_HOST` name remains supported for existing setups. The default host remains `127.0.0.1` for local use.

Configure the frontend host or a reverse proxy to route `/api` to this service. Do not expose unreviewed research rules as active recommendations.

## Tests

From the repository root:

```powershell
npm run test:backend
```

The backend test modules can also be run from this directory with `python -m unittest discover -s tests -v`.
