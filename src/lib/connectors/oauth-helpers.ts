import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { signConnectorState, verifyConnectorState } from './state';
import type { FitnessProvider, SyncedActivity } from './types';

/**
 * Generic OAuth connect handler: redirects to provider auth URL.
 */
export async function handleOAuthConnect(getAuthUrl: (state: string) => string) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const state = signConnectorState(user.id);
  const url = getAuthUrl(state);
  return NextResponse.redirect(url);
}

/**
 * Generic OAuth callback handler: exchanges code, stores connection, syncs activities.
 */
export async function handleOAuthCallback(
  provider: FitnessProvider,
  code: string,
  state: string,
  exchangeCode: (code: string) => Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; userId?: string }>,
  fetchActivities: (token: string) => Promise<SyncedActivity[]>,
) {
  const admin = getSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100';

  // The state is signed at /connect: a forged or replayed one must not bind a tracker to another user.
  const userId = verifyConnectorState(state);
  if (!userId) return NextResponse.redirect(`${appUrl}/profile?error=invalid_state`);

  try {
    const tokens = await exchangeCode(code);

    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : null;

    // Upsert connection
    await admin.from('fitness_connections').upsert({
      user_id: userId,
      provider,
      provider_user_id: tokens.userId || null,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || null,
      token_expires_at: expiresAt,
      is_active: true,
      last_sync_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    // Initial sync
    try {
      const activities = await fetchActivities(tokens.accessToken);
      if (activities.length > 0) {
        const rows = activities.map(a => ({
          user_id: userId,
          provider,
          provider_activity_id: a.providerActivityId,
          sport: a.sport,
          title: a.title,
          duration_seconds: a.durationSeconds,
          distance_meters: a.distanceMeters,
          calories: a.calories,
          start_time: a.startTime,
          avg_heart_rate: a.avgHeartRate,
          max_heart_rate: a.maxHeartRate,
          elevation_gain: a.elevationGain,
        }));
        await admin.from('synced_activities').upsert(rows, {
          onConflict: 'user_id,provider,provider_activity_id',
        });
      }
    } catch {
      // Sync error — connection still saved, sync can be retried
    }

    return NextResponse.redirect(`${appUrl}/profile/connections?connected=${provider}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.redirect(`${appUrl}/profile/connections?error=${encodeURIComponent(message)}`);
  }
}

/**
 * Generic manual sync handler.
 */
export async function handleManualSync(
  provider: FitnessProvider,
  fetchActivities: (token: string, after?: string) => Promise<SyncedActivity[]>,
  refreshToken?: (rt: string) => Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }>,
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

  const admin = getSupabaseAdminClient();

  const { data: conn } = await admin
    .from('fitness_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  if (!conn) return NextResponse.json({ error: `${provider} non connecté` }, { status: 404 });

  // Refresh token if expired
  let token = conn.access_token;
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;
  if (expiresAt && expiresAt < new Date() && conn.refresh_token && refreshToken) {
    try {
      const newTokens = await refreshToken(conn.refresh_token);
      token = newTokens.accessToken;
      await admin.from('fitness_connections').update({
        access_token: newTokens.accessToken,
        refresh_token: newTokens.refreshToken || conn.refresh_token,
        token_expires_at: newTokens.expiresIn
          ? new Date(Date.now() + newTokens.expiresIn * 1000).toISOString()
          : conn.token_expires_at,
      }).eq('id', conn.id);
    } catch {
      return NextResponse.json({ error: 'Token expiré, reconnectez-vous' }, { status: 401 });
    }
  }

  const afterDate = conn.last_sync_at || undefined;
  const activities = await fetchActivities(token, afterDate);

  if (activities.length > 0) {
    const rows = activities.map(a => ({
      user_id: user.id,
      provider,
      provider_activity_id: a.providerActivityId,
      sport: a.sport,
      title: a.title,
      duration_seconds: a.durationSeconds,
      distance_meters: a.distanceMeters,
      calories: a.calories,
      start_time: a.startTime,
      avg_heart_rate: a.avgHeartRate,
      max_heart_rate: a.maxHeartRate,
      elevation_gain: a.elevationGain,
    }));
    await admin.from('synced_activities').upsert(rows, {
      onConflict: 'user_id,provider,provider_activity_id',
    });
  }

  await admin.from('fitness_connections').update({
    last_sync_at: new Date().toISOString(),
  }).eq('id', conn.id);

  return NextResponse.json({ synced: activities.length });
}
