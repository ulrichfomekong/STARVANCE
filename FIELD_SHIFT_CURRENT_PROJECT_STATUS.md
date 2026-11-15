# Current Project Status: SOSCOPE (formerly FIELD SHIFT)

**Audit date:** 2026-11-15
**Repository:** `ulrichfomekong/STARVANCE`
**Scope:** Read-only audit of the checked-out repository, its current frontend/backend, data, tests, and Person 3 deliverables. This report is the only file created for this audit.

## 1. Executive summary

SOSCOPE is a working local React/Vite frontend connected to a Python standard-library HTTP API. The current pilot is Story County, Iowa. The checked-in application loads a local NASA POWER monthly dataset and a SoilGrids soil-context file, shows their provenance and limitations, and compares user-defined crop sequences descriptively.

The application is **not yet an agronomic recommendation system**. It does not calculate yield, suitability, profitability, a risk score, or a best rotation. Its comparison metrics describe sequence structure; a small number of cited research observations are shown with limitations. Person 3's research, data, and draft decision rules are not loaded by the application, and the rules are explicitly kept inactive.

**Strongest verified readiness:** the current Iowa data files are present and structurally validate; the API/backend unit suite and frontend TypeScript check pass; and the two-scenario comparison flow is implemented.

**Main blockers to a defensible decision-support release:** no field-level or county-wide inputs, no agronomic validation/sign-off, unresolved Person 3 coordinate and evidence-register inconsistencies, malformed Person 3 CSV rows and a failing offline test, and no completed scientific/performance validation. The map is a reference point rather than a farm or county boundary. The HTML browser title also says “SOWSCOPE,” while the current product name elsewhere is “SOSCOPE.”

Status labels used below:
- **Verified in repository:** directly confirmed from current files or a local check.
- **Documented, not independently verified:** stated in project documents, but not confirmed against an external source or the original approval record.
- **Inference:** a conclusion drawn from the implementation and available evidence.
- **Needs confirmation:** a decision or approval that the repository cannot establish.

## 2. Project identity, purpose, and scope

- **Verified in repository:** current active branding is SOSCOPE in `README.md`, `AGENTS.md`, package metadata, API messages, and application content. `frontend/index.html` instead sets the browser title to “SOWSCOPE | Story County Crop Rotation Explorer.”
- **Verified in repository:** the stated project is an exploratory crop-rotation application for a Story County, Iowa pilot. The current instructions and `backend/docs/DATA_CONTRACT.md` restrict functional data to this pilot and require descriptive comparisons until agronomic validation is complete.
- **Documented, not independently verified:** older project planning documents refer to FIELD SHIFT, a NASA Space Apps challenge, and earlier pilot/design ideas. They are historical context, not a reliable description of what the current code does. One older planning document describes Cameroon and another proposes a different architecture; neither matches the current Story County implementation.
- **Needs confirmation:** the repository does not contain the official competition resource sheet or a final signed-off product brief. The exact contest requirements, approved data-provider list, and final user-facing promise cannot be independently established from the checked-in material.
- **Verified in repository:** there is no user registration, farm-account workflow, or field-location onboarding in the current frontend. The active application is a local pilot explorer, not the previously discussed sign-up flow.

## 3. Repository layout and application architecture

The current deployment-oriented structure is:

- `frontend/`: React 19, TypeScript, Vite, Tailwind CSS v4, and Leaflet UI.
- `backend/`: Python API, descriptive rotation engine, tests, approved data, data-processing code, and research material.
- Repository root: workspace scripts, shared instructions, lockfile, and Vite compatibility configuration.

The frontend requests `/api/context` and posts scenario sequences to `/api/compare`. The Vite development configuration proxies `/api` to the local backend, which listens on `127.0.0.1:8765` by default. The API reads project data from paths anchored to `backend/rotation_engine.py`, rather than depending on the shell's working directory.

There is no database in the current implementation. The application reads checked-in JSON files; selected UI state is stored in browser `localStorage`; scenario drafts and comparison results are not persisted by the backend.

**Verified in repository:** the frontend build is configured under `frontend/`; the Python API and engine are under `backend/`; and root package scripts expose frontend development/build/preview, API startup, formatting, and backend tests.

