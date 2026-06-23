import {
  appendVtaEvent,
  appendVtcEvent,
  type AppendVtaEventInput,
  type AppendVtcEventInput,
} from "@fpndtg/db-infra";

export type VtaLedgerEventInput = AppendVtaEventInput;
export type VtcLedgerEventInput = AppendVtcEventInput;

/**
 * Append a VTA lifecycle event to the ledger.
 * Wraps db-infra's appendVtaEvent with ledger semantics.
 */
export async function appendVtaLedgerEvent(input: VtaLedgerEventInput) {
  return appendVtaEvent(input);
}

/**
 * Append a VTC lifecycle event to the ledger.
 * Wraps db-infra's appendVtcEvent with ledger semantics.
 */
export async function appendVtcLedgerEvent(input: VtcLedgerEventInput) {
  return appendVtcEvent(input);
}
