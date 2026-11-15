# 1. Executive summary

- `FOUND IN FILE`: The Person 3 deliverables are preserved at `backend/research/Story-County/Story-County`. The folder contains research notes, source lists, agronomic CSVs, JSON rules, Python scripts, and raw/clean NASA POWER/SSURGO extracts for a Story County, Iowa demonstration.
- `FOUND IN FILE`: The folder is clearly oriented toward agronomic decision support, but it does not yet form a validated backend scoring module. Its strongest technical outputs are the collection scripts, cleaned data exports, and qualitative rule documentation.
- `FOUND IN FILE`: The most important documented claims in `research_report.md` are about corn-after-soybean, corn-after-corn, corn-after-alfalfa, cereal rye before corn, and the role of oat/cover-crop management. Those claims are framed as research findings with caveats and unresolved disagreements, not as final backend recommendations.
- `FOUND IN FILE`: `decision_rules.json` explicitly marks several rules as requiring local validation (`requires_local_validation`) and the project contract at `backend/docs/DATA_CONTRACT.md` states that no numeric agronomic score or recommendation should be exposed until Person 3 validates the agronomic rules.
- `POTENTIAL_CONFLICT`: The folder states that sources are verified and traceable, but `source_register.csv` does not include an explicit verification-status column. This weakens auditability and makes the evidence chain harder to verify.
- `POTENTIAL_CONFLICT`: `rotation_compare.py` references rule `R14`, but `decision_rules.json` contains no `R14`. This suggests stale code or a missing rule definition.
- `FOUND IN FILE`: The folder independently collects NASA POWER plus SSURGO data and stores both raw and cleaned versions. The current backend uses NASA POWER and SoilGrids, not SSURGO, so Person 3's SSURGO files are not part of the active approved backend context. The coordinate choice also differs from the project-wide reference point described in `backend/docs/DATA_CONTRACT.md`.
- `FOUND IN FILE`: There are no executable agronomic models in the folder that calculate yield, profitability, or agronomic risk. The folder is best understood as a draft agronomy dossier plus a technical data pipeline, not a validated production decision engine.

# 2. Folder path and inspection scope

- `FOUND IN FILE`: Current repository-relative path: `backend/research/Story-County/Story-County`. The deliverables were inspected before the repository reorganization and have since been relocated intact.
- `FOUND IN FILE`: Scope included: all files recursively under that folder, including raw JSON, cleaned CSVs, research notes, source sheets, scenario tables, and Python scripts.
- `FOUND IN FILE`: Scope excluded by task rules: `.git`, `node_modules`, `.venv`, `venv`, `__pycache__`, and other caches were ignored as instructed.
- `FOUND IN FILE`: File count in the inspected folder: 21 files total, consisting of 11 top-level source/data files and 10 files in `clean/` and `raw/` subfolders; compiled Python bytecode files inside `__pycache__/` were treated as unreadable binary outputs and excluded from technical interpretation.
- `FOUND IN FILE`: The folder contains both operational scripts and evidence sources: NASA POWER collection, SSURGO collection, field-profile summarization, scenario comparison, crop knowledge tables, decision rules, and research report.
- `NOT STATED`: The original inspection instructions did not identify the folder name; the deliverables were found in `Story-County/Story-County` at that time and are now stored under `backend/research/Story-County/Story-County`.

# 3. File inventory

