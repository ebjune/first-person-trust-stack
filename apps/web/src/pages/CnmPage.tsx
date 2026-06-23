import { useState } from "react";
import { VtcList } from "../components/cnm/VtcList";
import { VtcCreateForm } from "../components/cnm/VtcCreateForm";
import { VtcMemberManager } from "../components/cnm/VtcMemberManager";
import type { VtcRecord, VtcMembership } from "../lib/types";

export function CnmPage() {
  const [vtcs, setVtcs] = useState<VtcRecord[]>([]);
  const [selectedCdid, setSelectedCdid] = useState<string | null>(null);
  // Per-VTC member lists keyed by cdid
  const [membersByVtc, setMembersByVtc] = useState<Record<string, VtcMembership[]>>({});

  const selectedVtc = vtcs.find((v) => v.cdid === selectedCdid) ?? null;
  const members = selectedCdid ? (membersByVtc[selectedCdid] ?? []) : [];

  function handleMemberAdded(membership: VtcMembership) {
    setMembersByVtc((prev) => ({
      ...prev,
      [membership.cdid]: [membership, ...(prev[membership.cdid] ?? [])],
    }));
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Community Network Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Provision and manage Verifiable Trust Communities (VTCs) and their members.
        </p>
      </div>

      {/* Communities panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Communities ({vtcs.length})
          </h2>
          <VtcCreateForm onCreated={(vtc) => setVtcs((prev) => [vtc, ...prev])} />
        </div>
        <div className="p-5">
          <VtcList
            vtcs={vtcs}
            selectedCdid={selectedCdid}
            onSelect={(cdid) => setSelectedCdid(cdid === selectedCdid ? null : cdid)}
          />
        </div>
      </div>

      {/* Member management panel — shown when a VTC is selected */}
      {selectedVtc && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Members — {selectedVtc.name}
                </h2>
                <p className="font-mono text-xs text-indigo-600 mt-0.5">{selectedVtc.cdid}</p>
              </div>
              <button
                onClick={() => setSelectedCdid(null)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className="p-5">
            <VtcMemberManager
              cdid={selectedVtc.cdid}
              members={members}
              onMemberAdded={handleMemberAdded}
            />
          </div>
        </div>
      )}

      {/* VMC issuance placeholder */}
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-500">VMC Issuance</p>
        <p className="text-xs text-slate-400 mt-1">
          Issue Verifiable Member Credentials to community members — coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
