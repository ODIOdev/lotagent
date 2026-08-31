"use client";

import { APP_NAV } from "@/lib/nav";
import { Bookmark, CircleDollarSign, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ICONS = {
  "/": CircleDollarSign,
  "/watch": Bookmark,
  "/buys": Package,
  "/settings": Settings,
} as const;

export function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="homeNav" aria-label="Main">
      {APP_NAV.map((item) => {
        const Icon = ICONS[item.href];
        const on = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const href = query ? `${item.href}?${query}` : item.href;
        return (
          <Link key={item.href} href={href} className={on ? "on" : undefined}>
            <Icon aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
