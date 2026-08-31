import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BadgeDollarSign,
  Columns3,
  Eye,
  LayoutDashboard,
  PlusCircle,
  Radio,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/acquisitions/new", label: "New Acquisition", icon: PlusCircle },
  { href: "/live-bid", label: "Live Bid", icon: Radio, match: "prefix" },
  { href: "/values", label: "Vehicle Values", icon: BadgeDollarSign },
  { href: "/watchlist", label: "Watchlist", icon: Eye },
  { href: "/comparisons", label: "Comparisons", icon: Columns3 },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag, match: "prefix" },
  { href: "/transportation", label: "Transportation", icon: Truck },
  { href: "/auction-fees", label: "Auction Fee Rules", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[4],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
];
