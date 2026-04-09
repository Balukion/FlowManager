"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@web/stores/auth.store";
import { Sidebar } from "./sidebar";
import { NotificationPanel } from "@web/components/features/notifications/notification-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, accessToken, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !user) router.replace("/login");
  }, [user, _hasHydrated, router]);

  if (!_hasHydrated) return null;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-end border-b bg-card px-4">
          <NotificationPanel token={accessToken!} />
        </header>
        <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
