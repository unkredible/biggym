/**
 * Host helpers. biggym serves two surfaces on two hostnames:
 *   - portal:  <name>.<BASE_DOMAIN>          → public, subscribe
 *   - app:     app.<name>.<BASE_DOMAIN>       → credential-gated app
 */

export function bigDomains() {
  const base = process.env.BASE_DOMAIN ?? "unkredible.com";
  const name = process.env.TENANT_NAME ?? "biggym";
  return {
    portal: `${name}.${base}`,
    app: `app.${name}.${base}`,
  };
}

export function isAppHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return host.split(":")[0]!.toLowerCase().startsWith("app.");
}

export function appBaseUrl(): string {
  return `https://${bigDomains().app}`;
}

export function portalBaseUrl(): string {
  return `https://${bigDomains().portal}`;
}

/**
 * Cookie domain that covers BOTH the portal (<name>.<base>) and the app
 * (app.<name>.<base>), so a session set on the app host is also sent to the
 * portal host. A cookie with Domain=<name>.<base> is sent to that host and all
 * its subdomains.
 */
export function cookieDomain(): string {
  return process.env.COOKIE_DOMAIN ?? bigDomains().portal;
}
