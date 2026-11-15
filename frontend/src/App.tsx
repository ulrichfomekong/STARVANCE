import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  compareScenarios,
  fetchProjectContext,
  type ProjectContext,
  type RotationComparison,
  type ScenarioKey,
  type ScenarioSeason,
  type ScenarioSequences,
} from "./api";

type Page = "dashboard" | "location" | "planner" | "methodology";
type SequenceMode = "shuffle" | "manual";
const scenarioKeys: ScenarioKey[] = ["A", "B", "C", "D"];

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const crops = ["Corn", "Soybean", "Oats", "Alfalfa"];
const cropMeta: Record<string, { code: string; tone: string; note: string }> = {
  Corn: { code: "CR", tone: "gold", note: "Warm-season cereal" },
  Soybean: { code: "SB", tone: "green", note: "Warm-season legume" },
  Oats: { code: "OA", tone: "sand", note: "Small-grain cereal" },
  Alfalfa: { code: "AL", tone: "green", note: "Perennial forage legume" },
};

const defaultScenarios: ScenarioSequences = {
  A: [{ crop: "" }],
  B: [{ crop: "" }],
  C: [{ crop: "" }],
  D: [{ crop: "" }],
};

const emptyGeneratedSequences: ScenarioSequences = { A: [], B: [], C: [], D: [] };
const defaultSequenceModes: Record<ScenarioKey, SequenceMode> = {
  A: "shuffle",
  B: "shuffle",
  C: "shuffle",
  D: "shuffle",
};

function scenarioNumber(key: ScenarioKey): string {
  return String(scenarioKeys.indexOf(key) + 1);
}

function sameSeason(first: ScenarioSeason, second: ScenarioSeason): boolean {
  return first.crop === second.crop && first.cover_crop === second.cover_crop;
}

function shuffleSeasons(seasons: ScenarioSeason[]): ScenarioSeason[] {
  const shuffled = seasons.map((season) => ({ ...season }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  if (
    shuffled.length > 1 &&
    shuffled.every((season, index) => sameSeason(season, seasons[index]))
  ) {
    const differentSeasonIndex = shuffled.findIndex(
      (season, index) => index > 0 && !sameSeason(season, shuffled[0]),
    );
    if (differentSeasonIndex > 0) {
      [shuffled[0], shuffled[differentSeasonIndex]] = [
        shuffled[differentSeasonIndex],
        shuffled[0],
      ];
    }
  }

  return shuffled;
}

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "location", label: "Explore Location", icon: "pin" },
  { id: "planner", label: "Rotation Planner", icon: "rotate" },
  { id: "methodology", label: "Data & Methodology", icon: "database" },
];

type IconName = "grid" | "pin" | "rotate" | "compare" | "database" | "search" | "chevron" | "rain" | "temperature" | "soil" | "layers" | "arrow" | "info" | "warning" | "plus" | "trash" | "menu" | "close" | "check" | "calendar" | "external" | "shield" | "water" | "diversity" | "stress";

