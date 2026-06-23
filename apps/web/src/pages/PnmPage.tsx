import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { VtaList } from "../components/pnm/VtaList";
import { VtaCreateForm } from "../components/pnm/VtaCreateForm";
import { MembershipList } from "../components/pnm/MembershipList";
import { CredentialWallet } from "../components/pnm/CredentialWallet";
import type { VtaRecord, VtcMembership, WalletCredential } from "../lib/types";

type Tab = "vtas" | "memberships" | "wallet";

export function PnmPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("vtas");
  const [vtas, setVtas] = useState<VtaRecord[]>([]);
  // Phase 2: fetch memberships and credentials from fps_user DB via API
  const memberships: VtcMembership[] = [];
  const credentials: WalletCredential[] = [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "vtas", label: "My VTAs" },
    { id: "memberships", label: "Memberships" },
    { id: "wallet", label: "Credential Wallet" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Personal Network Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal VTAs, community memberships, and credential wallet.
        </p>
        {session && (
          <p className="text-xs text-slate-400 mt-1 font-mono">{session.did}</p>
        )}
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

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {activeTab === "vtas" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                VTAs ({vtas.length})
              </h2>
              <VtaCreateForm onCreated={(vta) => setVtas((prev) => [vta, ...prev])} />
            </div>
            <VtaList vtas={vtas} />
          </div>
        )}

        {activeTab === "memberships" && (
          <div className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">
              VTC Memberships ({memberships.length})
            </h2>
            <MembershipList memberships={memberships} />
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Credentials ({credentials.length})
            </h2>
            <CredentialWallet credentials={credentials} />
          </div>
        )}
      </div>
    </div>
  );
}
