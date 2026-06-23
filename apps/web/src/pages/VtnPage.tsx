export function VtnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">VTN Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage Verifiable Trust Networks — federations of VTCs.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Coming in Phase 2</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          VTN Manager enables federation of multiple VTCs into a Verifiable Trust Network.
          VTN is greenfield — not yet in VTI — and will be built in{" "}
          <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">services/vtn-service</code>.
        </p>
        <div className="mt-6 grid gap-3 max-w-sm mx-auto text-left">
          {[
            "Create VTN (federate multiple VTCs)",
            "Cross-community recognition flows",
            "VTN-scoped credential verification",
            "Federation governance rules",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-slate-300">○</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
