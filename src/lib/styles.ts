import React from "react";

export const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#e5e7eb",
  color: "#1f2937",
  fontFamily: "Arial, sans-serif",
};

export const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
  padding: 16,
};

export const headerStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  padding: 18,
  borderRadius: 14,
  marginBottom: 18,
};

export const navWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
};

export const navButtonsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

export const navButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#e5e7eb",
  color: "#111827",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

export const navButtonActiveStyle: React.CSSProperties = {
  ...navButtonStyle,
  background: "#1d4ed8",
  color: "white",
  border: "1px solid #1d4ed8",
};

export const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

export const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

export const sectionStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

export const responsiveStatGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

export const responsiveTwoPanelGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

export const panelStyle: React.CSSProperties = {
  background: "#f8fafc",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  minWidth: 0,
};

export const statCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export const miniMetricStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 12,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 10,
  border: "1px solid #94a3b8",
  background: "white",
  boxSizing: "border-box",
  fontSize: 16,
  minHeight: 44,
};

export const compactInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 8,
  border: "1px solid #94a3b8",
  background: "white",
  boxSizing: "border-box",
  fontSize: 14,
  minHeight: 40,
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 88,
  resize: "vertical",
};

export const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 680,
  borderCollapse: "separate",
  borderSpacing: 0,
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  overflow: "hidden",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #cbd5e1",
  background: "#e2e8f0",
  position: "sticky",
  top: 0,
  fontSize: 14,
  whiteSpace: "nowrap",
};

export const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
  background: "white",
  fontSize: 14,
};