| Relative path | File type | Approx. size | Apparent purpose / contents | Role | Inspected |
|---|---|---:|---|---|---|
| `backend/research/Story-County/Story-County/collect_nasa_power.py` | Python source | ~2 KB | Pulls daily NASA POWER precipitation and temperature for a point and writes raw JSON plus cleaned CSV | Data collection script | Yes |
| `backend/research/Story-County/Story-County/collect_ssurgo_story.py` | Python source | ~4 KB | Pulls SSURGO map-unit, component, and horizon records for Story County area symbol IA169 and writes raw JSON plus cleaned CSVs | Data collection script | Yes |
| `backend/research/Story-County/Story-County/field_profile.py` | Python source | ~4 KB | Reads cleaned SSURGO files and prints a map-unit profile and simple drainage flags | Local descriptive profile utility | Yes |
| `backend/research/Story-County/Story-County/rotation_compare.py` | Python source | ~3 KB | Compares 12-year scenarios using note strings from `decision_rules.json` | Demo comparison script | Yes |
| `backend/research/Story-County/Story-County/test_offline.py` | Python source | ~1.3 KB | Offline tests for parsing and missing-value handling | Validation script | Yes |
| `backend/research/Story-County/Story-County/research_report.md` | Markdown document | ~13.8 KB | Research summary, agronomic claims, disagreements, limitations, and integration notes | Primary research narrative | Yes |
| `backend/research/Story-County/Story-County/decision_rules.json` | JSON | ~5.7 KB | Qualitative agronomic decision rules with conditions, sources, and validation flags | Rule catalog | Yes |
| `backend/research/Story-County/Story-County/crop_knowledge.csv` | CSV | ~5.8 KB | Crop-specific agronomic knowledge: N fixation, constraints, rotations, evidence | Crop-knowledge data | Yes |
| `backend/research/Story-County/Story-County/crop_interactions.csv` | CSV | ~5.9 KB | Preceding crop to following crop interactions and stated risks/benefits | Interaction data | Yes |
| `backend/research/Story-County/Story-County/rotation_scenarios.csv` | CSV | ~2.8 KB | Draft scenario descriptions for baseline and alternative rotations | Scenario summaries | Yes |
| `backend/research/Story-County/Story-County/source_register.csv` | CSV | ~10.8 KB | Source registry with IDs, institutions, publication references, and claims supported | Evidence catalog | Yes |
| `backend/research/Story-County/Story-County/clean/power_42.03_-93.62_daily.csv` | CSV | ~61.8 KB | Daily NASA POWER dataset for the selected point, cleaned to a consistent table | Environmental data output | Yes |
| `backend/research/Story-County/Story-County/clean/ssurgo_IA169_mapunit.csv` | CSV | ~10.5 KB | SSURGO map-unit table for Story County | Soil map-unit data | Yes |
| `backend/research/Story-County/Story-County/clean/ssurgo_IA169_component.csv` | CSV | ~11.2 KB | SSURGO component table for map units and components | Soil component data | Yes |
| `backend/research/Story-County/Story-County/clean/ssurgo_IA169_horizon.csv` | CSV | ~51.6 KB | SSURGO horizon-level soil properties including texture, OM, pH, clay/silt/sand | Soil horizon data | Yes |
| `backend/research/Story-County/Story-County/raw/power_42.03_-93.62_raw_20261115T045556Z.json` | JSON | ~201.7 KB | Raw NASA POWER API response for one coordinate | Raw source extract | Yes |
| `backend/research/Story-County/Story-County/raw/ssurgo_IA169_raw_20261115T045545Z.json` | JSON | ~268.4 KB | Raw SSURGO API response for Story County map-unit query | Raw source extract | Yes |
| `backend/research/Story-County/Story-County/raw/ssurgo_IA169_raw_20261115T050033Z.json` | JSON | ~268.4 KB | Raw SSURGO API response for Story County component/horizon queries | Raw source extract | Yes |
| `backend/research/Story-County/Story-County/__pycache__/collect_nasa_power.cpython-313.pyc` | Binary bytecode | ~4.4 KB | Compiled Python bytecode | Python cache, not source | Skipped as unreadable |
| `backend/research/Story-County/Story-County/__pycache__/collect_ssurgo_story.cpython-313.pyc` | Binary bytecode | ~6.5 KB | Compiled Python bytecode | Python cache, not source | Skipped as unreadable |
| `backend/research/Story-County/Story-County/__pycache__/field_profile.cpython-313.pyc` | Binary bytecode | ~7.5 KB | Compiled Python bytecode | Python cache, not source | Skipped as unreadable |

# 4. Person 3's work — detailed summary

