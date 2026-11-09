import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyConnectorState } from '@/lib/connectors/state';
import { exchangeStravaCode, fetchStravaActivities } from '@/lib/connectors/strava';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/profile?error=strava_denied', req.url));
  }

  const userId = verifyConnectorState(state);
  if (!userId) return NextResponse.redirect(new URL('/profile?error=invalid_state', req.url));

  try {
    const { accessToken, refreshToken, expiresAt, athlete } = await exchangeStravaCode(code);
    const db = getSupabaseAdminClient();

    // Upsert connection
    await db.from('fitness_connections').upsert({
      user_id: userId,
      provider: 'strava',
      provider_user_id: String((athlete as any).id),
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: new Date(expiresAt * 1000).toISOString(),
      scopes: ['read', 'activity:read_all'],
      profile_data: {
        firstName: (athlete as any).firstname,
        lastName: (athlete as any).lastname,
        profilePicture: (athlete as any).profile,
      },
      is_active: true,
      last_sync_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    // Initial sync — last 30 activities
    try {
      const activities = await fetchStravaActivities(accessToken);
      if (activities.length > 0) {
        const rows = activities.map(a => ({
          user_id: userId,
          provider: 'strava',
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
          average_speed: a.averageSpeed,
        }));
        await db.from('synced_activities').upsert(rows, { onConflict: 'provider,provider_activity_id' });
      }
    } catch (syncErr) {
      console.error('Initial Strava sync failed:', syncErr);
    }

    // Strava webhook will handle future auto-sync — no polling needed
    return NextResponse.redirect(new URL('/profile/connections?connected=strava', req.url));
  } catch (err) {
    console.error('Strava callback error:', err);
    return NextResponse.redirect(new URL('/profile?error=strava_failed', req.url));
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
