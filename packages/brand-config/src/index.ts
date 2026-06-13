export type ServiceStatus = "live" | "planned" | "partial";

export interface FpndtgService {
  id: string;
  host: string;
  url: string;
  label: string;
  role: string;
  status: ServiceStatus;
  fpsComponent?: string;
}

export const TRUST_TASK_ORG = "https://trusttasks.org/fpndtg" as const;

export const FPNDTG = {
  apex: "https://fpndtg.com",
  www: "https://www.fpndtg.com",
  vta: "https://vta.fpndtg.com",
  mediator: "https://mediator.fpndtg.com",
  dids: "https://dids.fpndtg.com",
  vtc: "https://vtc.fpndtg.com",
  app: "https://app.fpndtg.com",
  validator: "https://validator.fpndtg.com",
  governance: "https://governance.fpndtg.com",
  vtn: "https://vtn.fpndtg.com",
} as const;

export type FpndtgEndpoint = keyof typeof FPNDTG;

/** Resolve a service URL; env vars override defaults for local/dev. */
export function resolveUrl(
  key: FpndtgEndpoint,
  env: Record<string, string | undefined> = process.env,
): string {
  const envKey = `FPNDTG_${key.toUpperCase()}_URL`;
  return env[envKey] ?? FPNDTG[key];
}

export const FPNDTG_SERVICES: FpndtgService[] = [
  {
    id: "www",
    host: "www.fpndtg.com",
    url: FPNDTG.www,
    label: "Developer landing",
    role: "Docs and links to stack subdomains",
    status: "live",
  },
  {
    id: "vta",
    host: "vta.fpndtg.com",
    url: FPNDTG.vta,
    label: "Verifiable Trust Agent",
    role: "REST + auth, key custody",
    status: "live",
  },
  {
    id: "mediator",
    host: "mediator.fpndtg.com",
    url: FPNDTG.mediator,
    label: "DIDComm mediator",
    role: "DIDComm v2 message routing",
    status: "live",
  },
  {
    id: "dids",
    host: "dids.fpndtg.com",
    url: FPNDTG.dids,
    label: "WebVH hosting",
    role: "did.jsonl resolution",
    status: "live",
  },
  {
    id: "vtc",
    host: "vtc.fpndtg.com",
    url: FPNDTG.vtc,
    label: "Verifiable Trust Community",
    role: "Community API, VMC issuance",
    status: "partial",
  },
  {
    id: "app",
    host: "app.fpndtg.com",
    url: FPNDTG.app,
    label: "PNM / CNM / VTN Manager",
    role: "First Person Trust Stack web UI",
    status: "planned",
    fpsComponent: "apps/web",
  },
  {
    id: "validator",
    host: "validator.fpndtg.com",
    url: FPNDTG.validator,
    label: "Validator",
    role: "VMC / VP verification API",
    status: "planned",
    fpsComponent: "apps/validator",
  },
  {
    id: "governance",
    host: "governance.fpndtg.com",
    url: FPNDTG.governance,
    label: "Governance Control Plane",
    role: "Structured rules and PEP adapters",
    status: "planned",
    fpsComponent: "services/governance-api",
  },
  {
    id: "vtn",
    host: "vtn.fpndtg.com",
    url: FPNDTG.vtn,
    label: "VTN service",
    role: "Federation of VTCs",
    status: "planned",
    fpsComponent: "services/vtn-service",
  },
];
