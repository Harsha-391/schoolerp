/**
 * Subdomain detection utility.
 *
 * Env vars (set in .env / .env.production):
 *   VITE_BASE_DOMAIN     — root domain, e.g. "localhost" or "acadmay.in"
 *   VITE_ADMIN_SUBDOMAIN — subdomain reserved for developer admin, e.g. "admin"
 *
 * URL map:
 *   acadmay.in            → root (redirects to admin portal)
 *   admin.acadmay.in      → developer admin panel
 *   dps.acadmay.in        → DPS school portal
 *   xavier.acadmay.in     → Xavier's school portal
 *
 * Local dev equivalents:
 *   localhost:5173        → root
 *   admin.localhost:5173  → developer admin panel
 *   dps.localhost:5173    → DPS school portal
 */

const BASE_DOMAIN    = import.meta.env.VITE_BASE_DOMAIN    || 'localhost';
const ADMIN_SUBDOMAIN = import.meta.env.VITE_ADMIN_SUBDOMAIN || 'admin';

/**
 * Returns the subdomain string if on a subdomain of BASE_DOMAIN, else null.
 *   admin.acadmay.in  → "admin"
 *   dps.acadmay.in    → "dps"
 *   acadmay.in        → null
 */
export function getSubdomain() {
  const hostname = window.location.hostname;

  if (hostname === BASE_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  if (hostname.endsWith('.' + BASE_DOMAIN)) {
    return hostname.slice(0, -(BASE_DOMAIN.length + 1));
  }

  return null;
}

/** True when running on the admin subdomain (e.g. admin.acadmay.in). */
export function isAdminPortal() {
  return getSubdomain() === ADMIN_SUBDOMAIN;
}

/** True when running on a school subdomain (any subdomain that isn't admin). */
export function isSchoolPortal() {
  const sub = getSubdomain();
  return sub !== null && sub !== ADMIN_SUBDOMAIN;
}

/** Full URL for a school subdomain, preserving protocol and port. */
export function getSchoolUrl(subdomain) {
  const { protocol, port } = window.location;
  return `${protocol}//${subdomain}.${BASE_DOMAIN}${port ? ':' + port : ''}`;
}

/** Full URL for the admin portal. */
export function getAdminUrl() {
  const { protocol, port } = window.location;
  return `${protocol}//${ADMIN_SUBDOMAIN}.${BASE_DOMAIN}${port ? ':' + port : ''}`;
}

/** Full URL for the root domain. */
export function getRootUrl() {
  const { protocol, port } = window.location;
  return `${protocol}//${BASE_DOMAIN}${port ? ':' + port : ''}`;
}
