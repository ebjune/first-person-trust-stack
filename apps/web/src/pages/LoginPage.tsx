import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../contexts/AuthContext";
import { requestChallenge, verifyChallenge, provisionVta } from "../lib/api";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const signInSchema = z.object({
  did: z.string().min(7, "DID is required").startsWith("did:", "Must start with 'did:'"),
});

const createVtaSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(40, "Username too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  context: z.enum(["personal", "app", "mediator", "default"]),
});

type SignInValues = z.infer<typeof signInSchema>;
type CreateVtaValues = z.infer<typeof createVtaSchema>;

type Mode = "choose" | "signin" | "create" | "challenge";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("choose");
  const [challenge, setChallenge] = useState<string>("");
  const [activeDid, setActiveDid] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdDid, setCreatedDid] = useState<string | null>(null);

  // Sign-in form
  const signInForm = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  // Create VTA form
  const createForm = useForm<CreateVtaValues>({
    resolver: zodResolver(createVtaSchema),
    defaultValues: { context: "personal" },
  });

  // Derived suggested DID from username
  const watchedUsername = createForm.watch("username") ?? "";
  const suggestedDid = watchedUsername
    ? `did:webvh:dids.fpndtg.com:${watchedUsername}`
    : "did:webvh:dids.fpndtg.com:your-username";

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  async function onSignIn(values: SignInValues) {
    setError(null);
    setLoading(true);
    try {
      const result = await requestChallenge(values.did);
      setChallenge(result.challenge);
      setActiveDid(values.did);
      setMode("challenge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request challenge");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateVta(values: CreateVtaValues) {
    setError(null);
    setLoading(true);
    const newDid = `did:webvh:dids.fpndtg.com:${values.username}`;
    try {
      await provisionVta(newDid, values.context);
      setCreatedDid(newDid);
      // Immediately request a challenge for the new DID
      const result = await requestChallenge(newDid);
      setChallenge(result.challenge);
      setActiveDid(newDid);
      setMode("challenge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create VTA");
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    setError(null);
    setLoading(true);
    try {
      const session = await verifyChallenge(challenge, "stub-signature-phase1", activeDid);
      login(session);
      navigate("/pnm", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-indigo-600 font-bold text-3xl tracking-tight">FPS</span>
          <p className="text-slate-500 mt-1 text-sm">First Person Trust Stack</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">

          {/* ── CHOOSE MODE ── */}
          {mode === "choose" && (
            <>
              <h1 className="text-xl font-semibold text-slate-800 mb-1">Get started</h1>
              <p className="text-sm text-slate-500 mb-6">
                Sign in with an existing DID, or create a new Verifiable Trust Agent.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setMode("signin")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Sign in with existing DID
                </button>
                <button
                  onClick={() => setMode("create")}
                  className="w-full border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Create a new VTA (new DID)
                </button>
              </div>
            </>
          )}

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <>
              <h1 className="text-xl font-semibold text-slate-800 mb-1">Sign in with your DID</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your existing Verifiable Trust Agent DID.
              </p>
              <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">DID</label>
                  <input
                    {...signInForm.register("did")}
                    placeholder="did:webvh:dids.fpndtg.com:alice"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {signInForm.formState.errors.did && (
                    <p className="text-red-500 text-xs mt-1">{signInForm.formState.errors.did.message}</p>
                  )}
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setMode("choose"); setError(null); }}
                    className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    {loading ? "Requesting…" : "Continue"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── CREATE VTA ── */}
          {mode === "create" && (
            <>
              <h1 className="text-xl font-semibold text-slate-800 mb-1">Create a new VTA</h1>
              <p className="text-sm text-slate-500 mb-6">
                A Verifiable Trust Agent is your DID — your cryptographic identity on the trust graph.
              </p>
              <form onSubmit={createForm.handleSubmit(onCreateVta)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input
                    {...createForm.register("username")}
                    placeholder="alice"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {createForm.formState.errors.username && (
                    <p className="text-red-500 text-xs mt-1">{createForm.formState.errors.username.message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Your DID will be:{" "}
                    <span className="font-mono text-indigo-600">{suggestedDid}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Context</label>
                  <select
                    {...createForm.register("context")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="personal">personal — your primary identity</option>
                    <option value="app">app — application integration</option>
                    <option value="mediator">mediator — DIDComm relay</option>
                    <option value="default">default</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                  ℹ️ Phase 1: VTA creation is logged to the ledger emulator. Full registration at{" "}
                  <code className="font-mono">dids.fpndtg.com</code> requires Phase 2 VTI integration.
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setMode("choose"); setError(null); createForm.reset(); }}
                    className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                    {loading ? "Creating…" : "Create VTA & Sign in"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── CHALLENGE / VERIFY ── */}
          {mode === "challenge" && (
            <>
              <h1 className="text-xl font-semibold text-slate-800 mb-1">
                {createdDid ? "VTA created — verify identity" : "Verify your identity"}
              </h1>
              {createdDid && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mb-4">
                  ✓ VTA provisioned and logged to ledger.
                </div>
              )}
              <p className="text-sm text-slate-500 mb-4">
                Challenge issued for{" "}
                <span className="font-mono text-xs text-indigo-600 break-all">{activeDid}</span>.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-500 mb-1 font-medium">Challenge</p>
                <p className="font-mono text-xs text-slate-700 break-all">{challenge}</p>
              </div>

              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                ⚠️ Phase 1: Signature verification is stubbed. Set{" "}
                <code className="font-mono">AUTH_SKIP_SIGNATURE_VERIFY=true</code> in <code>.env</code>.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mb-4">{error}</div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setMode("choose"); setError(null); setCreatedDid(null); }}
                  className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  Back
                </button>
                <button onClick={() => void onVerify()} disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                  {loading ? "Verifying…" : "Sign in"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          <a href="https://www.fpndtg.com" target="_blank" rel="noreferrer" className="hover:text-indigo-500">
            fpndtg.com
          </a>
        </p>
      </div>
    </div>
  );
}
