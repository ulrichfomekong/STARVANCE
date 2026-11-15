# SOSCOPE backend data contract — Story County, Iowa

**Status:** MVP technical contract, version 1.0  
**Pilot:** Story County, Iowa, USA  
**Scope:** Python/data/backend only. This document does not define frontend implementation.

## 1. Current processed inputs

### A. Monthly environmental context

**File:** `backend/data/processed/iowa_monthly_environmental.json`  
**Source:** NASA POWER Daily API, community `AG`  
**Source period:** 2020-01-01 through 2025-12-31  
**Source records:** 2,192 daily records  
**Processed records:** 72 monthly records  
**Reference point:** latitude `42.0361668`, longitude `-93.4650441`  
**Spatial meaning:** one reference-point extraction; not a county-wide average and not field-level data.

Each item in `monthly_records` uses the existing stable keys:

| Field | Meaning | Output unit / interpretation |
|---|---|---|
| `month` | Calendar month, `YYYY-MM` | Month identifier |
| `temperature_mean_c` | Average of valid daily mean temperatures | °C |
| `temperature_max_mean_c` | Average of valid daily maximum temperatures | °C |
| `temperature_min_mean_c` | Average of valid daily minimum temperatures | °C |
| `precipitation_total_mm` | Sum of valid daily corrected precipitation values | mm accumulated over month |
| `relative_humidity_mean_percent` | Average of valid daily relative humidity | % |
| `days_in_source` | Number of daily source records grouped into month | days |
| `valid_precipitation_days` | Daily records with a non-null precipitation value | days |

The source daily precipitation unit is `mm/day`; after summing daily values, the monthly output is an accumulation in `mm/month` (equivalently, millimetres accumulated during that month). Do not label the monthly total as `mm/day`.

The output metadata distinguishes:
- `record_count` / `monthly_record_count`: monthly output record count (72).
- `source_daily_record_count`: daily input record count (2,192).

Temperature and humidity monthly values are arithmetic means of valid daily values. Monthly precipitation is the sum of valid daily values. Missing daily values are excluded from the relevant aggregation; consumers should inspect valid-day counts rather than assume every metric has complete coverage.

### B. Soil context

**File:** `backend/data/processed/iowa_soil_context.json`  
**Source:** ISRIC SoilGrids 2.0 raster layers downloaded by the team  
**Reference point:** same Story County reference point  
**Spatial meaning:** a single raster pixel at the reference point, not a county-wide or field-level soil survey.  
**Depth:** 0–5 cm  
**Statistic:** mean prediction layer  
**Interpretation:** modelled estimates, not laboratory measurements. The selected mean layers do not provide a prediction interval in the current processed output.

Current properties and converted values:

| Property | Converted value | Unit | Raw value | Raw unit |
|---|---:|---|---:|---|
| Clay | 28.4 | % | 284 | g/kg |
| Nitrogen | 3.08 | g/kg | 308 | cg/kg |
| pH in water | 6.4 | pH | 64 | pH × 10 |
| Soil organic carbon | 24.5 | g/kg | 245 | dg/kg |

The conversion factors and raw units are recorded by the processing workflow. Do not silently reinterpret these values as whole-profile or root-zone properties.

## 2. Data-use rules

1. Keep Story County, Iowa as the only validated functional pilot geography.
2. Do not present the reference point as a county average, farm, field, or field boundary.
3. Do not present SoilGrids estimates as lab measurements.
4. Preserve source, period, coordinates, depth, statistic, units, aggregation method, and limitations when passing data downstream.
5. Distinguish measured, modelled, derived, and assumed information without inferring a class that the source metadata does not support:
   - No ground-measured weather, soil, or field-yield values are included.
   - SoilGrids properties are modelled estimates.
   - Monthly weather aggregates and rotation summaries are derived values.
   - No numeric yield, profitability, or crop-performance assumptions are used. Crop order is manually arranged or shuffled from the user's selected crops.
6. Do not infer crop suitability, yield, profitability, or agronomic risk from these context values alone.
7. Do not add datasets or data providers outside the team's approved competition resource sheet without team approval.
8. Keep calculations deterministic and explainable. No opaque composite score.

## 3. Rotation scenario input contract

The descriptive engine accepts a JSON object with at least two rotations:

```json
{
  "pilot": {
    "country": "USA",
    "state": "Iowa",
    "county": "Story County"
  },
  "rotations": [
    {
      "rotation_id": "rotation_1",
      "name": "Scenario 1",
      "seasons": [
        {"year": 1, "season": "Season 1", "crop": "Team-validated crop name"},
        {
          "year": 2,
          "season": "Season 2",
          "crop": "Team-validated crop name",
          "cover_crop": "Optional cover crop label"
        }
      ]
    },
    {
      "rotation_id": "rotation_2",
      "name": "Scenario 2",
      "seasons": [
        {"year": 1, "season": "Season 1", "crop": "Team-validated crop name"},
        {"year": 2, "season": "Season 2", "crop": "Team-validated crop name"}
      ]
    }
  ]
}
```

`crop` must be Corn, Soybean, Oats, or Alfalfa (case-insensitive); the frontend exposes this set and the backend rejects any other value. `cover_crop` is optional and currently supports Cereal rye (including the `rye` and `cereal_rye` API aliases) or no cover crop. It is only used to attach a cited study note where the crop pairing has been reviewed. Season labels are descriptive labels supplied by the caller; the engine does not decide planting or harvest dates.