## 4. Current user-facing flow

1. The dashboard defaults to Iowa and loads the Story County reference-point climate and soil context from the API.
2. The location selector offers all 50 US states. The rest of the application does not have approved location-specific datasets for those other states.
3. A user creates two scenarios by entering crops for each, then either keeps the entered order or shuffles it. The user can also add scenarios (up to four) and select a scenario after seeing the comparison.
4. The frontend submits those sequences to the backend and presents sequence counts, transitions, and applicable research notes.
5. The user, not the model, chooses a scenario for their plan.

The interface supports manual sequence construction, but the shuffle operation is random ordering, not AI or environmental optimization. NASA POWER and SoilGrids context do not select crop order or influence the comparison metrics.

**Not implemented:** automatic agronomic scenario generation or a recommendation explaining why one scenario is scientifically better. The UI's selection of a scenario is a user choice, not a backend recommendation.

## 5. Frontend capabilities and limits

**Verified in repository:**
- Dashboard and methodology/data pages are implemented.
- Climate display uses the selected pilot context's monthly data; the checked-in Iowa period is January 2020 through December 2025.
- Soil cards present clay, nitrogen, pH, and soil organic carbon with SoilGrids provenance and a 0–5 cm depth caveat.
- The Leaflet map marks the Story County reference point and uses OpenStreetMap tiles with attribution.
- The application describes measured, modelled, derived, and assumed values. It states there are no included ground-measured weather, soil, or yield values; SoilGrids values are modelled; monthly weather and sequence summaries are derived; and crop outcomes are not assumed.
- Comparison indicators include growing seasons, different crops, crop changes, and repeated crops, each with a short explanation. These are structural summaries, not agronomic performance indicators.
- The comparison UI displays relevant research notes and source links for the limited observations returned by the backend.

**Limits:**
- The map marks a point, not a farm boundary, field boundary, county polygon, or area. No farm acreage is captured or shown.
- OpenStreetMap tiles require internet access; the map's basemap is not an offline asset.
- Non-Iowa state selections do not make other regional data available. The comparison flow reports that rotation comparisons are currently available only for Story County, Iowa.
- Provenance is presented, but uncertainty is qualitative. The SoilGrids input is a mean prediction layer without prediction intervals, and the current data do not quantify uncertainty for a whole county or an individual farm.
- There is no browser-level end-to-end test suite listed in the frontend package scripts.

## 6. Backend and API behavior

`backend/backend_api.py` uses Python's standard-library HTTP server. Its routes are:

- `GET /api/health`: liveness response.
- `GET /api/context`: approved geography, reference coordinates, monthly NASA POWER records, SoilGrids properties, and limitations.
- `POST /api/compare`: validates two or more rotations and returns descriptive sequence summaries and applicable cited observations.

The comparison engine:
- Accepts Corn, Soybean, Oats, and Alfalfa; optionally accepts Cereal rye as a cover crop.
- Requires at least two rotations but does not require exactly three years or a fixed sequence length.
- Checks basic payload shape, crop names, and pilot geography.
- Returns crop counts, sequence transitions, repeated-crop counts, structural warnings, and provenance.
- Explicitly returns null ranking, scores, and recommendation fields and lists agronomic topics it does not assess.
- Attaches a limited set of cited observations (sources S01, S13, S15) as descriptive-only, not locally validated recommendations.
- Does not load `decision_rules.json`.

The API handles malformed requests and missing approved data with explicit HTTP errors. A request body limit of 1 MB is enforced. The server binds to loopback by default; hosting can change the host via environment variables.

## 7. Active data: sources, coverage, and provenance

