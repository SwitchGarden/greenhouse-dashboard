export type ApiResponse = {
  ok: boolean;
  message?: string;
  rows?: unknown[];
  count?: number;
};

export type StaffActionType = "harvest" | "waste" | "status" | "planting";

export type StaffActionPayload = {
  type: StaffActionType;
  tower?: string;
  crop?: string;
  lbs?: number;
  date?: string;
  stage?: string;
  status?: string;
  wasteType?: string;
  note?: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function postToBackend(payload: Record<string, unknown>): Promise<ApiResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  return response.json() as Promise<ApiResponse>;
}

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || "";

export async function postStaffAction(payload: StaffActionPayload) {
  if (!API_BASE) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const res = await fetch(`${API_BASE}?action=appendStaffAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return await res.json();
}

export async function fetchDashboardData() {
  if (!API_BASE) {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  const res = await fetch(`${API_BASE}?action=getDashboardData`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return await res.json();
}
