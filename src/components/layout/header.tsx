'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { RoleSwitch } from './role-switch';
import { Button } from '../ui/button';

export function Header() {
  const { userId, clear } = useAuthStore();

  // Shared Fraynix ID session: sign out at the portal, which sends us back here.
  const handleLogout = () => {
    clear();
    window.location.href = '/api/logout';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold text-brand-700">
          Coaching
        </Link>

        <div className="flex items-center gap-3">
          <RoleSwitch />
          {userId ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
