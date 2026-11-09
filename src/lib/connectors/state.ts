import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed OAuth `state` for the fitness connectors. The state used to be the raw user id, so anyone
 * could hit a provider callback with another user's id and bind their own tracker to that account.
 * Now: `<userId>.<expiry>.<hmac>`, verified on the callback.
 *
 * Secret: CONNECTOR_STATE_SECRET, falling back to the existing CRON_SECRET. Domain-separated so a
 * state signature can never be replayed as anything else.
 */
const TTL_MS = 10 * 60 * 1000;

function secret(): string {
  const s = process.env.CONNECTOR_STATE_SECRET || process.env.CRON_SECRET;
  if (!s) throw new Error('CONNECTOR_STATE_SECRET (or CRON_SECRET) is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(`connector-state:${payload}`).digest('base64url');
}

export function signConnectorState(userId: string, now = Date.now()): string {
  const payload = `${userId}.${now + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the user id if the state is authentic and unexpired, otherwise null. */
export function verifyConnectorState(state: string | null | undefined, now = Date.now()): string | null {
  if (!state) return null;
  const parts = state.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiry, mac] = parts;
  if (!userId || !/^\d+$/.test(expiry) || Number(expiry) < now) return null;
  const expected = Buffer.from(sign(`${userId}.${expiry}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return userId;
}
