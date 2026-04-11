"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@web/hooks/use-auth";
import { useWorkspace } from "@web/hooks/use-workspace";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      <div className="border-b p-4">
        <p className="font-bold">FlowManager</p>
      </div>

      <div className="border-b p-3">
        <p className="mb-1 px-1 text-xs text-muted-foreground">Workspace</p>
        <select
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          value={currentWorkspace?.id ?? ""}
          onChange={(e) => {
            const ws = workspaces.find((w) => w.id === e.target.value);
            if (ws) {
              selectWorkspace(ws);
              router.push(`/workspaces/${ws.id}`);
            }
          }}
        >
          {!currentWorkspace && <option value="">Selecionar...</option>}
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <NavItem href="/dashboard" active={pathname === "/dashboard"}>
          Dashboard
        </NavItem>
        <NavItem href="/workspaces" active={pathname === "/workspaces"}>
          Workspaces
        </NavItem>
        <NavItem href="/settings" active={pathname === "/settings"}>
          Configurações
        </NavItem>
        {currentWorkspace && (
          <>
            <NavItem
              href={`/workspaces/${currentWorkspace.id}/members`}
              active={pathname.includes("/members")}
            >
              Membros
            </NavItem>
            <NavItem
              href={`/workspaces/${currentWorkspace.id}/labels`}
              active={pathname.includes("/labels")}
            >
              Labels
            </NavItem>
            <NavItem
              href={`/workspaces/${currentWorkspace.id}/activity`}
              active={pathname.includes("/activity")}
            >
              Histórico
            </NavItem>
            <NavItem
              href={`/workspaces/${currentWorkspace.id}/my-work`}
              active={pathname.includes("/my-work")}
            >
              Meu trabalho
            </NavItem>
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <button
          onClick={logout}
          className="mt-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
