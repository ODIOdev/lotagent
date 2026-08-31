"use client";

import { useSyncExternalStore } from "react";
import {
  getDemoState,
  subscribeDemo,
} from "@/lib/data/demo-store";
import { createSeedState } from "@/lib/data/seed";
import type { AppState } from "@/lib/types";

const empty = createSeedState();

export function useAppState(): AppState {
  return useSyncExternalStore(subscribeDemo, getDemoState, () => empty);
}
