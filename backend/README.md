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

## Optional AI comparison insights

`POST /api/compare/insights` accepts the same JSON body as `/api/compare`, with exactly two rotations. It returns the existing deterministic result plus an AI-generated explanation. The endpoint requires `OPENROUTER_API_KEY`; the existing `/api/compare` route does not.

The backend sends the two crop sequences, deterministic metrics, approved NASA POWER/SoilGrids context, and only the research observations already returned by the rotation engine to OpenRouter. Do not include confidential farm details in requests. The AI response is checked for its structure, claim labels, numeric claims, and source IDs; approved evidence and citations are attached by the backend. This is still an AI-generated discussion aid, not validated agronomic advice. The frontend is not yet connected to this endpoint.

`.env.example` documents the variables but is not loaded automatically. In PowerShell, set the key in the backend process environment and start the API:

```powershell
$env:OPENROUTER_API_KEY = "replace-with-your-openrouter-api-key"
$env:OPENROUTER_MODEL = "openai/gpt-4o-mini"
python backend/backend_api.py
```

In another PowerShell terminal, send a request:

```powershell
$body = @'
{
  "rotations": [
    {
      "rotation_id": "a",
      "name": "Sequence A",
      "seasons": [
        {"year": 1, "season": "Season 1", "crop": "Soybean"},
        {"year": 2, "season": "Season 2", "crop": "Corn"}
      ]
    },
    {
      "rotation_id": "b",
      "name": "Sequence B",
      "seasons": [
        {"year": 1, "season": "Season 1", "crop": "Corn"},
        {"year": 2, "season": "Season 2", "crop": "Oats"}
      ]
    }
  ]
}
'@
Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/compare/insights" `
  -Method Post -ContentType "application/json" -Body $body
```

The API returns `503` with `code: "ai_unavailable"` when the key is missing, `503` when rate-limited, and a controlled `502` for provider/network or invalid-response failures. No API key is returned or logged by the application.

## Tests

From the repository root:

```powershell
npm run test:backend
```

The backend test modules can also be run from this directory with `python -m unittest discover -s tests -v`.
