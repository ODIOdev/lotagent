import { FEE_PRESETS } from "@/lib/data/fee-presets";
import { uid } from "@/lib/format";
import type { AcquisitionCosts, ConditionItem, VehicleInfo, VehicleValues, Worksheet } from "@/lib/types";
import { CONDITION_FLAGS } from "@/lib/types";

export function blankConditionItems(): ConditionItem[] {
  return CONDITION_FLAGS.map((flag) => ({
    flag,
    selected: false,
    dollarAdjustment: 0,
  }));
}

export function blankVehicle(): VehicleInfo {
  return {
    year: new Date().getFullYear(),
    make: "",
    model: "",
    trim: "",
    mileage: 0,
    exteriorColor: "",
    interiorColor: "",
    titleStatus: "clean",
    auctionName: "Manheim",
    auctionLocation: "",
    auctionKey: "manheim",
    stockNumber: "",
    imageUrl: "",
    notes: "",
    conditionScore: 7,
    auctionDate: new Date().toISOString(),
    vin: "",
  };
}

export function blankValues(): VehicleValues {
  return {
    tradeIn: 0,
    wholesale: 0,
    retail: 0,
    quickSale: 0,
    localMarketAverage: 0,
    lowMarket: 0,
    highMarket: 0,
    source: "Manual entry",
    retrievedAt: new Date().toISOString(),
    confidence: 50,
    manualOverride: true,
    notes: "",
  };
}

export function blankCosts(): AcquisitionCosts {
  const schedule = FEE_PRESETS[0];
  return {
    currentBid: 0,
    expectedWinningBid: 0,
    auctionBuyerFee: 0,
    internetBiddingFee: schedule.internetFee,
    gateFee: schedule.gateFee,
    titleFee: schedule.titleFee,
    documentationFee: schedule.documentationFee,
    salesTax: 0,
    transportation: 0,
    mechanicalRepairs: 0,
    bodyRepairs: 0,
    tires: 0,
    brakes: 0,
    detailing: 0,
    reconditioning: 0,
    inspection: 0,
    keys: 0,
    fuel: 0,
    storage: 0,
    floorPlanFees: 0,
    financingInterest: 0,
    riskReserve: 250,
    otherCosts: 0,
    customRows: [],
    feeOverride: false,
  };
}

export function createBlankWorksheet(): Worksheet {
  return {
    id: uid("ws"),
    vehicle: blankVehicle(),
    conditionItems: blankConditionItems(),
    values: blankValues(),
    costs: blankCosts(),
    profitTargets: {
      expectedSellingPrice: 0,
      desiredMinProfit: 1500,
      desiredRoi: 12,
      expectedHoldingPeriod: 21,
      estimatedDaysToSell: 18,
      salesCommission: 200,
      advertisingCost: 125,
      negotiationDiscount: 250,
    },
    assignedBuyer: "Jordan Hale",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
