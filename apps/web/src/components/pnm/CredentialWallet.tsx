import type { WalletCredential } from "../../lib/types";

interface Props {
  credentials: WalletCredential[];
}

export function CredentialWallet({ credentials }: Props) {
  if (credentials.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No credentials in wallet yet. VMC issuance coming in Phase 2.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {credentials.map((cred) => (
        <div
          key={cred.id}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {cred.type}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(cred.issuedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-0.5">
            <span className="font-medium text-slate-700">Issuer:</span>{" "}
            <span className="font-mono">{cred.issuerDid}</span>
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">Subject:</span>{" "}
            <span className="font-mono">{cred.subjectDid}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