| Active file | Source and contents | Evidence and limitations |
|---|---|---|
| `backend/data/processed/iowa_monthly_environmental.json` | NASA POWER Daily API-derived monthly summaries for T2M, T2M maximum/minimum, corrected precipitation, and relative humidity. 72 monthly records, 2020-01 through 2025-12; derived from 2,192 daily records. | Metadata records NASA POWER API version, AG community, MERRA2/POWER components, UTC, units, aggregation methods, coordinates `42.0361668, -93.4650441`, and that this is a single point rather than a county average. |
| `backend/data/processed/iowa_soil_context.json` | ISRIC SoilGrids 2.0 mean raster estimates at 0–5 cm for clay, total nitrogen, pH in water, and soil organic carbon. | Values are 28.4%, 3.08 g/kg, pH 6.4, and 24.5 g/kg at the same reference point. The JSON identifies raw values/units, conversion factors, sampled raster pixel, CRS, source tile names, and limitations. These are modelled estimates, not lab results; mean layers do not provide prediction intervals. |

**Verified in repository:** the project data validator accepts the active files; the daily Iowa input has 2,192 continuous records from 2020-01-01 to 2025-12-31; and the stored SoilGrids raw values and conversions match the sampled raster pixel examined during the audit.

**Not included as active data sources:** USDA SSURGO, USDA Cropland Data Layer, NASA SMAP, and NASA GPM IMERG. The frontend lists GPM IMERG as a potential future source with status “Not available.” No active API route loads those providers.

## 8. Legacy, archived, and conflicting datasets

- `backend/data/processed/environmental.json` and `monthly_environmental.json`, together with `backend/aggregate_power.py`, belong to a separate Lubbock, Texas data pipeline and use a different schema. They are not the active Story County inputs. Their presence beside the Iowa data is a maintenance and operator-confusion risk.
- `backend/data/archive/frontend-static-copy/` contains older partial snapshots. The monthly snapshot has only three records and a different root/schema shape; the archived soil snapshot also differs from the active API contract. The active frontend calls the API rather than importing these snapshots.
- **Verified in repository:** the current engine explicitly restricts data paths to the approved Iowa files and rejects alternate dataset paths. This protects the active API from accidentally using the Lubbock or draft Person 3 data.
- The repository includes TIFF raster inputs and associated processed soil output. Raster metadata and stored pixel values were inspected; download date, exact upstream release/license, and prediction uncertainty are not established by the current metadata.
- **Needs confirmation:** whether the Lubbock pipeline and archived frontend snapshots are intentionally retained, required for a separate use, or should eventually be labelled/deprecated. This audit did not delete or alter them.

## 9. Person 3 deliverables: inventory and data

Person 3's deliverables are in `backend/research/Story-County/Story-County/`. The inspected human-readable files include:

- Collection and preparation: `collect_nasa_power.py`, `collect_ssurgo_story.py`.
- Local descriptive utilities: `field_profile.py`, `rotation_compare.py`.
- Offline checks: `test_offline.py`.
- Research/rule content: `research_report.md`, `decision_rules.json`, `crop_knowledge.csv`, `crop_interactions.csv`, `rotation_scenarios.csv`, and `source_register.csv`.
- NASA POWER extracts: one raw JSON file and `clean/power_42.03_-93.62_daily.csv`.
- SSURGO extracts: two raw JSON exports and cleaned map-unit, component, and horizon CSVs.

**NASA POWER deliverable:**
- The collection script requests daily precipitation and temperature variables (PRECTOTCORR, T2M_MAX, T2M_MIN, T2M) and writes raw plus cleaned outputs.
- Its reference point is latitude `42.03`, longitude `-93.62`, and the documented extract spans 2020–2024. The cleaned extract does not include relative humidity.
- The script preserves NASA fill values as missing rather than converting them to zero.
- This differs from the active approved point `42.0361668, -93.4650441` and active 2020–2025 file. It is not consumed by the application.

**SSURGO deliverable:**
- The collection script queries NRCS Soil Data Access for Story County's `IA169` area symbol and writes map-unit, component, and horizon tables.
- Cleaned extracts contain 86 map units, 229 components, and 831 horizons. They include mapped-unit, component, drainage/flooding, available-water, texture, pH, and horizon-depth attributes.
- The two raw SSURGO exports have identical map-unit and component rows; the horizon rows contain the same records but are in a different order. This appears to be a duplicate extract, not independent evidence.
- The deliverable describes survey-scale mapped soil and cautions that it is not a field laboratory measurement.
- **Needs confirmation:** the repository does not establish that SSURGO is on the officially approved competition resource list. It must not be activated solely because a collector and files exist.