- `FOUND IN FILE`: The dossier is centered on agronomic reasoning for Story County, Iowa, and appears to be a draft research layer for a crop-rotation support tool. It uses both SSURGO soil data and NASA POWER weather data to describe a soil/rotation decision context, but it does not calculate suitability, yield, or profit.
- `FOUND IN FILE`: The `research_report.md` frames its work as an evidence-based agronomy review, explicitly excluding NASA environmental datasets from the research claims. It says every claim should trace to `source_register.csv`, and that claims from unverified or blocked sources are not used.
- `FOUND IN FILE`: The data-collection scripts fetch a point-based environmental series near the Story County area and a county SSURGO dataset for `IA169`, then clean them into CSV tables. The scripts are technical and deterministic; they do not manipulate values beyond converting missing values to null-like placeholders and storing raw responses.
- `FOUND IN FILE`: The rule layer is stored in `crop_knowledge.csv`, `crop_interactions.csv`, and `decision_rules.json`. It covers corn, soybean, alfalfa, oats, red clover, and cereal rye. It includes notes on N response, stand termination, residue effects, pest/disease pressure, and management timing.
- `FOUND IN FILE`: The folder's scenario framing includes baseline corn-soybean, a direct-seeded alfalfa scenario, an oats scenario, and a longer rotation when looking at research. This is a descriptive design layer, not a validated backend recommendation engine.
- `FOUND IN FILE`: The `research_report.md` notes major research caveats: many Iowa datasets are from research farms or on-farm trials, some are organic, some sources are secondary reprints, and several references must be treated as uncertain because they are blocked or not individually checked.
- `FOUND IN FILE`: The folder documents disagreements and research uncertainties, for example corn-after-alfalfa N credit magnitude, soybean N credit magnitude, and the relative effects of fall versus spring termination. This is part of the dossier's honesty; it does not represent a final agronomic rule set.
- `NOT STATED`: The folder does not include a formal validation plan, a tested backend API contract, or a sign-off by the agronomy lead. It is therefore a draft evidence package, not validated production logic.

# 5. Agronomic rules and evidence table

| Agronomic item | Representative files | Evidence classification | Scientific claim / rule type | Validation status |
|---|---|---|---|---|
| Corn after soybean has lower N response than corn after corn | `research_report.md` “Main findings”; `decision_rules.json` `R05_corn_after_soybean_n_baseline`; `source_register.csv` S01, S03, S36 | `FOUND IN FILE` | Scientific claim from long-term Iowa research; rule is a qualitative N-response guideline | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the report itself keeps a range and notes that no operational credit is applied |
| Corn after corn has a yield/N penalty | `research_report.md`; `decision_rules.json` `R06_corn_after_corn_penalty` | `FOUND IN FILE` | Scientific claim and rule | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the folder does not provide a validated backend penalty function |
| First-year corn after alfalfa benefits from a lower N response | `research_report.md` “Main findings”; `crop_knowledge.csv`; `decision_rules.json` `R01_corn_after_alfalfa_n_credit` | `FOUND IN FILE` | Scientific claim plus proposed rule | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the report explicitly states current Iowa guidance is not available and credit values need local validation |
| Second-year corn after alfalfa has variable response | `research_report.md` “Main findings”; `decision_rules.json` `R02_corn_after_alfalfa_second_year` | `FOUND IN FILE` | Scientific claim and rule | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the research report records disagreement and cites partial evidence |
| Alfalfa termination timing matters | `research_report.md`; `decision_rules.json` `R03_alfalfa_termination_risk`, `R04_alfalfa_spring_termination_delay` | `FOUND IN FILE` | Proposed agronomic rule based on termination risk and planting delay | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the folder itself says the data are not final, and some references are secondary or not fully checked |
| Cereal rye before corn has a small but inconsistent yield penalty and should be terminated 10–14 days before planting | `research_report.md`; `decision_rules.json` `R07_cereal_rye_before_corn`; `source_register.csv` S12, S13, S16, S17 | `FOUND IN FILE` | Scientific claim and derived operational rule | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the rule requires local validation for thresholds and N-rate adjustment |
| Oats as grain and underseeding | `crop_knowledge.csv`; `crop_interactions.csv`; `rotation_scenarios.csv` | `FOUND IN FILE` | Descriptive observation and candidate rule | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the folder notes that conventional oat economics and timings are not established |
| Red clover N value needs Iowa-specific validation | `crop_knowledge.csv`; `research_report.md` “Data gaps”; `decision_rules.json` unresolved rules | `FOUND IN FILE` | Assumption/proposed rule from Wisconsin guidance only | `WAITING_FOR_DATA` and `WAITING_FOR_CLARIFICATION` because Iowa values are absent |
| Longer rotations reduce erosion and disease pressure | `research_report.md`; `rotation_scenarios.csv`; `crop_knowledge.csv` | `FOUND IN FILE` | Descriptive observation from a secondary report and long-term study | `WAITING_FOR_SCIENTIFIC_VALIDATION` because the report explicitly says the economic results are not used and that the study is secondary |

