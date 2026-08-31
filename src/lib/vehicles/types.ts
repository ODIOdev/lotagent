export interface DecodedVehicle {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  body_style?: string;
  drivetrain?: string;
  fuel?: string;
  transmission?: string;
  cylinders?: number;
  doors?: number;
  engine?: string;
}

export interface VehicleRecall {
  component?: string | null;
  summary?: string | null;
  consequence?: string | null;
  remedy?: string | null;
  campaign_number?: string | null;
  report_date?: string | null;
}

export interface VehicleLookup {
  vin?: string;
  vehicle?: DecodedVehicle;
  specifications?: Record<string, string>;
  market?: {
    currency?: string;
    estimateUsd?: number;
    tradeInUsd?: number;
    wholesaleUsd?: number;
    retailUsd?: number;
    medianApePct?: number;
    sample?: boolean;
    source?: "model" | "listings" | "depreciation";
  };
  photoUrl?: string;
  marketError?: string;
  recalls?: {
    count: number;
    items: VehicleRecall[];
  };
  error?: string;
}
