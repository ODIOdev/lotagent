export const TITLE_STATUSES = [
  "clean",
  "salvage",
  "rebuilt",
  "lemon",
  "flood",
  "unknown",
] as const;
export type TitleStatus = (typeof TITLE_STATUSES)[number];

export const DECISION_STATUSES = ["BUY", "CAUTION", "PASS"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const WORKSHEET_STATUSES = [
  "draft",
  "watching",
  "live",
  "won",
  "lost",
  "passed",
] as const;
export type WorksheetStatus = (typeof WORKSHEET_STATUSES)[number];

export const PURCHASE_STATUSES = [
  "won",
  "payment_due",
  "paid",
  "awaiting_pickup",
  "in_transportation",
  "delivered",
  "inspection",
  "reconditioning",
  "ready_for_sale",
  "listed",
  "sold",
] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const CONDITION_FLAGS = [
  "clean",
  "average",
  "rough",
  "runs_and_drives",
  "does_not_run",
  "mechanical_issue",
  "structural_damage",
  "accident_history",
  "salvage_title",
  "rebuilt_title",
  "missing_keys",
  "warning_lights",
  "tire_replacement",
  "brake_replacement",
  "body_damage",
  "interior_damage",
  "flood_concern",
  "unknown_condition",
] as const;
export type ConditionFlagId = (typeof CONDITION_FLAGS)[number];

export const CONDITION_FLAG_LABELS: Record<ConditionFlagId, string> = {
  clean: "Clean",
  average: "Average",
  rough: "Rough",
  runs_and_drives: "Runs and drives",
  does_not_run: "Does not run",
  mechanical_issue: "Mechanical issue",
  structural_damage: "Structural damage",
  accident_history: "Accident history",
  salvage_title: "Salvage title",
  rebuilt_title: "Rebuilt title",
  missing_keys: "Missing keys",
  warning_lights: "Warning lights",
  tire_replacement: "Tire replacement",
  brake_replacement: "Brake replacement",
  body_damage: "Body damage",
  interior_damage: "Interior damage",
  flood_concern: "Flood concern",
  unknown_condition: "Unknown condition",
};

export const HIGH_RISK_FLAGS: ConditionFlagId[] = [
  "does_not_run",
  "structural_damage",
  "salvage_title",
  "flood_concern",
];

export const ELEVATED_RISK_FLAGS: ConditionFlagId[] = [
  "mechanical_issue",
  "accident_history",
  "rebuilt_title",
  "missing_keys",
  "warning_lights",
  "body_damage",
  "rough",
  "unknown_condition",
];

export type FeeKind = "flat" | "percentage" | "tiered";
export type TaxTreatment = "none" | "on_fees" | "on_vehicle" | "on_vehicle_and_fees";
export type TransportStatus = "not_scheduled" | "scheduled" | "picked_up" | "in_transit" | "delivered";

export interface ConditionItem {
  flag: ConditionFlagId;
  selected: boolean;
  dollarAdjustment: number;
}

export interface CustomCostRow {
  id: string;
  label: string;
  amount: number;
}

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  titleStatus: TitleStatus;
  auctionName: string;
  auctionLocation: string;
  auctionKey: string;
  stockNumber: string;
  imageUrl: string;
  notes: string;
  conditionScore: number;
  auctionDate: string;
  vin: string;
}

export interface VehicleValues {
  tradeIn: number;
  wholesale: number;
  retail: number;
  quickSale: number;
  localMarketAverage: number;
  lowMarket: number;
  highMarket: number;
  source: string;
  retrievedAt: string;
  confidence: number;
  manualOverride: boolean;
  notes: string;
}

export interface AcquisitionCosts {
  currentBid: number;
  expectedWinningBid: number;
  auctionBuyerFee: number;
  internetBiddingFee: number;
  gateFee: number;
  titleFee: number;
  documentationFee: number;
  salesTax: number;
  transportation: number;
  mechanicalRepairs: number;
  bodyRepairs: number;
  tires: number;
  brakes: number;
  detailing: number;
  reconditioning: number;
  inspection: number;
  keys: number;
  fuel: number;
  storage: number;
  floorPlanFees: number;
  financingInterest: number;
  riskReserve: number;
  otherCosts: number;
  customRows: CustomCostRow[];
  feeOverride: boolean;
}

