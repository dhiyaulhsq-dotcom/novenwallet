/**
 * Hash PIN using Web Crypto API SHA-256
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`noven_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify if provided PIN matches stored hash
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return true;
  const hash = await hashPin(pin);
  return hash === storedHash;
}

/**
 * Hash Password using Web Crypto API SHA-256 with auth salt
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`noven_auth_salt_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/**
 * Default initial credentials for fresh install
 */
export const DEFAULT_AUTH_USERNAME = 'admin';
export const DEFAULT_AUTH_PASSWORD = 'admin';

// Exact SHA-256 of `noven_auth_salt_admin`
export const DEFAULT_PASSWORD_HASH = '3306771eddae09dd9d6178a4d87b1e8b802b413ca0d59945e36e9d12220caa61';

/**
 * Session expiration: 2 days (48 hours)
 */
export const SESSION_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 172,800,000 ms

/**
 * Check if a session has expired (more than 2 days since lastLoginTimestamp)
 */
export function isSessionExpired(lastLoginTimestamp: number | null): boolean {
  if (!lastLoginTimestamp) return true;
  const now = Date.now();
  const diff = now - lastLoginTimestamp;
  return diff > SESSION_DURATION_MS || diff < 0;
}

/**
 * Format remaining session time in human-readable Indonesian
 */
export function formatRemainingSession(lastLoginTimestamp: number | null): string {
  if (!lastLoginTimestamp) return 'Sesi berakhir';
  const remainingMs = SESSION_DURATION_MS - (Date.now() - lastLoginTimestamp);
  if (remainingMs <= 0) return 'Sesi berakhir';

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days} hari ${remHours} jam`;
  }

  return `${hours} jam ${minutes} menit`;
}
