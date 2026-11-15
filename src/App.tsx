import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  compareScenarios,
  fetchProjectContext,
  type ProjectContext,
  type RotationComparison,
} from "./api";

type Page = "dashboard" | "location" | "planner" | "comparison" | "methodology";
type ScenarioKey = "A" | "B";

const crops = ["Corn", "Soybean", "Oats", "Alfalfa", "Cereal rye", "Red clover"];
const cropMeta: Record<string, { code: string; tone: string; note: string }> = {
  Corn: { code: "CR", tone: "gold", note: "Warm-season cereal" },
  Soybean: { code: "SB", tone: "green", note: "Warm-season legume" },
  Oats: { code: "OA", tone: "sand", note: "Cool-season cereal" },
  Alfalfa: { code: "AL", tone: "blue", note: "Perennial forage legume" },
  "Cereal rye": { code: "RY", tone: "rust", note: "Cool-season cover crop" },
  "Red clover": { code: "RC", tone: "green", note: "Legume cover crop" },
};

const defaultScenarios: Record<ScenarioKey, string[]> = {
  A: ["Corn", "Soybean", "Corn", "Soybean"],
  B: ["Corn", "Oats", "Soybean", "Corn"],
};

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "location", label: "Explore Location", icon: "pin" },
  { id: "planner", label: "Rotation Planner", icon: "rotate" },
  { id: "comparison", label: "Scenario Comparison", icon: "compare" },
  { id: "methodology", label: "Data & Methodology", icon: "database" },
];

type IconName = "grid" | "pin" | "rotate" | "compare" | "database" | "search" | "chevron" | "rain" | "temperature" | "soil" | "layers" | "arrow" | "info" | "warning" | "plus" | "trash" | "menu" | "close" | "check" | "calendar" | "external" | "shield" | "water" | "diversity" | "stress";

