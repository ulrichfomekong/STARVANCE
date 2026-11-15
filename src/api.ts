export interface MonthlyEnvironmentalRecord {
  month: string;
  temperature_mean_c: number | null;
  precipitation_total_mm: number | null;
}

export interface SoilProperty {
  description: string;
  value: number;
  unit: string;
}

export interface ProjectContext {
  pilot_geography: {
    country: string;
    state: string;
    county: string;
  };
  reference_coordinates: {
    latitude: number;
    longitude: number;
  };
  environmental_dataset: {
    metadata: {
      source: string;
      start_date: string;
      end_date: string;
      spatial_scope: string;
      aggregation: { time_step: string };
    };
    monthly_records: MonthlyEnvironmentalRecord[];
  };
  soil_dataset: {
    source: string;
    depth_interval: string;
    statistic: string;
    properties: Record<string, SoilProperty>;
    limitations: string[];
  };
  interpretation_limit: string;
}

export interface RotationSummary {
  rotation_id: string;
  name: string;
  season_count: number;
  distinct_crop_count: number;
  repeated_crop_occurrences: number;
  crop_sequence: string[];
  crop_counts: Record<string, number>;
  transition_count: number;
  transitions: Array<{
    from_crop: string;
    to_crop: string;
    agronomic_evidence: ResearchEvidence[];
  }>;
  season_details: Array<{
    agronomic_evidence: ResearchEvidence[];
  }>;
}

export interface ResearchEvidence {
  rule_id: string;
  statement: string;
  source: {
    id: string;
    title: string;
    url: string;
  };
  limitations: string;
  evidence_status: string;
}

export interface RotationComparison {
  assessment_status: string;
  ranking: null;
  scores: null;
  recommendation: null;
  agronomic_rule_status: {
    mode: string;
    draft_decision_rules_activated: boolean;
    sources_reviewed: string[];
    local_validation: string;
  };
  comparison_warnings: string[];
  rotation_summaries: RotationSummary[];
  data_context: {
    pilot_geography: {
      country: string;
      state: string;
      county: string;
    };
    environmental_dataset: {
      available: boolean;
      period_start?: string;
      period_end?: string;
      source?: string;
    };
    soil_dataset: {
      available: boolean;
      source?: string;
      depth?: string;
    };
  };
  validation_note: string;
}

export interface ScenarioSequences {
  A: string[];
  B: string[];
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return body as T;
}

export function fetchProjectContext(): Promise<ProjectContext> {
  return requestJson<ProjectContext>("/api/context");
}

export function compareScenarios(
  scenarios: ScenarioSequences,
): Promise<RotationComparison> {
  return requestJson<RotationComparison>("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pilot: {
        country: "USA",
        state: "Iowa",
        county: "Story County",
      },
      rotations: (["A", "B"] as const).map((key) => ({
        rotation_id: `scenario_${key.toLowerCase()}`,
        name: `Scenario ${key}`,
        seasons: scenarios[key].map((crop, index) => ({
          year: index + 1,
          season: `Season ${index + 1}`,
          crop,
        })),
      })),
    }),
  });
}
