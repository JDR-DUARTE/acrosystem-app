"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { logout } from "@/app/auth/actions";

function Brand() {
  return (
    <span className="flex items-center gap-3">
      <Image
        src="/logo-acro.png"
        alt="Acrofobia"
        width={40}
        height={40}
        className="size-10 shrink-0 object-contain"
        priority
      />
      <span className="text-xl font-bold text-acro-text">AcroSystem</span>
    </span>
  );
}

function itemClasses(active) {
  return cn(
    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
    active
      ? "bg-acro-accent text-acro-dark"
      : "text-acro-text hover:bg-white/5",
  );
}

function SidebarBody({ isAdmin, pathname, onNavigate }) {
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col px-4 py-4">
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={itemClasses(active)}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
        <Link
          href="/configuracion"
          onClick={onNavigate}
          className={itemClasses(pathname.startsWith("/configuracion"))}
        >
          <Settings className="size-5 shrink-0" />
          Configuración
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-acro-danger transition-colors hover:bg-acro-danger/10"
          >
            <LogOut className="size-5 shrink-0" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppShell({ isAdmin = false, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setOpen(false);

  return (
    <div className="flex min-h-dvh flex-col bg-acro-dark">
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-6">
        <Brand />
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="rounded-md p-1 text-acro-text transition-colors hover:bg-white/5 lg:hidden"
        >
          <Menu className="size-7" />
        </button>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[320px] shrink-0 lg:block">
          <SidebarBody isAdmin={isAdmin} pathname={pathname} />
        </aside>

        <main className="min-w-0 flex-1 border-border p-6 lg:border-l lg:p-8">
          {children}
        </main>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          aria-describedby={undefined}
          className="flex w-[300px] flex-col gap-0 border-border bg-acro-dark p-0"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <SheetTitle asChild>
              <Brand />
            </SheetTitle>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={closeMenu}
              className="rounded-md p-1 text-acro-text transition-colors hover:bg-white/5"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarBody
              isAdmin={isAdmin}
              pathname={pathname}
              onNavigate={closeMenu}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
