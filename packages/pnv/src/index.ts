/** W3C Verifiable Credential (minimal shape for FPS interfaces). */
export interface Credential {
  id?: string;
  type: string[];
  issuer: string | { id: string };
  validFrom?: string;
  validUntil?: string;
  credentialSubject: Record<string, unknown>;
  proof?: unknown;
}

/** W3C Verifiable Presentation (minimal shape). */
export interface Presentation {
  type: string[];
  holder?: string;
  verifiableCredential: Credential[];
  proof?: unknown;
}

export interface WalletStore {
  listCredentials(): Promise<Credential[]>;
  getCredential(id: string): Promise<Credential | undefined>;
  storeCredential(credential: Credential): Promise<void>;
  removeCredential(id: string): Promise<void>;
  createPresentation(credentialIds: string[]): Promise<Presentation>;
}
