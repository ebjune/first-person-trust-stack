/** Structured governance rule model (compile target for Rego PEP sync). */
export type MembershipPolicyKind = "open" | "invite-only" | "witness-required";

export interface MembershipPolicy {
  kind: MembershipPolicyKind;
  description?: string;
}
