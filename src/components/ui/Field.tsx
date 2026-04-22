import React from "react";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}
