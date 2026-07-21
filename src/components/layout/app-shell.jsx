"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Settings, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { logout } from "@/app/auth/actions";

function Brand({ className }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo-acro.png"
        alt="Acrofobia"
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
      />
      <span className="text-xl font-bold text-acro-text">AcroSystem</span>
    </span>
  );
}

function NavList({ isAdmin, pathname, onNavigate }) {
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
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
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-acro-accent text-acro-dark"
                : "text-acro-text hover:bg-white/5",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ isAdmin = false, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setOpen(false);

  return (
    <div className="flex min-h-dvh flex-col bg-acro-dark">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-acro-dark px-4 py-3">
        <Brand />
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="rounded-md p-1 text-acro-text transition-colors hover:bg-white/5"
        >
          <Menu className="size-7" />
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          aria-describedby={undefined}
          className="flex w-[300px] flex-col gap-0 border-border bg-acro-dark p-0 sm:w-[320px]"
        >
          <SheetHeader className="flex-row items-center justify-between border-b border-border px-4 py-3">
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
          </SheetHeader>

          <NavList
            isAdmin={isAdmin}
            pathname={pathname}
            onNavigate={closeMenu}
          />

          <div className="mt-auto flex flex-col gap-1 border-t border-border px-3 py-3">
            <Link
              href="/configuracion"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/configuracion")
                  ? "bg-acro-accent text-acro-dark"
                  : "text-acro-text hover:bg-white/5",
              )}
            >
              <Settings className="size-5 shrink-0" />
              Configuración
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-acro-danger transition-colors hover:bg-acro-danger/10"
              >
                <LogOut className="size-5 shrink-0" />
                Cerrar Sessión
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
