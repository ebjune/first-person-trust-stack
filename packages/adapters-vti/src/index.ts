import { resolveUrl } from "@fpndtg/brand-config";

export interface HealthResult {
  ok: boolean;
  status: number;
  body: unknown;
  url: string;
}

export interface TrustTaskRequestInit extends RequestInit {
  trustTask: string;
}

/** Build headers for VTC Trust-Task routes (all VTC routes except GET /health). */
export function withTrustTask(
  trustTask: string,
  init: RequestInit = {},
): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Trust-Task", trustTask);
  return { ...init, headers };
}

async function fetchHealth(url: string): Promise<HealthResult> {
  const healthUrl = `${url.replace(/\/$/, "")}/health`;
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    let body: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      body = await response.text();
    }
    return {
      ok: response.ok,
      status: response.status,
      body,
      url: healthUrl,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : String(error) },
      url: healthUrl,
    };
  }
}

/** GET /health against a VTA base URL (Trust-Task exempt). */
export function vtaHealth(
  baseUrl: string = resolveUrl("vta"),
): Promise<HealthResult> {
  return fetchHealth(baseUrl);
}

/** GET /health against a VTC base URL (Trust-Task exempt). */
export function vtcHealth(
  baseUrl: string = resolveUrl("vtc"),
): Promise<HealthResult> {
  return fetchHealth(baseUrl);
}

/** Example Trust-Task for join-request submit (VTI trust-tasks spec). */
export const TRUST_TASKS = {
  joinRequestSubmit:
    "https://trusttasks.org/openvtc/vtc/join-requests/submit/1.0",
  healthDiagnostics:
    "https://trusttasks.org/openvtc/vtc/health/diagnostics/1.0",
} as const;

export async function vtcTrustTaskFetch(
  baseUrl: string,
  path: string,
  init: TrustTaskRequestInit,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, withTrustTask(init.trustTask, init));
}
