import React from "react";

export function MetricCard({ title, value, subtitle, icon }: { title:string; value:string|number; subtitle:string; icon:React.ReactNode }) {
  return (
    <div className="metric-card">
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
      <div className="metric-icon">{icon}</div>
    </div>
  );
}