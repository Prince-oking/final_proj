import crypto from 'node:crypto';

export type AuthRole = 'resident' | 'staff';

export interface SessionClaims {
  sub: string;
  role: AuthRole;
  exp: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function signSessionToken(
  userId: string,
  role: AuthRole,
  secret: string,
  ttlSeconds = 60 * 60 * 12,
): string {
  const claims: SessionClaims = {
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token: string,
  secret: string,
): SessionClaims | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payload || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as SessionClaims;

    if (
      !parsed ||
      typeof parsed.sub !== 'string' ||
      (parsed.role !== 'resident' && parsed.role !== 'staff') ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isSafePhotoAttachment(value?: string): boolean {
  if (!value) return true;
  if (value.startsWith('/src/assets/images/')) {
    return !value.includes('..');
  }
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}