function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
    pin: (<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>),
    rotate: (<><path d="M20 7h-6V1" /><path d="M20 7a9 9 0 1 0 1 9" /></>),
    compare: (<><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 13 4 4-4 4" /><path d="M20 17H4" /></>),
    database: (<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>),
    search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
    chevron: <path d="m8 10 4 4 4-4" />,
    rain: (<><path d="M7 17a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 8a4.5 4.5 0 0 1-.5 9" /><path d="m9 19-1 2m5-2-1 2m5-2-1 2" /></>),
    temperature: (<><path d="M14 14.8V5a4 4 0 0 0-8 0v9.8a6 6 0 1 0 8 0Z" /><path d="M10 7v9" /></>),
    soil: (<><path d="M3 7c4-2 6 2 10 0s6 2 8 0" /><path d="M3 12c4-2 6 2 10 0s6 2 8 0" /><path d="M3 17c4-2 6 2 10 0s6 2 8 0" /></>),
    layers: (<><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>),
    arrow: (<><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>),
    info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>),
    warning: (<><path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
    plus: (<><path d="M12 5v14" /><path d="M5 12h14" /></>),
    trash: (<><path d="M4 7h16" /><path d="m9 7 1-3h4l1 3" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6m4-6v6" /></>),
    menu: (<><path d="M4 7h16M4 12h16M4 17h16" /></>),
    close: (<><path d="m6 6 12 12M18 6 6 18" /></>),
    check: <path d="m5 12 4 4L19 6" />,
    calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>),
    external: (<><path d="M14 3h7v7M10 14 21 3" /><path d="M18 13v7H4V6h7" /></>),
    shield: (<><path d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3Z" /><path d="m8 12 2.5 2.5L16 9" /></>),
    water: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
    diversity: (<><circle cx="6" cy="7" r="3" /><circle cx="18" cy="7" r="3" /><circle cx="12" cy="18" r="3" /><path d="m8.5 9 2 6m5-6-2 6" /></>),
    stress: (<><path d="M12 3v3m0 12v3M3 12h3m12 0h3" /><circle cx="12" cy="12" r="4" /></>),
  };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function FieldMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "compact" : ""}`} aria-label="Field Shift">
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path d="M6 31c7-12 17-18 32-19-3 13-12 22-27 25" />
        <path d="M10 34c7-7 14-12 23-16M20 27l-1-7m8 2 1-7" />
        <circle cx="33.5" cy="9.5" r="2.5" />
      </svg>
      {!compact && (
        <div>
          <strong>FIELD SHIFT</strong>
          <span>NASA Space Apps 2026</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ children, tone = "sample" }: { children: ReactNode; tone?: "sample" | "ready" | "candidate" | "warning" | "neutral" }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function ProjectLocation({ county }: { county: string }) {
  return (
    <div className="state-select">
      <div className="state-trigger">
        <span>
          <small>Project area</small>
          <strong>{county}, Iowa</strong>
        </span>
        <Icon name="pin" size={16} />
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function CoverageBanner() {
  return (
    <div className="coverage-banner">
      <Icon name="info" size={18} />
      <p>
        <strong>Reference-point context only.</strong> NASA POWER and SoilGrids describe a single Story County point. Rotation comparisons are descriptive and do not produce agronomic scores or recommendations.
      </p>
      <StatusPill tone="ready">Pilot data</StatusPill>
    </div>
  );
}

function LocationMap({ large = false }: { large?: boolean }) {
  return (
    <div className={`location-map ${large ? "large" : ""}`}>
      <div className="map-grid" />
      <svg className="region-placeholder" viewBox="0 0 310 290" aria-label="Abstract reference-point illustration, not a map">
        <path d="M60 60h190v170H60Z" strokeDasharray="5 5" stroke="currentColor" fill="none" opacity="0.3" />
        <circle cx="155" cy="145" r="7" />
        <path className="focus-ring" d="M120 110h70v70h-70Z" />
      </svg>
      <div className="map-label">
        <i />
        <div>
          <strong>Reference point</strong>
          <span>Not a field boundary or county average</span>
        </div>
      </div>
      <span className="map-scale">Single data point · not field-level</span>
    </div>
  );
}

function Dashboard({ state, county, context, scenarios, goTo }: { state: string; county: string; context: ProjectContext | null; scenarios: Record<ScenarioKey, string[]>; goTo: (page: Page) => void }) {
  const monthlyRecords = context?.environmental_dataset.monthly_records ?? [];
  const latestMonth = monthlyRecords[monthlyRecords.length - 1];
  const soilProperties = context?.soil_dataset.properties;
  const metrics = [
    { icon: "temperature" as IconName, label: "Mean temperature", value: latestMonth?.temperature_mean_c == null ? "Unavailable" : `${latestMonth.temperature_mean_c.toFixed(1)} °C`, meta: latestMonth?.month ?? "NASA POWER monthly record", source: "NASA POWER · reference point" },
    { icon: "rain" as IconName, label: "Monthly precipitation", value: latestMonth?.precipitation_total_mm == null ? "Unavailable" : `${latestMonth.precipitation_total_mm.toFixed(1)} mm`, meta: latestMonth?.month ?? "NASA POWER monthly record", source: "NASA POWER · reference point" },
    { icon: "water" as IconName, label: "Relative humidity", value: latestMonth?.relative_humidity_mean_percent == null ? "Unavailable" : `${latestMonth.relative_humidity_mean_percent.toFixed(1)} %`, meta: latestMonth?.month ?? "NASA POWER monthly record", source: "NASA POWER · reference point" },
    { icon: "soil" as IconName, label: "Soil organic carbon", value: soilProperties?.soc ? `${soilProperties.soc.value} ${soilProperties.soc.unit}` : "Unavailable", meta: context?.soil_dataset.depth_interval ?? "SoilGrids estimate", source: "SoilGrids · modelled estimate" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`${county}, ${state}`}
        description="Explore environmental context and compare crop-rotation strategies across multiple growing seasons."
        action={
          <button className="primary-button" onClick={() => goTo("planner")}>
            Open rotation planner <Icon name="arrow" size={16} />
          </button>
        }
      />
      <CoverageBanner />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top">
              <span className="icon-box"><Icon name={metric.icon} /></span>
              <StatusPill tone={context ? "ready" : "warning"}>{context ? "Connected" : "Unavailable"}</StatusPill>
            </div>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-meta">{metric.meta}</span>
            <div className="metric-source"><Icon name="database" size={14} /> {metric.source}</div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel location-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Geographic context</span>
              <h2>{county}, {state}</h2>
            </div>
            <button className="text-button" onClick={() => goTo("location")}>
              Explore location <Icon name="arrow" size={15} />
            </button>
          </div>
          <LocationMap />
          <div className="map-footer">
            <div>
              <small>COUNTY</small>
              <strong>{county}</strong>
            </div>
            <div>
              <small>AREA</small>
              <strong>{context ? `${context.reference_coordinates.latitude.toFixed(4)}, ${context.reference_coordinates.longitude.toFixed(4)}` : "Point pending"}</strong>
            </div>
            <div>
              <small>STATUS</small>
              <strong>{context ? "Reference point loaded" : "Data unavailable"}</strong>
            </div>
          </div>
        </article>
        <article className="panel scenarios-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Rotation scenarios</span>
              <h2>Ready to compare</h2>
            </div>
            <StatusPill tone="neutral">User-defined</StatusPill>
          </div>
          {(["A", "B"] as ScenarioKey[]).map((key) => (
            <div className="scenario-summary" key={key}>
              <div className={`scenario-letter ${key.toLowerCase()}`}>{key}</div>
              <div className="scenario-summary-main">
                <strong>Scenario {key}</strong>
                <span>{scenarios[key].length} growing seasons</span>
                <div className="mini-sequence">
                  {scenarios[key].map((crop, i) => (<span key={`${crop}-${i}`} title={crop}>{cropMeta[crop].code}</span>))}
                </div>
              </div>
            </div>
          ))}
          <button className="compare-button" onClick={() => goTo("comparison")}>
            Compare scenarios <Icon name="compare" size={17} />
          </button>
          <p className="fine-print"><Icon name="shield" size={14} /> Exploratory comparison — not a yield prediction.</p>
        </article>
      </section>
    </>
  );
}

function ExploreLocation({ state, county, context }: { state: string; county: string; context: ProjectContext | null }) {
  const soilMetrics = [
    { key: "clay", label: "Clay" },
    { key: "nitrogen", label: "Total nitrogen" },
    { key: "phh2o", label: "pH in water" },
    { key: "soc", label: "Soil organic carbon" },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Explore location"
        title={`${county}, ${state}`}
        description="Review the approved reference point, connected datasets, and their spatial limitations."
      />
      <CoverageBanner />
      <section className="explore-grid">
        <article className="panel map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Territory</span>
              <h2>{county}, {state}</h2>
            </div>
            <StatusPill tone={context ? "ready" : "warning"}>{context ? "Connected" : "Unavailable"}</StatusPill>
          </div>
          <LocationMap large />
        </article>
        <aside className="location-details">
          <article className="panel detail-panel">
            <span className="eyebrow">Location profile</span>
            <h2>{county}, {state}</h2>
            <dl>
              <div><dt>Geographic region</dt><dd>Story County, Iowa, USA</dd></div>
              <div><dt>Reference coordinates</dt><dd>{context ? `${context.reference_coordinates.latitude}, ${context.reference_coordinates.longitude}` : "Unavailable"}</dd></div>
              <div><dt>Environmental source</dt><dd>{context?.environmental_dataset.metadata.source ?? "Unavailable"}</dd></div>
              <div><dt>Spatial interpretation</dt><dd>Single point; not county-wide or field-level</dd></div>
            </dl>
          </article>
          <article className="panel data-readiness">
            <span className="eyebrow">Data readiness</span>
            <h2>Coverage inventory</h2>
            {[
              ["Meteorological context", context ? "NASA POWER monthly data connected" : "Unavailable"],
              ["Soil properties", context ? "SoilGrids 0–5 cm mean estimates connected" : "Unavailable"],
              ["Soil moisture", "Not supplied by the approved inputs"],
              ["Crop suitability", "Not calculated"],
            ].map(([name, status], i) => (
              <div className="readiness-row" key={name}>
                <span className={`readiness-dot d${i}`} />
                <div><strong>{name}</strong><span>{status}</span></div>
              </div>
            ))}
            <h3 className="soil-properties-title">SoilGrids properties</h3>
            <p className="soil-properties-caption">
              {context ? `${context.soil_dataset.statistic} estimates · ${context.soil_dataset.depth_interval}` : "Approved soil context unavailable"}
            </p>
            <div className="soil-property-grid">
              {soilMetrics.map((metric) => {
                const property = context?.soil_dataset.properties[metric.key];
                return (
                  <div className="soil-property-card" key={metric.key}>
                    <small>{metric.label}</small>
                    <strong>{property ? `${property.value} ${property.unit}` : "Unavailable"}</strong>
                  </div>
                );
              })}
            </div>
            <p className="soil-properties-note">
              Modelled values from one reference pixel; not laboratory measurements or county-wide conditions.
            </p>
          </article>
        </aside>
      </section>
      <div className="resolution-note">
        <Icon name="warning" size={20} />
        <div>
          <strong>Resolution matters</strong>
          <p>NASA POWER values represent one point extraction and SoilGrids values represent one modelled raster pixel. Neither is an exact condition for a farm or field.</p>
        </div>
      </div>
    </>
  );
}

function CropCard({ crop, index, onChange, onRemove, canRemove }: { crop: string; index: number; onChange: (crop: string) => void; onRemove: () => void; canRemove: boolean }) {
  const meta = cropMeta[crop];
  return (
    <article className="crop-card">
      <div className="season-number">Season {index + 1}</div>
      <div className={`crop-symbol ${meta.tone}`}>
        <span>{meta.code}</span>
        <svg viewBox="0 0 40 40"><path d="M20 34V13m0 8c-7 0-10-4-11-9 7 0 10 3 11 9Zm0 5c7 0 10-4 11-9-7 0-10 3-11 9Z" /></svg>
      </div>
      <select value={crop} onChange={(e) => onChange(e.target.value)} aria-label={`Crop for season ${index + 1}`}>
        {crops.map((item) => (<option key={item}>{item}</option>))}
      </select>
      <span className="crop-note">{meta.note}</span>
      <button className="remove-crop" onClick={onRemove} disabled={!canRemove} aria-label={`Remove season ${index + 1}`}><Icon name="trash" size={15} /></button>
    </article>
  );
}

function RotationPlanner({ scenarios, setScenarios, goTo }: { scenarios: Record<ScenarioKey, string[]>; setScenarios: (value: Record<ScenarioKey, string[]>) => void; goTo: (page: Page) => void }) {
  const [active, setActive] = useState<ScenarioKey>("A");
  const updateCrop = (index: number, crop: string) => setScenarios({ ...scenarios, [active]: scenarios[active].map((item, i) => (i === index ? crop : item)) });
  const removeCrop = (index: number) => setScenarios({ ...scenarios, [active]: scenarios[active].filter((_, i) => i !== index) });
  const addSeason = () => setScenarios({ ...scenarios, [active]: [...scenarios[active], "Oats"] });

  return (
    <>
      <PageHeader
        eyebrow="Rotation planner"
        title="Build two rotation pathways"
        description="Arrange candidate crops across seasons, then compare their environmental context and trade-offs."
        action={<button className="primary-button" onClick={() => goTo("comparison")}>Compare scenarios <Icon name="compare" size={16} /></button>}
      />
      <CoverageBanner />
      <div className="scenario-tabs" role="tablist">
        {(["A", "B"] as ScenarioKey[]).map((key) => (
          <button role="tab" aria-selected={active === key} className={active === key ? "active" : ""} onClick={() => setActive(key)} key={key}>
            <span className={`scenario-letter ${key.toLowerCase()}`}>{key}</span>
            <span><strong>Scenario {key}</strong><small>{scenarios[key].length} seasons</small></span>
          </button>
        ))}
      </div>
      <section className="planner-panel panel">
        <div className="planner-heading">
          <div>
            <span className="eyebrow">Editing scenario {active}</span>
            <h2>Season sequence</h2>
            <p>Select a crop for each growing season. Candidate crops require local agronomic validation.</p>
          </div>
          <button className="secondary-button" onClick={addSeason} disabled={scenarios[active].length >= 6}><Icon name="plus" size={16} /> Add season</button>
        </div>
        <div className="crop-timeline">
          {scenarios[active].map((crop, index) => (
            <div className="crop-step" key={`${active}-${index}`}>
              <CropCard crop={crop} index={index} onChange={(value) => updateCrop(index, value)} onRemove={() => removeCrop(index)} canRemove={scenarios[active].length > 2} />
              {index < scenarios[active].length - 1 && (<span className="timeline-arrow"><Icon name="arrow" size={17} /></span>)}
            </div>
          ))}
        </div>
        <div className="planner-footer">
          <div><Icon name="info" size={17} /><span><strong>Illustrative sequence.</strong> Crop options and rotation rules have not been validated for this pilot territory.</span></div>
          <span>{scenarios[active].length}/6 seasons</span>
        </div>
      </section>
      <section className="both-scenarios">
        <span className="eyebrow">Scenario overview</span>
        <div className="sequence-overview-grid">
          {(["A", "B"] as ScenarioKey[]).map((key) => (
            <button key={key} onClick={() => setActive(key)} className={active === key ? "selected" : ""}>
              <span className={`scenario-letter ${key.toLowerCase()}`}>{key}</span>
              <div><strong>Scenario {key}</strong><p>{scenarios[key].join(" → ")}</p></div>
              <Icon name="arrow" size={17} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function SeasonStrip({ crops: list, tone }: { crops: string[]; tone: "a" | "b" }) {
  return (
    <div className={`season-strip ${tone}`}>
      {list.map((crop, i) => (
        <div key={`${crop}-${i}`}><small>S{i + 1}</small><span>{cropMeta[crop].code}</span><strong>{crop}</strong></div>
      ))}
    </div>
  );
}

function Comparison({ state, county, scenarios, result, loading, error, goTo }: { state: string; county: string; scenarios: Record<ScenarioKey, string[]>; result: RotationComparison | null; loading: boolean; error: string | null; goTo: (page: Page) => void }) {
  const summaryA = result?.rotation_summaries.find((summary) => summary.rotation_id === "scenario_a");
  const summaryB = result?.rotation_summaries.find((summary) => summary.rotation_id === "scenario_b");
  const matchedEvidence = result?.rotation_summaries.flatMap((summary) => [
    ...summary.transitions.flatMap((transition) => transition.agronomic_evidence),
    ...summary.season_details.flatMap((season) => season.agronomic_evidence),
  ]) ?? [];
  const uniqueEvidence = Array.from(
    new Map(matchedEvidence.map((item) => [item.rule_id, item])).values(),
  );
  const countTone = (a: number | undefined, b: number | undefined) =>
    a === undefined || b === undefined ? "unknown" : a === b ? "similar" : "difference";
  const indicators = [
    { icon: "calendar" as IconName, name: "Sequence length", a: `${summaryA?.season_count ?? "—"} seasons`, b: `${summaryB?.season_count ?? "—"} seasons`, tone: countTone(summaryA?.season_count, summaryB?.season_count), text: "A structural count of the user-entered seasons; it does not indicate performance." },
    { icon: "diversity" as IconName, name: "Distinct crop types", a: `${summaryA?.distinct_crop_count ?? "—"}`, b: `${summaryB?.distinct_crop_count ?? "—"}`, tone: countTone(summaryA?.distinct_crop_count, summaryB?.distinct_crop_count), text: "Counts unique crop labels in each sequence. This is not evidence that either sequence is agronomically better." },
    { icon: "rotate" as IconName, name: "Repeated crop occurrences", a: `${summaryA?.repeated_crop_occurrences ?? "—"}`, b: `${summaryB?.repeated_crop_occurrences ?? "—"}`, tone: countTone(summaryA?.repeated_crop_occurrences, summaryB?.repeated_crop_occurrences), text: "Counts occurrences beyond the first instance of each crop label." },
    { icon: "compare" as IconName, name: "Adjacent transitions", a: `${summaryA?.transition_count ?? "—"}`, b: `${summaryB?.transition_count ?? "—"}`, tone: countTone(summaryA?.transition_count, summaryB?.transition_count), text: "Counts adjacent season pairs. No transition score or yield effect is inferred." },
  ];
  const periodStart = result?.data_context.environmental_dataset.period_start;
  const periodEnd = result?.data_context.environmental_dataset.period_end;

  return (
    <>
      <PageHeader
        eyebrow="Scenario comparison"
        title="Compare pathways, not winners"
        description="Compare sequence structure with the same Story County data context. No crop-level environmental effects are calculated."
        action={<button className="secondary-button" onClick={() => goTo("planner")}>Edit rotations <Icon name="rotate" size={16} /></button>}
      />
      <CoverageBanner />
      {loading && <div className="api-notice" role="status">Comparing the current rotations…</div>}
      {error && <div className="api-notice error" role="alert">Comparison unavailable: {error}</div>}
      <div className="comparison-context">
        <span><Icon name="pin" size={15} /><b>Location</b> {county}, {state} reference point</span>
        <span><Icon name="database" size={15} /><b>Sources</b> {result?.data_context.environmental_dataset.source ?? "NASA POWER"} + {result?.data_context.soil_dataset.source ?? "SoilGrids"}</span>
        <span><Icon name="calendar" size={15} /><b>Period</b> {periodStart && periodEnd ? `${periodStart} to ${periodEnd}` : "Unavailable"}</span>
        <span><Icon name="shield" size={15} /><b>Method</b> Descriptive counts only</span>
      </div>
      <section className="comparison-hero">
        <article className="scenario-column a">
          <div className="scenario-title">
            <span className="scenario-letter a">A</span>
            <div><span>Scenario A</span><strong>{scenarios.A.length}-season rotation</strong></div>
          </div>
          <SeasonStrip crops={scenarios.A} tone="a" />
        </article>
        <div className="versus">VS</div>
        <article className="scenario-column b">
          <div className="scenario-title">
            <span className="scenario-letter b">B</span>
            <div><span>Scenario B</span><strong>{scenarios.B.length}-season rotation</strong></div>
          </div>
          <SeasonStrip crops={scenarios.B} tone="b" />
        </article>
      </section>
      <section className="indicator-section">
        <div className="section-title">
          <div><span className="eyebrow">Sequence structure</span><h2>Descriptive comparison</h2></div>
          <span className="no-score"><Icon name="info" size={15} /> No scores or ranking</span>
        </div>
        <div className="indicator-list">
          {indicators.map((item) => (
            <article className="indicator-card" key={item.name}>
              <div className="indicator-name">
                <span className="icon-box"><Icon name={item.icon} /></span>
                <div><strong>{item.name}</strong><button title="Interpretation is explained below"><Icon name="info" size={14} /></button></div>
              </div>
              <div className={`indicator-value ${item.tone}`}><small>SCENARIO A</small><strong>{item.a}</strong></div>
              <div className="indicator-track">
                <i /><span>{item.tone === "similar" ? "Similar" : item.tone === "difference" ? "Difference" : "Data gap"}</span><i />
              </div>
              <div className={`indicator-value ${item.tone}`}><small>SCENARIO B</small><strong>{item.b}</strong></div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="tradeoff-grid">
        <article className="tradeoff-card potential">
          <span><Icon name="check" size={18} /></span>
          <div><h3>Research evidence</h3><p>Where a transition matches a reviewed study, its study-scoped note is available in the backend response. Those notes are not locally validated recommendations.</p></div>
        </article>
        <article className="tradeoff-card constraint">
          <span><Icon name="warning" size={18} /></span>
          <div><h3>Not assessed</h3><p>Yield, profitability, crop suitability, pests, water stress, and field-level benefits are not assessed by this comparison.</p></div>
        </article>
      </section>
      <section className="panel research-evidence">
        <div className="section-title">
          <div><span className="eyebrow">Research context</span><h2>Study-scoped observations</h2></div>
          <StatusPill tone="warning">Not locally validated</StatusPill>
        </div>
        {uniqueEvidence.length > 0 ? uniqueEvidence.map((item) => (
          <article className="evidence-item" key={item.rule_id}>
            <h3>{item.rule_id.replace(/_/g, " ")}</h3>
            <p>{item.statement}</p>
            <p className="fine-print">{item.limitations}</p>
            <a href={item.source.url} target="_blank" rel="noreferrer">
              {item.source.id} · {item.source.title} <Icon name="external" size={13} />
            </a>
          </article>
        )) : (
          <p className="fine-print">No directly reviewed study note matches these crop transitions. No other agronomic rules are activated.</p>
        )}
      </section>
      {result?.comparison_warnings.map((warning) => (
        <div className="api-notice" role="status" key={warning}>{warning}</div>
      ))}
    </>
  );
}

const sources = [
  { name: "NASA POWER", provider: "NASA", variable: "Monthly temperature, precipitation, and humidity", resolution: "Single Story County reference point", status: "Connected", type: "Environmental estimates" },
  { name: "SoilGrids 2.0", provider: "ISRIC", variable: "Clay, nitrogen, pH, and soil organic carbon", resolution: "Single raster pixel; 0–5 cm mean", status: "Connected", type: "Modelled soil estimates" },
];

function Methodology({ context }: { context: ProjectContext | null }) {
  const [openSource, setOpenSource] = useState<string | null>("NASA POWER");
  const startDate = context?.environmental_dataset.metadata.start_date;
  const endDate = context?.environmental_dataset.metadata.end_date;
  return (
    <>
      <PageHeader
        eyebrow="Data & methodology"
        title="Approved inputs and limitations"
        description="Review the Story County reference datasets, their provenance, and what the current descriptive comparison cannot support."
      />
      <div className="method-status">
        <div>
          <Icon name="database" size={22} />
          <span><strong>{context ? "2 approved datasets connected" : "Approved data unavailable"}</strong><small>NASA POWER and SoilGrids inputs are loaded from the project data files.</small></span>
        </div>
        <StatusPill tone={context ? "ready" : "warning"}>{context ? "Connected" : "Unavailable"}</StatusPill>
      </div>
      <section className="panel source-panel">
        <div className="section-title">
          <div><span className="eyebrow">Source register</span><h2>Project-approved datasets</h2></div>
          <p>Only configured project inputs are shown.</p>
        </div>
        <div className="source-table">
          <div className="source-head">
            <span>Dataset / provider</span><span>Potential variable</span><span>Data type</span><span>Status</span><span />
          </div>
          {sources.map((source) => (
            <div className="source-wrap" key={source.name}>
              <button className="source-row" onClick={() => setOpenSource(openSource === source.name ? null : source.name)}>
                <span><strong>{source.name}</strong><small>{source.provider}</small></span>
                <span>{source.variable}</span>
                <span>{source.type}</span>
                <span><StatusPill tone={source.status === "Connected" ? "ready" : "neutral"}>{source.status}</StatusPill></span>
                <Icon name="chevron" size={16} className={openSource === source.name ? "up" : ""} />
              </button>
              {openSource === source.name && (
                <div className="source-detail">
                  <div><small>UNIT</small><strong>See source variables</strong></div>
                  <div><small>SPATIAL RESOLUTION</small><strong>{source.resolution}</strong></div>
                  <div><small>TEMPORAL / PERIOD</small><strong>{source.name === "NASA POWER" && startDate && endDate ? `${startDate} – ${endDate}` : "Soil depth: 0–5 cm"}</strong></div>
                  <div><small>AGGREGATION</small><strong>{source.name === "NASA POWER" ? "Monthly summaries" : "Mean estimate"}</strong></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="data-type-grid">
        {[
          ["Environmental estimates", "NASA POWER point-extraction summaries; not direct measurements at an individual field.", "ready"],
          ["Modelled soil data", "SoilGrids estimates for a single reference pixel and 0–5 cm depth; not laboratory results.", "candidate"],
          ["Descriptive metrics", "Sequence length, distinct crop labels, repeated occurrences, and adjacent transitions.", "sample"],
          ["Assumptions", "Rules introduced where information is incomplete; these must remain visible to users.", "warning"],
        ].map(([title, text, tone], i) => (
          <article key={title}>
            <span className={`type-number n${i}`}>0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <StatusPill tone={tone as "ready" | "candidate" | "sample" | "warning"}>{i < 2 ? "Connected" : i === 2 ? "Calculated" : "Disabled"}</StatusPill>
          </article>
        ))}
      </section>
      <section className="limitations panel">
        <div className="limitations-title">
          <span className="icon-box amber"><Icon name="warning" /></span>
          <div><span className="eyebrow">Uncertainty & limitations</span><h2>Interpret results with care</h2></div>
        </div>
        <div className="limitations-grid">
          <div><strong>Spatial resolution</strong><p>NASA POWER and SoilGrids values are from a single reference point/pixel, not county-wide or field-level data.</p></div>
          <div><strong>Temporal alignment</strong><p>NASA POWER provides monthly values for 2020–2025; SoilGrids properties are modelled estimates and are not time-series observations.</p></div>
          <div><strong>Agronomic validation</strong><p>Research observations retain their source limitations and have not been locally validated. Draft decision rules stay disabled.</p></div>
          <div><strong>Decision scope</strong><p>FIELD SHIFT supports exploration. It does not guarantee yield or replace site-specific agronomic advice.</p></div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenarios, setScenarios] = useState(defaultScenarios);
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RotationComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const state = context?.pilot_geography.state ?? "Iowa";
  const county = context?.pilot_geography.county ?? "Story County";
  const selectedNav = useMemo(() => navItems.find((item) => item.id === page)!, [page]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;
    fetchProjectContext()
      .then((projectContext) => {
        if (active) {
          setContext(projectContext);
          setContextError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setContextError(error instanceof Error ? error.message : "Unknown API error.");
        }
      })
      .finally(() => {
        if (active) setContextLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!context) return;
    let active = true;
    setComparison(null);
    setComparisonLoading(true);
    setComparisonError(null);
    compareScenarios(scenarios)
      .then((result) => {
        if (active) setComparison(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setComparison(null);
          setComparisonError(error instanceof Error ? error.message : "Unknown API error.");
        }
      })
      .finally(() => {
        if (active) setComparisonLoading(false);
      });
    return () => {
      active = false;
    };
  }, [context, scenarios]);

  const navigate = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard state={state} county={county} context={context} scenarios={scenarios} goTo={navigate} />;
    if (page === "location") return <ExploreLocation state={state} county={county} context={context} />;
    if (page === "planner") return <RotationPlanner scenarios={scenarios} setScenarios={setScenarios} goTo={navigate} />;
    if (page === "comparison") return <Comparison state={state} county={county} scenarios={scenarios} result={comparison} loading={comparisonLoading} error={comparisonError} goTo={navigate} />;
    return <Methodology context={context} />;
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <FieldMark />
          <button className="mobile-close" onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
        </div>
        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => navigate(item.id)} className={page === item.id ? "active" : ""}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {page === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-context">
          <span className="nav-label">Geographic context</span>
          <div className="context-card">
            <span className="pin-dot"><Icon name="pin" size={17} /></span>
            <div>
              <small>PILOT AREA</small>
              <strong>{county}</strong>
              <span>{context ? "Reference data loaded" : "Loading project data"}</span>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="nasa-orbit">N</div>
          <div><strong>NASA Space Apps</strong><span>Challenge 2026 prototype</span></div>
        </div>
      </aside>
      {mobileOpen && (<button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />)}
      <div className="app-main">
        <div className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <div className="mobile-brand"><FieldMark compact /><strong>{selectedNav.label}</strong></div>
          <div className="topbar-copy"><strong>Explore smarter crop rotations</strong><span>with environmental intelligence</span></div>
          <ProjectLocation county={county} />
        </div>
        <main>
          {contextLoading && <div className="api-notice" role="status">Loading approved Story County reference data…</div>}
          {contextError && <div className="api-notice error" role="alert">Project data unavailable: {contextError}</div>}
          {renderPage()}
        </main>
        <footer className="app-footer">
          <span>FIELD SHIFT · Exploratory decision-support prototype</span>
          <span>Reference-point data only · No agronomic recommendations</span>
        </footer>
      </div>
    </div>
  );
}