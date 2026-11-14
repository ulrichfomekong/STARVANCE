import { useMemo, useState, type ReactNode } from "react";

type Page = "dashboard" | "location" | "planner" | "comparison" | "methodology";
type ScenarioKey = "A" | "B";

const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const crops = ["Corn", "Soybean", "Wheat", "Cotton", "Sorghum"];
const cropMeta: Record<string, { code: string; tone: string; note: string }> = {
  Corn: { code: "CR", tone: "gold", note: "Warm-season cereal" },
  Soybean: { code: "SB", tone: "green", note: "Warm-season legume" },
  Wheat: { code: "WH", tone: "sand", note: "Cool-season cereal" },
  Cotton: { code: "CT", tone: "blue", note: "Warm-season fiber crop" },
  Sorghum: { code: "SG", tone: "rust", note: "Warm-season cereal" },
};

const defaultScenarios: Record<ScenarioKey, string[]> = {
  A: ["Corn", "Soybean", "Corn", "Soybean"],
  B: ["Corn", "Wheat", "Soybean", "Corn"],
};

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "location", label: "Explore Location", icon: "pin" },
  { id: "planner", label: "Rotation Planner", icon: "rotate" },
  { id: "comparison", label: "Scenario Comparison", icon: "compare" },
  { id: "methodology", label: "Data & Methodology", icon: "database" },
];

type IconName =
  | "grid"
  | "pin"
  | "rotate"
  | "compare"
  | "database"
  | "search"
  | "chevron"
  | "rain"
  | "temperature"
  | "soil"
  | "layers"
  | "arrow"
  | "info"
  | "warning"
  | "plus"
  | "trash"
  | "menu"
  | "close"
  | "check"
  | "calendar"
  | "external"
  | "shield"
  | "water"
  | "diversity"
  | "stress";

