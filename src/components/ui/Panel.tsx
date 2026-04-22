import React from "react";
import { panelStyle } from "../../lib/styles";

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: "clamp(18px, 3vw, 22px)", lineHeight: 1.2 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