- `FOUND IN FILE`: Several claims in `research_report.md` are labeled as open disagreements or caveats, which is appropriate for a working agronomy dossier but not for a production rule set. The report is careful to distinguish between “apparent N credit,” “EONR difference,” and “fertilizer credit.”
- `FOUND IN FILE`: `decision_rules.json` says that numeric thresholds marked `requires_local_validation` must be filled from current ISU or NRCS sources before use. This is a direct statement that the folder is not ready for a numeric backend decision model.
- `NOT STATED`: None of the files states that these rules are approved by the project agronomy lead or the product owner.

# 6. Data structures, units, geography, and periods

## NASA POWER data

- `FOUND IN FILE`: `collect_nasa_power.py` downloads daily NASA POWER data from `https://power.larc.nasa.gov/api/temporal/daily/point` for parameters `PRECTOTCORR`, `T2M_MAX`, `T2M_MIN`, and `T2M` and stores them in raw JSON plus cleaned CSV.
- `FOUND IN FILE`: The cleaned data file is `backend/research/Story-County/Story-County/clean/power_42.03_-93.62_daily.csv`, and the first rows show daily precipitation and temperature values in `mm` and `°C` respectively.
- `FOUND IN FILE`: The raw metadata in `raw/power_42.03_-93.62_raw_20261115T045556Z.json` shows a point geometry at longitude `-93.62` and latitude `42.03`, altitude `310.22`, with dates from 2020-01-01 onward.
- `FOUND IN FILE`: The script intentionally preserves missing values by treating `-999` as `None` instead of zero. This is a good data-quality pattern.
- `FOUND IN FILE`: The project-wide contract in `backend/docs/DATA_CONTRACT.md` defines the approved Story County reference point as latitude `42.0361668` and longitude `-93.4650441`, but the Person 3 scripts use `42.03 / -93.62`. That coordinate difference must be reconciled before backend integration.

## SSURGO soil data

- `FOUND IN FILE`: `collect_ssurgo_story.py` requests map-unit, component, and horizon tables for `areasymbol = 'IA169'` from the NRCS Soil Data Access service and writes them to `clean/ssurgo_IA169_mapunit.csv`, `ssurgo_IA169_component.csv`, and `ssurgo_IA169_horizon.csv`.
- `FOUND IN FILE`: The map-unit file includes `mukey`, `musym`, `muname`, `mukind`, `drclassdcd`, `drclasswettest`, `flodfreqdcd`, `aws0100wta`, and `aws0150wta`.
- `FOUND IN FILE`: The component file includes `mukey`, `cokey`, `compname`, `comppct_r`, `drainagecl`, and `majcompflag`.
- `FOUND IN FILE`: The horizon file includes `cokey`, `chkey`, `hzname`, `hzdept_r`, `hzdepb_r`, `sandtotal_r`, `silttotal_r`, `claytotal_r`, `om_r`, `ph1to1h2o_r`, `texdesc`, and `texcl`.
- `FOUND IN FILE`: Output values are physically meaningful map-unit and horizon properties, not field lab measurements. The scripts explicitly state that SSURGO values describe mapped soil at survey scale, not field-level measurements.
- `FOUND IN FILE`: `field_profile.py` prints drainage, flooding frequency, available water, dominant component, and surface-layer texture and pH. It also warns that missing values are reported as `not recorded` and that `weather_summary()` refers only to the NASA POWER grid point, not a field measurement.

## Geography and period

- `FOUND IN FILE`: Story County, Iowa is the pilot geography. The project contract uses Story County only. The data collection in Person 3 also targets `IA169` and the Story County reference region.
- `FOUND IN FILE`: The Person 3 dataset covers the period of the selected NASA POWER point records, with daily entries beginning in 2020; the `research_report.md` also discusses data from 1979–2004 and from specific studies in Iowa, Minnesota, and Wisconsin.
- `FOUND IN FILE`: Many agronomy claims are research-study specific and not directly transferable to all Iowa fields. The folder explicitly states that research results are site- and management-specific and should not be treated as universal effects.

# 7. Code and dependency review

