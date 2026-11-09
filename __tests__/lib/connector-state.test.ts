import { describe, it, expect, beforeAll } from 'vitest';
import { signConnectorState, verifyConnectorState } from '@/lib/connectors/state';

describe('connector OAuth state', () => {
  beforeAll(() => {
    process.env.CONNECTOR_STATE_SECRET = 'test-secret';
  });

  const uid = '3f2b8c1e-0a4d-4b7e-9c55-1d2e3f4a5b6c';

  it('round-trips a user id', () => {
    expect(verifyConnectorState(signConnectorState(uid))).toBe(uid);
  });

  it('rejects the raw user id and a forged signature', () => {
    expect(verifyConnectorState(uid)).toBeNull();
    const [id, exp] = signConnectorState(uid).split('.');
    expect(verifyConnectorState(`${id}.${exp}.AAAA`)).toBeNull();
  });

  it('rejects a state re-targeted at another user', () => {
    const [, exp, mac] = signConnectorState(uid).split('.');
    expect(verifyConnectorState(`other-user.${exp}.${mac}`)).toBeNull();
  });

  it('rejects an expired state', () => {
    const old = signConnectorState(uid, Date.now() - 60 * 60 * 1000);
    expect(verifyConnectorState(old)).toBeNull();
  });
});