## 10. Person 3 agronomic content and evidence quality

- `decision_rules.json` contains draft rules R01–R13. The active backend does not load or execute them.
- `rotation_compare.py` refers to R14 for an alfalfa drainage note, but R14 is absent from the current rule file.
- `field_profile.py` produces descriptive soil/weather output and simple drainage warnings; it is not part of the current API.
- `rotation_compare.py` prints a schedule and rule notes; it does not score or rank scenarios and is not connected to the active engine.
- `research_report.md` itself identifies local-validation needs, evidence gaps, disagreements, and site-specific applicability limits. Literature ranges and draft thresholds must not be presented as local fertilizer or yield recommendations.
- The research report references source IDs S28, S30, and S33–S40 that are absent from the current source register. The current register contains S01–S27 and has no verification-status column despite the report's discussion of verification status.
- The report refers to `alfalfa_nitrogen_guidance.csv` and `scenario_decisions.md`, which are not present in the inspected deliverables. The short Word dossier also refers to absent `crop_requirements.csv` and `rotation_12yr_schedule.csv` and reports 46 sources/17 rules, while the current register/rule file contain 27 sources/13 rules.
- **Scientific validation not established:** the audit did not verify every cited paper or extension document against its publisher, reproduce study findings, or establish that a rule generalizes to a particular Story County farm. No agronomist sign-off is present in the repository.

## 11. Technical integration readiness

| Deliverable or capability | Status | Reason |
|---|---|---|
| Current NASA POWER and SoilGrids context | **Integrated; structurally ready** | Active files load through `/api/context`; metadata and spatial limitations are carried to the UI. |
| Person 3 NASA POWER collector and extract | **Not integrated; coordinate/period reconciliation required** | Different point and period; it is not part of the approved file contract. |
| Person 3 SSURGO files and collector | **Technically structured; approval and integration decision pending** | Useful mapped-soil tables exist, but approval, target spatial unit, variable mapping, and relationship to active SoilGrids are unresolved. |
| `field_profile.py` | **Standalone descriptive utility** | No API import, integration contract, or application call site. |
| `decision_rules.json` and crop tables | **Not ready for operational decisions** | Draft status, source/CSV inconsistencies, unresolved scientific validation, and no active parser/consumer. |
| Person 3 `rotation_compare.py` | **Standalone/inconsistent** | References absent R14 and has no integration with active API. |
| Backend descriptive comparison | **Integrated; intentionally limited** | Returns sequence metrics and cited study notes, not an assessment or recommendation. |

The safe integration path is to preserve descriptive-only behavior while Person 3's files are reviewed. Before using additional tables, agree on the authoritative pilot coordinate, resource approval, table/schema/version, unit/depth semantics, spatial mapping, missing-data behavior, evidence IDs, and validation status. Only a separately approved and tested rule contract should activate agronomic interpretation.

## 12. Acceptance criteria status

| Priority / feature | Audit status | Evidence-based assessment |
|---|---|---|
| **P0: Select one pilot location; show coordinates/area** | **Partial** | Iowa/Story County is the sole functional pilot; the point and coordinates are shown. The selector offers 50 states, but only Iowa has data. There is no county/farm boundary or area measurement. |
| **P0: Show climate and soil context from documented sources** | **Met for current reference-point context** | NASA POWER monthly weather and SoilGrids properties load from documented local files. They are not county-wide or field measurements. |
| **P0: Compare at least two clearly defined rotations** | **Met for descriptive comparison** | The UI permits two to four user-defined sequences and shows side-by-side results. It does not score or rank them. |
| **P0: Explain trade-offs and risks** | **Partial** | Structural indicators have labels/explanations and a small set of study-scoped observations can be shown. There is no validated risk model or general agronomic trade-off assessment. |
| **P0: Show uncertainty and provenance** | **Partial to substantially addressed** | The methodology page distinguishes measured/modelled/derived/assumed and provides sources and limitations. The data lack quantified prediction intervals and field-specific uncertainty; this is not a full uncertainty model. |
| **P1: Interactive map and time-series charts** | **Partial / operational with limits** | The map and monthly charts are wired to the pilot point and current period. The basemap needs internet and the map is not an area boundary. |
| **P1: More crops or scenarios without breaking basic comparison** | **Partially met** | Two to four scenarios and four main crops are supported, with optional Cereal rye. Additional US state choices do not have corresponding data. |
| **P2: Visual polish, extra regions, advanced AI** | **Polish present; expansion/AI not implemented** | Visual UI exists. Extra regions and AI-driven sequence choice are not supported and should remain after P0 evidence and packaging work. |

