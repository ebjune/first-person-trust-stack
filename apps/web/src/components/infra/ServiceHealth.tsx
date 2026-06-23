import { useState } from "react";
import { checkAllServicesHealth } from "../../lib/api";
import type { ServiceHealthResult } from "../../lib/types";

export function ServiceHealth() {
  const [results, setResults] = useState<ServiceHealthResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    try {
      const data = await checkAllServicesHealth();
      setResults(data);
      setCheckedAt(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Service Health</h3>
          {checkedAt && (
            <p className="text-xs text-slate-400 mt-0.5">Last checked: {checkedAt}</p>
          )}
        </div>
        <button
          onClick={() => void runCheck()}
          disabled={loading}
          className="text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? "Checking…" : "Check All"}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Click "Check All" to probe service health endpoints.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {results.map((r) => (
            <div
              key={r.service}
              className={[
                "rounded-xl border p-4",
                r.ok
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200",
              ].join(" ")}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-800">{r.service}</span>
                <span className={[
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  r.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                ].join(" ")}>
                  {r.ok ? "OK" : "FAIL"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{r.url}</p>
              {r.responseMs !== undefined && (
                <p className="text-xs text-slate-400 mt-1">{r.responseMs}ms</p>
              )}
              {r.error && (
                <p className="text-xs text-red-600 mt-1 truncate" title={r.error}>{r.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
