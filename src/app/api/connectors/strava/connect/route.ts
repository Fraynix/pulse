import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getStravaAuthUrl } from '@/lib/connectors/strava';
import { signConnectorState } from '@/lib/connectors/state';

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const state = signConnectorState(user.id);
  const url = getStravaAuthUrl(state);
  return NextResponse.redirect(url);
}