function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    rotate: (
      <>
        <path d="M20 7h-6V1" />
        <path d="M20 7a9 9 0 1 0 1 9" />
      </>
    ),
    compare: (
      <>
        <path d="M8 3 4 7l4 4" />
        <path d="M4 7h16" />
        <path d="m16 13 4 4-4 4" />
        <path d="M20 17H4" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    rain: (
      <>
        <path d="M7 17a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 8a4.5 4.5 0 0 1-.5 9" />
        <path d="m9 19-1 2m5-2-1 2m5-2-1 2" />
      </>
    ),
    temperature: (
      <>
        <path d="M14 14.8V5a4 4 0 0 0-8 0v9.8a6 6 0 1 0 8 0Z" />
        <path d="M10 7v9" />
      </>
    ),
    soil: (
      <>
        <path d="M3 7c4-2 6 2 10 0s6 2 8 0" />
        <path d="M3 12c4-2 6 2 10 0s6 2 8 0" />
        <path d="M3 17c4-2 6 2 10 0s6 2 8 0" />
      </>
    ),
    layers: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <path d="M12 7h.01" />
      </>
    ),
    warning: (
      <>
        <path d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="m9 7 1-3h4l1 3" />
        <path d="m6 7 1 14h10l1-14" />
        <path d="M10 11v6m4-6v6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M10 14 21 3" />
        <path d="M18 13v7H4V6h7" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3Z" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    water: <path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />,
    diversity: (
      <>
        <circle cx="6" cy="7" r="3" />
        <circle cx="18" cy="7" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="m8.5 9 2 6m5-6-2 6" />
      </>
    ),
    stress: (
      <>
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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

function StatusPill({
  children,
  tone = "sample",
}: {
  children: ReactNode;
  tone?: "sample" | "ready" | "candidate" | "warning" | "neutral";
}) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function StateSelector({
  selected,
  onSelect,
  dark = false,
}: {
  selected: string;
  onSelect: (state: string) => void;
  dark?: boolean;
}) {
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
          <button
            className="select-scrim"
            onClick={() => setOpen(false)}
            aria-label="Close state selector"
          />
          <div className="state-menu">
            <div className="state-search">
              <Icon name="search" size={16} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all 50 states"
              />
            </div>
            <div className="state-options">
              {filtered.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    onSelect(state);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={selected === state ? "selected" : ""}
                >
                  <span>{state}</span>
                  {state === "Texas" && <em>Pilot</em>}
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

function Unsupported({ state, onChooseTexas }: { state: string; onChooseTexas: () => void }) {
  return (
    <div className="unsupported">
      <div className="unsupported-art">
        <Icon name="pin" size={35} />
      </div>
      <StatusPill tone="warning">MVP coverage notice</StatusPill>
      <h2>{state} is not yet supported</h2>
      <p>
        Regional data for this state is not yet available in the current MVP. The pilot experience
        is currently configured for Texas.
      </p>
      <div className="notice-box">
        <Icon name="info" size={19} />
        <span>
          No environmental or agronomic values are displayed here to avoid implying coverage that
          has not been prepared or validated.
        </span>
      </div>
      <button className="primary-button" onClick={onChooseTexas}>
        Return to Texas pilot <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
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
        <strong>Demonstration data only.</strong> Values and comparisons in this prototype are
        illustrative and are not validated observations or agronomic recommendations.
      </p>
      <StatusPill tone="sample">Sample</StatusPill>
    </div>
  );
}

function LocationMap({ large = false }: { large?: boolean }) {
  return (
    <div className={`location-map ${large ? "large" : ""}`}>
      <div className="map-grid" />
      <svg
        className="texas-shape"
        viewBox="0 0 310 290"
        aria-label="Stylized placeholder outline for Texas"
      >
        <path d="M62 37h102v31h55l23 27 34 4-18 29 2 64-29 16-28 49-32-27-42-20-22-42-33-21-5-52-30-24Z" />
        <circle cx="102" cy="85" r="7" />
        <path className="focus-ring" d="M74 61h59v52H74Z" />
      </svg>
      <div className="map-label">
        <i />
        <div>
          <strong>Lubbock County</strong>
          <span>Proposed pilot territory</span>
        </div>
      </div>
      <span className="map-scale">Regional context · not field-level</span>
    </div>
  );
}

function Dashboard({
  scenarios,
  goTo,
}: {
  scenarios: Record<ScenarioKey, string[]>;
  goTo: (page: Page) => void;
}) {
  const metrics = [
    {
      icon: "rain" as IconName,
      label: "Precipitation",
      value: "Not connected",
      meta: "Historical period pending",
      source: "Candidate: NASA POWER / GPM",
    },
    {
      icon: "temperature" as IconName,
      label: "Temperature",
      value: "Not connected",
      meta: "Historical period pending",
      source: "Candidate: NASA POWER",
    },
    {
      icon: "soil" as IconName,
      label: "Soil moisture context",
      value: "Illustrative",
      meta: "Regional context only",
      source: "Candidate: NASA FLDAS",
    },
    {
      icon: "layers" as IconName,
      label: "Soil properties",
      value: "Source identified",
      meta: "Coverage validation pending",
      source: "Candidate: SSURGO / SoilGrids",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Pilot dashboard"
        title="Lubbock County at a glance"
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
              <span className="icon-box">
                <Icon name={metric.icon} />
              </span>
              <StatusPill tone="sample">Sample status</StatusPill>
            </div>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric-value">{metric.value}</strong>
            <span className="metric-meta">{metric.meta}</span>
            <div className="metric-source">
              <Icon name="database" size={14} /> {metric.source}
            </div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel location-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Geographic context</span>
              <h2>Texas High Plains pilot</h2>
            </div>
            <button className="text-button" onClick={() => goTo("location")}>
              Explore location <Icon name="arrow" size={15} />
            </button>
          </div>
          <LocationMap />
          <div className="map-footer">
            <div>
              <small>STATE</small>
              <strong>Texas</strong>
            </div>
            <div>
              <small>PILOT AREA</small>
              <strong>Lubbock County</strong>
            </div>
            <div>
              <small>STATUS</small>
              <strong>Boundary replaceable</strong>
            </div>
          </div>
        </article>
        <article className="panel scenarios-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Rotation scenarios</span>
              <h2>Ready to compare</h2>
            </div>
            <StatusPill tone="candidate">Illustrative</StatusPill>
          </div>
          {(["A", "B"] as ScenarioKey[]).map((key) => (
            <div className="scenario-summary" key={key}>
              <div className={`scenario-letter ${key.toLowerCase()}`}>{key}</div>
              <div className="scenario-summary-main">
                <strong>Scenario {key}</strong>
                <span>{scenarios[key].length} growing seasons</span>
                <div className="mini-sequence">
                  {scenarios[key].map((crop, i) => (
                    <span key={`${crop}-${i}`} title={crop}>
                      {cropMeta[crop].code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button className="compare-button" onClick={() => goTo("comparison")}>
            Compare scenarios <Icon name="compare" size={17} />
          </button>
          <p className="fine-print">
            <Icon name="shield" size={14} /> Exploratory comparison — not a yield prediction.
          </p>
        </article>
      </section>
    </>
  );
}

function ExploreLocation() {
  return (
    <>
      <PageHeader
        eyebrow="Explore location"
        title="Texas pilot territory"
        description="Review geographic scope, environmental data readiness, and the limits of regional interpretation."
      />
      <CoverageBanner />
      <section className="explore-grid">
        <article className="panel map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Proposed territory</span>
              <h2>Lubbock County, Texas</h2>
            </div>
            <StatusPill tone="candidate">Pilot</StatusPill>
          </div>
          <LocationMap large />
        </article>
        <aside className="location-details">
          <article className="panel detail-panel">
            <span className="eyebrow">Location profile</span>
            <h2>Lubbock County</h2>
            <dl>
              <div>
                <dt>Geographic region</dt>
                <dd>Southern High Plains</dd>
              </div>
              <div>
                <dt>Reference point</dt>
                <dd>33.58° N, 101.85° W</dd>
              </div>
              <div>
                <dt>Boundary status</dt>
                <dd>
                  <StatusPill tone="warning">Placeholder</StatusPill>
                </dd>
              </div>
              <div>
                <dt>Spatial interpretation</dt>
                <dd>Regional, not field-level</dd>
              </div>
            </dl>
          </article>
          <article className="panel data-readiness">
            <span className="eyebrow">Data readiness</span>
            <h2>Coverage inventory</h2>
            {[
              ["Meteorological context", "Candidate source identified"],
              ["Soil moisture context", "Candidate source identified"],
              ["Soil properties", "Coverage review pending"],
              ["Crop suitability", "Not integrated"],
            ].map(([name, status], i) => (
              <div className="readiness-row" key={name}>
                <span className={`readiness-dot d${i}`} />
                <div>
                  <strong>{name}</strong>
                  <span>{status}</span>
                </div>
              </div>
            ))}
          </article>
        </aside>
      </section>
      <div className="resolution-note">
        <Icon name="warning" size={20} />
        <div>
          <strong>Resolution matters</strong>
          <p>
            Environmental products can differ in spatial and temporal resolution. Regional grid
            cells must not be interpreted as exact conditions for an individual field.
          </p>
        </div>
      </div>
    </>
  );
}

function CropCard({
  crop,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  crop: string;
  index: number;
  onChange: (crop: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const meta = cropMeta[crop];
  return (
    <article className="crop-card">
      <div className="season-number">Season {index + 1}</div>
      <div className={`crop-symbol ${meta.tone}`}>
        <span>{meta.code}</span>
        <svg viewBox="0 0 40 40">
          <path d="M20 34V13m0 8c-7 0-10-4-11-9 7 0 10 3 11 9Zm0 5c7 0 10-4 11-9-7 0-10 3-11 9Z" />
        </svg>
      </div>
      <select
        value={crop}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Crop for season ${index + 1}`}
      >
        {crops.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <span className="crop-note">{meta.note}</span>
      <button
        className="remove-crop"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Remove season ${index + 1}`}
      >
        <Icon name="trash" size={15} />
      </button>
    </article>
  );
}

function RotationPlanner({
  scenarios,
  setScenarios,
  goTo,
}: {
  scenarios: Record<ScenarioKey, string[]>;
  setScenarios: (value: Record<ScenarioKey, string[]>) => void;
  goTo: (page: Page) => void;
}) {
  const [active, setActive] = useState<ScenarioKey>("A");
  const updateCrop = (index: number, crop: string) =>
    setScenarios({
      ...scenarios,
      [active]: scenarios[active].map((item, i) => (i === index ? crop : item)),
    });
  const removeCrop = (index: number) =>
    setScenarios({ ...scenarios, [active]: scenarios[active].filter((_, i) => i !== index) });
  const addSeason = () =>
    setScenarios({ ...scenarios, [active]: [...scenarios[active], "Sorghum"] });
  return (
    <>
      <PageHeader
        eyebrow="Rotation planner"
        title="Build two rotation pathways"
        description="Arrange candidate crops across seasons, then compare their environmental context and trade-offs."
        action={
          <button className="primary-button" onClick={() => goTo("comparison")}>
            Compare scenarios <Icon name="compare" size={16} />
          </button>
        }
      />
      <CoverageBanner />
      <div className="scenario-tabs" role="tablist">
        {(["A", "B"] as ScenarioKey[]).map((key) => (
          <button
            role="tab"
            aria-selected={active === key}
            className={active === key ? "active" : ""}
            onClick={() => setActive(key)}
            key={key}
          >
            <span className={`scenario-letter ${key.toLowerCase()}`}>{key}</span>
            <span>
              <strong>Scenario {key}</strong>
              <small>{scenarios[key].length} seasons</small>
            </span>
          </button>
        ))}
      </div>
      <section className="planner-panel panel">
        <div className="planner-heading">
          <div>
            <span className="eyebrow">Editing scenario {active}</span>
            <h2>Season sequence</h2>
            <p>
              Select a crop for each growing season. Candidate crops require local agronomic
              validation.
            </p>
          </div>
          <button
            className="secondary-button"
            onClick={addSeason}
            disabled={scenarios[active].length >= 6}
          >
            <Icon name="plus" size={16} /> Add season
          </button>
        </div>
        <div className="crop-timeline">
          {scenarios[active].map((crop, index) => (
            <div className="crop-step" key={`${active}-${index}`}>
              <CropCard
                crop={crop}
                index={index}
                onChange={(value) => updateCrop(index, value)}
                onRemove={() => removeCrop(index)}
                canRemove={scenarios[active].length > 2}
              />
              {index < scenarios[active].length - 1 && (
                <span className="timeline-arrow">
                  <Icon name="arrow" size={17} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="planner-footer">
          <div>
            <Icon name="info" size={17} />
            <span>
              <strong>Illustrative sequence.</strong> Crop options and rotation rules have not been
              validated for this pilot territory.
            </span>
          </div>
          <span>{scenarios[active].length}/6 seasons</span>
        </div>
      </section>
      <section className="both-scenarios">
        <span className="eyebrow">Scenario overview</span>
        <div className="sequence-overview-grid">
          {(["A", "B"] as ScenarioKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={active === key ? "selected" : ""}
            >
              <span className={`scenario-letter ${key.toLowerCase()}`}>{key}</span>
              <div>
                <strong>Scenario {key}</strong>
                <p>{scenarios[key].join(" → ")}</p>
              </div>
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
        <div key={`${crop}-${i}`}>
          <small>S{i + 1}</small>
          <span>{cropMeta[crop].code}</span>
          <strong>{crop}</strong>
        </div>
      ))}
    </div>
  );
}

function Comparison({
  scenarios,
  goTo,
}: {
  scenarios: Record<ScenarioKey, string[]>;
  goTo: (page: Page) => void;
}) {
  const uniqueA = new Set(scenarios.A).size;
  const uniqueB = new Set(scenarios.B).size;
  const diversityResult =
    uniqueA === uniqueB
      ? "Similar diversity"
      : uniqueA > uniqueB
        ? "Scenario A is more varied"
        : "Scenario B is more varied";
  const indicators = [
    {
      icon: "water" as IconName,
      name: "Water availability context",
      a: "Insufficient data",
      b: "Insufficient data",
      tone: "unknown",
      text: "Requires aligned precipitation, soil moisture, and crop water-demand evidence. No connected values are available.",
    },
    {
      icon: "rain" as IconName,
      name: "Precipitation exposure",
      a: "Same regional context",
      b: "Same regional context",
      tone: "similar",
      text: "Both pathways are evaluated against the same location and historical period once a source dataset is connected.",
    },
    {
      icon: "diversity" as IconName,
      name: "Crop-sequence diversity",
      a: `${uniqueA} crop types`,
      b: `${uniqueB} crop types`,
      tone: uniqueA === uniqueB ? "similar" : "difference",
      text: `${diversityResult}. This is a simple count, not evidence of agronomic benefit.`,
    },
    {
      icon: "stress" as IconName,
      name: "Environmental stress",
      a: "Not calculated",
      b: "Not calculated",
      tone: "unknown",
      text: "Crop-specific thresholds and validated environmental time series are needed before stress can be interpreted.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Scenario comparison"
        title="Compare pathways, not winners"
        description="Inspect each indicator separately under a shared geographic context, dataset, period, and set of assumptions."
        action={
          <button className="secondary-button" onClick={() => goTo("planner")}>
            Edit rotations <Icon name="rotate" size={16} />
          </button>
        }
      />
      <CoverageBanner />
      <div className="comparison-context">
        <span>
          <Icon name="pin" size={15} />
          <b>Location</b> Lubbock County, TX
        </span>
        <span>
          <Icon name="database" size={15} />
          <b>Dataset</b> Local sample structure
        </span>
        <span>
          <Icon name="calendar" size={15} />
          <b>Period</b> Not yet configured
        </span>
        <span>
          <Icon name="shield" size={15} />
          <b>Method</b> Qualitative MVP
        </span>
      </div>
      <section className="comparison-hero">
        <article className="scenario-column a">
          <div className="scenario-title">
            <span className="scenario-letter a">A</span>
            <div>
              <span>Scenario A</span>
              <strong>{scenarios.A.length}-season rotation</strong>
            </div>
          </div>
          <SeasonStrip crops={scenarios.A} tone="a" />
        </article>
        <div className="versus">VS</div>
        <article className="scenario-column b">
          <div className="scenario-title">
            <span className="scenario-letter b">B</span>
            <div>
              <span>Scenario B</span>
              <strong>{scenarios.B.length}-season rotation</strong>
            </div>
          </div>
          <SeasonStrip crops={scenarios.B} tone="b" />
        </article>
      </section>
      <section className="indicator-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Indicator-by-indicator review</span>
            <h2>Environmental trade-offs</h2>
          </div>
          <span className="no-score">
            <Icon name="info" size={15} /> No composite score
          </span>
        </div>
        <div className="indicator-list">
          {indicators.map((item) => (
            <article className="indicator-card" key={item.name}>
              <div className="indicator-name">
                <span className="icon-box">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <button title="Interpretation is explained below">
                    <Icon name="info" size={14} />
                  </button>
                </div>
              </div>
              <div className={`indicator-value ${item.tone}`}>
                <small>SCENARIO A</small>
                <strong>{item.a}</strong>
              </div>
              <div className="indicator-track">
                <i />
                <span>
                  {item.tone === "similar"
                    ? "Similar"
                    : item.tone === "difference"
                      ? "Difference"
                      : "Data gap"}
                </span>
                <i />
              </div>
              <div className={`indicator-value ${item.tone}`}>
                <small>SCENARIO B</small>
                <strong>{item.b}</strong>
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="tradeoff-grid">
        <article className="tradeoff-card potential">
          <span>
            <Icon name="check" size={18} />
          </span>
          <div>
            <h3>Potential considerations</h3>
            <p>
              Additional crop types may broaden the sequence, but potential benefits depend on
              timing, soil, water, and management evidence.
            </p>
          </div>
        </article>
        <article className="tradeoff-card constraint">
          <span>
            <Icon name="warning" size={18} />
          </span>
          <div>
            <h3>Constraints and risks</h3>
            <p>
              No yield, irrigation, pest, input, or economic data is included. The comparison cannot
              establish farm-level performance.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}

const sources = [
  {
    name: "NASA POWER",
    provider: "NASA",
    variable: "Meteorological context",
    resolution: "Source-dependent",
    status: "Candidate",
    type: "Modelled / observed",
  },
  {
    name: "GPM IMERG",
    provider: "NASA",
    variable: "Precipitation",
    resolution: "Product-dependent",
    status: "Candidate",
    type: "Satellite / modelled",
  },
  {
    name: "FLDAS",
    provider: "NASA",
    variable: "Land surface & soil moisture",
    resolution: "Product-dependent",
    status: "Candidate",
    type: "Modelled",
  },
  {
    name: "SSURGO / gSSURGO",
    provider: "USDA NRCS",
    variable: "US soil properties",
    resolution: "Map unit-dependent",
    status: "Under review",
    type: "Survey / derived",
  },
  {
    name: "SoilGrids",
    provider: "ISRIC",
    variable: "Global soil properties",
    resolution: "Product-dependent",
    status: "Alternative",
    type: "Modelled",
  },
];

function Methodology() {
  const [openSource, setOpenSource] = useState<string | null>("NASA POWER");
  return (
    <>
      <PageHeader
        eyebrow="Data & methodology"
        title="Transparent by design"
        description="Understand which sources are candidates, how indicators will be derived, and what the current prototype cannot support."
      />
      <div className="method-status">
        <div>
          <Icon name="database" size={22} />
          <span>
            <strong>0 live datasets connected</strong>
            <small>This prototype uses local demonstration structures only.</small>
          </span>
        </div>
        <StatusPill tone="warning">Integration pending</StatusPill>
      </div>
      <section className="panel source-panel">
        <div className="section-title">
          <div>
            <span className="eyebrow">Source register</span>
            <h2>Candidate environmental datasets</h2>
          </div>
          <p>Inclusion here does not mean integrated.</p>
        </div>
        <div className="source-table">
          <div className="source-head">
            <span>Dataset / provider</span>
            <span>Potential variable</span>
            <span>Data type</span>
            <span>Status</span>
            <span />
          </div>
          {sources.map((source) => (
            <div className="source-wrap" key={source.name}>
              <button
                className="source-row"
                onClick={() => setOpenSource(openSource === source.name ? null : source.name)}
              >
                <span>
                  <strong>{source.name}</strong>
                  <small>{source.provider}</small>
                </span>
                <span>{source.variable}</span>
                <span>{source.type}</span>
                <span>
                  <StatusPill tone={source.status === "Candidate" ? "candidate" : "neutral"}>
                    {source.status}
                  </StatusPill>
                </span>
                <Icon name="chevron" size={16} className={openSource === source.name ? "up" : ""} />
              </button>
              {openSource === source.name && (
                <div className="source-detail">
                  <div>
                    <small>UNIT</small>
                    <strong>Not configured</strong>
                  </div>
                  <div>
                    <small>SPATIAL RESOLUTION</small>
                    <strong>{source.resolution}</strong>
                  </div>
                  <div>
                    <small>TEMPORAL / PERIOD</small>
                    <strong>Not configured</strong>
                  </div>
                  <div>
                    <small>ACCESS DATE</small>
                    <strong>Not accessed</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="data-type-grid">
        {[
          [
            "Observed data",
            "Measurements or observations supplied by a source. No observed dataset is connected in this MVP.",
            "ready",
          ],
          [
            "Modelled data",
            "Estimates produced by a model or data product; not equivalent to direct field measurements.",
            "candidate",
          ],
          [
            "Derived indicators",
            "Values FIELD SHIFT may calculate from aligned sources using documented rules.",
            "sample",
          ],
          [
            "Assumptions",
            "Rules introduced where information is incomplete; these must remain visible to users.",
            "warning",
          ],
        ].map(([title, text, tone], i) => (
          <article key={title}>
            <span className={`type-number n${i}`}>0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <StatusPill tone={tone as "ready" | "candidate" | "sample" | "warning"}>
              {i === 0 ? "None connected" : i === 3 ? "Must be declared" : "Planned"}
            </StatusPill>
          </article>
        ))}
      </section>
      <section className="limitations panel">
        <div className="limitations-title">
          <span className="icon-box amber">
            <Icon name="warning" />
          </span>
          <div>
            <span className="eyebrow">Uncertainty & limitations</span>
            <h2>Interpret results with care</h2>
          </div>
        </div>
        <div className="limitations-grid">
          <div>
            <strong>Spatial resolution</strong>
            <p>
              Regional grid cells and mapped soil units cannot represent exact conditions within an
              individual field.
            </p>
          </div>
          <div>
            <strong>Temporal alignment</strong>
            <p>
              Sources may cover different periods and reporting intervals; comparisons require
              explicit alignment.
            </p>
          </div>
          <div>
            <strong>Agronomic validation</strong>
            <p>
              Candidate crops and rotation rules need review against local evidence and practitioner
              knowledge.
            </p>
          </div>
          <div>
            <strong>Decision scope</strong>
            <p>
              FIELD SHIFT supports exploration. It does not guarantee yield or replace site-specific
              agronomic advice.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [state, setState] = useState("Texas");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scenarios, setScenarios] = useState(defaultScenarios);
  const selectedNav = useMemo(() => navItems.find((item) => item.id === page)!, [page]);

  const navigate = (next: Page) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const renderPage = () => {
    if (state !== "Texas")
      return <Unsupported state={state} onChooseTexas={() => setState("Texas")} />;
    if (page === "dashboard") return <Dashboard scenarios={scenarios} goTo={navigate} />;
    if (page === "location") return <ExploreLocation />;
    if (page === "planner")
      return <RotationPlanner scenarios={scenarios} setScenarios={setScenarios} goTo={navigate} />;
    if (page === "comparison") return <Comparison scenarios={scenarios} goTo={navigate} />;
    return <Methodology />;
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <FieldMark />
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={page === item.id ? "active" : ""}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {page === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-context">
          <span className="nav-label">Geographic context</span>
          <div className="context-card">
            <span className="pin-dot">
              <Icon name="pin" size={17} />
            </span>
            <div>
              <small>{state === "Texas" ? "PROPOSED PILOT" : "SELECTED STATE"}</small>
              <strong>{state === "Texas" ? "Lubbock County" : state}</strong>
              <span>{state === "Texas" ? "Texas, United States" : "Data unavailable"}</span>
            </div>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="nasa-orbit">N</div>
          <div>
            <strong>NASA Space Apps</strong>
            <span>Challenge 2026 prototype</span>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="app-main">
        <div className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="mobile-brand">
            <FieldMark compact />
            <strong>{selectedNav.label}</strong>
          </div>
          <div className="topbar-copy">
            <strong>Explore smarter crop rotations</strong>
            <span>with environmental intelligence</span>
          </div>
          <StateSelector selected={state} onSelect={setState} />
        </div>
        <main>{renderPage()}</main>
        <footer className="app-footer">
          <span>FIELD SHIFT · Exploratory decision-support prototype</span>
          <span>Data values are not live · Texas pilot only</span>
        </footer>
      </div>
    </div>
  );
}
