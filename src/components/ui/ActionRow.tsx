import React from "react";

export function ActionRow({ children, message }: { children: React.ReactNode; message: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      {children}
      <span style={{ fontSize: 14, color: "#334155", wordBreak: "break-word" }}>{message}</span>
    </div>
  );
}
