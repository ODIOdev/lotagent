"use client";

import { APP_NAV } from "@/lib/nav";
import { Bookmark, CircleDollarSign, Package, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ICONS = {
  "/": CircleDollarSign,
  "/watch": Bookmark,
  "/buys": Package,
  "/settings": Settings,
} as const;

function currentQuery() {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

export function AppNav() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(currentQuery());
  }, [pathname]);

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
