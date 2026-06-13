import { useCallback, useState } from "react";
import { vtaHealth, vtcHealth, type HealthResult } from "@fpndtg/adapters-vti";
import { FPNDTG_SERVICES, type FpndtgService } from "@fpndtg/brand-config";

function statusClass(status: FpndtgService["status"]): string {
  return `badge ${status}`;
}

function ServiceCard({ service }: { service: FpndtgService }) {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = useCallback(async () => {
    if (service.id !== "vta" && service.id !== "vtc") return;
    setLoading(true);
    try {
      const result =
        service.id === "vta" ? await vtaHealth(service.url) : await vtcHealth(service.url);
      setHealth(result);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const canProbe = service.id === "vta" || service.id === "vtc";

  return (
    <article className="card">
      <h2>{service.label}</h2>
      <p>{service.role}</p>
      <div className="meta">
        <span className={statusClass(service.status)}>{service.status}</span>
        <a href={service.url} target="_blank" rel="noreferrer">
          {service.host}
        </a>
        {service.fpsComponent && (
          <span style={{ color: "#64748b" }}>{service.fpsComponent}</span>
        )}
      </div>
      {canProbe && (
        <>
          <button type="button" onClick={checkHealth} disabled={loading}>
            {loading ? "Checking…" : "Check /health"}
          </button>
          {health && (
            <div className={`health ${health.ok ? "ok" : "fail"}`}>
              {health.ok ? "Healthy" : "Unreachable"} — HTTP {health.status || "—"}
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function App() {
  return (
    <div className="app">
      <header>
        <h1>First Person Trust Stack</h1>
        <p>
          PNM · CNM · VTN Manager — product layer for{" "}
          <a href="https://www.fpndtg.com" target="_blank" rel="noreferrer">
            fpndtg.com
          </a>
        </p>
      </header>

      <nav aria-label="Manager modules">
        <a className="active" href="#pnm">
          PNM
        </a>
        <a href="#cnm">CNM</a>
        <a href="#vtn">VTN Manager</a>
      </nav>

      <section className="card-grid">
        {FPNDTG_SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </section>
    </div>
  );
}
