'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getUser, clearAuth } from '@/lib/auth';
import { LogOut } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