In the planner, users enter crops separately for each scenario. The current interface supports two to four scenarios. For each one, they can shuffle the crop list or arrange the sequence manually before generating it. Shuffling keeps each crop paired with its selected cover crop. Once all active sequences are generated, users can compare descriptive patterns and choose which scenario to use; the comparison does not rank them.

## 4. Descriptive engine output contract

`backend/rotation_engine.py` returns:
- `assessment_status`: `descriptive_only_awaiting_agronomic_validation`
- `ranking`, `scores`, `recommendation`: `null`
- `agronomic_rule_status`: identifies reviewed-research-only mode, confirms draft rules are not activated, and lists source-review/local-validation status; evidence usage is explicitly descriptive-only
- `rotation_summaries`: season count, distinct crop count, repeated crop occurrences, ordered crop sequence, crop counts, and adjacent crop transitions; transitions and season details may include cited, study-scoped research observations with explicit source-review and local-validation status
- `comparison_warnings`: basic structural warnings such as unequal sequence lengths
- `data_context`: availability and high-level provenance of the monthly environmental and soil files
- `not_assessed`: explicit list of agronomic topics not evaluated
- `validation_note`: statement that research observations are not locally validated predictions or recommendations

The engine does **not** calculate crop suitability, yield, profitability, pest/disease pressure, nutrient response, water stress, climate adaptation, or field-specific rotation benefit/penalty. Research observations are limited to directly reviewed sources (currently S01, S13, and S15), are cited in the output, and include study limitations. Such notes do not activate unvalidated draft rules or produce a score or recommendation.

Each emitted research observation includes
`usage_status: "descriptive_only_not_a_recommendation"`. The Person 3
`decision_rules.json` draft is not loaded by the backend. Its unresolved
nitrogen values, timing actions, and other unvalidated rules are not activated;
only the four source-reviewed observation pairings currently encoded in
`backend/rotation_engine.py` may appear.

## 5. Local HTTP API

`backend/backend_api.py` exposes the project data and descriptive comparison to the React app using Python's standard-library HTTP server. From the repository root, run `python backend/backend_api.py` or `npm run dev:api`; from the `backend/` directory, run `python backend_api.py`. It listens on `127.0.0.1:8765` by default. `SOSCOPE_API_HOST` changes the host, while `PORT` or `SOSCOPE_API_PORT` changes the port. The previous `FIELD_SHIFT_API_HOST` and `FIELD_SHIFT_API_PORT` variables remain supported for existing setups.

The React app loads project context from `/api/context` and submits user-edited rotation sequences to `/api/compare`. The frontend should not use separate bundled copies of the processed environmental or soil datasets.

The location views use an interactive Leaflet map with OpenStreetMap tiles, centered on the backend reference coordinate. The map displays required OpenStreetMap attribution and marks one reference point; it does not draw a county or field boundary. Map tiles require an internet connection.

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Basic API liveness check |
| `/api/context` | GET | Approved geography, coordinates, NASA POWER monthly records, SoilGrids properties, and limitations |
| `/api/compare` | POST | Validate two or more user-defined rotations and return descriptive metrics plus matching cited research observations |
| `/api/compare/insights` | POST | Optional OpenRouter-generated explanation for exactly two rotations; returns the deterministic comparison alongside validated, source-grounded insights |

The comparison endpoint always reads the approved NASA POWER and SoilGrids files; request data cannot select alternate datasets. Invalid rotation payloads receive a client error, and missing project files receive a service-unavailable response. The context endpoint reports unavailable or invalid source data as service unavailable. The development Vite server proxies `/api` to the local API; production hosting must provide an equivalent `/api` route to the backend.

The optional insights endpoint requires `OPENROUTER_API_KEY` in the backend process environment and uses `OPENROUTER_MODEL` when configured. It does not change or add a key requirement to `/api/compare`. It sends the validated crop sequences, deterministic metrics, approved environmental/soil context, and only source observations already emitted by the rotation engine to OpenRouter. The endpoint rejects malformed model output, numeric claims, extra score/ranking fields, and source IDs not attached to the relevant sequence. Its response is labelled AI-generated and includes a fixed validation notice; it is not an agronomic recommendation. The frontend does not yet call this endpoint.

## 6. Agronomic integration gate

Rules that go beyond study-scoped research observations remain disabled until validated by the project agronomy owner. Each future active rule should document:
- rule identifier and plain-language explanation
- crop(s) and sequence position/season to which it applies
- required input variable(s), unit(s), depth, period, and spatial applicability
- evidence/source from the approved resource sheet or team-validated agronomy reference
- threshold or logic, including whether it is a hard constraint or advisory indicator
- missing-data behavior
- uncertainty and known limitations
- validation owner and validation status

Until that review is complete, do not expose a numeric agronomic score or a “best rotation” recommendation. The current reviewed corn-rotation notes are single-study context from Iowa State's Nashua experiment; they are not local field predictions or fertilizer-rate advice.

## 7. Repository layout

```text
STARVANCE/
├── frontend/
│   ├── index.html
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── backend_api.py
│   ├── rotation_engine.py
│   ├── data/
│   │   ├── raw/
│   │   └── processed/
│   ├── docs/
│   ├── research/
│   └── tests/
```

The repository root retains workspace commands, shared agent instructions, and the development-server compatibility configuration.
