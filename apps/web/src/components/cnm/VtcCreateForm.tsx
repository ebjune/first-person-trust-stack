import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { provisionVtc } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import type { VtcRecord } from "../../lib/types";

const schema = z.object({
  cdid: z.string().min(7, "C-DID is required").startsWith("did:", "Must start with 'did:'"),
  adminDid: z.string().min(7, "Admin DID is required").startsWith("did:", "Must start with 'did:'"),
  name: z.string().min(1, "Community name is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreated: (vtc: VtcRecord) => void;
}

export function VtcCreateForm({ onCreated }: Props) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adminDid: session?.did ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const result = await provisionVtc(values.cdid, values.adminDid, values.name);
      onCreated({
        id: `${result.sequence}`,
        cdid: result.cdid,
        name: values.name,
        adminDid: values.adminDid,
        createdAt: result.timestamp,
      });
      reset({ adminDid: session?.did ?? "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision VTC");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Create Community
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Provision New VTC</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Community DID (C-DID)</label>
          <input
            {...register("cdid")}
            placeholder="did:web:community.fpndtg.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.cdid && <p className="text-red-500 text-xs mt-1">{errors.cdid.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Admin DID</label>
          <input
            {...register("adminDid")}
            placeholder="did:web:alice.fpndtg.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.adminDid && <p className="text-red-500 text-xs mt-1">{errors.adminDid.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Community Name</label>
          <input
            {...register("name")}
            placeholder="My Trust Community"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); reset({ adminDid: session?.did ?? "" }); }}
            className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? "Provisioning…" : "Provision VTC"}
          </button>
        </div>
      </form>
    </div>
  );
}