// Added style prop to Icon to fix broken layout alignments
function Icon({ name, size = 18, className = "", style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
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
    <svg style={style} className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function FieldMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "compact" : ""}`} aria-label="SOWSCOPE">
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <path d="M6 31c7-12 17-18 32-19-3 13-12 22-27 25" />
        <path d="M10 34c7-7 14-12 23-16M20 27l-1-7m8 2 1-7" />
        <circle cx="33.5" cy="9.5" r="2.5" />
      </svg>
      {!compact && (
        <div>
          <strong>SOWSCOPE</strong>
          <span>NASA Space Apps 2026</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ children, tone = "sample" }: { children: ReactNode; tone?: "sample" | "ready" | "candidate" | "warning" | "neutral" }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function StateSelector({ selected, onSelect, dark = false }: { selected: string; onSelect: (state: string) => void; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = states.filter((state) => state.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={`state-select ${dark ? "dark" : ""}`}>
      <button className="state-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <small>Selected state</small>
          <strong>{selected}</strong>
        </span>
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <>
          <button className="select-scrim" onClick={() => setOpen(false)} aria-label="Close state selector" />
          <div className="state-menu">
            <div className="state-search">
              <Icon name="search" size={16} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all 50 states" />
            </div>
            <div className="state-options">
              {filtered.map((state) => (
                <button key={state} onClick={() => { onSelect(state); setOpen(false); setQuery(""); }} className={selected === state ? "selected" : ""}>
                  <span>{state}</span>
                  {selected === state && <Icon name="check" size={15} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
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
        <strong>Explore the project area.</strong> Find weather and soil information, then compare crop rotations.
      </p>
      <StatusPill tone="sample">Story County, Iowa</StatusPill>
    </div>
  );
}

function LocationMap({
  state,
  coordinates,
  large = false,
}: {
  state: string;
  coordinates: ProjectContext["reference_coordinates"] | undefined;
  large?: boolean;
}) {
  const isIowa = state === "Iowa";
  const mapRef = useRef<HTMLDivElement>(null);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);

  useEffect(() => {
    if (!isIowa || !coordinates || !mapRef.current) return;

    setTilesUnavailable(false);
    const map = L.map(mapRef.current, {
      center: [coordinates.latitude, coordinates.longitude],
      zoom: large ? 12 : 10,
      scrollWheelZoom: large,
    });

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
    });
    tiles.on("tileerror", () => setTilesUnavailable(true));
    tiles.addTo(map);

    L.circleMarker([coordinates.latitude, coordinates.longitude], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#568943",
      fillOpacity: 1,
    })
      .bindPopup(
        `<strong>Story County project location</strong><br>${coordinates.latitude.toFixed(7)}, ${coordinates.longitude.toFixed(7)}`,
      )
      .addTo(map);

    return () => {
      map.remove();
    };
  }, [coordinates?.latitude, coordinates?.longitude, isIowa, large]);

  return (
    <div className={`location-map ${large ? "large" : ""}`}>
      {isIowa && coordinates ? (
        <div
          ref={mapRef}
          className="leaflet-map"
          role="region"
          aria-label="Interactive map centered on the Story County project location"
        />
      ) : (
        <div className="map-unavailable" role="status">
          Map data is unavailable for this location.
        </div>
      )}
      {isIowa && coordinates && (
        <div className="map-label">
          <i />
          <div>
            <strong>Story County project location</strong>
            <span>Weather and soil data location</span>
          </div>
        </div>
      )}
      {isIowa && coordinates && tilesUnavailable && (
        <div className="map-error" role="status">
          The map couldn't load. Check your internet connection.
        </div>
      )}
    </div>
  );
}

type ClimateMetric =
  | "temperature_mean_c"
  | "precipitation_total_mm"
  | "relative_humidity_mean_percent";

function MonthlyClimateChart({
  records,
  metric,
  title,
  unit,
  color,
  decimals,
}: {
  records: ProjectContext["environmental_dataset"]["monthly_records"];
  metric: ClimateMetric;
  title: string;
  unit: string;
  color: string;
  decimals: number;
}) {
  const values = records.flatMap((record) => {
    const value = record[metric];
    return value == null ? [] : [{ record, value }];
  });
  if (values.length === 0) {
    return (
      <article className="climate-chart-card">
        <h3>{title}</h3>
        <p>Monthly data is unavailable for this indicator.</p>
      </article>
    );
  }

  const width = 720;
  const height = 190;
  const left = 54;
  const right = 704;
  const top = 18;
  const bottom = 145;
  const minimum = Math.min(...values.map(({ value }) => value));
  const maximum = Math.max(...values.map(({ value }) => value));
  const valueRange = maximum - minimum || Math.max(Math.abs(maximum) * 0.1, 1);
  const lowerBound = minimum - valueRange * 0.08;
  const upperBound = maximum + valueRange * 0.08;
  const points = values.map(({ record, value }, index) => {
    const x = values.length === 1
      ? (left + right) / 2
      : left + (index / (values.length - 1)) * (right - left);
    const y = top + ((upperBound - value) / (upperBound - lowerBound)) * (bottom - top);
    return { record, value, x, y };
  });
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  return (
    <article className="climate-chart-card">
      <div className="climate-chart-heading">
        <h3>{title}</h3>
        <span>{values.length} monthly values</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title} monthly time series from ${values[0].record.month} to ${values[values.length - 1].record.month}`}
      >
        <line x1={left} y1={top} x2={right} y2={top} className="climate-chart-grid-line" />
        <line x1={left} y1={bottom} x2={right} y2={bottom} className="climate-chart-grid-line" />
        <text x={left - 8} y={top + 4} textAnchor="end">
          {upperBound.toFixed(decimals)}
        </text>
        <text x={left - 8} y={bottom + 4} textAnchor="end">
          {lowerBound.toFixed(decimals)}
        </text>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" />
        {points.map(({ record, value, x, y }) => (
          <circle key={record.month} cx={x} cy={y} r="2.5" fill={color}>
            <title>{`${record.month}: ${value.toFixed(decimals)} ${unit}`}</title>
          </circle>
        ))}
        {labelIndexes.map((index) => (
          <text
            key={values[index].record.month}
            x={points[index].x}
            y={height - 10}
            textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
          >
            {values[index].record.month}
          </text>
        ))}
        <text x={width - 4} y={top + 4} textAnchor="end" className="climate-chart-unit">
          {unit}
        </text>
      </svg>
      <p>NASA POWER source data · derived monthly values</p>
    </article>
  );
}

