import { useState } from "react";
import { fetchTrustTaskLog } from "../../lib/api";
import type { TrustTaskEntry } from "../../lib/types";

export function TrustTaskLog() {
  const [entries, setEntries] = useState<TrustTaskEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrustTaskLog(20);
      setEntries(data);
      setFetchedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trust task log");
    } finally {
      setLoading(false);
    }
  }

  function statusColor(code: number): string {
    if (code >= 200 && code < 300) return "text-green-700 bg-green-50";
    if (code >= 400) return "text-red-700 bg-red-50";
    if (code === 0) return "text-slate-500 bg-slate-100";
    return "text-amber-700 bg-amber-50";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Trust Task Audit Log</h3>
          {fetchedAt && (
            <p className="text-xs text-slate-400 mt-0.5">Fetched at {fetchedAt}</p>
          )}
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {entries.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Click "Refresh" to load recent Trust Task calls from the infra ledger.
        </div>
      )}

      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Task URI</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Duration</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-700 break-all">{entry.taskUri}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-mono text-slate-600">{entry.method}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${statusColor(entry.statusCode)}`}>
                      {entry.statusCode || "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{entry.durationMs}ms</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
