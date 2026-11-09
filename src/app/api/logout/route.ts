import { NextResponse, type NextRequest } from 'next/server';
import { portalLogoutUrl, publicOrigin } from '@/lib/fraynix-id';

// GET /api/logout — sign out of Fraynix ID (shared SSO), then come back to Pulse.
export function GET(request: NextRequest) {
  const origin = publicOrigin(request.headers, request.nextUrl.host);
  return NextResponse.redirect(portalLogoutUrl(`${origin}/`));
}
