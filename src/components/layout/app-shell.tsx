"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { setDemoSession } from "@/lib/data/demo-store";
import { useAppState } from "@/lib/data/use-app-state";
import { MOBILE_NAV, NAV_ITEMS } from "@/lib/nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, match?: "exact" | "prefix") {
  if (match === "exact" || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
  compact,
}: {
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.match);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
              compact && "justify-center px-0",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className={cn(compact && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const live = pathname.startsWith("/live-bid/") && pathname !== "/live-bid";

  async function logout() {
    setDemoSession(false);
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (live) {
    return <div className="min-h-full bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-4 py-5">
          <p className="text-xs font-semibold tracking-[0.2em] text-sidebar-foreground/60">LOTAGENT</p>
          <p className="mt-1 text-sm font-medium">{state.dealership.name}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-xs text-sidebar-foreground/70">{state.profile.fullName}</p>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-3 py-2 backdrop-blur md:hidden">
          <p className="text-sm font-semibold tracking-[0.16em]">LOTAGENT</p>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-sidebar text-sidebar-foreground">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground">Menu</SheetTitle>
              </SheetHeader>
              <div className="px-2">
                <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                <Button
                  variant="ghost"
                  className="mt-4 w-full justify-start text-sidebar-foreground"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:px-8 md:pb-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
          <div className="grid grid-cols-4">
            {MOBILE_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label.replace("New Acquisition", "New").replace("Live Bid", "Live")}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