- `FOUND IN FILE`: All active scripts in the Person 3 folder rely on Python standard library modules only (`csv`, `json`, `urllib.request`, `pathlib`, `statistics`, `argparse`, and basic data handling). There is no evidence of a secondary package installation or an external SDK requirement.
- `FOUND IN FILE`: `collect_ssurgo_story.py` fetches NRCS SDA data using `urllib.request` and writes raw JSON plus cleaned CSV files. It explicitly keeps missing values as missing and never fills them.
- `FOUND IN FILE`: `collect_nasa_power.py` fetches NASA POWER daily data and performs a similar raw-plus-clean workflow. It preserves `-999` fill values as missing, which is consistent with the project's data-quality expectation.
- `FOUND IN FILE`: `field_profile.py` is descriptive only. It reads the cleaned files, raises minimal drainage warnings for poorly or very poorly drained soils, and does not generate recommendations.
- `FOUND IN FILE`: `rotation_compare.py` is also descriptive only. It prints a 12-year schedule and attaches notes from rules, but it does not score or rank rotations.
- `FOUND IN FILE`: `test_offline.py` asserts that missing values are handled safely and that `-999` is not silently converted to zero. It provides basic data-quality tests but not agronomic validation.
- `FOUND IN FILE`: The folder has no explicit dependency on the root `backend/rotation_engine.py`; it appears to be a parallel, domain-specific draft rather than a direct extension of the existing backend code.
- `FOUND IN FILE`: There is no backend or API integration beyond local file generation and local profile/rotation outputs. The Person 3 folder is not yet wired into the root application or Python backend contract.

# 8. Comparison with current SOSCOPE backend

- `FOUND IN FILE`: The project contract in `backend/docs/DATA_CONTRACT.md` states that the backend should remain descriptive-only until agronomic validation is complete. This matches the front-end/backend concept: no numeric agronomic score, recommendation, or ranking should be exposed before Person 3 supplies validated rules.
- `FOUND IN FILE`: `backend/rotation_engine.py` is intentionally descriptive-only and does not calculate suitability, yield, risk, or recommendations. Its structure is consistent with the Person 3 folder's general philosophy: descriptive sequence metrics and provenance are acceptable, but agronomic interpretation is not.
- `FOUND IN FILE`: The Person 3 folder adds more domain-specific content than the current root engine: a research narrative, source register, crop-knowledge tables, decision rules, and scenario notes. However, the actual rule layer is still draft and not validated.
- `FOUND IN FILE`: The backend contract explicitly says that Person 3 must supply and validate crop-specific rules before the team adds agronomic assessment. This aligns with the Person 3 folder's current status: useful technical structure, but not approved agronomic logic.
- `POTENTIAL_CONFLICT`: The Person 3 folder uses one coordinate convention (`42.03, -93.62`) while `backend/docs/DATA_CONTRACT.md` defines another Story County reference point (`42.0361668, -93.4650441`). This must be reconciled for backend use because the backend contract requires a single validated pilot geography and data provenance.
- `FOUND IN FILE`: There is no evidence in the current project backend of a direct import path, API, or JSON schema for `decision_rules.json` or `crop_knowledge.csv`. These items currently function as standalone deliverables rather than integrated backend modules.

# 9. Integration readiness table

