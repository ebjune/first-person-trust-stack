import type { VtcRecord } from "../../lib/types";

interface Props {
  vtcs: VtcRecord[];
  selectedCdid: string | null;
  onSelect: (cdid: string) => void;
}

export function VtcList({ vtcs, selectedCdid, onSelect }: Props) {
  if (vtcs.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No communities provisioned yet. Create one above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">C-DID</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin DID</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {vtcs.map((vtc) => (
            <tr
              key={vtc.id}
              className={[
                "border-b border-slate-100 transition-colors cursor-pointer",
                selectedCdid === vtc.cdid ? "bg-indigo-50" : "hover:bg-slate-50",
              ].join(" ")}
              onClick={() => onSelect(vtc.cdid)}
            >
              <td className="py-2.5 px-3 font-medium text-slate-800">{vtc.name}</td>
              <td className="py-2.5 px-3 font-mono text-xs text-indigo-700 break-all">{vtc.cdid}</td>
              <td className="py-2.5 px-3 font-mono text-xs text-slate-500 break-all">{vtc.adminDid}</td>
              <td className="py-2.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                {new Date(vtc.createdAt).toLocaleString()}
              </td>
              <td className="py-2.5 px-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(vtc.cdid); }}
                  className={[
                    "text-xs px-2 py-1 rounded transition-colors",
                    selectedCdid === vtc.cdid
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {selectedCdid === vtc.cdid ? "Selected" : "Manage"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