## 13. Running and deployment status

The current documented local workflow is two terminals from the repository root:

```powershell
npm run dev:api
npm run dev
```

The first starts the API on `127.0.0.1:8765`; the second starts Vite, which proxies `/api` to that API. The frontend can also be started from its own directory with its package script, but the backend must still be started separately. Production guidance is to build with `npm run build`, publish `frontend/dist/`, and route `/api` to the Python service; Vite's proxy is development-only.

**Verified in repository:** `README.md` documents the two-process workflow and deployment shape. The root package has `dev`, `dev:api`, `build`, `preview`, `format`, and `test:backend` scripts.

**Packaging caveats:**
- `.mise.toml` pins Node 22 and pnpm 10.34.3, and the repository has `pnpm-lock.yaml`; README installation instructions say `npm install`. This is a package-manager/reproducibility inconsistency to resolve for deployment.
- There is no Python dependency manifest. The runtime API and engine use the standard library, but the SoilGrids raster processing tool requires `rasterio`; that tool dependency is not pinned in a manifest.
- No production deployment configuration, container definition, CI workflow, or frontend E2E setup was identified in the inspected repository files.
- The API has no built-in authentication or database. It binds to loopback by default; a hosted deployment needs an explicit network boundary, HTTPS/reverse proxy, and access-control decision.

No app server was started for this audit. The previously requested stop-app state was not changed.

## 14. Tests and validation performed

| Check | Result | What it establishes / does not establish |
|---|---|---|
| `python -m unittest discover -s backend/tests -t backend -v` | **Pass: 19 tests** | Current backend/API behavior and data contract checks pass. Not scientific validation. |
| `python backend/validate_iowa_data.py` | **Pass** | Active monthly data has 72 records and expected geography/fields; soil properties and metadata are structurally valid. The script explicitly does not establish scientific accuracy. |
| Read-only call to `aggregate_iowa.load_and_validate_daily_data()` | **Pass: 2,192 daily records** | Daily dates/fields validate from 2020-01-01 through 2025-12-31. The write-producing pipeline main was not run. |
| `.\node_modules\.bin\tsc.cmd --noEmit -p frontend\tsconfig.json` | **Pass** | TypeScript check succeeds. It does not replace a production build or browser E2E test. |
| `python backend/research/Story-County/Story-County/test_offline.py` | **Fail** | The test calls `collect_ssurgo_story.to_dicts(t)` without required `cols`; `TypeError` occurs before the intended checks complete. |
| Static file parsing | **Partial pass** | 18 JSON files parsed; 17 Python files passed AST syntax parsing. Several Person 3 CSV row widths do not match their headers, listed below. |

Person 3 CSV shape issues observed:
- `crop_knowledge.csv`: header has 18 fields; physical lines 3 and 5 have 17 and 19.
- `crop_interactions.csv`: header has 15; lines 5 and 9 have 16.
- `rotation_scenarios.csv`: header has 7; line 3 has 9.
- `source_register.csv`: header has 8; line 15 has 10.

No production build, network-backed collector, installation, or external data download was performed for this audit. These checks do not substitute for scientific review, performance testing, deployment testing, or browser end-to-end validation.

## 15. Material defects, contradictions, and risks

