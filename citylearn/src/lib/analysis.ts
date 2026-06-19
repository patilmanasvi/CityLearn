export const ANALYSIS_STORAGE_KEY = "citylearn:last_analysis_response";

export type UnifiedAnalysisResponse = {
  event_analysis: Record<string, any>;
  predictions: Record<string, any>;
  similar_events: Array<Record<string, any>>;
  lessons_learned: string;
  recommendations: {
    officer_deployment: Record<string, any>;
    barricade_plan: Record<string, any>;
    diversion_strategy: Record<string, any>;
    impact_score?: number;
    efficiency_gains?: number;
  };
  dashboard_metrics: Record<string, any>;
};

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function readStoredAnalysis(): UnifiedAnalysisResponse | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse stored analysis response", error);
    return null;
  }
}

export function storeAnalysis(response: UnifiedAnalysisResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(response));
}

export async function fetchLastAnalysis(): Promise<UnifiedAnalysisResponse | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/last-analysis`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Last analysis API failed");
  return response.json();
}

export async function loadUnifiedAnalysis(): Promise<UnifiedAnalysisResponse | null> {
  const stored = readStoredAnalysis();
  if (stored) return stored;
  const remote = await fetchLastAnalysis();
  if (remote) storeAnalysis(remote);
  return remote;
}