export interface ProfitTargets {
  expectedSellingPrice: number;
  desiredMinProfit: number;
  desiredRoi: number;
  expectedHoldingPeriod: number;
  estimatedDaysToSell: number;
  salesCommission: number;
  advertisingCost: number;
  negotiationDiscount: number;
}

export interface FeeTier {
  minBid: number;
  maxBid: number | null;
  flat: number;
  percent: number;
}

export interface BuyerFeeConfig {
  kind: FeeKind;
  flat: number;
  percent: number;
  min: number;
  max: number | null;
  tiers: FeeTier[];
}

export interface AuctionFeeSchedule {
  id: string;
  name: string;
  auctionKey: string;
  sampleData: boolean;
  active: boolean;
  buyerFee: BuyerFeeConfig;
  internetFee: number;
  gateFee: number;
  titleFee: number;
  documentationFee: number;
  storageFee: number;
  latePaymentFee: number;
  taxTreatment: TaxTreatment;
  taxRate: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  kind: "dealership" | "storage" | "mechanic" | "body_shop" | "detail" | "other";
  zip: string;
  address: string;
}

export interface TransportationEstimate {
  id: string;
  worksheetId: string | null;
  pickupZip: string;
  deliveryZip: string;
  estimatedDistance: number;
  costPerMile: number;
  flatPickupCharge: number;
  inoperableSurcharge: number;
  enclosedSurcharge: number;
  urgentSurcharge: number;
  tollEstimate: number;
  carrierName: string;
  pickupStatus: TransportStatus;
  deliveryStatus: TransportStatus;
  notes: string;
}

export interface DecisionThresholds {
  comfortMarginPercent: number;
  cautionMarginPercent: number;
  minRoiPercent: number;
  minProfit: number;
  elevatedRiskScoreBelow: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: "buyer" | "manager" | "admin";
  avatarUrl: string;
}

export interface Dealership {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  defaultDestinationId: string;
  currency: string;
  taxRate: number;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: "buyer" | "manager" | "admin";
  status: "active" | "invited" | "placeholder";
}

export interface UserSettings {
  defaultDesiredProfit: number;
  defaultDesiredRoi: number;
  defaultRiskReserve: number;
  defaultTransportationRate: number;
  acquisitionBudget: number;
  decisionThresholds: DecisionThresholds;
  defaultFeeScheduleId: string;
}

export interface PurchaseActuals {
  winningBid: number;
  auctionFees: number;
  transportation: number;
  repairs: number;
  reconditioning: number;
  totalCost: number;
  listedPrice: number;
  soldPrice: number;
  saleDate: string | null;
}

export interface Purchase {
  id: string;
  worksheetId: string;
  status: PurchaseStatus;
  actuals: PurchaseActuals;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseStatusEvent {
  id: string;
  purchaseId: string;
  status: PurchaseStatus;
  at: string;
  note: string;
}

export interface ComparisonSet {
  id: string;
  worksheetIds: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  message: string;
  entityType: string;
  entityId: string;
}

export interface Worksheet {
  id: string;
  vehicle: VehicleInfo;
  conditionItems: ConditionItem[];
  values: VehicleValues;
  costs: AcquisitionCosts;
  profitTargets: ProfitTargets;
  assignedBuyer: string;
  status: WorksheetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  profile: UserProfile;
  dealership: Dealership;
  settings: UserSettings;
  team: TeamMember[];
  feeSchedules: AuctionFeeSchedule[];
  savedLocations: SavedLocation[];
  worksheets: Worksheet[];
  purchases: Purchase[];
  purchaseHistory: PurchaseStatusEvent[];
  transports: TransportationEstimate[];
  comparisons: ComparisonSet[];
  activity: ActivityLog[];
  watchlistIds: string[];
}