function Dashboard({
  state,
  scenarios,
  generatedSequences,
  scenarioCount,
  context,
  contextLoading,
  goTo,
}: {
  state: string;
  scenarios: ScenarioSequences;
  generatedSequences: ScenarioSequences;
  scenarioCount: number;
  context: ProjectContext | null;
  contextLoading: boolean;
  goTo: (page: Page) => void;
}) {
  const isIowa = state === "Iowa";
  const records = context?.environmental_dataset.monthly_records ?? [];
  const latestMonth = records.length > 0 ? records[records.length - 1] : null;
  const soilProperties = context?.soil_dataset.properties;
  const apiStatus = contextLoading ? "Loading" : context ? "Loaded" : "Unavailable";
  const environmentalSource =
    context?.environmental_dataset.metadata.source.replace(/ Daily API$/, "") ?? "NASA POWER";

  const metrics = [
    {
      icon: "temperature" as IconName,
      label: "Mean Temperature",
      value: isIowa && latestMonth?.temperature_mean_c != null ? `${latestMonth.temperature_mean_c.toFixed(1)} °C` : "N/A",
      meta: isIowa && latestMonth ? `Monthly mean · ${latestMonth.month}` : "Data unavailable",
      source: environmentalSource,
      provenance: "Derived monthly mean"
    },
    {
      icon: "rain" as IconName,
      label: "Precipitation",
      value: isIowa && latestMonth?.precipitation_total_mm != null ? `${latestMonth.precipitation_total_mm.toFixed(1)} mm` : "N/A",
      meta: isIowa && latestMonth ? `Monthly total · ${latestMonth.month}` : "Data unavailable",
      source: environmentalSource,
      provenance: "Derived monthly total"
    },
    {
      icon: "water" as IconName,
      label: "Relative Humidity",
      value: isIowa && latestMonth?.relative_humidity_mean_percent != null ? `${latestMonth.relative_humidity_mean_percent.toFixed(1)} %` : "N/A",
      meta: isIowa && latestMonth ? `Monthly mean · ${latestMonth.month}` : "Data unavailable",
      source: environmentalSource,
      provenance: "Derived monthly mean"
    },
    {
      icon: "soil" as IconName,
      label: "Soil Organic Carbon",
      value: isIowa && soilProperties?.soc ? `${soilProperties.soc.value} ${soilProperties.soc.unit}` : "N/A",
      meta: isIowa ? `Depth: ${context?.soil_dataset.depth_interval ?? "Unavailable"}` : "Data unavailable",
      source: context?.soil_dataset.source ?? "ISRIC SoilGrids 2.0",
      provenance: "Modelled soil estimate"
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={isIowa ? "Story County, Iowa" : `${state} at a glance`}
        description={isIowa ? "Explore Story County weather and soil data, then compare crop rotations." : `Data for ${state} isn't available yet. Story County, Iowa is the current study area.`}
        action={<button className="primary-button" onClick={() => goTo("planner")}>Open rotation planner <Icon name="arrow" size={16} /></button>}
      />
      <CoverageBanner />

      {!isIowa && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#fff3cd", border: "1px solid #ffe69c", borderRadius: "8px", display: "flex", gap: "0.75rem", alignItems: "center", color: "#664d03" }}>
          <Icon name="warning" size={20} />
          <span>
            <strong>Data for {state} isn't available yet.</strong> Choose Iowa to explore Story County.
          </span>
        </div>
      )}

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top">
              <span className="icon-box"><Icon name={metric.icon} /></span>
              <StatusPill tone={isIowa ? (context ? "ready" : contextLoading ? "neutral" : "warning") : "warning"}>{isIowa ? apiStatus : "Unavailable"}</StatusPill>
            </div>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-meta">{metric.meta}</span>
            <span className="metric-provenance">{metric.provenance}</span>
            <div className="metric-source"><Icon name="database" size={14} /> {metric.source}</div>
          </article>
        ))}
      </section>

      {isIowa && (
        <section className="climate-trends">
          <div className="section-title">
            <div>
              <span className="eyebrow">Monthly climate</span>
              <h2>Weather over time</h2>
            </div>
            <p>
              Story County reference point ·{" "}
              {context
                ? `${context.environmental_dataset.metadata.start_date} – ${context.environmental_dataset.metadata.end_date}`
                : contextLoading
                  ? "Loading source period"
                  : "Period unavailable"}
            </p>
          </div>
          {context ? (
            <div className="climate-chart-grid">
              <MonthlyClimateChart
                records={records}
                metric="temperature_mean_c"
                title="Mean temperature"
                unit="°C"
                color="#c56f49"
                decimals={1}
              />
              <MonthlyClimateChart
                records={records}
                metric="precipitation_total_mm"
                title="Precipitation"
                unit="mm"
                color="#558197"
                decimals={1}
              />
              <MonthlyClimateChart
                records={records}
                metric="relative_humidity_mean_percent"
                title="Relative humidity"
                unit="%"
                color="#6a9e58"
                decimals={1}
              />
            </div>
          ) : (
            <div className="climate-chart-empty">
              {contextLoading ? "Loading monthly climate data…" : "Monthly climate data is unavailable."}
            </div>
          )}
        </section>
      )}

      <section className="dashboard-grid">
        <article className="panel location-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Geographic context</span>
              <h2>{isIowa ? "Story County, Iowa" : `${state} Profile`}</h2>
            </div>
            <button className="text-button" onClick={() => goTo("location")}>Explore location <Icon name="arrow" size={15} /></button>
          </div>
          <LocationMap state={state} coordinates={context?.reference_coordinates} />
          <div className="map-footer">
            <div><small>STATE</small><strong>{state}</strong></div>
            <div><small>COUNTY</small><strong>{isIowa ? "Story County" : "Unavailable"}</strong></div>
            <div><small>STATUS</small><strong>{isIowa ? apiStatus : "Data unavailable"}</strong></div>
          </div>
        </article>
        <article className="panel scenarios-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Rotation scenarios</span><h2>Ready to compare</h2></div>
            <StatusPill tone="candidate">Side by side</StatusPill>
          </div>
          {scenarioKeys.slice(0, scenarioCount).map((key) => {
            const displaySequence = generatedSequences[key].length > 0
              ? generatedSequences[key]
              : scenarios[key].filter((season) => cropMeta[season.crop]);
            return (
              <div className="scenario-summary" key={key}>
                <div className={`scenario-letter ${key.toLowerCase()}`}>{key}</div>
                <div className="scenario-summary-main">
                  <strong>Scenario {scenarioNumber(key)}</strong>
                  <span>
                    {generatedSequences[key].length > 0
                      ? "Sequence generated"
                      : displaySequence.length > 0
                        ? `${displaySequence.length} ${displaySequence.length === 1 ? "crop" : "crops"} entered`
                        : "Add crops in planner"}
                  </span>
                  <div className="mini-sequence">
                    {displaySequence.map((season, i) => (
                      <span key={`${season.crop}-${i}`} title={season.crop}>
                        {cropMeta[season.crop].code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <button className="compare-button" onClick={() => goTo("planner")}>Plan scenarios <Icon name="compare" size={17} /></button>
        </article>
      </section>
    </>
  );
}

function ExploreLocation({
  state,
  context,
}: {
  state: string;
  context: ProjectContext | null;
}) {
  const isIowa = state === "Iowa";
  const properties = context?.soil_dataset.properties;
  const coordinates = context?.reference_coordinates;

  return (
    <>
      <PageHeader
        eyebrow="Explore location"
        title={isIowa ? "Story County, Iowa" : `${state} territory`}
        description={isIowa ? "Explore the mapped project location, soil details, and weather data." : `Data for ${state} isn't available yet. Story County, Iowa is the current study area.`}
      />
      <CoverageBanner />

      {!isIowa ? (
        <div className="panel" style={{ padding: "3rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Icon name="pin" size={48} style={{ color: "#888", marginBottom: "1rem" }} />
          <h2>Story County is the current study area</h2>
          <p style={{ color: "#666", maxWidth: "500px", marginTop: "1rem" }}>
            We don't have data for {state} yet. Choose Iowa to explore the project location.
          </p>
        </div>
      ) : (
        <section className="explore-grid">
          <article className="panel map-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">Project location</span><h2>Story County, Iowa</h2></div>
              <StatusPill tone="ready">Iowa</StatusPill>
            </div>
            <LocationMap state={state} coordinates={coordinates} large />
          </article>
          <aside className="location-details">
            <article className="panel detail-panel">
              <span className="eyebrow">Location profile</span>
              <h2>Story County location</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                <div>                <small style={{ display: "block", color: "#666" }}>Coordinates</small><strong>{coordinates ? `${Math.abs(coordinates.latitude).toFixed(7)}° ${coordinates.latitude >= 0 ? "N" : "S"}, ${Math.abs(coordinates.longitude).toFixed(7)}° ${coordinates.longitude >= 0 ? "E" : "W"}` : "Unavailable"}</strong></div>
                <div><small style={{ display: "block", color: "#666" }}>Data location</small><strong>Story County, Iowa</strong></div>
              </div>
            </article>

            <article className="panel data-readiness">
              <span className="eyebrow">Soil Context</span>
              <h2>{context?.soil_dataset.source ?? "SoilGrids"}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
                  <small style={{ display: "block", color: "#666", marginBottom: "0.25rem" }}>Clay</small>
                  <strong>{properties?.clay ? `${properties.clay.value} ${properties.clay.unit}` : "Unavailable"}</strong>
                </div>
                <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
                  <small style={{ display: "block", color: "#666", marginBottom: "0.25rem" }}>Nitrogen</small>
                  <strong>{properties?.nitrogen ? `${properties.nitrogen.value} ${properties.nitrogen.unit}` : "Unavailable"}</strong>
                </div>
                <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
                  <small style={{ display: "block", color: "#666", marginBottom: "0.25rem" }}>pH (water)</small>
                  <strong>{properties?.phh2o ? `${properties.phh2o.value} ${properties.phh2o.unit}` : "Unavailable"}</strong>
                </div>
                <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
                  <small style={{ display: "block", color: "#666", marginBottom: "0.25rem" }}>Organic Carbon</small>
                  <strong>{properties?.soc ? `${properties.soc.value} ${properties.soc.unit}` : "Unavailable"}</strong>
                </div>
              </div>
              <div style={{ marginTop: "1rem", padding: "1rem", background: "#fff3cd", borderRadius: "8px", display: "flex", gap: "0.75rem", fontSize: "0.9rem" }}>
                <Icon name="warning" size={20} style={{ flexShrink: 0 }} />
                <span>SoilGrids estimates describe the upper {context?.soil_dataset.depth_interval ?? "0-5 cm"} of soil near this location. Conditions can vary elsewhere in Story County.</span>
              </div>
            </article>
          </aside>
        </section>
      )}
    </>
  );
}

function CropCard({
  season,
  index,
  manualOrder,
  onChange,
  onCoverCropChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  season: ScenarioSeason;
  index: number;
  manualOrder: boolean;
  onChange: (crop: string) => void;
  onCoverCropChange: (coverCrop: string | undefined) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const crop = season.crop;
  const meta = cropMeta[crop] ?? {
    code: "?",
    tone: "",
    note: "Choose a crop to continue",
  };
  return (
    <article className="crop-card">
      <div className="season-number">
        {manualOrder ? `Sequence position ${index + 1}` : `Crop ${index + 1}`}
      </div>
      <div className={`crop-symbol ${meta.tone}`}>
        <span>{meta.code}</span>
        <svg viewBox="0 0 40 40"><path d="M20 34V13m0 8c-7 0-10-4-11-9 7 0 10 3 11 9Zm0 5c7 0 10-4 11-9-7 0-10 3-11 9Z" /></svg>
      </div>
      <select value={crop} onChange={(e) => onChange(e.target.value)} aria-label={`Crop choice ${index + 1}`} style={{ fontSize: "1rem", padding: "0.4rem", marginTop: "0.5rem" }}>
        <option value="">Select a crop</option>
        {crops.map((item) => (<option key={item} value={item}>{item}</option>))}
      </select>
      <span className="crop-note">{meta.note}</span>
      <label style={{ display: "grid", gap: "0.3rem", width: "100%", marginTop: "0.65rem", color: "#68756e", fontSize: "0.75rem" }}>
        Cover crop
        <select
          value={season.cover_crop ?? ""}
          onChange={(event) => onCoverCropChange(event.target.value || undefined)}
          aria-label={`Cover crop for crop ${index + 1}`}
          style={{ fontSize: "0.85rem", padding: "0.35rem" }}
        >
          <option value="">None</option>
          <option value="cereal rye">Cereal rye</option>
        </select>
      </label>
      <div className="crop-card-actions">
        {manualOrder && (
          <>
            <button className="move-crop" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move crop ${index + 1} earlier`}>
              <Icon name="arrow" size={14} className="move-up" />
            </button>
            <button className="move-crop" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move crop ${index + 1} later`}>
              <Icon name="arrow" size={14} className="move-down" />
            </button>
          </>
        )}
        <button className="remove-crop" onClick={onRemove} aria-label={`Remove crop ${index + 1}`}>
          <Icon name="trash" size={15} />
        </button>
      </div>
    </article>
  );
}

function RotationPlanner({
  state,
  scenarios,
  setScenarios,
  generatedSequences,
  setGeneratedSequences,
  scenarioCount,
  setScenarioCount,
  sequenceModes,
  setSequenceModes,
}: {
  state: string;
  scenarios: ScenarioSequences;
  setScenarios: (value: ScenarioSequences) => void;
  generatedSequences: ScenarioSequences;
  setGeneratedSequences: (value: ScenarioSequences) => void;
  scenarioCount: number;
  setScenarioCount: (value: number) => void;
  sequenceModes: Record<ScenarioKey, SequenceMode>;
  setSequenceModes: (value: Record<ScenarioKey, SequenceMode>) => void;
}) {
  const [active, setActive] = useState<ScenarioKey>("A");
  const [comparisonRequested, setComparisonRequested] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey | null>(null);
  const activeScenarioKeys = scenarioKeys.slice(0, scenarioCount);
  const activeCrops = scenarios[active];
  const canGenerateSequence =
    activeCrops.length > 0 && activeCrops.every((season) => crops.includes(season.crop));
  const canCompareScenarios =
    activeScenarioKeys.every((key) => generatedSequences[key].length > 0);

  const addScenario = () => {
    if (scenarioCount >= scenarioKeys.length) return;
    const nextKey = scenarioKeys[scenarioCount];
    setScenarioCount(scenarioCount + 1);
    setActive(nextKey);
    setComparisonRequested(false);
    setSelectedScenario(null);
  };
  const removeLastScenario = () => {
    if (scenarioCount <= 2) return;
    const removedKey = scenarioKeys[scenarioCount - 1];
    const remainingKey = scenarioKeys[scenarioCount - 2];
    setScenarioCount(scenarioCount - 1);
    setScenarios({ ...scenarios, [removedKey]: [{ crop: "" }] });
    setGeneratedSequences({ ...generatedSequences, [removedKey]: [] });
    setSequenceModes({ ...sequenceModes, [removedKey]: "shuffle" });
    if (active === removedKey) setActive(remainingKey);
    setComparisonRequested(false);
    setSelectedScenario(null);
  };

  const updateScenarios = (next: ScenarioSequences) => {
    setScenarios(next);
    setGeneratedSequences({ ...generatedSequences, [active]: [] });
    setComparisonRequested(false);
    setSelectedScenario(null);
  };
  const updateCrop = (index: number, crop: string) =>
    updateScenarios({
      ...scenarios,
      [active]: scenarios[active].map((item, i) => (i === index ? { ...item, crop } : item)),
    });
  const updateCoverCrop = (index: number, cover_crop: string | undefined) =>
    updateScenarios({
      ...scenarios,
      [active]: scenarios[active].map((item, i) => (i === index ? { ...item, cover_crop } : item)),
    });
  const removeCrop = (index: number) =>
    updateScenarios({
      ...scenarios,
      [active]: scenarios[active].filter((_, i) => i !== index),
    });
  const moveCrop = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeCrops.length) return;
    const reordered = [...activeCrops];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    updateScenarios({ ...scenarios, [active]: reordered });
  };
  const addCrop = () =>
    updateScenarios({ ...scenarios, [active]: [...scenarios[active], { crop: "" }] });
  const changeSequenceMode = (mode: SequenceMode) => {
    if (sequenceModes[active] === mode) return;
    setSequenceModes({ ...sequenceModes, [active]: mode });
    setGeneratedSequences({ ...generatedSequences, [active]: [] });
    setComparisonRequested(false);
    setSelectedScenario(null);
  };
  const generateSequence = () => {
    if (!canGenerateSequence) return;
    setGeneratedSequences({
      ...generatedSequences,
      [active]: sequenceModes[active] === "shuffle"
        ? shuffleSeasons(activeCrops)
        : activeCrops.map((season) => ({ ...season })),
    });
    setComparisonRequested(false);
    setSelectedScenario(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Rotation planner"
        title="Build crop rotations"
        description="Create two or more crop scenarios, choose how to order each one, then compare their sequences."
        action={
          <button
            className="primary-button"
            onClick={() => setComparisonRequested(true)}
            disabled={!canCompareScenarios}
            title={!canCompareScenarios ? "Generate a sequence for every scenario first." : undefined}
          >
            Compare scenarios <Icon name="compare" size={16} />
          </button>
        }
      />
      <CoverageBanner />
      <div className="scenario-toolbar">
        <div className="scenario-tabs" role="tablist">
          {activeScenarioKeys.map((key) => {
            const cropCount = scenarios[key].filter((season) => crops.includes(season.crop)).length;
            return (
              <button role="tab" aria-selected={active === key} className={active === key ? "active" : ""} onClick={() => setActive(key)} key={key}>
                <span className={`scenario-letter ${key.toLowerCase()}`}>{key}</span>
                <span>
                  <strong>Scenario {scenarioNumber(key)}</strong>
                  <small>
                    {generatedSequences[key].length > 0
                      ? "Sequence ready"
                      : `${cropCount} ${cropCount === 1 ? "crop" : "crops"} selected`}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <div className="scenario-actions">
          {scenarioCount > 2 && (
            <button className="secondary-button" onClick={removeLastScenario}>
              Remove last scenario
            </button>
          )}
          <button className="secondary-button" onClick={addScenario} disabled={scenarioCount >= scenarioKeys.length}>
            <Icon name="plus" size={15} /> Add scenario
          </button>
          <span>{scenarioCount} of {scenarioKeys.length}</span>
        </div>
      </div>
      <section className="planner-panel panel">
        <div className="planner-heading">
          <div>
            <span className="eyebrow">Scenario {scenarioNumber(active)}</span>
            <h2>Choose crops</h2>
            <p>Add crops from the list. You can include up to six crops in each scenario.</p>
          </div>
          <button className="secondary-button" onClick={addCrop} disabled={activeCrops.length >= 6}>
            <Icon name="plus" size={16} /> Add crop
          </button>
        </div>
        <fieldset className="sequence-mode">
          <legend>How would you like to create this sequence?</legend>
          <label className={sequenceModes[active] === "shuffle" ? "selected" : ""}>
            <input
              type="radio"
              name={`sequence-mode-${active}`}
              checked={sequenceModes[active] === "shuffle"}
              onChange={() => changeSequenceMode("shuffle")}
            />
            <span>
              <strong>Shuffle these crops</strong>
              <small>Generate a shuffled order from your selected crops.</small>
            </span>
          </label>
          <label className={sequenceModes[active] === "manual" ? "selected" : ""}>
            <input
              type="radio"
              name={`sequence-mode-${active}`}
              checked={sequenceModes[active] === "manual"}
              onChange={() => changeSequenceMode("manual")}
            />
            <span>
              <strong>Set the order manually</strong>
              <small>Arrange the crop entries in the order you want.</small>
            </span>
          </label>
        </fieldset>
        <div className="crop-timeline">
          {activeCrops.length === 0 && <p className="empty-crop-list">Add a crop to begin your scenario.</p>}
          {activeCrops.map((season, index) => (
            <div className="crop-step" key={`${active}-${index}`}>
              <CropCard
                season={season}
                index={index}
                manualOrder={sequenceModes[active] === "manual"}
                onChange={(value) => updateCrop(index, value)}
                onCoverCropChange={(value) => updateCoverCrop(index, value)}
                onRemove={() => removeCrop(index)}
                onMoveUp={() => moveCrop(index, -1)}
                onMoveDown={() => moveCrop(index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < activeCrops.length - 1}
              />
              {index < activeCrops.length - 1 && (<span className="timeline-arrow"><Icon name="arrow" size={17} /></span>)}
            </div>
          ))}
        </div>
        <div className="planner-footer">
          <div><Icon name="info" size={17} /><span><strong>Crop choices:</strong> Corn, Soybean, Oats, Alfalfa; Cereal rye is available as a cover crop.</span></div>
          <span>{activeCrops.filter((season) => crops.includes(season.crop)).length}/6 crops</span>
        </div>
        <div className="sequence-generation">
          <span>
            {activeCrops.length === 0
              ? "Add at least one crop to generate a sequence."
              : !canGenerateSequence
                ? "Choose a crop for every entry before generating a sequence."
                : sequenceModes[active] === "manual"
                  ? "The crop list order will be used as the sequence."
                  : "Your selected crops will be shuffled into a sequence."}
          </span>
          <button className="primary-button" onClick={generateSequence} disabled={!canGenerateSequence}>
            {sequenceModes[active] === "shuffle"
              ? generatedSequences[active].length > 0 ? "Shuffle again" : "Generate shuffled sequence"
              : generatedSequences[active].length > 0 ? "Update sequence" : "Use this order"}
            <Icon name="rotate" size={16} />
          </button>
        </div>
      </section>
      {generatedSequences[active].length > 0 && (
        <section className="sequence-preview panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">Scenario {scenarioNumber(active)}</span>
              <h2>Generated sequence</h2>
            </div>
            <span>
              {generatedSequences[active].length} {generatedSequences[active].length === 1 ? "crop" : "crops"}
            </span>
          </div>
          <SeasonStrip
            seasons={generatedSequences[active]}
            tone={active}
          />
        </section>
      )}
      {comparisonRequested && canCompareScenarios && (
        <ComparisonResults
          state={state}
          scenarios={generatedSequences}
          scenarioCount={scenarioCount}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
        />
      )}
    </>
  );
}

function SeasonStrip({ seasons, tone }: { seasons: ScenarioSeason[]; tone: ScenarioKey }) {
  return (
    <div className={`season-strip ${tone.toLowerCase()}`}>
      {seasons.map((season, i) => (
        <div key={`${season.crop}-${i}`}>
          <small>S{i + 1}</small>
          <span>{cropMeta[season.crop].code}</span>
          <strong>{season.crop}</strong>
          {season.cover_crop && <small>Cover: {season.cover_crop}</small>}
        </div>
      ))}
    </div>
  );
}

function ComparisonResults({
  state,
  scenarios,
  scenarioCount,
  selectedScenario,
  onSelectScenario,
}: {
  state: string;
  scenarios: ScenarioSequences;
  scenarioCount: number;
  selectedScenario: ScenarioKey | null;
  onSelectScenario: (key: ScenarioKey) => void;
}) {
  const isIowa = state === "Iowa";
  const [comparison, setComparison] = useState<RotationComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setComparison(null);
    setError(null);

    if (!isIowa) {
      setIsLoading(false);
      setError("Rotation comparisons are currently available for Story County, Iowa.");
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    compareScenarios(scenarios, scenarioKeys.slice(0, scenarioCount))
      .then((result) => {
        if (!cancelled) setComparison(result);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "We couldn't complete the comparison. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isIowa, scenarios, scenarioCount]);

  const activeScenarioKeys = scenarioKeys.slice(0, scenarioCount);
  const indicatorDefinitions = [
    { icon: "layers" as IconName, name: "Growing seasons", field: "season_count" as const, text: "How many growing seasons are in each scenario." },
    { icon: "diversity" as IconName, name: "Different crops", field: "distinct_crop_count" as const, text: "The number of crop types in each scenario." },
    { icon: "rotate" as IconName, name: "Crop changes", field: "transition_count" as const, text: "How often crops change from one season to the next." },
    { icon: "layers" as IconName, name: "Repeated crops", field: "repeated_crop_occurrences" as const, text: "A crop counted again after its first appearance." },
  ];
  const indicators = indicatorDefinitions.map((indicator) => ({
    ...indicator,
    values: activeScenarioKeys.map((key) => {
      const summary = comparison?.rotation_summaries.find(
        (item) => item.rotation_id === `scenario_${key.toLowerCase()}`,
      );
      return summary?.[indicator.field];
    }),
  }));

  const researchByRotation = comparison?.rotation_summaries.map((summary) => ({
    name: summary.name,
    observations: [
      ...summary.transitions.flatMap((transition) =>
        transition.agronomic_evidence.map((observation) => ({
          context: `${transition.from_crop} → ${transition.to_crop}`,
          observation,
        })),
      ),
      ...summary.season_details.flatMap((season) =>
        season.agronomic_evidence.map((observation) => ({
          context: `${season.crop}${season.cover_crop ? ` with ${season.cover_crop}` : ""}`,
          observation,
        })),
      ),
    ],
  }));

  return (
    <section className="generated-results" aria-labelledby="generated-results-title">
      <div className="section-title">
        <div><span className="eyebrow">Scenario comparison</span><h2 id="generated-results-title">Compare generated sequences</h2></div>
        {isLoading && <StatusPill tone="neutral">Comparing</StatusPill>}
      </div>
      <p className="generated-results-intro">Review the crop sequence and descriptive patterns in each scenario.</p>
      {error && <div role="alert" className="api-error">This comparison couldn't be loaded: {error}</div>}
      <div className="generated-option-grid">
        {activeScenarioKeys.map((key) => (
          <article className={`generated-option ${key.toLowerCase()} ${selectedScenario === key ? "selected" : ""}`} key={key}>
            <div className="generated-option-heading">
              <div><span>Scenario {scenarioNumber(key)}</span><strong>Generated crop sequence</strong></div>
              <span>{scenarios[key].length} seasons</span>
            </div>
            <SeasonStrip seasons={scenarios[key]} tone={key} />
            <button
              className={`generated-option-button ${selectedScenario === key ? "selected" : ""}`}
              onClick={() => onSelectScenario(key)}
              aria-pressed={selectedScenario === key}
            >
              {selectedScenario === key ? "Chosen for your plan" : `Choose Scenario ${scenarioNumber(key)}`}
            </button>
          </article>
        ))}
      </div>

      {comparison && (
        <>
          <section className="indicator-section">
            <div className="section-title">
              <div><span className="eyebrow">Sequence patterns</span><h2>Compare the details</h2></div>
              <span className="generated-area">{isIowa ? "Story County, Iowa" : `${state} data isn't available`}</span>
            </div>
            <div className="indicator-list">
              {indicators.map((item) => (
                <article className="indicator-card" key={item.name}>
                  <div className="indicator-name">
                    <span className="icon-box"><Icon name={item.icon} /></span>
                    <div><strong>{item.name}</strong></div>
                  </div>
                  <div className="indicator-values">
                    {activeScenarioKeys.map((key, index) => (
                      <div className="indicator-value" key={key}>
                        <small>SCENARIO {scenarioNumber(key)}</small>
                        <strong>{item.values[index] ?? (isLoading ? "…" : "—")}</strong>
                      </div>
                    ))}
                  </div>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
          {comparison.comparison_warnings.length > 0 && (
            <section className="panel comparison-warnings" aria-label="Comparison warnings">
              <strong>Comparison notes</strong>
              <ul>{comparison.comparison_warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </section>
          )}
          {researchByRotation?.some((group) => group.observations.length > 0) && (
            <section className="panel research-panel">
              <div className="section-title">
                <div><span className="eyebrow">Research sources</span><h2>Related research</h2></div>
              </div>
              {researchByRotation.map((group) => group.observations.length > 0 && (
                <div className="research-group" key={group.name}>
                  <h3>{group.name}</h3>
                  {group.observations.map(({ context, observation }) => (
                    <article className="research-note" key={`${observation.rule_id}-${context}`}>
                      <strong>{context}</strong>
                      <p>{observation.statement}</p>
                      <a href={observation.source.url} target="_blank" rel="noreferrer">
                        {observation.source.id}: {observation.source.title}
                      </a>
                    </article>
                  ))}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}

function Methodology({
  context,
  contextLoading,
}: {
  context: ProjectContext | null;
  contextLoading: boolean;
}) {
  const [openSource, setOpenSource] = useState<string | null>("NASA POWER");
  const sourceStatus = context ? "Loaded" : contextLoading ? "Loading" : "Unavailable";
  const sources = [
    {
      name: "NASA POWER",
      provider: "NASA",
      variable: "Monthly temperature, precipitation, and relative humidity",
      resolution: "Story County location",
      status: sourceStatus,
      type: "Derived monthly values",
    },
    {
      name: "ISRIC SoilGrids 2.0",
      provider: "ISRIC",
      variable: "Clay, nitrogen, pH, and soil organic carbon",
      resolution: context?.soil_dataset.depth_interval ?? "0-5 cm",
      status: sourceStatus,
      type: "Modelled estimates",
    },
    {
      name: "GPM IMERG",
      provider: "NASA",
      variable: "Precipitation comparison",
      resolution: "Not available yet",
      status: "Not available",
      type: "Potential future source",
    },
  ];
  const provenanceItems = [
    {
      label: "Measured",
      status: "Not included",
      detail: "No ground-measured weather, soil, or field-yield values are included.",
    },
    {
      label: "Modelled",
      status: "SoilGrids",
      detail: "Soil properties are 0-5 cm mean predictions for one reference-point pixel.",
    },
    {
      label: "Derived",
      status: "Monthly and sequence summaries",
      detail: "Weather values aggregate NASA POWER daily records; rotation counts and transitions come from the entered sequences.",
    },
    {
      label: "Assumed",
      status: "No assumed outcomes",
      detail: "The app does not assume yield, profitability, or crop performance. Crop order is manually arranged or shuffled from user-selected crops.",
    },
  ];

  return (
    <>
      <PageHeader eyebrow="Data & methodology" title="Data behind the comparisons" description="Explore the weather and soil sources behind SOSCOPE and how they shape the rotation comparison." />
      <div className="method-status">
        <div><Icon name="database" size={22} /><span><strong>{context ? "Story County data ready" : contextLoading ? "Loading Story County data" : "Story County data unavailable"}</strong><small>NASA POWER weather and SoilGrids estimates for the project location.</small></span></div>
        <StatusPill tone={context ? "ready" : contextLoading ? "neutral" : "warning"}>{context ? "Data loaded" : contextLoading ? "Loading" : "Unavailable"}</StatusPill>
      </div>
      <section className="panel provenance-panel">
        <div className="section-title">
          <div><span className="eyebrow">Value provenance</span><h2>How to read the data</h2></div>
        </div>
        <div className="provenance-grid">
          {provenanceItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.status}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="panel source-panel">
        <div className="section-title"><div><span className="eyebrow">Source register</span><h2>Environmental datasets</h2></div></div>
        <div className="source-table">
          <div className="source-head"><span>Dataset / provider</span><span>What it includes</span><span>Data</span><span>Status</span><span /></div>
          {sources.map((source) => (
            <div className="source-wrap" key={source.name}>
              <button className="source-row" onClick={() => setOpenSource(openSource === source.name ? null : source.name)}>
                <span><strong>{source.name}</strong><small>{source.provider}</small></span><span>{source.variable}</span><span>{source.type}</span>
                <span><StatusPill tone={source.status === "Loaded" ? "ready" : source.status === "Unavailable" ? "warning" : "neutral"}>{source.status}</StatusPill></span>
                <Icon name="chevron" size={16} className={openSource === source.name ? "up" : ""} />
              </button>
              {openSource === source.name && (
                <div className="source-detail">
                  <div><small>COVERAGE</small><strong>{source.resolution}</strong></div>
                  <div><small>STATUS</small><strong>{source.status}</strong></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="limitations panel">
        <div className="limitations-title"><span className="icon-box amber"><Icon name="warning" /></span><div><span className="eyebrow">Using the data</span><h2>What to keep in mind</h2></div></div>
        <div className="limitations-grid">
          <div><strong>Location</strong><p>Weather and soil values are estimates for the Story County project location. Conditions may vary elsewhere in the county.</p></div>
          <div><strong>Date range</strong><p>NASA POWER monthly records cover {context?.environmental_dataset.metadata.start_date ?? "the configured period"} through {context?.environmental_dataset.metadata.end_date ?? "the configured period"}.</p></div>
          <div><strong>Rotation comparison</strong><p>Compare crop order, repeats, and the research linked to selected transitions.</p></div>
        </div>
      </section>
    </>
  );
}

function getInitialState(): string {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const urlState = urlParams.get("state");
    if (urlState && states.includes(urlState)) return urlState;

    const savedState = localStorage.getItem("fieldshift_state");
    if (savedState && states.includes(savedState)) return savedState;
  }
  return "Iowa";
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [state, setState] = useState(getInitialState);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioSequences>(defaultScenarios);
  const [generatedSequences, setGeneratedSequences] = useState<ScenarioSequences>(emptyGeneratedSequences);
  const [scenarioCount, setScenarioCount] = useState(2);
  const [sequenceModes, setSequenceModes] = useState<Record<ScenarioKey, SequenceMode>>(defaultSequenceModes);
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const selectedNav = navItems.find((item) => item.id === page) ?? ({
    id: "planner",
    label: "Rotation Planner",
    icon: "rotate",
  } as const);

  useEffect(() => {
    if (!navItems.some((item) => item.id === page)) setPage("planner");
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    fetchProjectContext()
      .then((projectContext) => {
        if (!cancelled) {
          setContext(projectContext);
          setContextError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setContextError(
            requestError instanceof Error
              ? requestError.message
              : "The project data request failed.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    localStorage.setItem("fieldshift_state", state);
    const url = new URL(window.location.href);
    url.searchParams.set("state", state);
    window.history.replaceState({}, "", url.toString());
  }, [state]);

  const navigate = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard state={state} scenarios={scenarios} generatedSequences={generatedSequences} scenarioCount={scenarioCount} context={context} contextLoading={contextLoading} goTo={navigate} />;
    if (page === "location") return <ExploreLocation state={state} context={context} />;
    if (page === "planner") return <RotationPlanner state={state} scenarios={scenarios} setScenarios={setScenarios} generatedSequences={generatedSequences} setGeneratedSequences={setGeneratedSequences} scenarioCount={scenarioCount} setScenarioCount={setScenarioCount} sequenceModes={sequenceModes} setSequenceModes={setSequenceModes} />;
    return <Methodology context={context} contextLoading={contextLoading} />;
  };

  return (
    <div className="app-shell" style={{ fontSize: "16px" }}>
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
              <small>SELECTED STATE</small>
              <strong>{state}</strong>
              <span>{state === "Iowa" ? "Story County location" : "No data available"}</span>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="nasa-orbit">N</div>
          <div><strong>NASA Space Apps</strong><span>Crop rotation explorer</span></div>
        </div>
      </aside>
      {mobileOpen && (<button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />)}
      <div className="app-main">
        <div className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
          <div className="mobile-brand"><FieldMark compact /><strong>{selectedNav.label}</strong></div>
          <div className="topbar-copy"><strong>Explore smarter crop rotations</strong><span>with environmental intelligence</span></div>
          <StateSelector selected={state} onSelect={setState} />
        </div>
        <main>
          {contextLoading && !context && (
            <div className="api-loading" role="status">Loading Story County data…</div>
          )}
          {contextError && (
            <div className="api-error" role="alert">
              Story County data couldn't be loaded: {contextError}
            </div>
          )}
          {renderPage()}
        </main>
        <footer className="app-footer">
          <span>SOSCOPE · Crop rotation explorer</span>
          <span>NASA POWER weather · ISRIC SoilGrids · Story County, Iowa</span>
        </footer>
      </div>
    </div>
  );
}