import React from "react";
import { statCardStyle, miniMetricStyle } from "../../lib/styles";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={miniMetricStyle}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}
