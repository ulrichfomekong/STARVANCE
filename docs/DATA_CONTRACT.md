# FIELD SHIFT backend data contract — Story County, Iowa

**Status:** MVP technical contract, version 1.0  
**Pilot:** Story County, Iowa, USA  
**Scope:** Python/data/backend only. This document does not define frontend implementation.

## 1. Current processed inputs

### A. Monthly environmental context

**File:** `data/processed/iowa_monthly_environmental.json`  
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

**File:** `data/processed/iowa_soil_context.json`  
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
5. Distinguish observed/source-provided, modelled, derived, and assumed information.
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

`crop` is a team-provided crop label. The engine does not maintain a crop catalogue or infer crop identity. `cover_crop` is optional and is only used to attach a cited study note where the crop pairing has been reviewed. Season labels are descriptive labels supplied by the caller; the engine does not decide planting or harvest dates.

## 4. Descriptive engine output contract

`rotation_engine.py` returns:
- `assessment_status`: `descriptive_only_awaiting_agronomic_validation`
- `ranking`, `scores`, `recommendation`: `null`
- `agronomic_rule_status`: identifies reviewed-research-only mode, confirms draft rules are not activated, and lists source-review/local-validation status
- `rotation_summaries`: season count, distinct crop count, repeated crop occurrences, ordered crop sequence, crop counts, and adjacent crop transitions; transitions and season details may include cited, study-scoped research observations with explicit source-review and local-validation status
- `comparison_warnings`: basic structural warnings such as unequal sequence lengths
- `data_context`: availability and high-level provenance of the monthly environmental and soil files
- `not_assessed`: explicit list of agronomic topics not evaluated
- `validation_note`: statement that research observations are not locally validated predictions or recommendations

The engine does **not** calculate crop suitability, yield, profitability, pest/disease pressure, nutrient response, water stress, climate adaptation, or field-specific rotation benefit/penalty. Research observations are limited to directly reviewed sources (currently S01, S13, and S15), are cited in the output, and include study limitations. Such notes do not activate unvalidated draft rules or produce a score or recommendation.

## 5. Agronomic integration gate

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

## 6. Suggested repository placement

```text
STARVANCE/
├── data/
│   ├── raw/
│   └── processed/
│       ├── iowa_environmental.json
│       ├── iowa_monthly_environmental.json
│       └── iowa_soil_context.json
├── backend/
│   └── rotation_engine.py
├── docs/
│   └── DATA_CONTRACT.md
└── tests/
    └── test_rotation_engine.py
```

The supplied package keeps the engine and tests at its root for easy copying. The team can move them into the folders above if that matches the existing repository layout.
