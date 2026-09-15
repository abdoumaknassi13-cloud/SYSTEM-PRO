import type React from "react";

export default function Home(): React.JSX.Element {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 640,
        margin: "4rem auto",
        padding: "0 1rem",
      }}
    >
      <h1>SYSTEM PRO</h1>
      <p>TASK-01 foundation placeholder. No business logic yet.</p>
      <p>
        API health: <code>GET /health</code> · readiness: <code>GET /ready</code>
      </p>
    </main>
  );
}
