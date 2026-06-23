import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinVtc } from "../../lib/api";
import type { VtcMembership } from "../../lib/types";

const schema = z.object({
  memberDid: z.string().min(7, "Member DID is required").startsWith("did:", "Must start with 'did:'"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  cdid: string;
  members: VtcMembership[];
  onMemberAdded: (membership: VtcMembership) => void;
}

export function VtcMemberManager({ cdid, members, onMemberAdded }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(null);
    try {
      await joinVtc(cdid, values.memberDid);
      onMemberAdded({
        id: `${Date.now()}`,
        cdid,
        memberDid: values.memberDid,
        role: "member",
        joinedAt: new Date().toISOString(),
      });
      setSuccess(`${values.memberDid} added to community.`);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  return (
    <div className="space-y-4">
      {/* Add member form */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-700 mb-3">Add Member</h4>
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
          <div className="flex-1">
            <input
              {...register("memberDid")}
              placeholder="did:web:member.fpndtg.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.memberDid && (
              <p className="text-red-500 text-xs mt-1">{errors.memberDid.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {isSubmitting ? "Adding…" : "Add Member"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mt-2">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mt-2">
            ✓ {success}
          </div>
        )}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          No members yet. Add one above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Member DID</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-xs text-indigo-700 break-all">{m.memberDid}</td>
                  <td className="py-2.5 px-3">
                    <span className={[
                      "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
                      m.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600",
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
      )}
    </div>
  );
}
