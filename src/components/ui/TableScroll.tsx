import React from "react";

export function TableScroll({ children }: { children: React.ReactNode }) {
  return <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>{children}</div>;
}
