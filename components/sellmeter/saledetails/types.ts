import type { CalendarDate } from "@internationalized/date";
import type { KenyaRegion, CustomerType } from "@/lib/constants/locationData";

export interface UnitPrices {
  [key: string]: string;
}

// Referral info - either a registered user or a custom name
export interface ReferralInfo {
  userId?: string; // If selecting a registered user
  name: string; // Display name (for registered user or custom entry)
  isRegistered: boolean;
}

// Pickup info - who collected the meters
export interface PickupInfo {
  type: "customer" | "rider";
  name: string;
  contact: string;
}

export interface SaleDetails {
  destination: string;
  recipient: string;
  unitPrices: UnitPrices;
  customerType: CustomerType;
  customerRegion: KenyaRegion;
  customerCounty: string;
  customerContact: string;
  saleDate: CalendarDate;
  referral?: ReferralInfo; // Optional referral
  pickup?: PickupInfo; // Optional pickup info
}

export interface SaleDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SaleDetails) => void;
  initialData?: SaleDetails | null;
  meterTypes: string[];
  trigger?: React.ReactNode;
}

export type ReferralMode = "none" | "existing" | "manual";

export type PickupType = "customer" | "rider";
