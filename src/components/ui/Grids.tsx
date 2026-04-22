import React from "react";
import { responsiveStatGridStyle, responsiveTwoPanelGridStyle } from "../../lib/styles";

export function ResponsiveStatGrid({ children }: { children: React.ReactNode }) {
  return <div style={responsiveStatGridStyle}>{children}</div>;
}

export function ResponsiveTwoPanelGrid({ children }: { children: React.ReactNode }) {
  return <div style={responsiveTwoPanelGridStyle}>{children}</div>;
}

export function FormGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 | 3 }) {
  const minWidth = columns === 3 ? 180 : columns === 2 ? 220 : 320;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginTop: 12,
      }}
    >
      {children}
    </div>
  );
}
