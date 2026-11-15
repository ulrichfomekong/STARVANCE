# Instructions for the editor AI agent — FIELD SHIFT / Person 3 review

## Objective
Inspect the new folder containing Person 3's deliverables and produce a factual overview for the backend developer. First identify the exact new folder; do not assume its name.

## Safety rules
- Static inspection only. Do not run scripts, notebooks, installers, or commands that modify files, download data, access APIs, or use credentials.
- Do not edit, rename, move, delete, reformat, or execute Person 3's files.
- Do not modify any existing project files, especially frontend files under `src/`, backend scripts, or processed datasets.
- Do not install packages.
- Ignore `.git`, `node_modules`, `.venv`, `venv`, `__pycache__`, `dist`, `build`, and cache folders.
- Do not expose passwords, tokens, API keys, private URLs, or personal information. If secrets appear, report only the file path and nature of the concern.
- Do not infer scientific correctness from code comments or file presence. Do not fill gaps by guessing.
- You may inspect nearby project files only to understand integration points.

## Project constraints to use in your comparison
- Approved functional pilot: Story County, Iowa, USA.
- Existing environmental input: `data/processed/iowa_monthly_environmental.json`; NASA POWER; 72 monthly records from Jan 2020 to Dec 2025; derived from 2,192 daily records at one reference point.
- Existing soil input: `data/processed/iowa_soil_context.json`; SoilGrids 2.0; clay, nitrogen, pH in water, soil organic carbon; one reference pixel; 0–5 cm depth; mean prediction layers.
- Existing `rotation_engine.py` is descriptive only: sequence, crop counts, repeats, and adjacent transitions. It does not calculate suitability, yield, profitability, agronomic risk, or rank rotations.
- Agronomic rules must not be treated as validated unless their evidence and validation status are explicit.
- Only use datasets/resources approved in the official competition resource sheet or team documentation. Do not propose new datasets or vendors.
- Do not modify frontend files. The user is responsible for backend/data engineering, not frontend.
- The MVP must be transparent, deterministic, and explicit about provenance, units, uncertainty, and limitations.

## Inspect and report

### 1. File inventory
For every relevant file, list:
- relative path, file type, approximate size
- apparent purpose and contents
- whether source code, data, documentation, configuration, image, model, or other
- input/intermediate/output role if identifiable
- dependencies and references to other files
- whether successfully inspected

For large datasets, inspect schema and metadata, not every row or pixel.

### 2. Person 3's work
Summarize only what is supported by files:
- agronomic question or objective
- crops, rotations, seasons, locations, time periods
- rules, thresholds, indicators, formulas, assumptions
- evidence/source cited for each rule
- whether each item is a scientific claim, proposed rule, descriptive observation, or assumption
- validation evidence and stated limitations

Preserve Person 3's terminology. Do not silently correct or replace scientific logic.

### 3. Technical structures
For data files, report format, columns/keys/sheets/bands, units, value ranges where inspectable, geography, dates, depth, resolution, missing values/NoData, provenance, and any documented unit mismatch.

For code, report language, purpose, main functions/classes, inputs/outputs, imports/dependencies, files read/written, external API/network references (do not call them), and overlap with existing backend scripts.

For documents, report title, author/owner/date/version if stated, sections, conclusions, citations, and unresolved questions.

### 4. Integration readiness
Classify each item as exactly one of:
- `READY_FOR_TECHNICAL_INTEGRATION` (technical structure ready; not a claim of scientific validation)
- `WAITING_FOR_SCIENTIFIC_VALIDATION`
- `WAITING_FOR_DATA`
- `WAITING_FOR_CLARIFICATION`
- `NOT_IN_SCOPE`
- `POTENTIAL_CONFLICT`

Explain each classification and cite an exact file path plus page/section/sheet/line/column/JSON key or other available locator.

Answer:
1. What can be integrated into Python backend now without inventing agronomy?
2. What requires Person 3 to clarify or validate?
3. What conflicts with the Story County pilot or current data?
4. What backend input/output contract is needed?
5. What tests are needed?
6. Does anything require an unapproved dataset or external service?

### 5. Required report
Create only this new file at the project root:

`PERSON3_FOLDER_OVERVIEW.md`

Use these headings:
1. Executive summary
2. Folder path and inspection scope
3. File inventory
4. Person 3's work — detailed summary
5. Agronomic rules and evidence table
6. Data structures, units, geography, and periods
7. Code and dependency review
8. Comparison with current FIELD SHIFT backend
9. Integration readiness table
10. Conflicts, gaps, and risks
11. Questions for Person 3
12. Recommended next backend steps
13. Files not inspectable and why
14. Inspection integrity statement

Use these evidence labels:
- `FOUND IN FILE`
- `INFERENCE`
- `NOT STATED`
- `NEEDS CONFIRMATION`

The integrity statement must list files inspected, skipped, unreadable; commands executed (should be none); files changed; and confirm that no other project files were modified.

## Final response
Tell the user which folder was inspected, counts of inspected/skipped files, report path, important findings, unreadable files, and confirm that only `PERSON3_FOLDER_OVERVIEW.md` was created. Do not claim scientific validation unless explicit evidence supports it.
