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

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

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