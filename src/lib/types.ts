export type PageKey = "dashboard" | "inventory" | "staffDaily";

export type StaffActionRow = {
  rowNumber: number;
  Timestamp?: string;
  Mode?: string;
  Tower?: string;
  Crop?: string;
  Lbs?: number | string;
  LBS?: number | string;
  "Pods Changed"?: number | string;
  Status?: string;
  Stage?: string;
  Date?: string;
  "Scrap Type"?: string;
  Note?: string;
  timestamp?: string;
  mode?: string;
  tower?: string;
  crop?: string;
  lbs?: number | string;
  podsChanged?: number | string;
  status?: string;
  stage?: string;
  date?: string;
  scrapType?: string;
  note?: string;
};

export type SalesOrderRow = {
  rowNumber: number;
  Timestamp?: string;
  Customer?: string;
  Crop?: string;
  "Unit Type"?: string;
  "Quantity Needed"?: number | string;
  "Requested Delivery Date"?: string;
  "Available Qty"?: number | string;
  "Shortage Qty"?: number | string;
  "Towers Needed"?: number | string;
  "Pipeline Towers"?: number | string;
  "New Towers To Plant"?: number | string;
  "Estimated Ready Date"?: string;
  Feasible?: string;
  Notes?: string;
  Status?: string;
  "Order Type"?: string;
  Frequency?: string;
  "Contract Start Date"?: string;
  "Contract End Date"?: string;
  timestamp?: string;
  customer?: string;
  crop?: string;
  unitType?: string;
  quantityNeeded?: number | string;
  requestedDeliveryDate?: string;
  availableQty?: number | string;
  shortageQty?: number | string;
  towersNeeded?: number | string;
  pipelineTowers?: number | string;
  newTowersToPlant?: number | string;
  estimatedReadyDate?: string;
  feasible?: string;
  notes?: string;
  status?: string;
  orderType?: string;
  frequency?: string;
  contractStartDate?: string;
  contractEndDate?: string;
};

export type ProductionInventoryRow = {
  rowNumber: number;
  Timestamp?: string;
  Tower?: string;
  "Tower Type"?: string;
  "Max Pods"?: number | string;
  "Active Pods"?: number | string;
  Crop?: string;
  Stage?: string;
  "Seeded Date"?: string;
  "Transplant Date"?: string;
  "Estimated Ready Date"?: string;
  "Expected Lbs"?: number | string;
  "Remaining Expected Lbs"?: number | string;
  Status?: string;
  Notes?: string;
  timestamp?: string;
  tower?: string;
  towerType?: string;
  maxPods?: number | string;
  activePods?: number | string;
  crop?: string;
  stage?: string;
  seededDate?: string;
  transplantDate?: string;
  estimatedReadyDate?: string;
  expectedLbs?: number | string;
  remainingExpectedLbs?: number | string;
  status?: string;
  notes?: string;
};

export type OrderUnitType = "Lbs" | "Plants" | "6oz Bag" | "6oz Clamshell" | "0.75oz Small Bag";

export type SalesPlannerResult = {
  availableQty: number;
  shortageQty: number;
  towersNeeded: number;
  pipelineTowers: number;
  newTowersToPlant: number;
  estimatedReadyDate: string;
  deliveryFeasible: boolean;
  unitLabel: string;
  qtyNeededInLbs: number;
};

export type DraftOrderLine = {
  id: string;
  crop: string;
  unitType: OrderUnitType;
  quantityNeeded: string;
};

export type CropInventoryEntry = {
  towers: number;
  availableLbs: number;
  availablePlants: number;
  pipelineTowers: number;
  nextReadyDate: string;
  readyNowLbs: number;
  readyNowPlants: number;
  futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
};
