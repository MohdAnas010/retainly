import type {
  MetricPoint,
  NudgeSegment,
  OverviewData,
  RiskAssessment,
} from "./types";
import { MockAdapter } from "./mock";
import { WhopSdkAdapter } from "./whop";

export interface RetainlyDataAdapter {
  getOverview(companyId: string): Promise<OverviewData>;
  getAtRisk(companyId: string): Promise<RiskAssessment[]>;
  getWinBack(companyId: string): Promise<NudgeSegment[]>;
}

// Re-export so consumers can import from a single place.
export type { MetricPoint, NudgeSegment, OverviewData, RiskAssessment };

let cached: RetainlyDataAdapter | null = null;

/**
 * Selects the data adapter for the current environment.
 *
 * - DATA_MODE === "whop" && WHOP_API_KEY set  -> live WhopSdkAdapter
 * - otherwise                                 -> deterministic MockAdapter
 *
 * The production adapter is never instantiated without an API key.
 */
export function getAdapter(): RetainlyDataAdapter {
  if (cached) return cached;

  const mode = process.env.DATA_MODE;
  const hasKey = Boolean(process.env.WHOP_API_KEY);

  if (mode === "whop" && hasKey) {
    console.log("[retainly] data mode: whop (live)");
    cached = new WhopSdkAdapter();
  } else {
    if (mode === "whop" && !hasKey) {
      console.warn(
        "[retainly] DATA_MODE=whop but WHOP_API_KEY is missing — falling back to mock data."
      );
    } else {
      console.log("[retainly] data mode: mock (deterministic seed)");
    }
    cached = new MockAdapter();
  }
  return cached;
}
