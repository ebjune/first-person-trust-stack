import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { provisionVta } from "../../lib/api";
import type { VtaRecord } from "../../lib/types";

const schema = z.object({
  did: z.string().min(7, "DID is required").startsWith("did:", "Must start with 'did:'"),
  context: z.enum(["personal", "app", "mediator", "default"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onCreated: (vta: VtaRecord) => void;
}

export function VtaCreateForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { context: "personal" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const result = await provisionVta(values.did, values.context);
      onCreated({
        id: `${result.sequence}`,
        did: result.did,
        context: values.context,
        createdAt: result.timestamp,
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision VTA");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Create VTA
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Provision New VTA</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">DID</label>
          <input
            {...register("did")}
            placeholder="did:web:alice.fpndtg.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.did && <p className="text-red-500 text-xs mt-1">{errors.did.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Context</label>
          <select
            {...register("context")}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="personal">personal</option>
            <option value="app">app</option>
            <option value="mediator">mediator</option>
            <option value="default">default</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); reset(); }}
            className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isSubmitting ? "Provisioning…" : "Provision VTA"}
          </button>
        </div>
      </form>
    </div>
  );
}
