import { useState } from "react";
import { verifyLedger } from "../../lib/api";
import type { LedgerVerifyReport } from "../../lib/types";

export function LedgerStatus() {
  const [report, setReport] = useState<LedgerVerifyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runVerify() {
    setLoading(true);
    setError(null);
    try {
      const data = await verifyLedger();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Ledger Chain Integrity</h3>
          {report && (
            <p className="text-xs text-slate-400 mt-0.5">
              Checked at {new Date(report.checkedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => void runVerify()}
          disabled={loading}
          className="text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? "Verifying…" : "Verify Ledger"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className={[
            "rounded-xl border px-4 py-3 flex items-center gap-3",
            report.allValid
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200",
          ].join(" ")}>
            <span className="text-xl">{report.allValid ? "✅" : "❌"}</span>
            <div>
              <p className={[
                "text-sm font-semibold",
                report.allValid ? "text-green-800" : "text-red-800",
              ].join(" ")}>
                {report.allValid ? "All chains valid" : "Chain integrity failure detected"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {report.chains.length} chain{report.chains.length !== 1 ? "s" : ""} checked
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {report.chains.map((chain) => (
              <div
                key={chain.chain}
                className={[
                  "rounded-xl border p-4",
                  chain.valid ? "bg-white border-slate-200" : "bg-red-50 border-red-200",
                ].join(" ")}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {chain.chain} events
                  </span>
                  <span className={[
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    chain.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                  ].join(" ")}>
                    {chain.valid ? "Valid" : "Invalid"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{chain.eventCount} events in chain</p>
                {chain.error && (
                  <p className="text-xs text-red-600 mt-1">{chain.error}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!report && !loading && !error && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Click "Verify Ledger" to check hash-chain integrity across all event tables.
        </div>
      )}
    </div>
  );
}
