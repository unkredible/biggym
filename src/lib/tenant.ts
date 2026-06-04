/**
 * Tenant context loaded from environment variables.
 *
 * Isolation is enforced at the infrastructure layer:
 *   - one container per tenant,
 *   - one Postgres database per tenant,
 *   - one storage directory per tenant,
 *   - one SMTP account per tenant.
 *
 * This module gives application code a typed handle on the current tenant
 * and optionally verifies that the incoming HTTP host matches the tenant
 * the container was provisioned for (defence-in-depth).
 */

export interface TenantContext {
  id: number;
  name: string;
  /** Fully-qualified hostname this tenant answers on. */
  host: string;
  /** Absolute filesystem path of the tenant's storage volume (inside the container). */
  storageDir: string;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.length === 0) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Tenant containers must be started via setup-tenant.sh.`,
    );
  }
  return v;
}

let cached: TenantContext | null = null;

export function getTenant(): TenantContext {
  if (cached) return cached;

  const idRaw = requireEnv("TENANT_ID");
  const id = Number.parseInt(idRaw, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`TENANT_ID must be a positive integer, got: ${idRaw}`);
  }

  const name = requireEnv("TENANT_NAME");
  if (!/^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]?$/.test(name)) {
    throw new Error(
      `TENANT_NAME must be DNS-safe (a-z, 0-9, hyphen), got: ${name}`,
    );
  }

  const baseDomain = requireEnv("BASE_DOMAIN");
  const host = `${name}.${baseDomain}`;

  cached = {
    id,
    name,
    host,
    storageDir: process.env.STORAGE_DIR ?? "/app/storage",
  };
  return cached;
}

/**
 * Defence-in-depth: confirm the request really came in on the host this
 * container was provisioned for. nginx-proxy already routes by host, but a
 * misconfigured proxy or a direct hit to the container port could otherwise
 * cross tenant boundaries.
 *
 * @returns true when the host matches; false otherwise.
 */
export function isRequestForThisTenant(requestHost: string | null): boolean {
  if (!requestHost) return false;
  const tenant = getTenant();
  // Strip any port suffix before comparing.
  const bare = requestHost.split(":")[0]!.toLowerCase();
  return bare === tenant.host.toLowerCase();
}
