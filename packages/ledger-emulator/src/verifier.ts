import { verifyVtaChain as dbVerifyVtaChain, verifyVtcChain as dbVerifyVtcChain } from "@fpndtg/db-infra";

export interface LedgerVerificationResult {
  ledger: string;
  valid: boolean;
  brokenAt?: number;
  message?: string;
  checkedAt: string;
}

export interface FullVerificationReport {
  allValid: boolean;
  results: LedgerVerificationResult[];
  checkedAt: string;
}

/** Verify the VTA event hash chain. */
export async function verifyVtaChain(): Promise<LedgerVerificationResult> {
  const result = await dbVerifyVtaChain();
  return {
    ledger: "vta_events",
    valid: result.valid,
    brokenAt: result.brokenAt,
    message: result.message,
    checkedAt: new Date().toISOString(),
  };
}

/** Verify the VTC event hash chain. */
export async function verifyVtcChain(): Promise<LedgerVerificationResult> {
  const result = await dbVerifyVtcChain();
  return {
    ledger: "vtc_events",
    valid: result.valid,
    brokenAt: result.brokenAt,
    message: result.message,
    checkedAt: new Date().toISOString(),
  };
}

/** Verify all ledger chains and return a full report. */
export async function verifyAllChains(): Promise<FullVerificationReport> {
  const [vtaResult, vtcResult] = await Promise.all([
    verifyVtaChain(),
    verifyVtcChain(),
  ]);

  const results = [vtaResult, vtcResult];
  const allValid = results.every((r) => r.valid);

  return {
    allValid,
    results,
    checkedAt: new Date().toISOString(),
  };
}