1. **Brand inconsistency:** browser title is SOWSCOPE, while the current brand is SOSCOPE.
2. **Pilot-point conflict:** Person 3's NASA POWER point (`42.03, -93.62`) differs from the active contract point (`42.0361668, -93.4650441`).
3. **Legacy data ambiguity:** Lubbock JSON/pipeline and partial archived frontend snapshots coexist with the active Iowa data.
4. **No real automatic recommendation:** shuffle is random; comparison has no score, ranking, or best-scenario reasoning.
5. **No area geometry or field-scale context:** current coordinates identify a reference point only.
6. **Evidence traceability gaps:** missing source IDs, missing referenced files, stale counts, absent source verification field, missing R14, and malformed CSV rows.
7. **Person 3 test failure:** offline tests currently fail at a function-argument mismatch.
8. **Current project-level approval gap:** no official resource sheet or signed scientific approval was found. SSURGO and draft rules must not be treated as approved based solely on their presence.
9. **Historical runtime error context:** a prior user-reported missing-data error named a repository-root `data\processed\iowa_monthly_environmental.json`. The current engine resolves its approved path under `backend\data\processed\` relative to its own file, and current backend tests/data validation pass. The previous error was not reproduced during this read-only audit; it should be checked against the exact command and checkout if it recurs.
10. **Deployment/reproducibility gaps:** mixed package-manager guidance, no Python dependency manifest for processing tools, and no confirmed production API routing/security configuration.

## 16. Security, privacy, licensing, and accessibility observations

- **Verified in repository:** the API defaults to localhost, caps request bodies, validates JSON/content type, uses explicit error responses, sets `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`, and does not expose a database or user-account store.
- The server can be configured to bind beyond localhost. The code itself does not provide authentication, TLS, authorization, rate limiting, or production reverse-proxy policy; deployment must supply those controls if remotely reachable.
- The current browser persists selected state in `localStorage`; the audit found no farm account or scenario persistence. No credentials were identified in the inspected active application/data files.
- The Person 3 collection scripts contain network request code for NASA POWER and NRCS Soil Data Access. They were not run during this audit. Their results should carry retrieval timestamps, request parameters, license/attribution, and reproducible provenance.
- **Not independently verified:** licensing/terms for bundled datasets, rasters, third-party research sources, and map tiles. The repository has citations/attribution in places, but no complete license manifest was identified.
- Accessibility was not formally tested. The UI contains labels, alert roles, and some button aria labels, but keyboard, screen-reader, contrast, and responsive-layout conformance were not validated.

## 17. Phased action plan

Owners below are role-based because individual names and formal assignments are not present in the repository.

### Phase 1 — stabilize the current technical baseline

1. **Resolve SOSCOPE/SOWSCOPE title mismatch.**
   **Owner:** Person 1 / frontend. **Priority:** P0 polish.
   **Why/dependency:** Align browser tab/title with the current product identity.
   **Done when:** `frontend/index.html` and visible branding consistently say SOSCOPE; a frontend build passes.

2. **Make active versus legacy data unambiguous.**
   **Owner:** Person 2 / backend-data. **Priority:** P0.
   **Why/dependency:** Lubbock and archived snapshots can confuse operators; preserve rather than delete until owners confirm use.
   **Done when:** a documented data manifest identifies the two approved Iowa files, coordinates, period, schemas, and legacy status of other datasets; API tests still reject unapproved paths.

3. **Choose and document one package workflow.**
   **Owner:** Person 2 / release. **Priority:** P0 deployment.
   **Why/dependency:** README npm instructions conflict with the pnpm pin/lockfile.
   **Done when:** clean-install commands use the chosen lockfile/package manager and successfully run frontend build plus backend tests.

4. **Fix Person 3 CSV/test structural defects without changing agronomic meaning.**
   **Owner:** Person 3, reviewed by Person 2. **Priority:** P1 integration.
   **Why/dependency:** Loaders and tests cannot reliably consume malformed rows; offline test currently fails before assertions.
   **Done when:** each CSV parses to its declared column count, the test supplies the correct `cols` argument, and offline tests pass.

### Phase 2 — establish evidence and data approval

5. **Reconcile the pilot coordinate and temporal scope.**
   **Owner:** Person 2 + Person 3. **Priority:** P0 data governance.
   **Why/dependency:** Person 3 and active datasets use different points/periods.
   **Done when:** the team records the chosen coordinate/period and any permitted comparison point, with a rationale and provenance; no conflicting file is silently substituted.

6. **Confirm the authoritative allowed-provider list and SSURGO status.**
   **Owner:** Project lead / data steward. **Priority:** P0 governance.
   **Why/dependency:** The official resource sheet was not in the repository.
   **Done when:** the approved list is checked into project documentation or linked from an authoritative team record; SSURGO is explicitly approved or excluded.

7. **Repair the Person 3 evidence register.**
   **Owner:** Person 3. **Priority:** P0 before rules.
   **Why/dependency:** Missing IDs/files, stale counts, and absent verification statuses prevent traceability.
   **Done when:** every in-use claim/rule points to a present source record; source type, title, URL, retrieval/access status, evidence limits, and review status are recorded; stale references and counts are reconciled.

8. **Obtain scientific review of every proposed agronomic rule.**
   **Owner:** Agronomy reviewer / Person 3. **Priority:** P0 before recommendation claims.
   **Why/dependency:** Existing thresholds and observations are draft or study-specific; no local sign-off was found.
   **Done when:** each rule has an applicability domain, variables/units/depth, evidence, uncertainty, missing-data behavior, validation owner/status, and documented approval or remains disabled.

### Phase 3 — define a safe integration contract

9. **Decide whether/how approved soil tables complement SoilGrids.**
   **Owner:** Person 2 + Person 3. **Priority:** P1.
   **Why/dependency:** SSURGO is mapped survey-scale data; active SoilGrids is a modelled point pixel. They are not interchangeable.
   **Done when:** a versioned schema defines geography/key joins, spatial meaning, depths, units, data freshness, missing values, and UI provenance, backed by representative fixtures and tests.

10. **Keep the comparison endpoint descriptive until scientific gates pass.**
    **Owner:** Person 2 / backend, with agronomy reviewer. **Priority:** P0 safety.
    **Why/dependency:** Current comparison is useful but structural and cannot support “best rotation” claims.
    **Done when:** API and UI make no ranking/recommendation claim unless a separately approved rule implementation has explicit tests and output provenance; draft rules remain inactive by default.

11. **Specify what “location/area” means for the demo.**
    **Owner:** Product lead + Person 1. **Priority:** P0 acceptance.
    **Why/dependency:** Current point does not satisfy a county/farm area boundary or acreage requirement.
    **Done when:** product selects whether the demo represents a county polygon, a named reference point, or a user-supplied field; displayed geometry/area, source, and uncertainty match that decision.

### Phase 4 — release and verification

12. **Add end-to-end and deployment checks.**
    **Owner:** Person 1 + Person 2 / release. **Priority:** P1.
    **Why/dependency:** Unit/type checks do not establish that the deployed frontend reaches the API or that error states work.
    **Done when:** a repeatable local or CI test starts both services, checks context and comparison, covers missing-data/error paths and non-Iowa selection, and verifies the production `/api` route.

13. **Document runtime dependencies and hosted-service controls.**
    **Owner:** Person 2 / release. **Priority:** P1.
    **Why/dependency:** Data-processing dependencies and production network controls are not fully specified.
    **Done when:** supported Python/Node/package-manager versions and processing dependencies are pinned; hosted API exposure, HTTPS, proxying, and access control are documented and tested.

## 18. Audit evidence, limitations, and integrity

- The report reflects the checked-out repository and the inspection/validation results recorded above; it does not treat older reports as proof of current behavior.
- No existing project file was edited, deleted, moved, or overwritten. No frontend or backend server was started. No network-backed collector, external data download, or package installation was run.
- Local backend tests, validators, static parsing, and the frontend TypeScript check were used as stated in section 14. These checks establish software/data-structure properties only, not agronomic truth.
- The official competition resource sheet, external licensing terms, live provider availability, source-paper validity, and expert validation were not independently checked.
- Generated Python bytecode/cache content was not treated as source evidence. Two 130-byte frontend-origin `.docx` entries are Git LFS pointer files; corresponding root-origin documents were available and matched their referenced content hashes.
- This is a status audit, not a scientific endorsement or deployment certification. Any future agronomic scoring, recommendations, or claim that one rotation is “better” requires explicit evidence review and project approval.
