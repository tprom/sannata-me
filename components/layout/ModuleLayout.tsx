"use client";

import React from "react";

export default function ModuleLayout({
  menu,
  children,
}: {
  menu: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        minHeight: "100vh",
        gap: "32px",
      }}
    >
      <aside
        style={{
          width: "240px",
          padding: "16px 20px",
          borderRight: "1px solid #eee",
          background: "#fafafa",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>{menu}</div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "20px",
          paddingTop: "8px",
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {children}
      </main>
    </div>
  );
}

