import type { VtcMembership } from "../../lib/types";

interface Props {
  memberships: VtcMembership[];
}

export function MembershipList({ memberships }: Props) {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No VTC memberships yet. Join a community via the CNM tab.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Community DID</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
          </tr>
        </thead>
        <tbody>
          {memberships.map((m) => (
            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-xs text-indigo-700 break-all">{m.cdid}</td>
              <td className="py-2.5 px-3">
                <span className={[
                  "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
                  m.role === "admin"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}>
                  {m.role}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                {new Date(m.joinedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
