import { useState } from "react";
import { ServiceHealth } from "../components/infra/ServiceHealth";
import { LedgerStatus } from "../components/infra/LedgerStatus";
import { TrustTaskLog } from "../components/infra/TrustTaskLog";

type Tab = "health" | "ledger" | "tasks";

export function InfraPage() {
  const [activeTab, setActiveTab] = useState<Tab>("health");

  const tabs: { id: Tab; label: string }[] = [
    { id: "health", label: "Service Health" },
    { id: "ledger", label: "Ledger Integrity" },
    { id: "tasks", label: "Trust Task Log" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Infrastructure Monitor</h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only view of service health, ledger chain integrity, and Trust Task audit log.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {activeTab === "health" && <ServiceHealth />}
        {activeTab === "ledger" && <LedgerStatus />}
        {activeTab === "tasks" && <TrustTaskLog />}
      </div>
    </div>
  );
}