| Item | Classification | Reason | Evidence |
|---|---|---|---|
| NASA POWER data collection script and clean daily CSV | `READY_FOR_TECHNICAL_INTEGRATION` | The script is a clear, stable extraction pattern and preserves data quality; no agronomic inference is performed. | `collect_nasa_power.py`; `clean/power_42.03_-93.62_daily.csv` |
| SSURGO data collection script and cleaned soil tables | `READY_FOR_TECHNICAL_INTEGRATION` | The scripts and cleaned CSVs are technically structured and consistent with a soil context workflow; they are descriptive only. | `collect_ssurgo_story.py`; `clean/ssurgo_IA169_mapunit.csv`; `clean/ssurgo_IA169_horizon.csv` |
| `field_profile.py` descriptive profile output | `READY_FOR_TECHNICAL_INTEGRATION` | It is a local utility that prints map-unit data and generic flags without calculating agronomic score; it stays within the current descriptive-only backend contract. | `field_profile.py` |
| `research_report.md` as a research and evidence dossier | `WAITING_FOR_SCIENTIFIC_VALIDATION` | The report contains valuable evidence but also records disagreements, blocked sources, and missing validation. It must be reviewed by the agronomy lead before being treated as authoritative. | `research_report.md`; `source_register.csv`; `decision_rules.json` |
| `decision_rules.json` agronomic rules | `WAITING_FOR_SCIENTIFIC_VALIDATION` | It includes explicit `requires_local_validation` entries, which is a direct acknowledgment that thresholds and credits are not yet final. | `decision_rules.json` |
| `crop_knowledge.csv` and `crop_interactions.csv` | `WAITING_FOR_SCIENTIFIC_VALIDATION` | They are useful structured notes, but they are not final validated backend rule tables. Some entries are explicitly low-confidence or not quantified. | `crop_knowledge.csv`; `crop_interactions.csv` |
| `rotation_compare.py` scenario demo | `WAITING_FOR_CLARIFICATION` | It references `R14`, but `R14` is not present in the current JSON rule set; the script is therefore stale or partially inconsistent with the rule catalog. | `rotation_compare.py`; `decision_rules.json` |
| `source_register.csv` as evidence registry | `WAITING_FOR_CLARIFICATION` | The report says each source carries a verification status, but the CSV file itself does not show a verification-status column or field; this undermines traceability. | `research_report.md`; `source_register.csv` |
| Coordinate selection in the Person 3 folder | `POTENTIAL_CONFLICT` | The scripts use `42.03, -93.62` while the approved backend contract uses `42.0361668, -93.4650441`. This can create mismatched data provenance and geographic interpretation. | `collect_nasa_power.py`; `backend/docs/DATA_CONTRACT.md` |
| Any future numeric agronomic scoring or ranking | `NOT_IN_SCOPE` until validation | The current project contract forbids numeric agronomic scoring until the agronomy rules are validated. | `backend/docs/DATA_CONTRACT.md`; `backend/rotation_engine.py` |
| Unapproved dataset or external service beyond the competition resource sheet | `NOT_IN_SCOPE` or `WAITING_FOR_DATA` | No unapproved vendors are documented in the folder; the issue is simply whether additional inputs, such as NDVI or SMAP, are future design ideas and not current capability. | `research_report.md` “Integration with NASA data” |

- `FOUND IN FILE`: The technical structure can be integrated with the backend in a descriptive way now: data extraction, soil context, and rule-file loading. The agronomic interpretation layer cannot be treated as validated without a formal sign-off.

# 10. Conflicts, gaps, and risks

- `POTENTIAL_CONFLICT`: The folder says that every claim traces to a source ID in `source_register.csv` and that each source carries a verification status, but the CSV file itself has no verification-status field. This weakens the chain of evidence and is a traceability gap.
- `POTENTIAL_CONFLICT`: `rotation_compare.py` states that it uses rules `R01, R03, R05, R14`, but the current `decision_rules.json` has no `R14`. That is a logic mismatch between script and data.
- `WAITING_FOR_DATA`: The report references missing files such as `alfalfa_nitrogen_guidance.csv` and `scenario_decisions.md`, and it explicitly lists missing data: current Iowa corn-after-alfalfa guidance, red clover N credit tables, nutrient removal values, and some cover-crop termination details.
- `POTENTIAL_CONFLICT`: The Person 3 scripts use a reference point of `42.03,-93.62`, while the current project contract specifies `42.0361668,-93.4650441` for Story County. That is a provenance and consistency issue.
- `WAITING_FOR_SCIENTIFIC_VALIDATION`: Many values are left in ranges rather than final recommendations. The research report itself says 29–60 lb N/ac is a literature comparison, not an operational fertilizer credit.
- `WAITING_FOR_SCIENTIFIC_VALIDATION`: Some agronomic items remain open disagreements, such as the soybean N credit and the second-year corn-after-alfalfa response pattern. These are not resolved and cannot be treated as final backend rules.
- `FOUND IN FILE`: The folder clearly distinguishes between a measured field response and a generalized recommendation, which is good practice. But the current backend cannot safely take this as an approved rule set without explicit validation.
- `NOT STATED`: There is no evidence of a final approved dataset list beyond the existing NASA POWER and SSURGO data sources. Some future extensions like SMAP, NDVI, and land cover are described as design intent, not operational inputs.

# 11. Questions for Person 3

