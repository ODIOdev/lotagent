/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import {
  emptyAuctionStore,
  loadAuctionStore,
  percentForAuction,
  writeAuctionStore,
} from "@/lib/data/auction-percents";

const KEY = "lotagent.auction.percents.v1";

afterEach(() => {
  window.localStorage.removeItem(KEY);
});

describe("auction percents", () => {
  it("defaults each house to its own rate", () => {
    const store = emptyAuctionStore();
    expect(store.selected).toBe("fee-manheim");
    expect(percentForAuction(store, "fee-manheim")).toBe("5");
    expect(percentForAuction(store, "fee-copart")).toBe("6");
    expect(percentForAuction(store, "fee-iaa")).toBe("8.5");
    expect(percentForAuction(store, "fee-acv")).toBe("4.5");
    expect(percentForAuction(store, "fee-custom")).toBe("5");
  });

  it("saves and reloads a rate for one house without changing others", () => {
    const store = emptyAuctionStore();
    writeAuctionStore({
      selected: "fee-copart",
      percents: { ...store.percents, "fee-copart": "7.25" },
    });

    const loaded = loadAuctionStore();
    expect(loaded.selected).toBe("fee-copart");
    expect(percentForAuction(loaded, "fee-copart")).toBe("7.25");
    expect(percentForAuction(loaded, "fee-manheim")).toBe("5");
    expect(percentForAuction(loaded, "fee-iaa")).toBe("8.5");
  });
});
