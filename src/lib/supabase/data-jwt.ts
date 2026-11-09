import { createHmac } from 'crypto';

/**
 * Short-lived JWT for the data-pulse database (PostgREST), minted server-side after the Fraynix ID
 * session has been verified. It keeps the ~100 RLS-scoped queries working unchanged: PostgREST sees
 * `auth.uid()` = the Pulse user, exactly as when GoTrue issued the token itself.
 * Needs PULSE_DATA_JWT_SECRET = the JWT secret of data-pulse's GoTrue/PostgREST.
 */
const TTL_SECONDS = 300;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function mintDataJwt(userId: string, email: string | null): string {
  const secret = process.env.PULSE_DATA_JWT_SECRET;
  if (!secret) throw new Error('PULSE_DATA_JWT_SECRET is not set');
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      aud: 'authenticated',
      role: 'authenticated',
      sub: userId,
      email: email ?? undefined,
      iat: now,
      exp: now + TTL_SECONDS,
    }),
  );
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}