- `NEEDS CONFIRMATION`: Which exact Story County reference coordinate should the team use as the authoritative pilot point: `42.03, -93.62` from the scripts or `42.0361668, -93.4650441` from `backend/docs/DATA_CONTRACT.md`?
- `NEEDS CONFIRMATION`: Where is the verification-status field for each source in `source_register.csv`? The report says it exists; the CSV as inspected does not show it.
- `NEEDS CONFIRMATION`: Is `R14` intended to be a rule that was omitted from `decision_rules.json`, or is it stale code that should be removed from `rotation_compare.py`?
- `NEEDS CONFIRMATION`: Which referenced files are still expected to be added (`alfalfa_nitrogen_guidance.csv`, `scenario_decisions.md`, or others), and which are not part of the final deliverable set?
- `NEEDS CONFIRMATION`: Which rules are officially approved for backend use, and which remain draft or unvalidated?
- `NEEDS CONFIRMATION`: Are the yield and N-response ranges meant to remain as literature comparisons only, or should the team convert them into explicit backend thresholds later?
- `NEEDS CONFIRMATION`: Should the future backend treat corn-after-alfalfa N response and cereal rye termination as advisory warning flags only, or do you expect them to become hard constraints later?

# 12. Recommended next backend steps

- `FOUND IN FILE`: Keep the current backend descriptive-only and do not expose a numeric score or recommendation until the agronomic rule set is validated.
- `FOUND IN FILE`: Standardize a single rule schema for future backend use: rule ID, crop/sequence condition, input variables, units, source IDs, thresholds, validation owner, and validation status.
- `FOUND IN FILE`: Align the geographic reference point and dataset provenance across project documentation and Person 3 scripts before using any of the data as backend input.
- `FOUND IN FILE`: Add a small rule-loading contract that accepts validated rule IDs, evidence IDs, and a `validation_status` flag, rather than passing raw experimental notes directly into the backend.
- `FOUND IN FILE`: Create tests for missing data handling, no silent imputation, and explicit rules about unsupported numeric agronomic scoring until validation is complete.
- `FOUND IN FILE`: Treat the current Person 3 folder as a draft source library and a technical pipeline example, not as an approved backend model.

# 13. Files not inspectable and why

- `FOUND IN FILE`: The `__pycache__/` files are compiled Python bytecode (`.pyc`), not human-readable source. They were not treated as evidence for agronomic logic; they were skipped because they are generated outputs and not part of the reviewed deliverable content.
- `NOT STATED`: No other files in the inspected folder were unreadable; all relevant text sources were inspectable.
- `NOT STATED`: The folder itself does not include blocked external documents that were inaccessible for direct reading; however, the research report explicitly notes several sources and claims as blocked, secondary, or not individually checked.

# 14. Inspection integrity statement

- `FOUND IN FILE`: Files inspected: `backend/research/Story-County/Story-County/collect_nasa_power.py`, `backend/research/Story-County/Story-County/collect_ssurgo_story.py`, `backend/research/Story-County/Story-County/field_profile.py`, `backend/research/Story-County/Story-County/rotation_compare.py`, `backend/research/Story-County/Story-County/test_offline.py`, `backend/research/Story-County/Story-County/research_report.md`, `backend/research/Story-County/Story-County/decision_rules.json`, `backend/research/Story-County/Story-County/crop_knowledge.csv`, `backend/research/Story-County/Story-County/crop_interactions.csv`, `backend/research/Story-County/Story-County/rotation_scenarios.csv`, `backend/research/Story-County/Story-County/source_register.csv`, all files under `backend/research/Story-County/Story-County/clean/`, and all files under `backend/research/Story-County/Story-County/raw/`.
- `FOUND IN FILE`: At the time of inspection, compiled bytecode under `backend/research/Story-County/Story-County/__pycache__/` was skipped as unreadable generated output. Those cache files have since been removed; `.git`, `node_modules`, and build output remain outside the inspection scope.
- `FOUND IN FILE`: Files unreadable: none among the relevant human-readable deliverables; the only unreadable files were the generated `.pyc` bytecode files in `__pycache__/`.
- `NOT STATED`: Commands executed: none (for the report, this is an inspection-only static review; no scripts, installers, or data downloads were run from this folder).
- `FOUND IN FILE`: This report was created at the repository root during the original review and has since been moved to `backend/docs/PERSON3_FOLDER_OVERVIEW.md`; its repository-relative references were updated for the new layout.
- `FOUND IN FILE`: Person 3 source and data file contents were not edited or executed. The deliverables were relocated intact under `backend/research/Story-County/`; generated Python caches and the obsolete root build output were removed as part of the later deployment cleanup.
