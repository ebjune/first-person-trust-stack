import type { VtaRecord } from "../../lib/types";

interface Props {
  vtas: VtaRecord[];
}

export function VtaList({ vtas }: Props) {
  if (vtas.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No VTAs provisioned yet. Create one above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">DID</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Context</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
          </tr>
        </thead>
        <tbody>
          {vtas.map((vta) => (
            <tr key={vta.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-xs text-indigo-700 break-all">{vta.did}</td>
              <td className="py-2.5 px-3">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {vta.context}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                {new Date(vta.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
