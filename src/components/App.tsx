import React, { useEffect, useMemo, useRef, useState } from "react";
import ContractBuilder from "./ContractBuilder";

type PageKey = "dashboard" | "inventory" | "staffDaily" | "contracts" | "staffBoard";

type StaffNote = {
  rowNumber: number;
  Timestamp?: string;
  Category?: string;
  Description?: string;
  "Assigned To"?: string;
  "Due Date"?: string;
  Status?: string;
};

type MaintenanceLog = {
  rowNumber: number;
  Timestamp?: string;
  Date?: string;
  Note?: string;
};

type StaffActionRow = {
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

type SalesOrderRow = {
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

type ProductionInventoryRow = {
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
  harvestType?: string;
  "Harvest Type"?: string;
};

type OrderUnitType = "Lbs" | "Plants" | "6oz Bag" | "6oz Clamshell" | "0.75oz Small Bag";

type StandingOrderItem = {
  id: string;
  crop: string;
  unitType: OrderUnitType;
  weeklyQty: number;
  active: boolean;
};

type FarmersMarketConfig = {
  enabled: boolean;
  seasonStart: number; // 1–12
  seasonEnd: number;   // 1–12
  manualPause: boolean;
  items: StandingOrderItem[];
};

type SalesPlannerResult = {
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

type DraftOrderLine = {
  id: string;
  crop: string;
  unitType: OrderUnitType;
  quantityNeeded: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

const SIX_OZ_IN_LBS = 6 / 16;
const SMALL_BAG_OZ_IN_LBS = 0.75 / 16;
const MAX_TRIMS = 5;
const TRIM_REGROWTH_DAYS = 21;
const FULL_TRAY_SEEDS = 88;   // one full tray → 2 Low Density towers
const HALF_TRAY_SEEDS = 44;   // one half tray → 1 Low Density tower

const DEFAULT_MARKET_CONFIG: FarmersMarketConfig = {
  enabled: true,
  seasonStart: 2,
  seasonEnd: 12,
  manualPause: false,
  items: [
    { id: "bh", crop: "Butterhead",   unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "ro", crop: "Romaine",       unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "ol", crop: "Oakleaf",       unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "mu", crop: "Muir",          unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "sc", crop: "Swiss Chard",   unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "pa", crop: "Parsley",       unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "ci", crop: "Cilantro",      unitType: "Plants",           weeklyQty: 0, active: true },
    { id: "su", crop: "Sunset Mix",    unitType: "6oz Clamshell",    weeklyQty: 0, active: true },
    { id: "sm", crop: "Salad Mix",     unitType: "6oz Clamshell",    weeklyQty: 0, active: true },
    { id: "hm", crop: "Harvest Mix",   unitType: "6oz Bag",          weeklyQty: 0, active: true },
    { id: "km", crop: "Kale Mix",      unitType: "6oz Bag",          weeklyQty: 0, active: true },
    { id: "ar", crop: "Arugula",       unitType: "6oz Bag",          weeklyQty: 0, active: true },
    { id: "ba", crop: "Basil",         unitType: "0.75oz Small Bag", weeklyQty: 0, active: true },
    { id: "mi", crop: "Mint",          unitType: "0.75oz Small Bag", weeklyQty: 0, active: true },
    { id: "di", crop: "Dill",          unitType: "0.75oz Small Bag", weeklyQty: 0, active: true },
  ],
};

const REPEAT_HARVEST_CROPS = new Set([
  "arugula", "basil", "thai_basil", "mint", "kale", "brassica",
  "red_mizuna", "green_mizuna", "swiss_chard", "dill", "five_star", "wildfire",
]);

// Salad mix recipes: crop key → array of { crop (normalized key), oz per clamshell }
const SALAD_MIX_RECIPES: Record<string, Array<{ crop: string; oz: number }>> = {
  sunset_mix: [
    { crop: "brassica", oz: 2 },
    { crop: "red_mizuna", oz: 1 },
    { crop: "green_mizuna", oz: 1 },
    { crop: "swiss_chard", oz: 1 },
    { crop: "oakleaf", oz: 1 },
  ],
  salad_mix: [
    { crop: "brassica", oz: 2 },
    { crop: "kale", oz: 1 },
    { crop: "mizuna", oz: 1 },
    { crop: "muir", oz: 2 },
  ],
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isContainerUnit = (unitType: string) => unitType === "6oz Bag" || unitType === "6oz Clamshell" || unitType === "0.75oz Small Bag";

const quantityToLbs = (unitType: string, quantity: number) => {
  if (unitType === "Plants") return 0;
  if (unitType === "0.75oz Small Bag") return Math.round(quantity * SMALL_BAG_OZ_IN_LBS * 100) / 100;
  if (isContainerUnit(unitType)) return Math.round(quantity * SIX_OZ_IN_LBS * 100) / 100;
  return Math.round(quantity * 100) / 100;
};

const availableLbsToUnitQty = (unitType: string, lbs: number, plants: number) => {
  if (unitType === "Plants") return Math.max(0, Math.floor(plants));
  if (unitType === "0.75oz Small Bag") return Math.max(0, Math.floor(lbs / SMALL_BAG_OZ_IN_LBS));
  if (isContainerUnit(unitType)) return Math.max(0, Math.floor(lbs / SIX_OZ_IN_LBS));
  return Math.max(0, Math.round(lbs * 100) / 100);
};

const getUnitLabel = (unitType: string) => {
  if (unitType === "Plants") return "Plants";
  if (unitType === "0.75oz Small Bag") return "Small Bags";
  if (unitType === "6oz Bag") return "Bags";
  if (unitType === "6oz Clamshell") return "Clamshells";
  return "Lbs";
};

const isRepeatHarvestCrop = (crop: string) => {
  const normalized = normalizeCropKey(crop);
  const canonical = cropAliases[normalized] || normalized;
  return REPEAT_HARVEST_CROPS.has(canonical);
};

const CROP_PROFILES: Record<
  string,
  {
    expectedLbsPerTower: number;
  }
> = {
  arugula: { expectedLbsPerTower: 1.76 },
  basil: { expectedLbsPerTower: 3.52 },
  thai_basil: { expectedLbsPerTower: 3.52 },
  butterhead: { expectedLbsPerTower: 3.52 },
  butterleaf: { expectedLbsPerTower: 3.52 },
  brassica: { expectedLbsPerTower: 3.52 },
  cilantro: { expectedLbsPerTower: 6.4 },
  dill: { expectedLbsPerTower: 3.52 },
  fennel: { expectedLbsPerTower: 3.52 },
  five_star: { expectedLbsPerTower: 5.5 },
  green_mizuna: { expectedLbsPerTower: 3.52 },
  red_mizuna: { expectedLbsPerTower: 3.52 },
  kale: { expectedLbsPerTower: 3.52 },
  lettuce_mix: { expectedLbsPerTower: 3.52 },
  mint: { expectedLbsPerTower: 3.52 },
  muir: { expectedLbsPerTower: 5.6 },
  oakleaf: { expectedLbsPerTower: 3.52 },
  parsley: { expectedLbsPerTower: 3.52 },
  romaine: { expectedLbsPerTower: 3.52 },
  swiss_chard: { expectedLbsPerTower: 3.52 },
  mizuna: { expectedLbsPerTower: 3.52 },
  wildfire: { expectedLbsPerTower: 5.5 },
  sunset_mix: { expectedLbsPerTower: 0 },
  salad_mix: { expectedLbsPerTower: 0 },
  harvest_mix: { expectedLbsPerTower: 0 },
  kale_mix: { expectedLbsPerTower: 0 },
};
const normalizeCropKey = (crop: string = "") =>
  crop
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/\s+/g, "_");

const cropAliases: Record<string, string> = {
  thaibasil: "thai_basil",
  thai_basil: "thai_basil",
  greenmizuna: "green_mizuna",
  green_mizuna: "green_mizuna",
  redmizuna: "red_mizuna",
  red_mizuna: "red_mizuna",
  lettucemix: "lettuce_mix",
  lettuce_mix: "lettuce_mix",
  fivestar: "five_star",
  five_star: "five_star",
  swisschard: "swiss_chard",
  swiss_chard: "swiss_chard",
  wild_fire: "wildfire",
  wildfire: "wildfire",
  oak_leaf: "oakleaf",
  oakleaf_lettuce: "oakleaf",
  butterleaf: "butterleaf",
  butterleaf_lettuce: "butterleaf",
  butter_leaf: "butterleaf",
  butter_lettuce: "butterleaf",
  butterhead_lettuce: "butterhead",
  bibb: "butterhead",
  bibb_lettuce: "butterhead",
  boston_lettuce: "butterhead",
  romaine_lettuce: "romaine",
  cos: "romaine",
  cos_lettuce: "romaine",
  harvest_mix: "harvest_mix",
  harvestmix: "harvest_mix",
  kale_mix: "kale_mix",
  kalemix: "kale_mix",
};
const validateTowerName = (tower: string): string => {
  if (!tower) return "";
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tower))
    return "Tower name must start with a letter (e.g. R1, A12). Did you use 0 (zero) instead of O (letter)?";
  return "";
};

const getCropProfile = (crop: string) => {
  const normalized = normalizeCropKey(crop);
  const aliasKey = cropAliases[normalized] || normalized;

  return (
    CROP_PROFILES[aliasKey] || {
      expectedLbsPerTower: 3.52,
    }
  );
};
const formatCropLabel = (crop: string) => {
  const normalized = normalizeCropKey(crop);
  const aliasKey = cropAliases[normalized] || normalized;

  return aliasKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
const getExpectedLbs = (crop: string) => {
  const profile = getCropProfile(crop);
  return profile ? profile.expectedLbsPerTower : "";
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeStatus = (status: string) => (status || "").trim().toLowerCase();

const formatDateInput = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateDisplay = (value: string | Date | null | undefined) => {
  if (!value) return "";
  // Date-only strings (YYYY-MM-DD) must be parsed as local midnight, not UTC midnight,
  // otherwise US timezones shift the date back by one day when displaying.
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value + "T00:00:00"
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatDateTimeDisplay = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const addDays = (dateString: string, days: number) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const printSection = (title: string, headers: string[], rows: string[][]) => {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const headerHtml = headers.map(h => `<th>${h}</th>`).join("");
  const rowsHtml = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
  ).join("");
  const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 20px; }
    h2 { margin: 0 0 4px 0; font-size: 16px; }
    .date { color: #555; font-size: 11px; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0f172a; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { button { display: none; } }
  </style></head><body>
    <h2>${title}</h2>
    <div class="date">${today}</div>
    <table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (date: Date) => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getTowerMaxPods = (towerType: string) => {
  
  return towerType === "High Density" ? 160 : 44;
};

const TOWER_ROW_ORDER = ["R", "O", "Y", "G", "B", "I", "V"];

const parseTowerForSort = (tower: string) => {
  const raw = (tower || "").trim().toUpperCase();

  const match = raw.match(/^([A-Z]+)\s*0*(\d+)?/);

  if (!match) {
    return {
      rowIndex: 999,
      towerNumber: 9999,
    };
  }

  const rowKey = match[1];
  const towerNumber = match[2] ? Number(match[2]) : 9999;

  return {
    rowIndex: TOWER_ROW_ORDER.indexOf(rowKey),
    towerNumber,
  };
};

const sortInventoryByTowerLayout = (a: any, b: any) => {
  const towerA = parseTowerForSort(getInventoryTower(a));
  const towerB = parseTowerForSort(getInventoryTower(b));

  if (towerA.rowIndex !== towerB.rowIndex) {
    return towerA.rowIndex - towerB.rowIndex;
  }

  return towerA.towerNumber - towerB.towerNumber;
};

const calculateExpectedLbs = (crop: string, activePods: number, towerType = "Low Density") => {
  const profile = getCropProfile(crop);
  const fullTowerPods = towerType === "High Density" ? 160 : 44;
  return Math.round(((activePods / fullTowerPods) * profile.expectedLbsPerTower) * 100) / 100;
};

const isDueTodayOrTomorrow = (dateString: string) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(todayOnly);
  tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);

  const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return targetOnly.getTime() === todayOnly.getTime() || targetOnly.getTime() === tomorrowOnly.getTime();
};

const isDueToday = (dateString: string) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
};

const isOverdue = (dateString: string) => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return targetOnly.getTime() < todayOnly.getTime();
};

const generateRecurringDates = (startDate: string, endDate: string, frequency: string) => {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDateInput(current));

    if (frequency === "Weekly") {
      current.setDate(current.getDate() + 7);
    } else if (frequency === "Bi-Weekly") {
      current.setDate(current.getDate() + 14);
    } else if (frequency === "Monthly") {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
  }

  return dates;
};

async function postToBackend(payload: Record<string, unknown>) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

const getStaffMode = (row: StaffActionRow) => row.mode || row.Mode || "";
const getStaffTower = (row: StaffActionRow) => row.tower || row.Tower || "";
const getStaffCrop = (row: StaffActionRow) => row.crop || row.Crop || "";
const getStaffLbs = (row: StaffActionRow) => row.lbs ?? row.Lbs ?? row.LBS ?? "";
const getStaffPodsChanged = (row: StaffActionRow) => row.podsChanged ?? row["Pods Changed"] ?? 0;
const getStaffNote = (row: StaffActionRow) => row.note || row.Note || "";
const getStaffTimestamp = (row: StaffActionRow) => row.timestamp || row.Timestamp || "";
const getStaffDate = (row: StaffActionRow) => row.date || row.Date || "";

const getOrderCustomer = (row: SalesOrderRow) => row.customer || row.Customer || "";
const getOrderCrop = (row: SalesOrderRow) => row.crop || row.Crop || "";
const getOrderUnitType = (row: SalesOrderRow) => row.unitType || row["Unit Type"] || "Lbs";
const getOrderQuantityNeeded = (row: SalesOrderRow) => row.quantityNeeded ?? row["Quantity Needed"] ?? 0;
const getOrderRequestedDeliveryDate = (row: SalesOrderRow) =>
  row.requestedDeliveryDate || row["Requested Delivery Date"] || "";
const getOrderPipelineTowers = (row: SalesOrderRow) => row.pipelineTowers ?? row["Pipeline Towers"] ?? 0;
const getOrderNewTowersToPlant = (row: SalesOrderRow) => row.newTowersToPlant ?? row["New Towers To Plant"] ?? 0;
const getOrderEstimatedReadyDate = (row: SalesOrderRow) =>
  row.estimatedReadyDate || row["Estimated Ready Date"] || "";
const getOrderStatus = (row: SalesOrderRow) => row.status || row.Status || "";
const getOrderType = (row: SalesOrderRow) => row.orderType || row["Order Type"] || "One-Time";
const getOrderFrequency = (row: SalesOrderRow) => row.frequency || row.Frequency || "";

const getInventoryTower = (row: ProductionInventoryRow) => row.tower || row.Tower || "";
const getInventoryTowerType = (row: ProductionInventoryRow) => row.towerType || row["Tower Type"] || "Low Density";
const getInventoryMaxPods = (row: ProductionInventoryRow) =>
  row.maxPods ?? row["Max Pods"] ?? getTowerMaxPods(getInventoryTowerType(row));
const getInventoryActivePods = (row: ProductionInventoryRow) =>
  row.activePods ?? row["Active Pods"] ?? getInventoryMaxPods(row);
const getInventoryCrop = (row: ProductionInventoryRow) => row.crop || row.Crop || "";
const getInventoryStage = (row: ProductionInventoryRow) => row.stage || row.Stage || "";
const getInventorySeededDate = (row: ProductionInventoryRow) => row.seededDate || row["Seeded Date"] || "";
const getInventoryTransplantDate = (row: ProductionInventoryRow) => row.transplantDate || row["Transplant Date"] || "";
const getInventoryEstimatedReadyDate = (row: ProductionInventoryRow) =>
  row.estimatedReadyDate || row["Estimated Ready Date"] || "";

const getInventoryEffectiveReadyDate = (row: ProductionInventoryRow) => {
  const explicitReadyDate = formatDateInput(getInventoryEstimatedReadyDate(row));
  if (explicitReadyDate) return explicitReadyDate;

  const seededDate = formatDateInput(getInventorySeededDate(row));
  if (seededDate) return addDays(seededDate, 42);

  return "";
};

const getInventoryExpectedLbs = (row: ProductionInventoryRow) => {
  const stored = row.expectedLbs ?? row["Expected Lbs"];
  if (stored !== "" && stored !== null && stored !== undefined) {
    return stored;
  }

  return calculateExpectedLbs(
    getInventoryCrop(row),
    toNumber(getInventoryActivePods(row)),
    getInventoryTowerType(row)
  );
};

const getInventoryRemainingExpectedLbs = (row: ProductionInventoryRow) => {
  const stored = row.remainingExpectedLbs ?? row["Remaining Expected Lbs"];
  if (stored !== "" && stored !== null && stored !== undefined) {
    return stored;
  }

  const expected = row.expectedLbs ?? row["Expected Lbs"];
  if (expected !== "" && expected !== null && expected !== undefined) {
    return expected;
  }

  return calculateExpectedLbs(
    getInventoryCrop(row),
    toNumber(getInventoryActivePods(row)),
    getInventoryTowerType(row)
  );
};

const getInventoryStatus = (row: ProductionInventoryRow) => row.status || row.Status || "";
const getInventoryNotes = (row: ProductionInventoryRow) => row.notes || row.Notes || "";
const getInventoryTrimCount = (row: ProductionInventoryRow): number | string =>
  (row as any).trimCount ?? (row as any)["Trim Count"] ?? 0;

const getInventoryHarvestType = (row: ProductionInventoryRow): string =>
  row.harvestType || row["Harvest Type"] || "";

const getEffectiveHarvestType = (row: ProductionInventoryRow): "Full Harvest" | "Trim Harvest" => {
  const cropName = getInventoryCrop(row);
  if (!isRepeatHarvestCrop(cropName)) return "Full Harvest";
  const stored = getInventoryHarvestType(row);
  if (stored === "Full Harvest") return "Full Harvest";
  return "Trim Harvest";
};

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [loadingData, setLoadingData] = useState(false);

  const [staffRows, setStaffRows] = useState<StaffActionRow[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderRow[]>([]);
  const [productionInventory, setProductionInventory] = useState<ProductionInventoryRow[]>([]);
  const [staffNotes, setStaffNotes] = useState<StaffNote[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  // Staff Board form state
  const [noteCategory, setNoteCategory] = useState<"Equipment" | "Purchase">("Equipment");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteAssignedTo, setNoteAssignedTo] = useState("");
  const [noteDueDate, setNoteDueDate] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [editingNoteRow, setEditingNoteRow] = useState<number | null>(null);
  const [editNoteStatus, setEditNoteStatus] = useState("");
  const [editNoteAssignedTo, setEditNoteAssignedTo] = useState("");
  const [editNoteSaving, setEditNoteSaving] = useState(false);

  // Maintenance log form state
  const [maintDate, setMaintDate] = useState(formatDateInput(new Date()));
  const [maintNote, setMaintNote] = useState("");
  const [maintSaving, setMaintSaving] = useState(false);
  const [maintMessage, setMaintMessage] = useState("");

  const [message, setMessage] = useState("");

  // Quick Action form
  const [mode, setMode] = useState("Harvest");
  const [tower, setTower] = useState("");
  const [crop, setCrop] = useState("");
  const [quickTrayType, setQuickTrayType] = useState<"Full Tray" | "Half Tray">("Full Tray");
  const [quickTrayCount, setQuickTrayCount] = useState("1");
  const [lbs, setLbs] = useState("");
  const [podsChanged, setPodsChanged] = useState("");
  const [entryStatus, setEntryStatus] = useState("");
  const [stage, setStage] = useState("");
  const [entryDate, setEntryDate] = useState(formatDateInput(new Date()));
  const [scrapType, setScrapType] = useState("");
  const [note, setNote] = useState("");

  // Filters
  const [filterMode, setFilterMode] = useState("All");
  const [filterCrop, setFilterCrop] = useState("All");
  const [filterTower, setFilterTower] = useState("All");

  // Sales Planner / Orders
  const [salesCustomer, setSalesCustomer] = useState("");
  const [draftOrderLines, setDraftOrderLines] = useState<DraftOrderLine[]>(() => [
    { id: makeId(), crop: "", unitType: "Lbs" as OrderUnitType, quantityNeeded: "" },
  ]);
  const [editingSalesOrderRowNumber, setEditingSalesOrderRowNumber] = useState<number | null>(null);
  const [salesDeliveryDate, setSalesDeliveryDate] = useState("");
  const [salesNotes, setSalesNotes] = useState("");
  const [salesSaveMessage, setSalesSaveMessage] = useState("");
  const [salesSaving, setSalesSaving] = useState(false);
  const saveOrderInProgress = useRef(false);
  const [salesOrderType, setSalesOrderType] = useState<"One-Time" | "Contract">("One-Time");
  const [salesFrequency, setSalesFrequency] = useState("Weekly");
  const [salesContractStartDate, setSalesContractStartDate] = useState("");
  const [salesContractEndDate, setSalesContractEndDate] = useState("");

  const [savedOrderStatusFilter, setSavedOrderStatusFilter] = useState("All");
  const [savedOrderCropFilter, setSavedOrderCropFilter] = useState("All");
  const [savedOrderCustomerFilter, setSavedOrderCustomerFilter] = useState("All");
  const [savedOrderDueFilter, setSavedOrderDueFilter] = useState<"All" | "Current Week">("All");
  const [expandedSavedOrderGroups, setExpandedSavedOrderGroups] = useState<Record<string, boolean>>({});

  // Production Inventory form
  const [inventoryTower, setInventoryTower] = useState("");
  const [inventoryTowerType, setInventoryTowerType] = useState("Low Density");
  const [inventoryMaxPods, setInventoryMaxPods] = useState(String(getTowerMaxPods("Low Density")));
  const [inventoryActivePods, setInventoryActivePods] = useState(String(getTowerMaxPods("Low Density")));
  const [inventoryCrop, setInventoryCrop] = useState("");
  const [inventoryStage, setInventoryStage] = useState("Growing");
  const [inventorySeededDate, setInventorySeededDate] = useState("");
  const [inventoryTransplantDate, setInventoryTransplantDate] = useState("");
  const [inventoryEstimatedReadyDate, setInventoryEstimatedReadyDate] = useState("");
  const [inventoryHarvestType, setInventoryHarvestType] = useState("");
  const [inventoryExpectedLbs, setInventoryExpectedLbs] = useState("");
  const [inventoryRemainingExpectedLbs, setInventoryRemainingExpectedLbs] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("Active");
  const [inventoryNotes, setInventoryNotes] = useState("");
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [inventorySaving, setInventorySaving] = useState(false);

  // Inventory adjustment
  const [adjustInventoryRow, setAdjustInventoryRow] = useState("");
  const [adjustMode, setAdjustMode] = useState<"Harvest" | "Scrapped">("Harvest");
  const [adjustPods, setAdjustPods] = useState("");
  const [adjustLbs, setAdjustLbs] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustScrapType, setAdjustScrapType] = useState("");
  const [adjustMessage, setAdjustMessage] = useState("");

  // Edit inventory
  const [editingInventoryRowNumber, setEditingInventoryRowNumber] = useState("");
  const [editInventoryTower, setEditInventoryTower] = useState("");
  const [editInventoryTowerType, setEditInventoryTowerType] = useState("Low Density");
  const [editInventoryMaxPods, setEditInventoryMaxPods] = useState("");
  const [editInventoryActivePods, setEditInventoryActivePods] = useState("");
  const [editInventoryCrop, setEditInventoryCrop] = useState("");
  const [editInventoryStage, setEditInventoryStage] = useState("Growing");
  const [editInventorySeededDate, setEditInventorySeededDate] = useState("");
  const [editInventoryTransplantDate, setEditInventoryTransplantDate] = useState("");
  const [editInventoryEstimatedReadyDate, setEditInventoryEstimatedReadyDate] = useState("");
  const [editInventoryHarvestType, setEditInventoryHarvestType] = useState("");
  const [editInventoryExpectedLbs, setEditInventoryExpectedLbs] = useState("");
  const [editInventoryRemainingExpectedLbs, setEditInventoryRemainingExpectedLbs] = useState("");
  const [editInventoryStatus, setEditInventoryStatus] = useState("Active");
  const [editInventoryNotes, setEditInventoryNotes] = useState("");
  const [editInventoryMessage, setEditInventoryMessage] = useState("");
  const [editInventorySaving, setEditInventorySaving] = useState(false);

  // Staff Daily action helpers
  const [dailyMessage, setDailyMessage] = useState("");
  const [plantingTrayType, setPlantingTrayType] = useState<Record<string, "Full Tray" | "Half Tray">>({});
  const [plantingTrayCount, setPlantingTrayCount] = useState<Record<string, string>>({});
  const [plantedDates, setPlantedDates] = useState<Record<string, string>>({});
  const [activeHarvestRowNumber, setActiveHarvestRowNumber] = useState("");
  const [harvestActionType, setHarvestActionType] = useState<"Full Harvest" | "Trim Harvest">("Full Harvest");
  const [harvestPodsValue, setHarvestPodsValue] = useState("");
  const [harvestOutputUnit, setHarvestOutputUnit] = useState<OrderUnitType>("Lbs");
  const [harvestOutputQty, setHarvestOutputQty] = useState("");
  const [harvestNote, setHarvestNote] = useState("");

  // Quick Harvest panel
  const [qhRowNumber, setQhRowNumber] = useState("");
  const [qhType, setQhType] = useState<"Full Harvest" | "Trim Harvest" | "Scrap" | null>(null);
  const [qhQty, setQhQty] = useState("");
  const [qhUnit, setQhUnit] = useState<OrderUnitType>("Lbs");
  const [qhPods, setQhPods] = useState("");
  const [qhNote, setQhNote] = useState("");
  const [qhScrapReason, setQhScrapReason] = useState("");
  const [qhOrderRowNumber, setQhOrderRowNumber] = useState("");
  const [qhMessage, setQhMessage] = useState("");
  const [qhSaving, setQhSaving] = useState(false);
  const [staffLookupCrop, setStaffLookupCrop] = useState("");
  const [quickEntryUnitType, setQuickEntryUnitType] = useState<OrderUnitType>("Lbs");
  const [seedScheduleFilter, setSeedScheduleFilter] = useState<"Today" | "This Week" | "This Month" | "3 Months">("Today");
  const [dismissedSeedTasks, setDismissedSeedTasks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("dismissedSeedTasks");
      if (saved) return new Set<string>(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set<string>();
  });
  const [seededEditRowNumber, setSeededEditRowNumber] = useState<number | null>(null);
  const [seededEditTower, setSeededEditTower] = useState("");
  const [seededEditSeededDate, setSeededEditSeededDate] = useState("");
  const [seededEditCrop, setSeededEditCrop] = useState("");
  const [seededEditActivePods, setSeededEditActivePods] = useState("");
  const [seededEditMessage, setSeededEditMessage] = useState("");
  const [seededEditSaving, setSeededEditSaving] = useState(false);
  const [seededTransplantRowNumber, setSeededTransplantRowNumber] = useState<number | null>(null);
  const [seededTransplantTower, setSeededTransplantTower] = useState("");
  const [seededTransplantTowerType, setSeededTransplantTowerType] = useState("Low Density");
  const [seededTransplantDate, setSeededTransplantDate] = useState(formatDateInput(new Date()));
  const [seededTransplantMessage, setSeededTransplantMessage] = useState("");
  const [seededTransplantSaving, setSeededTransplantSaving] = useState(false);

  const [marketConfig, setMarketConfig] = useState<FarmersMarketConfig>(() => {
    try {
      const saved = localStorage.getItem("farmersMarketConfig");
      if (saved) return { ...DEFAULT_MARKET_CONFIG, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return DEFAULT_MARKET_CONFIG;
  });
  const [showMarketSettings, setShowMarketSettings] = useState(false);
  const [marketConfigSaveStatus, setMarketConfigSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Staff action correction
  const [editingStaffRow, setEditingStaffRow] = useState<StaffActionRow | null>(null);
  const [editLbs, setEditLbs] = useState("");
  const [editPods, setEditPods] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editUndoConfirm, setEditUndoConfirm] = useState(false);

  // Transplant form
  const [transplantRowNumber, setTransplantRowNumber] = useState("");
  const [transplantTower, setTransplantTower] = useState("");
  const [transplantTowerType, setTransplantTowerType] = useState("Low Density");
  const [transplantMaxPods, setTransplantMaxPods] = useState(String(getTowerMaxPods("Low Density")));
  const [transplantActivePods, setTransplantActivePods] = useState(String(getTowerMaxPods("Low Density")));
  const [transplantDate, setTransplantDate] = useState(formatDateInput(new Date()));
  const [transplantReadyDate, setTransplantReadyDate] = useState(addDays(formatDateInput(new Date()), 21));
  const [transplantNotes, setTransplantNotes] = useState("");

  // Manual add seeded tray
  const [addTrayTower, setAddTrayTower] = useState("");
  const [addTrayCrop, setAddTrayCrop] = useState("");
  const [addTrayType, setAddTrayType] = useState<"Full Tray" | "Half Tray">("Full Tray");
  const [addTrayDate, setAddTrayDate] = useState(formatDateInput(new Date()));
  const [addTraySaving, setAddTraySaving] = useState(false);
  const [addTrayMessage, setAddTrayMessage] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const saveMarketConfig = async (config: FarmersMarketConfig) => {
    setMarketConfigSaveStatus("saving");
    try { localStorage.setItem("farmersMarketConfig", JSON.stringify(config)); } catch { /* ignore */ }
    try {
      const result = await postToBackend({ action: "saveMarketConfig", config });
      setMarketConfigSaveStatus(result.ok ? "saved" : "error");
    } catch {
      setMarketConfigSaveStatus("saved");
    }
    setTimeout(() => setMarketConfigSaveStatus("idle"), 3000);
  };

  useEffect(() => {
    const max = getTowerMaxPods(inventoryTowerType);
    setInventoryMaxPods(String(max));
    if (!inventoryActivePods || Number(inventoryActivePods) > max) {
      setInventoryActivePods(String(max));
    }
  }, [inventoryTowerType]);

  useEffect(() => {
    if (inventoryCrop) {
     const expected = calculateExpectedLbs(
  inventoryCrop,
  toNumber(inventoryActivePods),
  inventoryTowerType
);
      setInventoryExpectedLbs(String(expected));
      setInventoryRemainingExpectedLbs(String(expected));
    }
 }, [inventoryCrop, inventoryActivePods, inventoryTowerType]);

  useEffect(() => {
    if (inventorySeededDate && !inventoryEstimatedReadyDate) {
      setInventoryEstimatedReadyDate(addDays(inventorySeededDate, 42));
    }
  }, [inventorySeededDate, inventoryEstimatedReadyDate]);

  useEffect(() => {
    if (editInventorySeededDate && !editInventoryEstimatedReadyDate) {
      setEditInventoryEstimatedReadyDate(addDays(editInventorySeededDate, 42));
    }
  }, [editInventorySeededDate, editInventoryEstimatedReadyDate]);

  useEffect(() => {
    const max = getTowerMaxPods(transplantTowerType);
    setTransplantMaxPods(String(max));
    if (!transplantActivePods || Number(transplantActivePods) > max) {
      setTransplantActivePods(String(max));
    }
  }, [transplantTowerType]);

  const loadStaffActions = async () => {
    const result = await postToBackend({ action: "getStaffActions" });
    if (result.ok) {
      setStaffRows(Array.isArray(result.rows) ? result.rows : []);
    } else {
      console.error("Failed to load staff actions:", result.message);
      setStaffRows([]);
    }
  };

  const loadSalesOrders = async () => {
    const result = await postToBackend({ action: "getSalesOrders" });
    if (result.ok) {
      setSalesOrders(Array.isArray(result.rows) ? result.rows : []);
    } else {
      console.error("Failed to load sales orders:", result.message);
      setSalesOrders([]);
    }
  };

  const loadProductionInventory = async () => {
    const result = await postToBackend({ action: "getProductionInventory" });
    if (result.ok) {
      setProductionInventory(Array.isArray(result.rows) ? result.rows : []);
    } else {
      console.error("Failed to load production inventory:", result.message);
      setProductionInventory([]);
    }
  };

  const loadMarketConfig = async () => {
    try {
      const result = await postToBackend({ action: "getMarketConfig" });
      if (result.ok && result.rows && Array.isArray(result.rows) && result.rows.length > 0) {
        const remote = result.rows[0] as FarmersMarketConfig;
        setMarketConfig({ ...DEFAULT_MARKET_CONFIG, ...remote });
        try { localStorage.setItem("farmersMarketConfig", JSON.stringify(remote)); } catch { /* ignore */ }
      }
    } catch { /* backend may not support this yet — localStorage already loaded */ }
  };

  const loadStaffNotes = async () => {
    const result = await postToBackend({ action: "loadStaffNotes" });
    if (result.ok) setStaffNotes(Array.isArray(result.rows) ? result.rows : []);
  };

  const loadMaintenanceLogs = async () => {
    const result = await postToBackend({ action: "loadMaintenanceLogs" });
    if (result.ok) setMaintenanceLogs(Array.isArray(result.rows) ? result.rows : []);
  };

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([loadStaffActions(), loadSalesOrders(), loadProductionInventory(), loadMarketConfig(), loadStaffNotes(), loadMaintenanceLogs()]);
    } catch (error) {
      console.error("loadAllData error:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const activeInventory = useMemo(
    () =>
      productionInventory.filter((item) => {
        const status = normalizeStatus(getInventoryStatus(item));
        return status !== "harvested" && status !== "lost" && status !== "scrapped" && status !== "closed";
      }),
    [productionInventory]
  );

  const inventoryByCrop = useMemo(() => {
    const map = new Map<
      string,
      {
        towers: number;
        availableLbs: number;
        availablePlants: number;
        podsInTowers: number;
        pipelineTowers: number;
        nextReadyDate: string;
        lastReadyDate: string;
        readyNowLbs: number;
        readyNowPlants: number;
        futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
      }
    >();

    const today = formatDateInput(new Date());

    activeInventory.forEach((item) => {
      const cropName = (getInventoryCrop(item) || "").trim();
      if (!cropName) return;

      const current = map.get(cropName) || {
        towers: 0,
        availableLbs: 0,
        availablePlants: 0,
        podsInTowers: 0,
        pipelineTowers: 0,
        nextReadyDate: "",
        lastReadyDate: "",
        readyNowLbs: 0,
        readyNowPlants: 0,
        futureEntries: [],
      };

      const remainingLbs = toNumber(getInventoryRemainingExpectedLbs(item));
      const activePods = toNumber(getInventoryActivePods(item));
      const itemStatus = normalizeStatus(getInventoryStatus(item));
      const itemStage = normalizeStatus(getInventoryStage(item));
      const readyDate = getInventoryEffectiveReadyDate(item);
      const readyNow = !!readyDate && readyDate <= today && ["transplanted", "growing", "ready"].includes(itemStage);

      current.towers += 1;
      current.availableLbs += remainingLbs;
      current.availablePlants += activePods;
      if (itemStage !== "seeded") current.podsInTowers += activePods;

      if (
        itemStatus === "active" ||
        itemStage === "growing" ||
        itemStage === "transplanted" ||
        itemStage === "ready" ||
        itemStage === "seeded"
      ) {
        current.pipelineTowers += 1;
      }

      const harvestType = getEffectiveHarvestType(item);
      const isTrimHarvest = harvestType === "Trim Harvest";
      const trimCount = toNumber(getInventoryTrimCount(item));
      const remainingTrimCycles = Math.max(0, MAX_TRIMS - trimCount - 1);
      const lbsPerCycle = toNumber(getInventoryExpectedLbs(item)) || remainingLbs;

      if (readyNow) {
        current.readyNowLbs += remainingLbs;
        current.readyNowPlants += activePods;
        if (isTrimHarvest && remainingTrimCycles > 0) {
          for (let i = 1; i <= remainingTrimCycles; i++) {
            current.futureEntries.push({
              readyDate: addDays(today, i * TRIM_REGROWTH_DAYS),
              lbs: lbsPerCycle,
              plants: activePods,
            });
          }
        }
      } else if (readyDate) {
        current.futureEntries.push({ readyDate, lbs: remainingLbs, plants: activePods });
        if (isTrimHarvest && remainingTrimCycles > 0) {
          for (let i = 1; i <= remainingTrimCycles; i++) {
            current.futureEntries.push({
              readyDate: addDays(readyDate, i * TRIM_REGROWTH_DAYS),
              lbs: lbsPerCycle,
              plants: activePods,
            });
          }
        }
      }

      if (readyDate) {
        if (!current.nextReadyDate || new Date(readyDate) < new Date(current.nextReadyDate)) {
          current.nextReadyDate = formatDateInput(readyDate);
        }
        if (!current.lastReadyDate || new Date(readyDate) > new Date(current.lastReadyDate)) {
          current.lastReadyDate = formatDateInput(readyDate);
        }
      }

      map.set(cropName, current);
    });

    for (const value of map.values()) {
      value.futureEntries.sort((a, b) => new Date(a.readyDate).getTime() - new Date(b.readyDate).getTime());
    }

    return map;
  }, [activeInventory]);

  const salesPlanner: SalesPlannerResult = useMemo(() => {
    const activeLine = draftOrderLines.find((l) => l.crop) || draftOrderLines[0];
    const qtyNeeded = toNumber(activeLine?.quantityNeeded || "");
    const cropName = (activeLine?.crop || "").trim();
    const plannerUnitType: OrderUnitType = activeLine?.unitType || "Lbs";
    const cropInventory = inventoryByCrop.get(cropName);
    const targetDate = salesOrderType === "Contract" ? salesContractStartDate : salesDeliveryDate;

    const committedSameCropLbs = salesOrders.reduce((sum, order) => {
      if (editingSalesOrderRowNumber && order.rowNumber === editingSalesOrderRowNumber) return sum;
      if ((getOrderCrop(order) || "").trim() !== cropName) return sum;
      const dueDate = getOrderRequestedDeliveryDate(order);
      const orderStatus = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "packed"].includes(orderStatus)) return sum;
      if (!dueDate || !targetDate || dueDate > targetDate) return sum;
      return sum + quantityToLbs(getOrderUnitType(order), toNumber(getOrderQuantityNeeded(order)));
    }, 0);

    const readyNowLbs = Math.max(0, (cropInventory?.readyNowLbs || 0) - committedSameCropLbs);
    const readyNowPlants = Math.max(0, (cropInventory?.readyNowPlants || 0) - committedSameCropLbs * 16 / 6);
    const availableQty = availableLbsToUnitQty(plannerUnitType, readyNowLbs, readyNowPlants);
    const shortageQty = Math.max(0, qtyNeeded - availableQty);

    const qtyNeededInLbs = quantityToLbs(plannerUnitType, qtyNeeded);
    const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));
    const towersNeeded = qtyNeededInLbs > 0 ? Math.ceil(qtyNeededInLbs / avgQtyPerTower) : 0;
    const pipelineTowers = cropInventory ? cropInventory.pipelineTowers : 0;
    const newTowersToPlant = Math.max(0, towersNeeded - pipelineTowers);

    let estimatedReadyDate = "";
    if (qtyNeeded > 0 && shortageQty > 0 && cropInventory) {
      let runningLbs = readyNowLbs;
      for (const entry of cropInventory.futureEntries) {
        runningLbs += entry.lbs;
        if (runningLbs >= qtyNeededInLbs) {
          estimatedReadyDate = entry.readyDate;
          break;
        }
      }
    }

    if (!estimatedReadyDate && shortageQty > 0) {
      estimatedReadyDate = addDays(formatDateInput(new Date()), 42);
    }

    const deliveryFeasible = qtyNeeded > 0 && (shortageQty === 0 || (!!targetDate && !!estimatedReadyDate && new Date(estimatedReadyDate).getTime() <= new Date(targetDate).getTime()));

    return {
      availableQty,
      shortageQty,
      towersNeeded,
      pipelineTowers,
      newTowersToPlant,
      estimatedReadyDate: shortageQty === 0 ? "" : estimatedReadyDate,
      deliveryFeasible,
      unitLabel: getUnitLabel(plannerUnitType),
      qtyNeededInLbs,
    };
  }, [
    draftOrderLines,
    salesDeliveryDate,
    inventoryByCrop,
    salesOrderType,
    salesContractStartDate,
    salesOrders,
    editingSalesOrderRowNumber,
  ]);

  const filteredRecentActivity = useMemo(() => {
    return staffRows
      .filter((row) => (filterMode === "All" ? true : getStaffMode(row) === filterMode))
      .filter((row) => (filterCrop === "All" ? true : getStaffCrop(row) === filterCrop))
      .filter((row) => (filterTower === "All" ? true : getStaffTower(row) === filterTower))
      .sort((a, b) => new Date(getStaffTimestamp(b)).getTime() - new Date(getStaffTimestamp(a)).getTime());
  }, [staffRows, filterMode, filterCrop, filterTower]);

  const filteredSavedOrders = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = getEndOfWeek(now);

    return salesOrders
      .filter((row) => {
        const status = normalizeStatus(getOrderStatus(row));
        return !["completed", "cancelled", "harvested"].includes(status);
      })
      .filter((row) => (savedOrderStatusFilter === "All" ? true : getOrderStatus(row) === savedOrderStatusFilter))
      .filter((row) => (savedOrderCropFilter === "All" ? true : getOrderCrop(row) === savedOrderCropFilter))
      .filter((row) => (savedOrderCustomerFilter === "All" ? true : getOrderCustomer(row) === savedOrderCustomerFilter))
      .filter((row) => {
        if (savedOrderDueFilter !== "Current Week") return true;
        const dueDate = getOrderRequestedDeliveryDate(row);
        if (!dueDate) return false;
        const due = new Date(dueDate);
        return due >= weekStart && due <= weekEnd;
      })
      .sort((a, b) => new Date(getOrderRequestedDeliveryDate(a)).getTime() - new Date(getOrderRequestedDeliveryDate(b)).getTime());
  }, [salesOrders, savedOrderStatusFilter, savedOrderCropFilter, savedOrderCustomerFilter, savedOrderDueFilter]);


  const groupedSavedOrders = useMemo(() => {
    const groups = new Map<string, { key: string; customer: string; dueDate: string; status: string; cropSummary: string; isOverdue: boolean; items: SalesOrderRow[]; totalNewTowers: number }>();

    filteredSavedOrders.forEach((order) => {
      const customer = getOrderCustomer(order) || "Unknown Customer";
      const dueDate = getOrderRequestedDeliveryDate(order) || "";
      const key = `${customer}__${dueDate}`;
      const current = groups.get(key) || {
        key,
        customer,
        dueDate,
        status: getOrderStatus(order) || "Planned",
        cropSummary: "",
        isOverdue: isOverdue(dueDate),
        items: [],
        totalNewTowers: 0,
      };
      current.items.push(order);
      current.totalNewTowers += toNumber(getOrderNewTowersToPlant(order));
      groups.set(key, current);
    });

    const result = Array.from(groups.values()).sort((a, b) => new Date(a.dueDate || "2100-01-01").getTime() - new Date(b.dueDate || "2100-01-01").getTime());
    result.forEach((g) => {
      g.cropSummary = g.items.map((o) => `${getOrderCrop(o)} ×${getOrderQuantityNeeded(o)}`).join(", ");
    });
    return result;
  }, [filteredSavedOrders]);

 const seededInventory = useMemo(() => {
  return activeInventory
    .filter((item) => normalizeStatus(getInventoryStage(item)) === "seeded")
    .sort(
      (a, b) =>
        new Date(getInventorySeededDate(a) || "2100-01-01").getTime() -
        new Date(getInventorySeededDate(b) || "2100-01-01").getTime()
    );
}, [activeInventory]);

const emptyTowers = useMemo(() =>
  activeInventory
    .filter((item) => normalizeStatus(getInventoryStage(item)) === "empty" && !!getInventoryTower(item))
    .slice()
    .sort(sortInventoryByTowerLayout),
  [activeInventory]);

const transplantTodayTasks = useMemo(() => {
  return activeInventory
    .filter((item) => normalizeStatus(getInventoryStage(item)) === "seeded")
    .sort(
      (a, b) =>
        new Date(getInventorySeededDate(a) || "2100-01-01").getTime() -
        new Date(getInventorySeededDate(b) || "2100-01-01").getTime()
    );
}, [activeInventory]);

const openOrders = useMemo(() => {
  return salesOrders
    .filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      return !["completed", "cancelled", "packed"].includes(status);
    })
    .sort(
      (a, b) =>
        new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
        new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
    );
}, [salesOrders]);

const plantTodayTasks = useMemo(() => {
  const cropPools = new Map<
    string,
    {
      readyLbs: number;
      readyPlants: number;
      futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
    }
  >();

  const today = formatDateInput(new Date());

  // Trim/repeat-harvest crops: lbs-based, pool from aggregated inventoryByCrop
  for (const [cropName, cropInventory] of inventoryByCrop.entries()) {
    const ck = cropAliases[normalizeCropKey(cropName)] || normalizeCropKey(cropName);
    if (!isRepeatHarvestCrop(ck)) continue;
    const existing = cropPools.get(ck);
    if (existing) {
      existing.readyLbs += cropInventory.readyNowLbs;
      existing.readyPlants += cropInventory.readyNowPlants;
      existing.futureEntries.push(...cropInventory.futureEntries.map(e => ({ ...e })));
    } else {
      cropPools.set(ck, {
        readyLbs: cropInventory.readyNowLbs,
        readyPlants: cropInventory.readyNowPlants,
        futureEntries: cropInventory.futureEntries.map(e => ({ ...e })),
      });
    }
  }

  // Full-harvest crops (whole heads): build from individual towers so we can
  // apply a 2-week freshness window — heads go bad quickly once ready.
  // Each tower becomes its own future entry keyed by when it becomes ready.
  for (const item of activeInventory) {
    const rawCropName = (getInventoryCrop(item) || "").trim();
    if (!rawCropName) continue;
    const ck = cropAliases[normalizeCropKey(rawCropName)] || normalizeCropKey(rawCropName);
    if (isRepeatHarvestCrop(ck)) continue;
    const stage = normalizeStatus(getInventoryStage(item));
    if (!["seeded", "transplanted", "growing", "ready"].includes(stage)) continue;
    const activePods = toNumber(getInventoryActivePods(item));
    const remainingLbs = toNumber(getInventoryRemainingExpectedLbs(item));
    if (activePods <= 0) continue;
    const readyDate = getInventoryEffectiveReadyDate(item);
    if (!readyDate) continue; // seeded items without a ready date can't satisfy demand
    // Already-past-ready towers count as available starting today
    const effectiveDate = readyDate <= today ? today : readyDate;
    const pool = cropPools.get(ck) || { readyLbs: 0, readyPlants: 0, futureEntries: [] };
    pool.futureEntries.push({ readyDate: effectiveDate, lbs: remainingLbs, plants: activePods });
    cropPools.set(ck, pool);
  }

  const grouped = new Map<
    string,
    {
      crop: string;
      totalTowers: number;
      orders: string[];
      orderCount: number;
      seedByDate: string;
      earliestDueDate: string;
      currentAvailableLbs: number;
      currentAvailablePlants: number;
      seededCount: number;
      pipelineCount: number;
      urgency: "Overdue" | "Today" | "Upcoming";
    }
  >();

  // Expand orders: salad mix orders become per-component crop demands
  type OrderDemand = { cropKey: string; cropName: string; dueDate: string; qtyInLbs: number; qtyInPlants: number; customer: string };
  const demands: OrderDemand[] = [];
  for (const order of openOrders) {
    const rawCrop = (getOrderCrop(order) || "").trim();
    const normalized = normalizeCropKey(rawCrop);
    const cropKey = cropAliases[normalized] || normalized;
    const dueDate = getOrderRequestedDeliveryDate(order);
    if (!dueDate) continue;
    const unitType = getOrderUnitType(order);
    const qtyNeeded = toNumber(getOrderQuantityNeeded(order));
    // Plants unit: track as plants (not lbs) so inventory pods are compared directly
    const qtyInPlants = unitType === "Plants" ? qtyNeeded : 0;
    const totalLbs = unitType === "Plants" ? 0 : quantityToLbs(unitType, qtyNeeded);
    const recipe = SALAD_MIX_RECIPES[cropKey];
    if (recipe && totalLbs > 0) {
      const totalRecipeOz = recipe.reduce((s, c) => s + c.oz, 0);
      for (const { crop: compCrop, oz } of recipe) {
        demands.push({
          cropKey: compCrop,
          cropName: formatCropLabel(compCrop),
          dueDate,
          qtyInLbs: Math.round(totalLbs * (oz / totalRecipeOz) * 1000) / 1000,
          qtyInPlants: 0,
          customer: `${getOrderCustomer(order)} (${formatCropLabel(cropKey)})`,
        });
      }
    } else if (!recipe) {
      demands.push({ cropKey, cropName: rawCrop, dueDate, qtyInLbs: totalLbs, qtyInPlants, customer: getOrderCustomer(order) });
    }
  }
  // Standing orders: generate weekly demand for each market week in the next 26 weeks
  if (marketConfig.enabled && !marketConfig.manualPause) {
    const windowEnd = addDays(today, 26 * 7);
    let cursor = new Date(today);
    // advance to next Saturday (start of market week)
    while (cursor.getDay() !== 6) cursor = new Date(cursor.getTime() + 86400000);
    while (formatDateInput(cursor) <= windowEnd) {
      const month = cursor.getMonth() + 1;
      const { seasonStart, seasonEnd } = marketConfig;
      const inSeason = seasonStart <= seasonEnd
        ? month >= seasonStart && month <= seasonEnd
        : month >= seasonStart || month <= seasonEnd;
      if (inSeason) {
        const dueDate = formatDateInput(cursor);
        for (const item of marketConfig.items) {
          if (!item.active || item.weeklyQty <= 0) continue;
          const normalized = normalizeCropKey(item.crop);
          const cropKey = cropAliases[normalized] || normalized;
          const isPlants = item.unitType === "Plants";
          const qtyInPlants = isPlants ? item.weeklyQty : 0;
          const qtyInLbs = isPlants ? 0 : quantityToLbs(item.unitType, item.weeklyQty);
          if (qtyInPlants <= 0 && qtyInLbs <= 0) continue;
          const recipe = SALAD_MIX_RECIPES[cropKey];
          if (recipe && qtyInLbs > 0) {
            const totalRecipeOz = recipe.reduce((s, c) => s + c.oz, 0);
            for (const { crop: compCrop, oz } of recipe) {
              demands.push({
                cropKey: compCrop,
                cropName: formatCropLabel(compCrop),
                dueDate,
                qtyInLbs: Math.round(qtyInLbs * (oz / totalRecipeOz) * 1000) / 1000,
                qtyInPlants: 0,
                customer: `Farmers Market (${formatCropLabel(cropKey)})`,
              });
            }
          } else if (!recipe) {
            demands.push({ cropKey, cropName: item.crop, dueDate, qtyInLbs, qtyInPlants, customer: "Farmers Market" });
          }
        }
      }
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    }
  }

  demands.sort((a, b) => new Date(a.dueDate || "2100-01-01").getTime() - new Date(b.dueDate || "2100-01-01").getTime());

  for (const demand of demands) {
    const { cropKey, cropName, dueDate, qtyInLbs, qtyInPlants, customer } = demand;
    const seedByDate = addDays(dueDate, -42);

    const pool =
      cropPools.get(cropKey) || {
        readyLbs: 0,
        readyPlants: 0,
        futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
      };

    let availableLbsByDue = pool.readyLbs;
    let availablePlantsByDue = pool.readyPlants;
    const remainingFutureEntries: Array<{ readyDate: string; lbs: number; plants: number }> = [];

    for (const entry of pool.futureEntries) {
      if (entry.readyDate && entry.readyDate <= dueDate) {
        availableLbsByDue += entry.lbs;
        availablePlantsByDue += entry.plants;
      } else {
        remainingFutureEntries.push(entry);
      }
    }

    let newTowersNeeded: number;
    if (qtyInPlants > 0) {
      // Full-harvest crops: use 2-week freshness window per tower.
      // Plants from a tower that became ready more than 2 weeks before this
      // market date are treated as expired (harvested, wasted, or sold elsewhere).
      const freshWindowStart = addDays(dueDate, -14);
      let freshPlants = 0;
      const freshEntries: Array<{ readyDate: string; lbs: number; plants: number }> = [];
      const stillFuture: Array<{ readyDate: string; lbs: number; plants: number }> = [];
      for (const entry of pool.futureEntries) {
        if (entry.readyDate > dueDate) {
          stillFuture.push(entry);
        } else if (entry.readyDate >= freshWindowStart) {
          freshPlants += entry.plants;
          freshEntries.push(entry);
        }
        // else: ready > 2 weeks ago → expired, discard
      }
      const shortagePlants = Math.max(0, qtyInPlants - freshPlants);
      newTowersNeeded = shortagePlants > 0 ? Math.ceil(shortagePlants / HALF_TRAY_SEEDS) : 0;
      // Consume from oldest-first
      freshEntries.sort((a, b) => a.readyDate.localeCompare(b.readyDate));
      let toConsume = Math.min(qtyInPlants, freshPlants);
      for (const entry of freshEntries) {
        if (toConsume <= 0) { stillFuture.push(entry); continue; }
        if (entry.plants <= toConsume) {
          toConsume -= entry.plants;
        } else {
          stillFuture.push({ readyDate: entry.readyDate, plants: entry.plants - toConsume, lbs: entry.lbs * (entry.plants - toConsume) / entry.plants });
          toConsume = 0;
        }
      }
      pool.readyPlants = 0;
      pool.futureEntries = stillFuture;
      // Add proposed new towers to pool so later demands can draw from them
      if (newTowersNeeded > 0) {
        const proposedReadyDate = addDays(today, 42);
        pool.futureEntries = [...pool.futureEntries, { readyDate: proposedReadyDate, lbs: 0, plants: newTowersNeeded * HALF_TRAY_SEEDS }];
      }
    } else {
      const cropProfile = getCropProfile(cropKey);
      // Skip mix/assembled crops with no grow profile — they have no direct seeding yield
      if (cropProfile.expectedLbsPerTower === 0 && !SALAD_MIX_RECIPES[cropKey]) {
        cropPools.set(cropKey, pool);
        continue;
      }
      const shortageLbs = Math.max(0, qtyInLbs - availableLbsByDue);
      const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropKey, HALF_TRAY_SEEDS));
      newTowersNeeded = shortageLbs > 0 ? Math.ceil(shortageLbs / avgQtyPerTower) : 0;
      const consumedLbs = Math.min(qtyInLbs, availableLbsByDue);
      pool.readyLbs = Math.max(0, availableLbsByDue - consumedLbs);
      pool.readyPlants = Math.max(0, availablePlantsByDue - Math.round((consumedLbs * 16) / 6));
      pool.futureEntries = remainingFutureEntries;
      // Add proposed new towers to pool so later demands can draw from them
      if (newTowersNeeded > 0) {
        const proposedReadyDate = addDays(today, 42);
        const proposedLbs = newTowersNeeded * avgQtyPerTower;
        pool.futureEntries = [...pool.futureEntries, { readyDate: proposedReadyDate, lbs: proposedLbs, plants: 0 }];
      }
    }

    cropPools.set(cropKey, pool);

    if (!seedByDate) continue;

    const seededCount = activeInventory.filter(
      (item) => (getInventoryCrop(item) || "").trim().toLowerCase() === cropKey && normalizeStatus(getInventoryStage(item)) === "seeded"
    ).length;

    // Seeded inventory is already in the pipeline — subtract it from the remaining shortage
    const remainingTowersNeeded = Math.max(0, newTowersNeeded - seededCount);
    if (remainingTowersNeeded <= 0) continue;

    const pipelineCount = activeInventory.filter(
      (item) =>
        (getInventoryCrop(item) || "").trim().toLowerCase() === cropKey &&
        ["seeded", "transplanted", "growing", "ready"].includes(normalizeStatus(getInventoryStage(item))) &&
        !["harvested", "lost", "scrapped", "closed"].includes(normalizeStatus(getInventoryStatus(item)))
    ).length;

    const cropInventory = inventoryByCrop.get(cropName) || inventoryByCrop.get(cropKey);
    const urgency: "Overdue" | "Today" | "Upcoming" =
      seedByDate < today ? "Overdue" : seedByDate === today ? "Today" : "Upcoming";
    const effectiveSeedByDate = seedByDate < today ? today : seedByDate;
    const key = `${effectiveSeedByDate}__${cropKey}`;

    const current = grouped.get(key) || {
      crop: cropName,
      totalTowers: 0,
      orders: [],
      orderCount: 0,
      seedByDate: effectiveSeedByDate,
      earliestDueDate: dueDate,
      currentAvailableLbs: cropInventory ? cropInventory.availableLbs : 0,
      currentAvailablePlants: cropInventory ? cropInventory.availablePlants : 0,
      seededCount,
      pipelineCount,
      urgency,
    };

    current.totalTowers += remainingTowersNeeded;
    current.orderCount += 1;
    // Accumulate towers per customer so repeated market weeks consolidate
    const existingEntry = current.orders.find(o => o.startsWith(customer + " ("));
    if (existingEntry) {
      const idx = current.orders.indexOf(existingEntry);
      const prevTowers = parseInt(existingEntry.match(/\((\d+) towers\)/)?.[1] || "0", 10);
      current.orders[idx] = `${customer} (${prevTowers + remainingTowersNeeded} towers)`;
    } else {
      current.orders.push(`${customer} (${remainingTowersNeeded} towers)`);
    }
    if (!current.earliestDueDate || new Date(dueDate) < new Date(current.earliestDueDate)) {
      current.earliestDueDate = dueDate;
    }

    grouped.set(key, current);
  }

  // Replacement seeding: trimmed towers with <= 3 trims remaining (6 weeks of production left)
  for (const item of activeInventory) {
    const stage = normalizeStatus(getInventoryStage(item));
    if (stage !== "trimmed") continue;

    const trimCount = toNumber(getInventoryTrimCount(item));
    const remainingTrims = MAX_TRIMS - trimCount;
    if (remainingTrims > 3) continue;

    const cropName = getInventoryCrop(item) || "Unknown Crop";
    const exhaustDate = addDays(today, remainingTrims * TRIM_REGROWTH_DAYS);
    const seedByDate = addDays(exhaustDate, -42);
    const urgency: "Overdue" | "Today" | "Upcoming" =
      seedByDate < today ? "Overdue" : seedByDate === today ? "Today" : "Upcoming";

    const towerLabel = getInventoryTower(item) || `row ${item.rowNumber}`;
    const replacementLabel = `Replace tower ${towerLabel} (trim ${trimCount}/${MAX_TRIMS})`;
    const effectiveReplaceSeedByDate = seedByDate < today ? today : seedByDate;
    const key = `${effectiveReplaceSeedByDate}__${cropName}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.totalTowers += 1;
      existing.orders.push(replacementLabel);
    } else {
      const seededCount = activeInventory.filter(
        (i) => getInventoryCrop(i) === cropName && normalizeStatus(getInventoryStage(i)) === "seeded"
      ).length;
      const pipelineCount = activeInventory.filter(
        (i) =>
          getInventoryCrop(i) === cropName &&
          ["seeded", "transplanted", "growing", "ready", "trimmed"].includes(normalizeStatus(getInventoryStage(i))) &&
          !["harvested", "lost", "scrapped", "closed"].includes(normalizeStatus(getInventoryStatus(i)))
      ).length;
      const cropInventory = inventoryByCrop.get(cropName);
      grouped.set(key, {
        crop: cropName,
        totalTowers: 1,
        orders: [replacementLabel],
        orderCount: 0,
        seedByDate: effectiveReplaceSeedByDate,
        earliestDueDate: exhaustDate,
        currentAvailableLbs: cropInventory ? cropInventory.availableLbs : 0,
        currentAvailablePlants: cropInventory ? cropInventory.availablePlants : 0,
        seededCount,
        pipelineCount,
        urgency,
      });
    }
  }


  return Array.from(grouped.values()).sort((a, b) => {
    const dateCompare =
      new Date(a.seedByDate || "2100-01-01").getTime() - new Date(b.seedByDate || "2100-01-01").getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.crop.localeCompare(b.crop);
  });
}, [openOrders, activeInventory, inventoryByCrop, marketConfig]);


const filteredPlantTodayTasks = useMemo(() => {
  const todayStr = formatDateInput(new Date());
  const todayDate = new Date(todayStr + "T12:00:00");
  const weekEnd = getEndOfWeek(new Date(todayStr + "T12:00:00"));
  const monthEnd = new Date(todayDate); monthEnd.setMonth(monthEnd.getMonth() + 1);
  const threeMonthEnd = new Date(todayDate); threeMonthEnd.setMonth(threeMonthEnd.getMonth() + 3);

  // Round a date up to the next (or current) Wednesday
  const toNextWednesday = (dateStr: string): string => {
    const base = dateStr < todayStr ? todayStr : dateStr;
    const dow = new Date(base + "T12:00:00").getDay();
    const daysUntil = (3 - dow + 7) % 7;
    return addDays(base, daysUntil);
  };

  // Merge tasks that share the same crop + mapped Wednesday
  type MergedTask = (typeof plantTodayTasks)[0] & { mappedWednesday: string };
  const mergedMap = new Map<string, MergedTask>();
  for (const task of plantTodayTasks) {
    const wed = toNextWednesday(task.seedByDate);
    const key = `${wed}__${task.crop}`;
    const existing = mergedMap.get(key);
    if (existing) {
      existing.totalTowers += task.totalTowers;
      existing.orderCount += task.orderCount;
      existing.orders.push(...task.orders);
      if (task.earliestDueDate && (!existing.earliestDueDate || task.earliestDueDate < existing.earliestDueDate)) {
        existing.earliestDueDate = task.earliestDueDate;
      }
    } else {
      mergedMap.set(key, { ...task, seedByDate: wed, mappedWednesday: wed });
    }
  }

  return Array.from(mergedMap.values()).filter((task) => {
    const wedDate = new Date(task.mappedWednesday + "T12:00:00");
    if (seedScheduleFilter === "Today") return task.mappedWednesday === todayStr;
    if (seedScheduleFilter === "This Week") return wedDate >= todayDate && wedDate <= weekEnd;
    if (seedScheduleFilter === "3 Months") return wedDate >= todayDate && wedDate <= threeMonthEnd;
    return wedDate >= todayDate && wedDate <= monthEnd;
  });
}, [plantTodayTasks, seedScheduleFilter]);

const readyToHarvestInventory = useMemo(() => {
  const today = formatDateInput(new Date());

  return activeInventory
    .filter((item) => {
      const stage = normalizeStatus(getInventoryStage(item));
      const status = normalizeStatus(getInventoryStatus(item));
      const readyDate = getInventoryEffectiveReadyDate(item);

      if (["harvested", "lost", "scrapped", "closed"].includes(status)) return false;
      if (!["transplanted", "growing", "ready"].includes(stage)) return false;
      if (!readyDate) return false;

      return readyDate <= today;
    })
    .sort(
      (a, b) =>
        new Date(getInventoryEstimatedReadyDate(a) || "2100-01-01").getTime() -
        new Date(getInventoryEstimatedReadyDate(b) || "2100-01-01").getTime()
    );
}, [activeInventory]);

const harvestTodayTasks = useMemo(() => {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sevenDaysOut = new Date(todayOnly);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  return openOrders
    .filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "harvested", "packed"].includes(status)) return false;
      const dueDate = getOrderRequestedDeliveryDate(order);
      if (!dueDate) return false;
      const due = new Date(dueDate);
      if (Number.isNaN(due.getTime())) return false;
      const dueOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return dueOnly <= sevenDaysOut;
    })
    .map((order) => ({
      rowNumber: order.rowNumber,
      customer: getOrderCustomer(order),
      crop: getOrderCrop(order),
      unitType: getOrderUnitType(order),
      quantityNeeded: toNumber(getOrderQuantityNeeded(order)),
      dueDate: getOrderRequestedDeliveryDate(order),
      status: getOrderStatus(order),
    }))
    .sort((a, b) => new Date(a.dueDate || "2100-01-01").getTime() - new Date(b.dueDate || "2100-01-01").getTime());
}, [openOrders]);

const packTodayTasks = useMemo(() => {
  return openOrders
    .filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "packed"].includes(status)) return false;

      return (
        status === "harvested" &&
        (isDueToday(getOrderRequestedDeliveryDate(order)) ||
          isOverdue(getOrderRequestedDeliveryDate(order)) ||
          isDueTodayOrTomorrow(getOrderRequestedDeliveryDate(order)))
      );
    })
    .map((order) => ({
      rowNumber: order.rowNumber,
      customer: getOrderCustomer(order),
      crop: getOrderCrop(order),
      unitType: getOrderUnitType(order),
      quantityNeeded: toNumber(getOrderQuantityNeeded(order)),
      dueDate: getOrderRequestedDeliveryDate(order),
      status: getOrderStatus(order),
    }))
    .sort((a, b) => new Date(a.dueDate || "2100-01-01").getTime() - new Date(b.dueDate || "2100-01-01").getTime());
}, [openOrders]);

const overdueOrders = useMemo(() => {
  return openOrders
    .filter((order) => {
      const orderStatus = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "packed"].includes(orderStatus)) return false;
      return isOverdue(getOrderRequestedDeliveryDate(order));
    })
    .sort(
      (a, b) =>
        new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
        new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
    );
}, [openOrders]);

  const weeklyMetrics = useMemo(() => {
    const now = new Date();
    const currentStart = getStartOfWeek(now);
    const currentEnd = getEndOfWeek(now);

    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 7);

    const currentStartStr = formatDateInput(currentStart);
    const currentEndStr = formatDateInput(currentEnd);
    const prevStartStr = formatDateInput(prevStart);
    const prevEndStr = formatDateInput(prevEnd);

    const sumWindow = (
      modeName: string,
      startStr: string,
      endStr: string,
      field: "lbs" | "pods"
    ) => {
      return staffRows
        .filter((row) => {
          const modeNameValue = normalizeStatus(getStaffMode(row));

          if (modeName === "Harvest") {
            return modeNameValue === "harvest" || modeNameValue === "farmers market";
          }

          if (modeName === "Scrapped") {
            return modeNameValue === "scrapped";
          }

          return modeNameValue === modeName.toLowerCase();
        })
        .filter((row) => {
          const raw = getStaffDate(row) || getStaffTimestamp(row);
          const rowDateStr = formatDateInput(raw);
          if (!rowDateStr) return false;
          return rowDateStr >= startStr && rowDateStr <= endStr;
        })
        .reduce((sum, row) => {
          return sum + (field === "lbs" ? toNumber(getStaffLbs(row)) : toNumber(getStaffPodsChanged(row)));
        }, 0);
    };

    return {
      harvestedThisWeek: sumWindow("Harvest", currentStartStr, currentEndStr, "lbs"),
      scrappedThisWeek: sumWindow("Scrapped", currentStartStr, currentEndStr, "lbs"),
      harvestedPrevWeek: sumWindow("Harvest", prevStartStr, prevEndStr, "lbs"),
      scrappedPrevWeek: sumWindow("Scrapped", prevStartStr, prevEndStr, "lbs"),
      podsScrappedThisWeek: sumWindow("Scrapped", currentStartStr, currentEndStr, "pods"),
      podsHarvestedThisWeek: sumWindow("Harvest", currentStartStr, currentEndStr, "pods"),
    };
  }, [staffRows]);

  const dashboardStats = useMemo(() => {
    const activeOrders = salesOrders.filter((row) => {
      const status = normalizeStatus(getOrderStatus(row));
      return status !== "completed" && status !== "cancelled" && status !== "packed";
    });

    const totalQtyOnOrder = activeOrders.reduce((sum, row) => sum + toNumber(getOrderQuantityNeeded(row)), 0);
    const totalNewTowersNeeded = activeOrders.reduce((sum, row) => sum + toNumber(getOrderNewTowersToPlant(row)), 0);
    const readyInventory = activeInventory.filter((item) => normalizeStatus(getInventoryStage(item)) === "ready").length;
    const podsInProduction = activeInventory
      .filter((row) => { const s = normalizeStatus(getInventoryStage(row)); return s !== "seeded" && s !== "empty"; })
      .reduce((sum, row) => sum + toNumber(getInventoryActivePods(row)), 0);

    const activeSeeds = activeInventory
      .filter((row) => normalizeStatus(getInventoryStage(row)) === "seeded")
      .reduce((sum, row) => sum + toNumber(getInventoryActivePods(row)), 0);

    const fulfilledStatuses = ["harvested", "packed", "completed"];
    const currStartStr = formatDateInput(getStartOfWeek(new Date()));
    const currEndStr = formatDateInput(getEndOfWeek(new Date()));

    const kitchenLbs = salesOrders
      .filter((o) => {
        const customer = (getOrderCustomer(o) || "").toLowerCase();
        const status = normalizeStatus(getOrderStatus(o));
        const delivery = formatDateInput(getOrderRequestedDeliveryDate(o));
        return customer.includes("kitchen") && fulfilledStatuses.includes(status) &&
               !!delivery && delivery >= currStartStr && delivery <= currEndStr;
      })
      .reduce((sum, o) => sum + quantityToLbs(getOrderUnitType(o), toNumber(getOrderQuantityNeeded(o))), 0);

    const pantryLbs = salesOrders
      .filter((o) => {
        const customer = (getOrderCustomer(o) || "").toLowerCase();
        const status = normalizeStatus(getOrderStatus(o));
        const delivery = formatDateInput(getOrderRequestedDeliveryDate(o));
        return customer.includes("pantry") && fulfilledStatuses.includes(status) &&
               !!delivery && delivery >= currStartStr && delivery <= currEndStr;
      })
      .reduce((sum, o) => sum + quantityToLbs(getOrderUnitType(o), toNumber(getOrderQuantityNeeded(o))), 0);

    const prevStart = new Date(getStartOfWeek(new Date()));
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(prevStart);
    prevEnd.setDate(prevEnd.getDate() + 6);
    const prevStartStr = formatDateInput(prevStart);
    const prevEndStr = formatDateInput(prevEnd);

    const kitchenLbsPrevWeek = salesOrders
      .filter((o) => {
        const customer = (getOrderCustomer(o) || "").toLowerCase();
        const status = normalizeStatus(getOrderStatus(o));
        const delivery = formatDateInput(getOrderRequestedDeliveryDate(o));
        return customer.includes("kitchen") && fulfilledStatuses.includes(status) &&
               !!delivery && delivery >= prevStartStr && delivery <= prevEndStr;
      })
      .reduce((sum, o) => sum + quantityToLbs(getOrderUnitType(o), toNumber(getOrderQuantityNeeded(o))), 0);

    const pantryLbsPrevWeek = salesOrders
      .filter((o) => {
        const customer = (getOrderCustomer(o) || "").toLowerCase();
        const status = normalizeStatus(getOrderStatus(o));
        const delivery = formatDateInput(getOrderRequestedDeliveryDate(o));
        return customer.includes("pantry") && fulfilledStatuses.includes(status) &&
               !!delivery && delivery >= prevStartStr && delivery <= prevEndStr;
      })
      .reduce((sum, o) => sum + quantityToLbs(getOrderUnitType(o), toNumber(getOrderQuantityNeeded(o))), 0);

    return {
      totalQtyOnOrder,
      totalNewTowersNeeded,
      activeInventoryCount: activeInventory.length,
      readyInventory,
      overdueOrders: overdueOrders.length,
      harvestedThisWeek: weeklyMetrics.harvestedThisWeek,
      scrappedThisWeek: weeklyMetrics.scrappedThisWeek,
      harvestedPrevWeek: weeklyMetrics.harvestedPrevWeek,
      scrappedPrevWeek: weeklyMetrics.scrappedPrevWeek,
      podsInProduction,
      activeSeeds,
      kitchenLbs,
      pantryLbs,
      kitchenLbsPrevWeek,
      pantryLbsPrevWeek,
    };
  }, [salesOrders, activeInventory, overdueOrders, weeklyMetrics]);

  const shortageAlerts = useMemo(() => {
    const openOrders = salesOrders
      .filter((row) => {
        const status = normalizeStatus(getOrderStatus(row));
        return !["completed", "cancelled", "packed"].includes(status);
      })
      .sort(
        (a, b) =>
          new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
          new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
      );

    const cropPools = new Map<
      string,
      {
        readyLbs: number;
        readyPlants: number;
        futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
      }
    >();

    for (const [cropName, cropInventory] of inventoryByCrop.entries()) {
      cropPools.set(cropName, {
        readyLbs: cropInventory.readyNowLbs,
        readyPlants: cropInventory.readyNowPlants,
        futureEntries: cropInventory.futureEntries.map((entry) => ({ ...entry })),
      });
    }

    const alerts = openOrders
      .map((row) => {
        const cropName = (getOrderCrop(row) || "").trim();
        const dueDate = getOrderRequestedDeliveryDate(row);
        const unitType = getOrderUnitType(row);
        const qtyNeeded = toNumber(getOrderQuantityNeeded(row));
        const alertNormalized = cropAliases[normalizeCropKey(cropName)] || normalizeCropKey(cropName);
        let qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
        if (unitType === "Plants" && qtyNeeded > 0) {
          const profile = getCropProfile(alertNormalized);
          qtyNeededInLbs = Math.round(qtyNeeded * (profile.expectedLbsPerTower / HALF_TRAY_SEEDS) * 1000) / 1000;
        }
        const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));

        const pool =
          cropPools.get(cropName) || {
            readyLbs: 0,
            readyPlants: 0,
            futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
          };

        let availableLbsByDue = pool.readyLbs;
        let availablePlantsByDue = pool.readyPlants;
        const remainingFutureEntries: Array<{ readyDate: string; lbs: number; plants: number }> = [];

        for (const entry of pool.futureEntries) {
          if (dueDate && entry.readyDate && entry.readyDate <= dueDate) {
            availableLbsByDue += entry.lbs;
            availablePlantsByDue += entry.plants;
          } else {
            remainingFutureEntries.push(entry);
          }
        }

        const availableQtyByDue = availableLbsToUnitQty(unitType, availableLbsByDue, availablePlantsByDue);
        const shortageQty = Math.max(0, qtyNeeded - availableQtyByDue);
        const shortageLbs = Math.max(0, qtyNeededInLbs - availableLbsByDue);
        const newTowers = shortageLbs > 0 ? Math.ceil(shortageLbs / avgQtyPerTower) : 0;

        const consumedLbs = Math.min(qtyNeededInLbs, availableLbsByDue);
        const consumedPlants = Math.min(
          unitType === "Plants" ? qtyNeeded : Math.round((consumedLbs * 16) / 6),
          availablePlantsByDue
        );

        pool.readyLbs = Math.max(0, availableLbsByDue - consumedLbs);
        pool.readyPlants = Math.max(0, availablePlantsByDue - consumedPlants);
        pool.futureEntries = remainingFutureEntries;
        cropPools.set(cropName, pool);

        return {
          rowNumber: row.rowNumber,
          customer: getOrderCustomer(row),
          crop: cropName,
          dueDate,
          shortageQty,
          newTowers,
          status: getOrderStatus(row),
        };
      })
      .filter((item) => item.shortageQty > 0 || item.newTowers > 0);

    return alerts;
  }, [salesOrders, inventoryByCrop]);

  const executiveAlerts = useMemo(() => {
    const alerts: Array<{ level: "High" | "Medium"; title: string; detail: string }> = [];

    const overdue = salesOrders.filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      return !["completed", "cancelled", "packed"].includes(status) && isOverdue(getOrderRequestedDeliveryDate(order));
    });
    overdue.slice(0, 6).forEach((order) => {
      alerts.push({
        level: "High",
        title: `Overdue order: ${getOrderCustomer(order)} / ${getOrderCrop(order)}`,
        detail: `Due ${formatDateDisplay(getOrderRequestedDeliveryDate(order))}. Status: ${getOrderStatus(order) || "Planned"}.`,
      });
    });

    const seededTooLong = activeInventory.filter((item) => {
      if (normalizeStatus(getInventoryStage(item)) !== "seeded") return false;
      const seeded = getInventorySeededDate(item);
      if (!seeded) return false;
      return addDays(seeded, 10) < formatDateInput(new Date());
    });
    seededTooLong.slice(0, 6).forEach((item) => {
      alerts.push({
        level: "Medium",
        title: `Seeded item waiting to transplant: ${getInventoryCrop(item)}`,
        detail: `${getInventoryTower(item) || "Unassigned tower"} seeded ${formatDateDisplay(getInventorySeededDate(item))}.`,
      });
    });

    const readyOverdue = activeInventory.filter((item) => {
      const stage = normalizeStatus(getInventoryStage(item));
      const ready = getInventoryEffectiveReadyDate(item);
      return (stage === "ready" || stage === "transplanted" || stage === "growing") && !!ready && isOverdue(ready);
    });
    readyOverdue.slice(0, 6).forEach((item) => {
      alerts.push({
        level: "Medium",
        title: `Inventory past ready date: ${getInventoryCrop(item)}`,
        detail: `${getInventoryTower(item) || "Unassigned tower"} ready ${formatDateDisplay(getInventoryEffectiveReadyDate(item))}.`,
      });
    });

    return alerts.slice(0, 12);
  }, [salesOrders, activeInventory]);

  const seedingCalendar = useMemo(() => {
    const openOrders = salesOrders
      .filter((row) => {
        const status = normalizeStatus(getOrderStatus(row));
        return !["completed", "cancelled", "packed"].includes(status);
      })
      .sort(
        (a, b) =>
          new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
          new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
      );

    const cropPools = new Map<
      string,
      {
        readyLbs: number;
        readyPlants: number;
        futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
      }
    >();

    for (const [cropName, cropInventory] of inventoryByCrop.entries()) {
      cropPools.set(cropName, {
        readyLbs: cropInventory.readyNowLbs,
        readyPlants: cropInventory.readyNowPlants,
        futureEntries: cropInventory.futureEntries.map((entry) => ({ ...entry })),
      });
    }

    const buckets = new Map<
      string,
      Array<{
        crop: string;
        towers: number;
        orders: number;
        seedByDate: string;
        firstDueDate: string;
      }>
    >();

    for (const row of openOrders) {
      const cropName = (getOrderCrop(row) || "").trim();
      const dueDate = getOrderRequestedDeliveryDate(row);
      const unitType = getOrderUnitType(row);
      const qtyNeeded = toNumber(getOrderQuantityNeeded(row));
      const normalizedCrop = cropAliases[normalizeCropKey(cropName)] || normalizeCropKey(cropName);
      let qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
      if (unitType === "Plants" && qtyNeeded > 0) {
        const profile = getCropProfile(normalizedCrop);
        qtyNeededInLbs = Math.round(qtyNeeded * (profile.expectedLbsPerTower / HALF_TRAY_SEEDS) * 1000) / 1000;
      }
      const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));

      const pool =
        cropPools.get(cropName) || {
          readyLbs: 0,
          readyPlants: 0,
          futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
        };

      let availableLbsByDue = pool.readyLbs;
      let availablePlantsByDue = pool.readyPlants;
      const remainingFutureEntries: Array<{ readyDate: string; lbs: number; plants: number }> = [];

      for (const entry of pool.futureEntries) {
        if (dueDate && entry.readyDate && entry.readyDate <= dueDate) {
          availableLbsByDue += entry.lbs;
          availablePlantsByDue += entry.plants;
        } else {
          remainingFutureEntries.push(entry);
        }
      }

      const shortageLbs = Math.max(0, qtyNeededInLbs - availableLbsByDue);
      const newTowers = shortageLbs > 0 ? Math.ceil(shortageLbs / avgQtyPerTower) : 0;

      const consumedLbs = Math.min(qtyNeededInLbs, availableLbsByDue);
      const consumedPlants = Math.min(
        unitType === "Plants" ? qtyNeeded : Math.round((consumedLbs * 16) / 6),
        availablePlantsByDue
      );

      pool.readyLbs = Math.max(0, availableLbsByDue - consumedLbs);
      pool.readyPlants = Math.max(0, availablePlantsByDue - consumedPlants);
      pool.futureEntries = remainingFutureEntries;
      cropPools.set(cropName, pool);

      if (newTowers <= 0 || !dueDate) continue;

      const seedByDate = addDays(dueDate, -42);
      const key = seedByDate ? formatDateInput(getStartOfWeek(new Date(seedByDate))) : "No Seed Date";
      const list = buckets.get(key) || [];
      const existing = list.find((x) => x.crop === cropName);

      if (existing) {
        existing.towers += newTowers;
        existing.orders += 1;
        if (!existing.firstDueDate || new Date(dueDate) < new Date(existing.firstDueDate)) {
          existing.firstDueDate = dueDate;
        }
        if (!existing.seedByDate || new Date(seedByDate) < new Date(existing.seedByDate)) {
          existing.seedByDate = seedByDate;
        }
      } else {
        list.push({
          crop: cropName || "Unknown Crop",
          towers: newTowers,
          orders: 1,
          seedByDate,
          firstDueDate: dueDate,
        });
      }

      buckets.set(key, list);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => {
        if (a[0] === "No Seed Date") return 1;
        if (b[0] === "No Seed Date") return -1;
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
      })
      .map(([weekOf, items]) => [
        weekOf,
        items.sort((a, b) => {
          if (a.seedByDate !== b.seedByDate) return new Date(a.seedByDate).getTime() - new Date(b.seedByDate).getTime();
          return a.crop.localeCompare(b.crop);
        }),
      ] as const)
      .slice(0, 8);
  }, [salesOrders, inventoryByCrop]);

  const saveQuickAction = async () => {
    setMessage("");

    const isSeedMode = mode === "Seed";

    if (!isSeedMode && !tower && mode !== "Farmers Market") {
      setMessage("Please enter a tower.");
      return;
    }
    if (!crop || !entryDate) {
      setMessage("Please select crop and date.");
      return;
    }

    if ((mode === "Harvest" || mode === "Farmers Market" || mode === "Scrapped" || mode === "Pack") && !lbs) {
      setMessage("Please enter quantity for this action.");
      return;
    }

    const enteredQty = Number(lbs || 0);
    const convertedLbs = ["Harvest", "Farmers Market", "Scrapped", "Pack"].includes(mode)
      ? (quickEntryUnitType === "Plants" ? "" : quantityToLbs(quickEntryUnitType, enteredQty))
      : "";
    const convertedPods = quickEntryUnitType === "Plants" ? Number(lbs || 0) : (podsChanged ? Number(podsChanged) : "");

    const trayCount = Math.max(1, Number(quickTrayCount) || 1);
    const seedsPerTray = quickTrayType === "Full Tray" ? FULL_TRAY_SEEDS : HALF_TRAY_SEEDS;
    const trayNote = isSeedMode
      ? `${trayCount} ${quickTrayType}${trayCount !== 1 ? "s" : ""} (${trayCount * seedsPerTray} seeds)`
      : "";

    const payload = {
      action: "saveStaffAction",
      mode,
      tower: isSeedMode || mode === "Farmers Market" ? "" : tower,
      crop,
      lbs: convertedLbs,
      podsChanged: isSeedMode ? trayCount * seedsPerTray : convertedPods,
      status: entryStatus || (isSeedMode ? "Completed" : ""),
      stage: stage || (isSeedMode ? "Seeded" : ""),
      date: entryDate,
      scrapType,
      note: [trayNote, note, ["Harvest", "Farmers Market", "Pack"].includes(mode) ? `Unit: ${quickEntryUnitType}; Qty Entered: ${enteredQty}` : ""].filter(Boolean).join(" | "),
    };

    try {
      const result = await postToBackend(payload);

      if (result.ok) {
        if (isSeedMode) {
          const seedsPerTrayVal = quickTrayType === "Full Tray" ? FULL_TRAY_SEEDS : HALF_TRAY_SEEDS;
          const trayCountNum = Math.max(1, Number(quickTrayCount) || 1);
          const activePods = seedsPerTrayVal;
          const expectedLbs = calculateExpectedLbs(crop, activePods, "Low Density");
          const seedDate = entryDate || formatDateInput(new Date());
          let invFailed = false;
          for (let i = 0; i < trayCountNum; i += 1) {
            const invResult = await postToBackend({
              action: "saveProductionInventory",
              tower: "",
              towerType: "Low Density",
              maxPods: activePods,
              activePods,
              crop,
              stage: "Seeded",
              seededDate: seedDate,
              transplantDate: "",
              estimatedReadyDate: addDays(seedDate, 42),
              expectedLbs,
              remainingExpectedLbs: expectedLbs,
              status: "Active",
              notes: `Created from Quick Action Seed: ${trayCountNum} ${quickTrayType}${trayCountNum !== 1 ? "s" : ""}.`,
            });
            if (!invResult.ok) { invFailed = true; break; }
          }
          if (invFailed) {
            setMessage("Staff action saved but inventory creation failed for one or more trays.");
          } else {
            setMessage("Saved to Staff_Actions and added to Seeded inventory.");
          }
          await Promise.all([loadStaffActions(), loadProductionInventory()]);
        } else {
          setMessage("Saved to Staff_Actions.");
          await loadStaffActions();
        }
        setTower("");
        setCrop("");
        setLbs("");
        setPodsChanged("");
        setQuickEntryUnitType("Lbs");
        setEntryStatus("");
        setStage("");
        setScrapType("");
        setNote("");
        setQuickTrayCount("1");
      } else {
        setMessage(result.message || "Unable to save entry.");
      }
    } catch (error) {
      console.error("saveQuickAction error:", error);
      setMessage("Error saving entry.");
    }
  };

  const removeDraftOrderLine = (id: string) => {
    setDraftOrderLines((prev) => {
      const next = prev.filter((line) => line.id !== id);
      return next.length > 0 ? next : [{ id: makeId(), crop: "", unitType: "Lbs" as OrderUnitType, quantityNeeded: "" }];
    });
  };

  const addDraftOrderRow = () => {
    setDraftOrderLines((prev) => [
      ...prev,
      { id: makeId(), crop: "", unitType: "Lbs" as OrderUnitType, quantityNeeded: "" },
    ]);
  };

  const updateDraftOrderLine = (id: string, field: "crop" | "unitType" | "quantityNeeded", value: string) => {
    setDraftOrderLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const startEditSalesOrder = (order: SalesOrderRow) => {
    setEditingSalesOrderRowNumber(order.rowNumber);
    setDraftOrderLines([{
      id: makeId(),
      crop: getOrderCrop(order),
      unitType: (getOrderUnitType(order) as OrderUnitType) || "Lbs",
      quantityNeeded: String(getOrderQuantityNeeded(order) || ""),
    }]);
    setSalesCustomer(getOrderCustomer(order));
    setSalesDeliveryDate(formatDateInput(getOrderRequestedDeliveryDate(order)));
    setSalesNotes(order.notes || order.Notes || "");
    setSalesOrderType((getOrderType(order) as "One-Time" | "Contract") || "One-Time");
    setSalesFrequency(getOrderFrequency(order) || "Weekly");
    setSalesContractStartDate(formatDateInput(order.contractStartDate || order["Contract Start Date"] || ""));
    setSalesContractEndDate(formatDateInput(order.contractEndDate || order["Contract End Date"] || ""));
    setSalesSaveMessage(`Editing order #${order.rowNumber}`);
  };

  const cancelEditSalesOrder = () => {
    setEditingSalesOrderRowNumber(null);
    setSalesCustomer("");
    setSalesDeliveryDate("");
    setSalesNotes("");
    setSalesOrderType("One-Time");
    setSalesFrequency("Weekly");
    setSalesContractStartDate("");
    setSalesContractEndDate("");
    setDraftOrderLines([{ id: makeId(), crop: "", unitType: "Lbs" as OrderUnitType, quantityNeeded: "" }]);
    setSalesSaveMessage("");
  };

  const handleCancelSalesOrder = async (rowNumber: number) => {
    try {
      const result = await postToBackend({ action: "updateOrderStatus", rowNumber, status: "Cancelled" });
      if (result.ok) {
        if (editingSalesOrderRowNumber === rowNumber) cancelEditSalesOrder();
        await loadSalesOrders();
        setSalesSaveMessage(`Order ${rowNumber} cancelled.`);
      } else {
        setSalesSaveMessage(result.message || "Unable to cancel order.");
      }
    } catch (error) {
      console.error("handleCancelSalesOrder error:", error);
      setSalesSaveMessage("Error cancelling order.");
    }
  };

  const handleSaveOrder = async () => {
    if (saveOrderInProgress.current) return;

    const lineItems = draftOrderLines.filter((l) => l.crop && toNumber(l.quantityNeeded) > 0);

    if (!salesCustomer || lineItems.length === 0) {
      setSalesSaveMessage("Please enter customer and at least one line item with a crop and quantity.");
      return;
    }

    if (salesOrderType === "One-Time" && !salesDeliveryDate) {
      setSalesSaveMessage("Please enter requested delivery date.");
      return;
    }

    if (salesOrderType === "Contract" && (!salesContractStartDate || !salesContractEndDate || !salesFrequency)) {
      setSalesSaveMessage("Please enter contract frequency, start date, and end date.");
      return;
    }

    saveOrderInProgress.current = true;
    try {
      setSalesSaving(true);
      setSalesSaveMessage("");

      const dates =
        salesOrderType === "Contract"
          ? generateRecurringDates(salesContractStartDate, salesContractEndDate, salesFrequency)
          : [salesDeliveryDate];

      if (!dates.length) {
        setSalesSaveMessage("No order dates could be generated.");
        return;
      }

      if (editingSalesOrderRowNumber) {
        const editLine = lineItems[0];
        const result = await postToBackend({
          action: "updateSalesOrderRow",
          rowNumber: editingSalesOrderRowNumber,
          customer: salesCustomer,
          crop: editLine.crop,
          unitType: editLine.unitType,
          quantityNeeded: toNumber(editLine.quantityNeeded),
          requestedDeliveryDate: salesOrderType === "Contract" ? salesContractStartDate : salesDeliveryDate,
          availableQty: salesPlanner.availableQty,
          shortageQty: salesPlanner.shortageQty,
          towersNeeded: salesPlanner.towersNeeded,
          pipelineTowers: salesPlanner.pipelineTowers,
          newTowersToPlant: salesPlanner.newTowersToPlant,
          estimatedReadyDate: salesPlanner.estimatedReadyDate,
          feasible: salesPlanner.deliveryFeasible ? "Yes" : "No",
          notes: salesNotes,
          status: "Planned",
          orderType: salesOrderType,
          frequency: salesOrderType === "Contract" ? salesFrequency : "",
          contractStartDate: salesOrderType === "Contract" ? salesContractStartDate : "",
          contractEndDate: salesOrderType === "Contract" ? salesContractEndDate : "",
        });

        if (result.ok) {
          await loadSalesOrders();
          setSalesSaveMessage("Order updated.");
          cancelEditSalesOrder();
        } else {
          setSalesSaveMessage(result.message || "Unable to update sales order.");
        }
        return;
      }

      const orders = [] as Array<Record<string, unknown>>;
      for (const line of lineItems) {
        const lineQty = toNumber(line.quantityNeeded);
        const lineQtyInLbs = quantityToLbs(line.unitType, lineQty);
        const plannerQtyLabel = getUnitLabel(line.unitType);
        const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(line.crop, 44));
        const cropInventory = inventoryByCrop.get(line.crop);
        const availableQty = availableLbsToUnitQty(line.unitType, cropInventory?.readyNowLbs || 0, cropInventory?.readyNowPlants || 0);
        const shortageQty = Math.max(0, lineQty - availableQty);
        const towersNeeded = lineQtyInLbs > 0 ? Math.ceil(lineQtyInLbs / avgQtyPerTower) : (line.unitType === "Plants" ? Math.ceil(lineQty / 44) : 0);
        const pipelineTowers = cropInventory ? cropInventory.pipelineTowers : 0;
        const newTowersToPlant = Math.max(0, towersNeeded - pipelineTowers);
        let estimatedReadyDate = "";
        if (shortageQty > 0 && cropInventory) {
          let runningLbs = cropInventory.readyNowLbs || 0;
          for (const entry of cropInventory.futureEntries || []) {
            runningLbs += entry.lbs;
            if (runningLbs >= lineQtyInLbs) {
              estimatedReadyDate = entry.readyDate;
              break;
            }
          }
        }
        if (!estimatedReadyDate && shortageQty > 0) {
          estimatedReadyDate = addDays(dates[0], 42);
        }

        for (const deliveryDate of dates) {
          orders.push({
            customer: salesCustomer,
            crop: line.crop,
            unitType: line.unitType,
            quantityNeeded: lineQty,
            requestedDeliveryDate: deliveryDate,
            availableQty,
            shortageQty,
            towersNeeded,
            pipelineTowers,
            newTowersToPlant,
            estimatedReadyDate: shortageQty === 0 ? "" : estimatedReadyDate,
            feasible: shortageQty === 0 || (!!estimatedReadyDate && new Date(estimatedReadyDate).getTime() <= new Date(deliveryDate).getTime()) ? "Yes" : "No",
            notes: [salesNotes, lineItems.length > 1 ? `Batch Order` : "", isContainerUnit(line.unitType) ? `${plannerQtyLabel}: ${lineQty}` : ""].filter(Boolean).join(" | "),
            status: "Planned",
            orderType: salesOrderType,
            frequency: salesOrderType === "Contract" ? salesFrequency : "",
            contractStartDate: salesOrderType === "Contract" ? salesContractStartDate : "",
            contractEndDate: salesOrderType === "Contract" ? salesContractEndDate : "",
          });
        }
      }

      const result = await postToBackend({ action: "saveSalesOrder", orders });

      if (result.ok) {
        setSalesSaveMessage(
          salesOrderType === "Contract"
            ? `Contract order saved. ${result.count || orders.length} occurrences created.`
            : `Order saved with ${lineItems.length} line item${lineItems.length === 1 ? "" : "s"}.`
        );
        await loadSalesOrders();
        cancelEditSalesOrder();
      } else {
        setSalesSaveMessage(result.message || "Unable to save sales order.");
      }
    } catch (error) {
      console.error("Error saving sales order:", error);
      setSalesSaveMessage("Error saving sales order.");
    } finally {
      setSalesSaving(false);
      saveOrderInProgress.current = false;
    }
  };

  const handleOrderStatusChange = async (rowNumber: number, status: string) => {
    try {
      const result = await postToBackend({
        action: "updateOrderStatus",
        rowNumber,
        status,
      });

      if (result.ok) {
        await loadSalesOrders();
      } else {
        console.error("Update failed:", result.message);
      }
    } catch (error) {
      console.error("handleOrderStatusChange error:", error);
    }
  };

  const handleGroupStatusChange = async (groupKey: string, status: string) => {
    const group = groupedSavedOrders.find((g) => g.key === groupKey);
    if (!group) return;
    try {
      await Promise.all(
        group.items.map((order) =>
          postToBackend({ action: "updateOrderStatus", rowNumber: order.rowNumber, status })
        )
      );
      await loadSalesOrders();
    } catch (error) {
      console.error("handleGroupStatusChange error:", error);
    }
  };

  const handleSaveInventory = async () => {
    if (!inventoryTower || !inventoryCrop) {
      setInventoryMessage("Please enter tower and crop.");
      return;
    }

    const towerErr = validateTowerName(inventoryTower);
    if (towerErr) { setInventoryMessage(towerErr); return; }

    if (inventorySeededDate && inventoryTransplantDate && inventoryTransplantDate < inventorySeededDate) {
      setInventoryMessage("Transplant date cannot be before seeded date. Check for a typo (e.g. month/day swapped).");
      return;
    }
    if (inventoryTransplantDate && inventoryEstimatedReadyDate && inventoryEstimatedReadyDate < inventoryTransplantDate) {
      setInventoryMessage("Estimated ready date cannot be before transplant date.");
      return;
    }

    try {
      setInventorySaving(true);
      setInventoryMessage("");

      const maxPods = toNumber(inventoryMaxPods) || getTowerMaxPods(inventoryTowerType);
      const activePods = toNumber(inventoryActivePods) || maxPods;
      const expectedLbs = inventoryExpectedLbs
  ? Number(inventoryExpectedLbs)
  : calculateExpectedLbs(inventoryCrop, activePods, inventoryTowerType);
      const remainingExpectedLbs = inventoryRemainingExpectedLbs ? Number(inventoryRemainingExpectedLbs) : expectedLbs;

      const result = await postToBackend({
        action: "saveProductionInventory",
        tower: inventoryTower,
        towerType: inventoryTowerType,
        maxPods,
        activePods,
        crop: inventoryCrop,
        stage: inventoryStage,
        seededDate: inventorySeededDate,
        transplantDate: inventoryTransplantDate,
        estimatedReadyDate: inventoryEstimatedReadyDate,
        expectedLbs,
        remainingExpectedLbs,
        status: inventoryStatus,
        notes: inventoryNotes,
        harvestType: inventoryHarvestType,
      });

      if (result.ok) {
        setInventoryMessage("Production inventory saved.");
        setInventoryTower("");
        setInventoryTowerType("Low Density");
        setInventoryMaxPods(String(getTowerMaxPods("Low Density")));
        setInventoryActivePods(String(getTowerMaxPods("Low Density")));
        setInventoryCrop("");
        setInventoryStage("Growing");
        setInventorySeededDate("");
        setInventoryTransplantDate("");
        setInventoryEstimatedReadyDate("");
        setInventoryExpectedLbs("");
        setInventoryRemainingExpectedLbs("");
        setInventoryStatus("Active");
        setInventoryNotes("");
        setInventoryHarvestType("");
        await loadProductionInventory();
      } else {
        setInventoryMessage(result.message || "Unable to save production inventory.");
      }
    } catch (error) {
      console.error("handleSaveInventory error:", error);
      setInventoryMessage("Error saving production inventory.");
    } finally {
      setInventorySaving(false);
    }
  };

  const handleProductionStatusChange = async (rowNumber: number, status: string) => {
    try {
      const result = await postToBackend({
        action: "updateProductionInventoryStatus",
        rowNumber,
        status,
      });

      if (result.ok) {
        await loadProductionInventory();
      } else {
        console.error("Inventory status update failed:", result.message);
      }
    } catch (error) {
      console.error("handleProductionStatusChange error:", error);
    }
  };

  const handleInventoryAdjustment = async () => {
    setAdjustMessage("");

    const selected = productionInventory.find((row) => String(row.rowNumber) === adjustInventoryRow);
    if (!selected) {
      setAdjustMessage("Please choose an inventory row.");
      return;
    }

    const podsToRemove = toNumber(adjustPods);
    const currentCropName = selected ? getInventoryCrop(selected) : "";
    if (!podsToRemove && !(adjustMode === "Harvest" && isRepeatHarvestCrop(currentCropName) && toNumber(adjustLbs) > 0)) {
      setAdjustMessage("Please enter pods to adjust, or for repeat-harvest crops enter lbs removed.");
      return;
    }

    const currentActivePods = toNumber(getInventoryActivePods(selected));
    const currentRemainingLbs = toNumber(getInventoryRemainingExpectedLbs(selected));
    const currentExpectedLbs = toNumber(getInventoryExpectedLbs(selected));
    const maxPods = toNumber(getInventoryMaxPods(selected));
    const cropName = getInventoryCrop(selected);

    if (podsToRemove > currentActivePods) {
      setAdjustMessage("You cannot remove more pods than are active.");
      return;
    }

    const lbsPerPlant = currentActivePods > 0 ? currentRemainingLbs / currentActivePods : 0;
    const lbsRemoved = adjustLbs ? toNumber(adjustLbs) : Math.round(podsToRemove * lbsPerPlant * 100) / 100;
    const newActivePods = Math.max(0, currentActivePods - podsToRemove);
    const newRemainingLbs = Math.max(0, Math.round((currentRemainingLbs - lbsRemoved) * 100) / 100);

    const keepRowActiveForRepeatHarvest = adjustMode === "Harvest" && getEffectiveHarvestType(selected) === "Trim Harvest" && podsToRemove === 0;
    const towerName = getInventoryTower(selected);
    const towerDone = newActivePods === 0 && !!towerName;
    const newStatus = keepRowActiveForRepeatHarvest ? (getInventoryStatus(selected) || "Active") : (towerDone ? "Active" : getInventoryStatus(selected) || "Active");
    const newStage = keepRowActiveForRepeatHarvest ? (getInventoryStage(selected) || "Growing") : (towerDone ? "Empty" : getInventoryStage(selected) || "Growing");
    const updatedNotes = `${getInventoryNotes(selected) || ""} ${adjustMode} ${podsToRemove} pods / ${lbsRemoved} lbs on ${formatDateInput(
      new Date()
    )}. ${adjustNote}`.trim();

    try {
      const actionResult = await postToBackend({
        action: "saveStaffAction",
        mode: adjustMode,
        tower: getInventoryTower(selected),
        crop: cropName,
        lbs: lbsRemoved,
        podsChanged: podsToRemove,
        status: "Completed",
        stage: newStage,
        date: formatDateInput(new Date()),
        scrapType: adjustMode === "Scrapped" ? adjustScrapType : "",
        note: adjustNote || `${adjustMode} from inventory adjustment`,
      });

      if (!actionResult.ok) {
        setAdjustMessage("Could not log staff action.");
        return;
      }

      const updateResult = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: selected.rowNumber,
        tower: towerName,
        towerType: getInventoryTowerType(selected),
        maxPods,
        activePods: newActivePods,
        crop: towerDone ? "" : cropName,
        stage: newStage,
        seededDate: towerDone ? "" : getInventorySeededDate(selected),
        transplantDate: towerDone ? "" : getInventoryTransplantDate(selected),
        estimatedReadyDate: towerDone ? "" : getInventoryEstimatedReadyDate(selected),
        expectedLbs: towerDone ? 0 : currentExpectedLbs,
        remainingExpectedLbs: towerDone ? 0 : newRemainingLbs,
        status: newStatus,
        notes: towerDone ? "" : updatedNotes,
      });

      if (updateResult.ok) {
        setAdjustMessage(towerDone ? `${adjustMode} complete — ${towerName} is now available for new plants.` : `${adjustMode} adjustment saved.`);
        setAdjustInventoryRow("");
        setAdjustMode("Harvest");
        setAdjustPods("");
        setAdjustLbs("");
        setAdjustNote("");
        setAdjustScrapType("");
        await Promise.all([loadProductionInventory(), loadStaffActions()]);
      } else {
        setAdjustMessage(updateResult.message || "Unable to update inventory row.");
      }
    } catch (error) {
      console.error("handleInventoryAdjustment error:", error);
      setAdjustMessage("Error saving inventory adjustment.");
    }
  };


const handleEditInventory = (item: ProductionInventoryRow) => {
  setEditInventoryMessage("");
  setEditingInventoryRowNumber(String(item.rowNumber));
  setEditInventoryTower(getInventoryTower(item));
  setEditInventoryTowerType(getInventoryTowerType(item) || "Low Density");
  setEditInventoryMaxPods(String(getInventoryMaxPods(item)));
  setEditInventoryActivePods(String(getInventoryActivePods(item)));
  setEditInventoryCrop(getInventoryCrop(item));
  setEditInventoryStage(getInventoryStage(item) || "Growing");
  setEditInventorySeededDate(formatDateInput(getInventorySeededDate(item)));
  setEditInventoryTransplantDate(formatDateInput(getInventoryTransplantDate(item)));
  setEditInventoryEstimatedReadyDate(formatDateInput(getInventoryEffectiveReadyDate(item)));
  setEditInventoryHarvestType(getInventoryHarvestType(item));
  setEditInventoryExpectedLbs(String(getInventoryExpectedLbs(item)));
  setEditInventoryRemainingExpectedLbs(String(getInventoryRemainingExpectedLbs(item)));
  setEditInventoryStatus(getInventoryStatus(item) || "Active");
  setEditInventoryNotes(getInventoryNotes(item));

  setTimeout(() => {
    const editPanel = document.getElementById("edit-production-inventory");
    if (editPanel) {
      editPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
};
  const handleSaveInventoryEdits = async () => {
    if (!editingInventoryRowNumber) {
      setEditInventoryMessage("No inventory row selected.");
      return;
    }

    if (!editInventoryTower || !editInventoryCrop) {
      setEditInventoryMessage("Please enter tower and crop.");
      return;
    }

    const editTowerErr = validateTowerName(editInventoryTower);
    if (editTowerErr) { setEditInventoryMessage(editTowerErr); return; }

    if (editInventorySeededDate && editInventoryTransplantDate && editInventoryTransplantDate < editInventorySeededDate) {
      setEditInventoryMessage("Transplant date cannot be before seeded date. Check for a typo (e.g. month/day swapped).");
      return;
    }
    if (editInventoryTransplantDate && editInventoryEstimatedReadyDate && editInventoryEstimatedReadyDate < editInventoryTransplantDate) {
      setEditInventoryMessage("Estimated ready date cannot be before transplant date.");
      return;
    }

    try {
      setEditInventorySaving(true);
      setEditInventoryMessage("");

      const result = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: Number(editingInventoryRowNumber),
        tower: editInventoryTower,
        towerType: editInventoryTowerType,
        maxPods: toNumber(editInventoryMaxPods),
        activePods: toNumber(editInventoryActivePods),
        crop: editInventoryCrop,
        stage: editInventoryStage,
        seededDate: editInventorySeededDate,
        transplantDate: editInventoryTransplantDate,
        estimatedReadyDate: editInventoryEstimatedReadyDate,
        expectedLbs: toNumber(editInventoryExpectedLbs),
        remainingExpectedLbs: toNumber(editInventoryRemainingExpectedLbs),
        status: editInventoryStatus,
        notes: editInventoryNotes,
        harvestType: editInventoryHarvestType,
      });

      if (result.ok) {
        setEditInventoryMessage("Inventory changes saved.");
        await loadProductionInventory();
      } else {
        setEditInventoryMessage(result.message || "Unable to save inventory changes.");
      }
    } catch (error) {
      console.error("handleSaveInventoryEdits error:", error);
      setEditInventoryMessage("Error saving inventory changes.");
    } finally {
      setEditInventorySaving(false);
    }
  };

  const clearEditInventoryForm = () => {
    setEditingInventoryRowNumber("");
    setEditInventoryTower("");
    setEditInventoryTowerType("Low Density");
    setEditInventoryMaxPods("");
    setEditInventoryActivePods("");
    setEditInventoryCrop("");
    setEditInventoryStage("Growing");
    setEditInventorySeededDate("");
    setEditInventoryTransplantDate("");
    setEditInventoryEstimatedReadyDate("");
    setEditInventoryExpectedLbs("");
    setEditInventoryRemainingExpectedLbs("");
    setEditInventoryStatus("Active");
    setEditInventoryNotes("");
    setEditInventoryHarvestType("");
    setEditInventoryMessage("");
  };

  const handleMarkPlanted = async (task: { crop: string; totalTowers: number; earliestDueDate: string }) => {
    try {
      setDailyMessage("");

      const trayType = plantingTrayType[task.crop] || "Full Tray";
      const maxPods = HALF_TRAY_SEEDS; // each tower slot = 44 pods (Low Density)
      const expectedLbs = calculateExpectedLbs(task.crop, maxPods, "Low Density");

      // Use override count if set, otherwise derive from totalTowers
      const suggestedTrays = trayType === "Full Tray" ? Math.ceil(task.totalTowers / 2) : task.totalTowers;
      const overrideTrays = plantingTrayCount[task.crop] ? Math.max(1, parseInt(plantingTrayCount[task.crop], 10) || suggestedTrays) : suggestedTrays;
      const fullTrays = trayType === "Full Tray" ? overrideTrays : 0;
      const halfTrays = trayType === "Full Tray" ? 0 : overrideTrays;
      const towersToCreate = trayType === "Full Tray" ? overrideTrays * 2 : overrideTrays;
      const trayNote = trayType === "Full Tray"
        ? `${fullTrays} full tray${fullTrays !== 1 ? "s" : ""} (${towersToCreate} towers)`
        : `${halfTrays} half tray${halfTrays !== 1 ? "s" : ""} (${towersToCreate} towers)`;

      const matchingOrders = salesOrders
        .filter((order) => {
          const orderStatus = normalizeStatus(getOrderStatus(order));
          if (["completed", "cancelled", "harvested", "packed"].includes(orderStatus)) return false;
          return getOrderCrop(order) === task.crop && toNumber(getOrderNewTowersToPlant(order)) > 0;
        })
        .sort(
          (a, b) =>
            new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
            new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
        );

      const seedDate = plantedDates[task.crop] || formatDateInput(new Date());
      const actionResult = await postToBackend({
        action: "saveStaffAction",
        mode: "Plant",
        tower: "",
        crop: task.crop,
        lbs: "",
        podsChanged: maxPods * towersToCreate,
        status: "Completed",
        stage: "Seeded",
        date: seedDate,
        scrapType: "",
        note: `Planted ${trayNote} for due date ${task.earliestDueDate || ""}.`,
      });

      if (!actionResult.ok) {
        setDailyMessage("Unable to log planted action.");
        return;
      }

      for (let i = 0; i < towersToCreate; i += 1) {
        const invResult = await postToBackend({
          action: "saveProductionInventory",
          tower: "",
          towerType: "Low Density",
          maxPods,
          activePods: maxPods,
          crop: task.crop,
          stage: "Seeded",
          seededDate: seedDate,
          transplantDate: "",
          estimatedReadyDate: addDays(seedDate, 42),
          expectedLbs,
          remainingExpectedLbs: expectedLbs,
          status: "Active",
          notes: `Created from Plant Today task: ${trayNote}. Due by ${task.earliestDueDate || ""}`,
        });

        if (!invResult.ok) {
          setDailyMessage("Plant action logged, but inventory save failed on one or more towers.");
          await loadStaffActions();
          await loadProductionInventory();
          return;
        }
      }

      let towersLeftToAllocate = task.totalTowers;

      for (const order of matchingOrders) {
        if (towersLeftToAllocate <= 0) break;

        const currentNewTowers = toNumber(getOrderNewTowersToPlant(order));
        if (currentNewTowers <= 0) continue;

        const reduction = Math.min(currentNewTowers, towersLeftToAllocate);
        const updatedNewTowers = Math.max(0, currentNewTowers - reduction);

        const updateResult = await postToBackend({
          action: "updateSalesOrderRow",
          rowNumber: order.rowNumber,
          newTowersToPlant: updatedNewTowers,
          status: updatedNewTowers === 0 ? "In Progress" : getOrderStatus(order) || "Planned",
        });

        if (!updateResult.ok) {
          setDailyMessage("Planted inventory was created, but one or more orders were not updated.");
          await Promise.all([loadStaffActions(), loadProductionInventory(), loadSalesOrders()]);
          return;
        }

        towersLeftToAllocate -= reduction;
      }

      setDailyMessage(`Marked planted for ${task.crop}. Added ${task.totalTowers} seeded inventory entries and updated planting demand.`);
      await Promise.all([loadStaffActions(), loadProductionInventory(), loadSalesOrders()]);
    } catch (error) {
      console.error("handleMarkPlanted error:", error);
      setDailyMessage("Error marking planted.");
    }
  };

  const dismissSeedTask = (seedByDate: string, crop: string) => {
    const key = `${seedByDate}__${crop}`;
    setDismissedSeedTasks((prev) => {
      const next = new Set(prev);
      next.add(key);
      try { localStorage.setItem("dismissedSeedTasks", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const handleDeleteSeededEntry = async (rowNumber: number) => {
    try {
      const result = await postToBackend({
        action: "updateProductionInventoryStatus",
        rowNumber,
        status: "Scrapped",
      });
      if (result.ok) {
        await loadProductionInventory();
      } else {
        setDailyMessage("Unable to delete seeded entry.");
      }
    } catch (error) {
      console.error("handleDeleteSeededEntry error:", error);
      setDailyMessage("Error deleting seeded entry.");
    }
  };

  const startEditSeededEntry = (item: ProductionInventoryRow) => {
    setSeededEditRowNumber(item.rowNumber);
    setSeededEditTower(getInventoryTower(item) || "");
    setSeededEditSeededDate(getInventorySeededDate(item) || "");
    setSeededEditCrop(getInventoryCrop(item) || "");
    setSeededEditActivePods(String(getInventoryActivePods(item) || ""));
    setSeededEditMessage("");
  };

  const cancelEditSeededEntry = () => {
    setSeededEditRowNumber(null);
    setSeededEditTower("");
    setSeededEditSeededDate("");
    setSeededEditCrop("");
    setSeededEditActivePods("");
    setSeededEditMessage("");
  };

  const handleEditStaffAction = async () => {
    if (!editingStaffRow) return;
    setEditSaving(true);
    setEditMessage("");

    const oldPods = toNumber(getStaffPodsChanged(editingStaffRow));
    const newPods = Number(editPods) || 0;
    const podDelta = oldPods - newPods;

    const correctionNote = editNote.trim()
      ? editNote.trim()
      : `Corrected from ${oldPods} pods / ${toNumber(getStaffLbs(editingStaffRow))} lbs`;

    const result = await postToBackend({
      action: "updateStaffActionRow",
      rowNumber: editingStaffRow.rowNumber,
      lbs: Number(editLbs) || 0,
      podsChanged: newPods,
      note: correctionNote,
    });

    if (!result.ok) {
      setEditMessage("Failed to save — check connection and try again.");
      setEditSaving(false);
      return;
    }

    // If pods changed and tower is known, correct the production inventory
    if (podDelta !== 0) {
      const tower = getStaffTower(editingStaffRow);
      if (tower) {
        const invRow = activeInventory.find((r) => getInventoryTower(r) === tower);
        if (invRow) {
          const correctedPods = Math.max(0, toNumber(getInventoryActivePods(invRow)) + podDelta);
          await postToBackend({
            action: "updateProductionInventoryRow",
            rowNumber: invRow.rowNumber,
            tower: getInventoryTower(invRow),
            towerType: getInventoryTowerType(invRow),
            maxPods: toNumber(getInventoryMaxPods(invRow)),
            activePods: correctedPods,
            crop: getInventoryCrop(invRow),
            stage: getInventoryStage(invRow),
            seededDate: getInventorySeededDate(invRow),
            transplantDate: getInventoryTransplantDate(invRow),
            estimatedReadyDate: getInventoryEstimatedReadyDate(invRow),
            expectedLbs: toNumber(getInventoryExpectedLbs(invRow)),
            remainingExpectedLbs: toNumber(getInventoryRemainingExpectedLbs(invRow)),
            status: getInventoryStatus(invRow),
            notes: getInventoryNotes(invRow),
          });
          await loadProductionInventory();
        }
      }
    }

    await loadStaffActions();
    setEditMessage("Correction saved.");
    setTimeout(() => {
      setEditingStaffRow(null);
      setEditMessage("");
    }, 1500);
    setEditSaving(false);
  };

  const handleUndoStaffAction = async () => {
    if (!editingStaffRow) return;
    setEditSaving(true);
    setEditMessage("");

    const tower = getStaffTower(editingStaffRow);
    const crop = getStaffCrop(editingStaffRow);
    const podsChanged = toNumber(getStaffPodsChanged(editingStaffRow));
    const lbs = toNumber(getStaffLbs(editingStaffRow));

    // Search all non-closed inventory rows for this tower (includes Harvested rows)
    const invRow = tower
      ? [...productionInventory]
          .filter(r => normalizeStatus(getInventoryStatus(r)) !== "closed")
          .sort((a, b) => b.rowNumber - a.rowNumber)
          .find(r => getInventoryTower(r) === tower)
      : null;

    if (!invRow) {
      setEditMessage("Could not find this tower in production inventory.");
      setEditSaving(false);
      return;
    }

    const currentStage = normalizeStatus(getInventoryStage(invRow));
    const currentStatus = normalizeStatus(getInventoryStatus(invRow));
    const wasFullyHarvested = currentStage === "empty" || currentStatus === "harvested";
    const restoredPods = toNumber(getInventoryActivePods(invRow)) + podsChanged;
    const restoredRemainingLbs = toNumber(getInventoryRemainingExpectedLbs(invRow)) + lbs;

    await postToBackend({
      action: "updateProductionInventoryRow",
      rowNumber: invRow.rowNumber,
      tower,
      towerType: getInventoryTowerType(invRow),
      maxPods: toNumber(getInventoryMaxPods(invRow)),
      activePods: restoredPods,
      crop: getInventoryCrop(invRow) || crop,
      stage: wasFullyHarvested ? "Ready" : getInventoryStage(invRow),
      seededDate: getInventorySeededDate(invRow),
      transplantDate: getInventoryTransplantDate(invRow),
      estimatedReadyDate: getInventoryEstimatedReadyDate(invRow),
      expectedLbs: toNumber(getInventoryExpectedLbs(invRow)),
      remainingExpectedLbs: restoredRemainingLbs,
      status: "Active",
      notes: getInventoryNotes(invRow),
    });

    const originalNote = getStaffNote(editingStaffRow) || "";
    await postToBackend({
      action: "updateStaffActionRow",
      rowNumber: editingStaffRow.rowNumber,
      lbs: 0,
      podsChanged: 0,
      note: `[REVERSED] ${originalNote}`.trim(),
    });

    await Promise.all([loadStaffActions(), loadProductionInventory()]);

    const dateWarning = wasFullyHarvested ? " Seeded/transplant dates were cleared — update them in Production Inventory." : "";
    setEditMessage(`Tower restored.${dateWarning}`);
    setTimeout(() => {
      setEditingStaffRow(null);
      setEditUndoConfirm(false);
      setEditMessage("");
    }, 3000);
    setEditSaving(false);
  };

  const handleTransplantSeeded = async () => {
    if (!seededTransplantRowNumber || !seededTransplantTower) {
      setSeededTransplantMessage("Please enter a tower name.");
      return;
    }
    setSeededTransplantSaving(true);
    setSeededTransplantMessage("");
    try {
      const maxPods = getTowerMaxPods(seededTransplantTowerType);
      const sourceItem = seededInventory.find((i) => i.rowNumber === seededTransplantRowNumber);
      const existingSeededDate = sourceItem ? getInventorySeededDate(sourceItem) : "";
      const result = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: seededTransplantRowNumber,
        tower: seededTransplantTower,
        towerType: seededTransplantTowerType,
        maxPods,
        activePods: maxPods,
        crop: sourceItem ? getInventoryCrop(sourceItem) : "",
        stage: "Transplanted",
        seededDate: existingSeededDate,
        transplantDate: seededTransplantDate,
        estimatedReadyDate: addDays(seededTransplantDate, 21),
      });
      if (result.ok) {
        // Close any empty tower row for this tower so it no longer shows as available
        const emptyRow = activeInventory.find(
          (r) => getInventoryTower(r) === seededTransplantTower &&
                 normalizeStatus(getInventoryStage(r)) === "empty" &&
                 r.rowNumber !== seededTransplantRowNumber
        );
        if (emptyRow) {
          await postToBackend({ action: "updateProductionInventoryStatus", rowNumber: emptyRow.rowNumber, status: "Closed" });
        }
        setSeededTransplantRowNumber(null);
        setSeededTransplantTower("");
        setSeededTransplantTowerType("Low Density");
        setSeededTransplantDate(formatDateInput(new Date()));
        setSeededTransplantMessage("");
        await loadProductionInventory();
      } else {
        setSeededTransplantMessage(result.message || "Unable to save transplant.");
      }
    } catch (error) {
      console.error("handleTransplantSeeded error:", error);
      setSeededTransplantMessage("Error saving transplant.");
    } finally {
      setSeededTransplantSaving(false);
    }
  };

  const handleSaveSeededEdit = async () => {
    if (!seededEditRowNumber) return;
    setSeededEditSaving(true);
    setSeededEditMessage("");
    try {
      const result = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: seededEditRowNumber,
        tower: seededEditTower,
        seededDate: seededEditSeededDate,
        crop: seededEditCrop,
        activePods: toNumber(seededEditActivePods),
        estimatedReadyDate: seededEditSeededDate ? addDays(seededEditSeededDate, 42) : "",
      });
      if (result.ok) {
        setSeededEditMessage("Entry updated successfully.");
        cancelEditSeededEntry();
        await loadProductionInventory();
      } else {
        setSeededEditMessage(result.message || "Unable to save changes.");
      }
    } catch (error) {
      console.error("handleSaveSeededEdit error:", error);
      setSeededEditMessage("Error saving changes.");
    } finally {
      setSeededEditSaving(false);
    }
  };

  const handleAddSeededTray = async () => {
    if (!addTrayCrop) { setAddTrayMessage("Please select a crop."); return; }
    if (!addTrayDate) { setAddTrayMessage("Please enter a seeded date."); return; }
    setAddTraySaving(true);
    setAddTrayMessage("");
    try {
      const pods = addTrayType === "Full Tray" ? FULL_TRAY_SEEDS : HALF_TRAY_SEEDS;
      const readyDate = addDays(addTrayDate, 42);
      const expectedLbs = calculateExpectedLbs(normalizeCropKey(addTrayCrop), pods);
      await postToBackend({
        action: "saveProductionInventory",
        tower: addTrayTower.trim(),
        towerType: "Low Density",
        maxPods: pods,
        activePods: pods,
        crop: addTrayCrop,
        stage: "Seeded",
        seededDate: addTrayDate,
        transplantDate: "",
        estimatedReadyDate: readyDate,
        expectedLbs,
        remainingExpectedLbs: expectedLbs,
        status: "Active",
        notes: `Manually added seeded tray (${addTrayType}).`,
      });
      setAddTrayMessage("Tray added.");
      setAddTrayTower("");
      setAddTrayCrop("");
      setAddTrayType("Full Tray");
      setAddTrayDate(formatDateInput(new Date()));
      await loadProductionInventory();
    } catch (err) {
      setAddTrayMessage("Error saving tray.");
    } finally {
      setAddTraySaving(false);
    }
  };

  const handleMarkTransplanted = async () => {
    try {
      setDailyMessage("");

      if (!transplantRowNumber) {
        setDailyMessage("Please select a seeded item to transplant.");
        return;
      }

      if (!transplantTower) {
        setDailyMessage("Please enter the tower for transplant.");
        return;
      }

      const selected = productionInventory.find(
        (row) => String(row.rowNumber) === String(transplantRowNumber)
      );

      if (!selected) {
        setDailyMessage("Could not find selected seeded entry.");
        return;
      }

      const cropName = getInventoryCrop(selected);
      const maxPods = toNumber(transplantMaxPods) || getTowerMaxPods(transplantTowerType);
      const activePods = toNumber(transplantActivePods) || maxPods;
      const expectedLbs = calculateExpectedLbs(cropName, activePods, transplantTowerType);

      const actionResult = await postToBackend({
        action: "saveStaffAction",
        mode: "Transplant",
        tower: transplantTower,
        crop: cropName,
        lbs: "",
        podsChanged: activePods,
        status: "Completed",
        stage: "Transplanted",
        date: transplantDate,
        scrapType: "",
        note: transplantNotes || `Transplanted to ${transplantTower}`,
      });

      if (!actionResult.ok) {
        setDailyMessage("Could not log transplant action.");
        return;
      }

      const updateResult = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: selected.rowNumber,
        tower: transplantTower,
        towerType: transplantTowerType,
        maxPods,
        activePods,
        crop: cropName,
        stage: "Transplanted",
        seededDate: getInventorySeededDate(selected),
        transplantDate: transplantDate,
        estimatedReadyDate: transplantReadyDate,
        expectedLbs,
        remainingExpectedLbs: expectedLbs,
        status: "Active",
        notes: transplantNotes || getInventoryNotes(selected),
      });

      if (!updateResult.ok) {
        setDailyMessage(updateResult.message || "Unable to update production inventory for transplant.");
        return;
      }

      // Close any empty tower row for this tower so it no longer shows as available
      const emptyTowerRow = activeInventory.find(
        (r) => getInventoryTower(r) === transplantTower &&
               normalizeStatus(getInventoryStage(r)) === "empty" &&
               String(r.rowNumber) !== String(transplantRowNumber)
      );
      if (emptyTowerRow) {
        await postToBackend({ action: "updateProductionInventoryStatus", rowNumber: emptyTowerRow.rowNumber, status: "Closed" });
      }

      const matchingOrders = salesOrders
        .filter((order) => {
          const orderStatus = normalizeStatus(getOrderStatus(order));
          if (["completed", "cancelled", "packed"].includes(orderStatus)) return false;
          return getOrderCrop(order) === cropName;
        })
        .sort(
          (a, b) =>
            new Date(getOrderRequestedDeliveryDate(a) || "2100-01-01").getTime() -
            new Date(getOrderRequestedDeliveryDate(b) || "2100-01-01").getTime()
        );

      for (const order of matchingOrders) {
        const currentPipeline = toNumber(getOrderPipelineTowers(order));
        const currentNewTowers = toNumber(getOrderNewTowersToPlant(order));
        const currentEstimatedReadyDate = getOrderEstimatedReadyDate(order);

        if (currentNewTowers <= 0 && currentPipeline > 0) continue;

        const newPipeline = currentPipeline + 1;
        const updatedNewTowers = Math.max(0, currentNewTowers - 1);

        let updatedReadyDate = currentEstimatedReadyDate;
        if (!updatedReadyDate || new Date(transplantReadyDate) < new Date(updatedReadyDate)) {
          updatedReadyDate = transplantReadyDate;
        }

        const feasible =
          !!getOrderRequestedDeliveryDate(order) &&
          !!updatedReadyDate &&
          new Date(updatedReadyDate).getTime() <= new Date(getOrderRequestedDeliveryDate(order)).getTime()
            ? "Yes"
            : "No";

        const orderUpdateResult = await postToBackend({
          action: "updateSalesOrderRow",
          rowNumber: order.rowNumber,
          pipelineTowers: newPipeline,
          newTowersToPlant: updatedNewTowers,
          estimatedReadyDate: updatedReadyDate,
          feasible,
          status: "In Progress",
        });

        if (!orderUpdateResult.ok) {
          setDailyMessage("Transplant saved, but one or more orders were not updated.");
          await Promise.all([loadProductionInventory(), loadStaffActions(), loadSalesOrders()]);
          return;
        }

        break;
      }

      setDailyMessage(`Transplanted ${cropName} into tower ${transplantTower} and synced order pipeline.`);
      setTransplantRowNumber("");
      setTransplantTower("");
      setTransplantTowerType("Low Density");
      setTransplantMaxPods(String(getTowerMaxPods("Low Density")));
      setTransplantActivePods(String(getTowerMaxPods("Low Density")));
      setTransplantDate(formatDateInput(new Date()));
      setTransplantReadyDate(addDays(formatDateInput(new Date()), 21));
      setTransplantNotes("");

      await Promise.all([loadProductionInventory(), loadStaffActions(), loadSalesOrders()]);
    } catch (error) {
      console.error("handleMarkTransplanted error:", error);
      setDailyMessage("Error marking transplanted.");
    }
  };

  const startReadyHarvestAction = (item: ProductionInventoryRow) => {
    const rowId = String(item.rowNumber);
    setActiveHarvestRowNumber(rowId);
    setHarvestActionType(getEffectiveHarvestType(item));
    setHarvestPodsValue(String(getInventoryActivePods(item) || ""));
    setHarvestOutputUnit("Lbs");
    setHarvestOutputQty(String(getInventoryRemainingExpectedLbs(item) || ""));
    setHarvestNote("");
  };

  const clearReadyHarvestAction = () => {
    setActiveHarvestRowNumber("");
    setHarvestActionType("Full Harvest");
    setHarvestPodsValue("");
    setHarvestOutputUnit("Lbs");
    setHarvestOutputQty("");
    setHarvestNote("");
  };

  const handleReadyHarvestSubmit = async () => {
    try {
      setDailyMessage("");

      const selected = productionInventory.find((row) => String(row.rowNumber) === activeHarvestRowNumber);
      if (!selected) {
        setDailyMessage("Please choose a ready-to-harvest row.");
        return;
      }

      const outputQty = toNumber(harvestOutputQty);
      const podsWorked = toNumber(harvestPodsValue);
      const currentActivePods = toNumber(getInventoryActivePods(selected));
      const currentRemainingLbs = toNumber(getInventoryRemainingExpectedLbs(selected));
      const currentExpectedLbs = toNumber(getInventoryExpectedLbs(selected));
      const harvestLbs = quantityToLbs(harvestOutputUnit, outputQty);

      if (!outputQty || harvestLbs < 0) {
        setDailyMessage("Please enter harvested quantity.");
        return;
      }

      if (!podsWorked) {
        setDailyMessage(harvestActionType === "Trim Harvest" ? "Please enter how many pods were trimmed." : "Please enter how many pods were harvested.");
        return;
      }

      if (podsWorked > currentActivePods) {
        setDailyMessage("You cannot harvest or trim more pods than are active.");
        return;
      }

      if (harvestLbs > currentRemainingLbs + 0.001) {
        setDailyMessage("Harvested weight cannot be more than remaining harvestable pounds.");
        return;
      }

      const isFullHarvest = harvestActionType === "Full Harvest";
      const newActivePods = isFullHarvest ? Math.max(0, currentActivePods - podsWorked) : currentActivePods;
      const newRemainingLbs = Math.max(0, Math.round((currentRemainingLbs - harvestLbs) * 100) / 100);
      const isFinished = newActivePods <= 0 || newRemainingLbs <= 0.01;
      const towerName = getInventoryTower(selected);
      const newStatus = isFinished && towerName ? "Active" : (isFinished ? "Harvested" : getInventoryStatus(selected) || "Active");
      const newStage = isFinished && towerName ? "Empty" : (isFinished ? "Harvested" : getInventoryStage(selected) || "Ready");
      const actionNote = [
        harvestActionType,
        `${outputQty} ${getUnitLabel(harvestOutputUnit)}`,
        isFullHarvest ? `${podsWorked} pods harvested` : `${podsWorked} pods trimmed`,
        harvestNote,
      ]
        .filter(Boolean)
        .join(" | " );

      const actionResult = await postToBackend({
        action: "saveStaffAction",
        mode: "Harvest",
        tower: getInventoryTower(selected),
        crop: getInventoryCrop(selected),
        lbs: harvestLbs,
        podsChanged: isFullHarvest ? podsWorked : "",
        status: isFinished ? "Completed" : "Partial",
        stage: isFinished ? "Harvested" : harvestActionType === "Trim Harvest" ? "Trimmed" : "Ready",
        date: formatDateInput(new Date()),
        scrapType: "",
        note: actionNote,
      });

      if (!actionResult.ok) {
        setDailyMessage(actionResult.message || "Unable to log harvest action.");
        return;
      }

      const updatedNotes = [getInventoryNotes(selected), actionNote].filter(Boolean).join(" | ");
      const updateResult = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: selected.rowNumber,
        tower: towerName,
        towerType: getInventoryTowerType(selected),
        maxPods: toNumber(getInventoryMaxPods(selected)),
        activePods: newActivePods,
        crop: isFinished && towerName ? "" : getInventoryCrop(selected),
        stage: newStage,
        seededDate: isFinished && towerName ? "" : getInventorySeededDate(selected),
        transplantDate: isFinished && towerName ? "" : getInventoryTransplantDate(selected),
        estimatedReadyDate: isFinished && towerName ? "" : getInventoryEstimatedReadyDate(selected),
        expectedLbs: isFinished && towerName ? 0 : currentExpectedLbs,
        remainingExpectedLbs: isFinished && towerName ? 0 : newRemainingLbs,
        status: newStatus,
        notes: isFinished && towerName ? "" : updatedNotes,
      });

      if (!updateResult.ok) {
        setDailyMessage(updateResult.message || "Unable to update ready-to-harvest inventory row.");
        return;
      }

      setDailyMessage(
        isFinished && towerName
          ? `Harvest complete — ${towerName} is now available for new plants.`
          : isFinished
          ? `Harvest saved for ${getInventoryCrop(selected)}. Row complete.`
          : `Harvest saved for ${getInventoryCrop(selected)}.`
      );
      clearReadyHarvestAction();
      await Promise.all([loadProductionInventory(), loadStaffActions()]);
    } catch (error) {
      console.error("handleReadyHarvestSubmit error:", error);
      setDailyMessage("Error marking harvested.");
    }
  };

  const handleQuickHarvest = async () => {
    if (!qhRowNumber || !qhType) { setQhMessage("Please select a tower and harvest type."); return; }
    const selected = activeInventory.find((r) => String(r.rowNumber) === qhRowNumber);
    if (!selected) { setQhMessage("Tower not found."); return; }
    const currentActivePods = toNumber(getInventoryActivePods(selected));
    const currentRemainingLbs = toNumber(getInventoryRemainingExpectedLbs(selected));
    const currentExpectedLbs = toNumber(getInventoryExpectedLbs(selected));
    const crop = getInventoryCrop(selected);

    setQhSaving(true);
    setQhMessage("");
    try {
      if (qhType === "Scrap") {
        const actionNote = ["Scrapped", qhScrapReason].filter(Boolean).join(" | ");
        const actionResult = await postToBackend({
          action: "saveStaffAction",
          mode: "Scrapped",
          tower: getInventoryTower(selected),
          crop,
          lbs: currentRemainingLbs,
          podsChanged: currentActivePods,
          status: "Completed",
          stage: "Scrapped",
          date: formatDateInput(new Date()),
          scrapType: qhScrapReason,
          note: actionNote,
        });
        if (!actionResult.ok) { setQhMessage(actionResult.message || "Failed to log scrap."); setQhSaving(false); return; }

        const updateResult = await postToBackend({
          action: "updateProductionInventoryRow",
          rowNumber: selected.rowNumber,
          tower: getInventoryTower(selected),
          towerType: getInventoryTowerType(selected),
          maxPods: toNumber(getInventoryMaxPods(selected)),
          activePods: 0,
          crop: "",
          stage: "Empty",
          seededDate: "",
          transplantDate: "",
          estimatedReadyDate: "",
          expectedLbs: 0,
          remainingExpectedLbs: 0,
          status: "Active",
          notes: "",
        });
        if (!updateResult.ok) { setQhMessage(updateResult.message || "Scrap logged but inventory update failed."); setQhSaving(false); return; }

        setQhMessage(`${crop} scrapped — ${getInventoryTower(selected)} is now available for new plants.`);
      } else {
        const outputQty = toNumber(qhQty);
        const podsWorked = toNumber(qhPods);
        const harvestLbs = quantityToLbs(qhUnit, outputQty);
        if (!outputQty) { setQhMessage("Please enter harvested quantity."); setQhSaving(false); return; }
        if (!podsWorked) { setQhMessage(qhType === "Trim Harvest" ? "Please enter pods trimmed." : "Please enter pods harvested."); setQhSaving(false); return; }
        if (podsWorked > currentActivePods) { setQhMessage("Cannot harvest more pods than are active."); setQhSaving(false); return; }
        if (harvestLbs > currentRemainingLbs + 0.001) { setQhMessage("Harvested weight exceeds remaining harvestable lbs."); setQhSaving(false); return; }

        const isFullHarvest = qhType === "Full Harvest";
        const newActivePods = isFullHarvest ? Math.max(0, currentActivePods - podsWorked) : currentActivePods;
        const newRemainingLbs = Math.max(0, Math.round((currentRemainingLbs - harvestLbs) * 100) / 100);
        const isFinished = newActivePods <= 0 || newRemainingLbs <= 0.01;
        const qhTowerName = getInventoryTower(selected);
        const newStatus = isFinished && qhTowerName ? "Active" : (isFinished ? "Harvested" : getInventoryStatus(selected) || "Active");
        const newStage = isFinished && qhTowerName ? "Empty" : (isFinished ? "Harvested" : isFullHarvest ? "Ready" : "Trimmed");
        const actionNote = [qhType, `${outputQty} ${getUnitLabel(qhUnit)}`, isFullHarvest ? `${podsWorked} pods harvested` : `${podsWorked} pods trimmed`, qhNote].filter(Boolean).join(" | ");

        const actionResult = await postToBackend({
          action: "saveStaffAction",
          mode: "Harvest",
          tower: qhTowerName,
          crop,
          lbs: harvestLbs,
          podsChanged: isFullHarvest ? podsWorked : "",
          status: isFinished ? "Completed" : "Partial",
          stage: isFinished ? "Harvested" : newStage,
          date: formatDateInput(new Date()),
          scrapType: "",
          note: actionNote,
        });
        if (!actionResult.ok) { setQhMessage(actionResult.message || "Failed to log harvest."); setQhSaving(false); return; }

        const updateResult = await postToBackend({
          action: "updateProductionInventoryRow",
          rowNumber: selected.rowNumber,
          tower: qhTowerName,
          towerType: getInventoryTowerType(selected),
          maxPods: toNumber(getInventoryMaxPods(selected)),
          activePods: newActivePods,
          crop: isFinished && qhTowerName ? "" : crop,
          stage: newStage,
          seededDate: isFinished && qhTowerName ? "" : getInventorySeededDate(selected),
          transplantDate: isFinished && qhTowerName ? "" : getInventoryTransplantDate(selected),
          estimatedReadyDate: isFinished && qhTowerName ? "" : getInventoryEstimatedReadyDate(selected),
          expectedLbs: isFinished && qhTowerName ? 0 : currentExpectedLbs,
          remainingExpectedLbs: isFinished && qhTowerName ? 0 : newRemainingLbs,
          status: newStatus,
          notes: isFinished && qhTowerName ? "" : [getInventoryNotes(selected), actionNote].filter(Boolean).join(" | "),
        });
        if (!updateResult.ok) { setQhMessage(updateResult.message || "Harvest logged but inventory update failed."); setQhSaving(false); return; }

        if (qhOrderRowNumber) {
          const linkedOrder = salesOrders.find((o) => String(o.rowNumber) === qhOrderRowNumber);
          if (linkedOrder) {
            const orderUnitType = getOrderUnitType(linkedOrder);
            const orderQtyLbs = quantityToLbs(orderUnitType, toNumber(getOrderQuantityNeeded(linkedOrder)));
            const remainingLbs = Math.max(0, orderQtyLbs - harvestLbs);
            if (remainingLbs <= 0.001) {
              await postToBackend({ action: "updateOrderStatus", rowNumber: linkedOrder.rowNumber, status: "Harvested" });
            } else {
              const remainingQty = availableLbsToUnitQty(orderUnitType, remainingLbs, 0);
              await postToBackend({
                action: "updateSalesOrderRow",
                rowNumber: linkedOrder.rowNumber,
                quantityNeeded: remainingQty,
                status: "In Progress",
              });
            }
            await loadSalesOrders();
          }
        }

        setQhMessage(isFinished && qhTowerName ? `Harvest complete — ${qhTowerName} is now available for new plants.` : isFinished ? `Harvest complete for ${crop}.` : `${qhType} saved for ${crop}.`);
      }

      setQhRowNumber("");
      setQhType(null);
      setQhQty("");
      setQhPods("");
      setQhNote("");
      setQhScrapReason("");
      setQhOrderRowNumber("");
      await Promise.all([loadProductionInventory(), loadStaffActions()]);
    } catch (err) {
      console.error("handleQuickHarvest error:", err);
      setQhMessage("Error saving.");
    } finally {
      setQhSaving(false);
    }
  };

  const handleMarkPacked = async (task: {
    rowNumber: number;
    customer: string;
    crop: string;
    unitType: string;
    quantityNeeded: number;
    dueDate: string;
  }) => {
    try {
      setDailyMessage("");

      const result = await postToBackend({
        action: "saveStaffAction",
        mode: "Pack",
        tower: "",
        crop: task.crop,
        lbs: task.unitType === "Plants" ? "" : quantityToLbs(task.unitType, task.quantityNeeded),
        podsChanged: task.unitType === "Plants" ? task.quantityNeeded : "",
        status: "Completed",
        stage: "Packed",
        date: formatDateInput(new Date()),
        scrapType: "",
        note: `Packed for ${task.customer}. Due date ${task.dueDate || ""}`,
      });

      if (!result.ok) {
        setDailyMessage(result.message || "Unable to mark packed.");
        return;
      }

      const statusResult = await postToBackend({
        action: "updateOrderStatus",
        rowNumber: task.rowNumber,
        status: "Packed",
      });

      if (statusResult.ok) {
        setDailyMessage(`Marked packed for ${task.customer} - ${task.crop}.`);
        await Promise.all([loadStaffActions(), loadSalesOrders()]);
      } else {
        setDailyMessage("Packed logged, but order status was not updated.");
      }
    } catch (error) {
      console.error("handleMarkPacked error:", error);
      setDailyMessage("Error marking packed.");
    }
  };

  const uniqueModes = Array.from(new Set(staffRows.map((r) => getStaffMode(r)).filter(Boolean))).sort();
 const uniqueCrops = Array.from(
  new Set(
    [
      ...Object.keys(CROP_PROFILES),
      ...staffRows.map((r) => getStaffCrop(r)),
      ...salesOrders.map((r) => getOrderCrop(r)),
      ...productionInventory.map((r) => getInventoryCrop(r)),
    ]
      .filter(Boolean)
      .map((crop) => formatCropLabel(String(crop)))
  )
).sort((a, b) => a.localeCompare(b));
  const uniqueTowers = Array.from(
    new Set([...staffRows.map((r) => getStaffTower(r)), ...productionInventory.map((r) => getInventoryTower(r))].filter(Boolean))
  ).sort();
  const uniqueCustomers = Array.from(new Set(salesOrders.map((r) => getOrderCustomer(r)).filter(Boolean))).sort();
  const uniqueOrderStatuses = Array.from(new Set(salesOrders.map((r) => getOrderStatus(r)).filter(Boolean))).sort();

  return (
    <div style={pageStyle}>
      <style>{`
        button:disabled { opacity: 0.55; cursor: not-allowed; }
        @keyframes btn-spin { to { transform: rotate(360deg); } }
        .btn-saving::after {
          content: '';
          display: inline-block;
          width: 11px;
          height: 11px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: btn-spin 0.65s linear infinite;
          margin-left: 7px;
          vertical-align: middle;
        }
        @media (max-width: 640px) {
          table th, table td { padding: 8px 6px !important; font-size: 13px !important; }
          .gh-subtitle { display: none; }
        }
        @media (max-width: 400px) {
          table th, table td { padding: 6px 4px !important; font-size: 12px !important; }
        }
      `}</style>
      <div style={containerStyle}>
        <header
          style={{
            ...headerStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0, flex: "1 1 200px" }}>
            <img
              src="/gardennobkgd.png"
              alt="Switchpoint Garden"
              style={{
                height: "clamp(64px, 14vw, 112px)",
                width: "auto",
                display: "block",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.15 }}>
                Switchpoint Greenhouse Dashboard
              </h1>
              <p className="gh-subtitle" style={{ margin: "10px 0 0 0", opacity: 0.9, fontSize: 15 }}>
                Mobile-friendly operations build for dashboard, production inventory, and staff daily tasks.
              </p>
            </div>
          </div>
        </header>

        <div style={navWrapStyle}>
          <div style={navButtonsStyle}>
            <button onClick={() => setActivePage("dashboard")} style={activePage === "dashboard" ? navButtonActiveStyle : navButtonStyle}>
              Dashboard
            </button>
            <button onClick={() => setActivePage("staffDaily")} style={activePage === "staffDaily" ? navButtonActiveStyle : navButtonStyle}>
              Staff Daily
            </button>
            <button onClick={() => setActivePage("inventory")} style={activePage === "inventory" ? navButtonActiveStyle : navButtonStyle}>
              Production Inventory
            </button>
            <button onClick={() => setActivePage("contracts")} style={activePage === "contracts" ? navButtonActiveStyle : navButtonStyle}>
              Contracts
            </button>
            <button onClick={() => setActivePage("staffBoard")} style={activePage === "staffBoard" ? navButtonActiveStyle : navButtonStyle}>
              Staff Board
            </button>
          </div>

          <button onClick={loadAllData} style={secondaryButtonStyle}>
            {loadingData ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {activePage === "dashboard" && (
          <div style={sectionStackStyle}>
            <ResponsiveStatGrid>
              <StatCard label="Harvested This Week (lbs)" value={dashboardStats.harvestedThisWeek} />
              <StatCard label="Scrapped This Week (lbs)" value={dashboardStats.scrappedThisWeek} />
              <StatCard label="Harvested Prev Week (lbs)" value={dashboardStats.harvestedPrevWeek} />
              <StatCard label="Scrapped Prev Week (lbs)" value={dashboardStats.scrappedPrevWeek} />
              <StatCard label="Pods in Production" value={dashboardStats.podsInProduction} />
              <StatCard label="Active Seeds" value={dashboardStats.activeSeeds} />
              <StatCard label="This Week to Kitchen (lbs)" value={dashboardStats.kitchenLbs} />
              <StatCard label="This Week to Pantry (lbs)" value={dashboardStats.pantryLbs} />
              <StatCard label="Prev Week to Kitchen (lbs)" value={dashboardStats.kitchenLbsPrevWeek} />
              <StatCard label="Prev Week to Pantry (lbs)" value={dashboardStats.pantryLbsPrevWeek} />
            </ResponsiveStatGrid>

            {/* Row 1: Executive Alerts (full width) */}
            <Panel title="Executive Alerts">
              <div style={{ maxHeight: 280, overflowY: "auto", overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Priority</th>
                      <th style={thStyle}>Alert</th>
                      <th style={thStyle}>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executiveAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={tdStyle}>No critical alerts right now.</td>
                      </tr>
                    ) : (
                      executiveAlerts.map((alert, index) => (
                        <tr key={`${alert.title}-${index}`}>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: alert.level === "Severe" ? "#ef4444" : alert.level === "Medium" ? "#eab308" : "#94a3b8",
                                flexShrink: 0,
                              }} />
                              {alert.level}
                            </div>
                          </td>
                          <td style={tdStyle}>{alert.title}</td>
                          <td style={tdStyle}>{alert.detail}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* Row 2: Saved Orders (full width) */}
            <Panel title="Saved Orders">
              <FormGrid columns={3}>
                <Field label="Status Filter">
                  <select value={savedOrderStatusFilter} onChange={(e) => setSavedOrderStatusFilter(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueOrderStatuses.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Crop Filter">
                  <select value={savedOrderCropFilter} onChange={(e) => setSavedOrderCropFilter(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueCrops.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Customer Filter">
                  <select value={savedOrderCustomerFilter} onChange={(e) => setSavedOrderCustomerFilter(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueCustomers.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Due Filter">
                  <select value={savedOrderDueFilter} onChange={(e) => setSavedOrderDueFilter(e.target.value as "All" | "Current Week")} style={inputStyle}>
                    <option value="All">All</option>
                    <option value="Current Week">Current Week</option>
                  </select>
                </Field>
              </FormGrid>
              <div style={{ maxHeight: 340, overflowY: "auto", overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}></th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Delivery</th>
                      <th style={thStyle}>Crops</th>
                      <th style={thStyle}>New Towers</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSavedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={tdStyle}>No saved orders.</td>
                      </tr>
                    ) : (
                      groupedSavedOrders.flatMap((group) => {
                        const expanded = !!expandedSavedOrderGroups[group.key];
                        const summaryRow = (
                          <tr key={group.key} style={group.isOverdue ? { background: "#fef2f2" } : undefined}>
                            <td style={tdStyle}>
                              <button
                                onClick={() => setExpandedSavedOrderGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                                style={{ ...secondaryButtonStyle, padding: "6px 10px", minWidth: 38 }}
                              >
                                {expanded ? "▾" : "▸"}
                              </button>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{group.customer}</td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {formatDateDisplay(group.dueDate)}
                                {group.isOverdue && (
                                  <span style={{ fontSize: 10, fontWeight: 700, background: "#dc2626", color: "white", padding: "1px 6px", borderRadius: 8 }}>OVERDUE</span>
                                )}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, fontSize: 12, color: "#475569" }}>{group.cropSummary}</td>
                            <td style={tdStyle}>{group.totalNewTowers}</td>
                            <td style={tdStyle}>
                              <select
                                value={group.status || "Planned"}
                                onChange={(e) => handleGroupStatusChange(group.key, e.target.value)}
                                style={{
                                  ...compactInputStyle,
                                  fontWeight: 600,
                                  background: ({ Planned: "#f1f5f9", "In Progress": "#dbeafe", Harvested: "#dcfce7", Packed: "#d1fae5", Completed: "#bbf7d0", Cancelled: "#fee2e2" } as Record<string, string>)[group.status] || "#f1f5f9",
                                  color: ({ Planned: "#475569", "In Progress": "#1d4ed8", Harvested: "#15803d", Packed: "#166534", Completed: "#14532d", Cancelled: "#dc2626" } as Record<string, string>)[group.status] || "#475569",
                                }}
                              >
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Harvested">Harvested</option>
                                <option value="Packed">Packed</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        );

                        if (!expanded) return [summaryRow];

                        const detailRows = group.items.map((order) => (
                          <tr key={`${group.key}-${order.rowNumber}`} style={{ background: "#f8fafc" }}>
                            <td style={tdStyle}></td>
                            <td style={{ ...tdStyle, paddingLeft: 24 }} colSpan={2}>
                              <span style={{ fontWeight: 500 }}>{getOrderCrop(order)}</span>
                              <span style={{ color: "#64748b" }}> — {getOrderUnitType(order)} × {getOrderQuantityNeeded(order)}</span>
                              <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>
                                {getOrderType(order)}{getOrderFrequency(order) ? ` / ${getOrderFrequency(order)}` : ""}
                              </span>
                            </td>
                            <td style={tdStyle}>{getOrderNewTowersToPlant(order)}</td>
                            <td colSpan={2} style={tdStyle}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                <select
                                  value={getOrderStatus(order) || "Planned"}
                                  onChange={(e) => handleOrderStatusChange(order.rowNumber, e.target.value)}
                                  style={compactInputStyle}
                                >
                                  <option value="Planned">Planned</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Harvested">Harvested</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <button onClick={() => startEditSalesOrder(order)} style={primaryButtonStyle}>Edit</button>
                                <button
                                  onClick={() => {
                                    const customer = getOrderCustomer(order) || "this order";
                                    const crop = getOrderCrop(order) || "";
                                    if (window.confirm(`Cancel ${crop ? crop + " order" : "order"} for ${customer}? This cannot be undone.`)) {
                                      handleCancelSalesOrder(order.rowNumber);
                                    }
                                  }}
                                  style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                                >Cancel Order</button>
                              </div>
                            </td>
                          </tr>
                        ));

                        return [summaryRow, ...detailRows];
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Harvested and Cancelled orders are removed automatically. Changing status on the summary row updates all items in that delivery at once.
              </div>
            </Panel>

            {/* Sales Planner / Order Planner (full width) */}
            <Panel title="Sales Planner / Order Planner">
              <FormGrid columns={2}>
                <Field label="Customer">
                  <input value={salesCustomer} onChange={(e) => setSalesCustomer(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Order Type">
                  <select value={salesOrderType} onChange={(e) => setSalesOrderType(e.target.value as "One-Time" | "Contract")} style={inputStyle}>
                    <option value="One-Time">One-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </Field>

                {salesOrderType === "One-Time" ? (
                  <Field label="Requested Delivery Date">
                    <input type="date" value={salesDeliveryDate} onChange={(e) => setSalesDeliveryDate(e.target.value)} style={inputStyle} />
                  </Field>
                ) : (
                  <>
                    <Field label="Frequency">
                      <select value={salesFrequency} onChange={(e) => setSalesFrequency(e.target.value)} style={inputStyle}>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </Field>
                    <Field label="Contract Start Date">
                      <input type="date" value={salesContractStartDate} onChange={(e) => setSalesContractStartDate(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Contract End Date">
                      <input type="date" value={salesContractEndDate} onChange={(e) => setSalesContractEndDate(e.target.value)} style={inputStyle} />
                    </Field>
                  </>
                )}
              </FormGrid>

              <div style={{ marginBottom: 8 }}>
                <TableScroll>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Crop</th>
                        <th style={thStyle}>Unit</th>
                        <th style={thStyle}>Qty</th>
                        <th style={thStyle}>Approx Lbs</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftOrderLines.map((line) => (
                        <tr key={line.id}>
                          <td style={tdStyle}>
                            <select
                              value={line.crop}
                              onChange={(e) => updateDraftOrderLine(line.id, "crop", e.target.value)}
                              style={compactInputStyle}
                            >
                              <option value="">Select Crop</option>
                              {uniqueCrops.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </td>
                          <td style={tdStyle}>
                            <select
                              value={line.unitType}
                              onChange={(e) => updateDraftOrderLine(line.id, "unitType", e.target.value)}
                              style={compactInputStyle}
                            >
                              <option value="Lbs">Lbs</option>
                              <option value="Plants">Plants</option>
                              <option value="6oz Bag">6oz Bag</option>
                              <option value="6oz Clamshell">6oz Clamshell</option>
                              <option value="0.75oz Small Bag">0.75oz Small Bag</option>
                            </select>
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              min="0"
                              value={line.quantityNeeded}
                              onChange={(e) => updateDraftOrderLine(line.id, "quantityNeeded", e.target.value)}
                              style={{ ...compactInputStyle, width: 80 }}
                              placeholder="0"
                            />
                          </td>
                          <td style={tdStyle}>{quantityToLbs(line.unitType, toNumber(line.quantityNeeded))}</td>
                          <td style={tdStyle}>
                            {draftOrderLines.length > 1 && (
                              <button
                                onClick={() => removeDraftOrderLine(line.id)}
                                style={{ ...secondaryButtonStyle, padding: "4px 8px" }}
                              >✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
                {!editingSalesOrderRowNumber && (
                  <button onClick={addDraftOrderRow} style={{ ...secondaryButtonStyle, marginTop: 6 }}>
                    + Add Row
                  </button>
                )}
              </div>

              <Field label="Notes">
                <textarea value={salesNotes} onChange={(e) => setSalesNotes(e.target.value)} style={textareaStyle} />
              </Field>

              <MetricGrid>
                <MiniMetric label="Available Lbs" value={salesPlanner.availableQty} />
                <MiniMetric label="Shortage Lbs" value={salesPlanner.shortageQty} />
                <MiniMetric label="Total Order Lbs" value={salesPlanner.qtyNeededInLbs} />
                <MiniMetric label="Towers Needed" value={salesPlanner.towersNeeded} />
                <MiniMetric label="Pipeline Towers" value={salesPlanner.pipelineTowers} />
                <MiniMetric label="New Towers To Plant" value={salesPlanner.newTowersToPlant} />
                <MiniMetric
                  label={salesOrderType === "Contract" ? "First Problem Delivery" : "Earliest Delivery Date"}
                  value={salesPlanner.estimatedReadyDate ? formatDateDisplay(salesPlanner.estimatedReadyDate) : salesPlanner.deliveryFeasible ? "Can Fulfill" : "-"}
                />
                <MiniMetric label="Feasible" value={salesPlanner.deliveryFeasible ? "Yes" : salesPlanner.shortageQty > 0 ? "No" : "-"} />
              </MetricGrid>

              {editingSalesOrderRowNumber && (
                <div style={{ marginBottom: 14 }}>
                  <button onClick={cancelEditSalesOrder} style={secondaryButtonStyle}>
                    Cancel Edit
                  </button>
                </div>
              )}

              <ActionRow message={salesSaveMessage}>
                <button onClick={handleSaveOrder} style={primaryButtonStyle} disabled={salesSaving}>
                  {salesSaving ? "Saving..." : editingSalesOrderRowNumber ? "Update Order" : "Save Order"}
                </button>
              </ActionRow>
            </Panel>

            {/* Row 3: Short Orders | Seeding Calendar */}
            <ResponsiveTwoPanelGrid>
              <Panel title="Short Orders / Planting Pressure">
                <TableScroll>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Crop</th>
                        <th style={thStyle}>Due Date</th>
                        <th style={thStyle}>Shortage Qty</th>
                        <th style={thStyle}>Towers Still Needed</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortageAlerts.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={tdStyle}>No shortage warnings right now.</td>
                        </tr>
                      ) : (
                        shortageAlerts.slice(0, 10).map((item) => (
                          <tr key={item.rowNumber}>
                            <td style={tdStyle}>{item.customer}</td>
                            <td style={tdStyle}>{item.crop}</td>
                            <td style={tdStyle}>{formatDateDisplay(item.dueDate)}</td>
                            <td style={tdStyle}>{item.shortageQty}</td>
                            <td style={tdStyle}>{item.newTowers}</td>
                            <td style={tdStyle}>{item.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </TableScroll>
              </Panel>
              <Panel title="Seeding Calendar">
                <TableScroll>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Seed Week</th>
                        <th style={thStyle}>Crop</th>
                        <th style={thStyle}>Towers</th>
                        <th style={thStyle}>Seed By</th>
                        <th style={thStyle}>Ready By</th>
                        <th style={thStyle}>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seedingCalendar.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={tdStyle}>No seeding needed yet.</td>
                        </tr>
                      ) : (
                        seedingCalendar.flatMap(([weekOf, items]) =>
                          items.map((item, index) => (
                            <tr key={`${weekOf}-${item.crop}-${item.seedByDate}`}>
                              <td style={tdStyle}>{index === 0 ? formatDateDisplay(weekOf) : ""}</td>
                              <td style={tdStyle}>{item.crop}</td>
                              <td style={tdStyle}>{item.towers}</td>
                              <td style={tdStyle}>{formatDateDisplay(item.seedByDate)}</td>
                              <td style={tdStyle}>{formatDateDisplay(item.firstDueDate)}</td>
                              <td style={tdStyle}>{item.orders}</td>
                            </tr>
                          ))
                        )
                      )}
                    </tbody>
                  </table>
                </TableScroll>
              </Panel>
            </ResponsiveTwoPanelGrid>

            {/* Row 4: Recent Activity (full width at bottom) */}
            <Panel title="Recent Activity">
              <FormGrid columns={3}>
                <Field label="Mode Filter">
                  <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueModes.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Crop Filter">
                  <select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueCrops.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tower Filter">
                  <select value={filterTower} onChange={(e) => setFilterTower(e.target.value)} style={inputStyle}>
                    <option value="All">All</option>
                    {uniqueTowers.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </FormGrid>
              <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Mode</th>
                      <th style={thStyle}>Tower</th>
                      <th style={thStyle}>Crop</th>
                      <th style={thStyle}>Lbs</th>
                      <th style={thStyle}>Pods</th>
                      <th style={thStyle}>Note</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentActivity.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={tdStyle}>No recent activity.</td>
                      </tr>
                    ) : (
                      filteredRecentActivity.slice(0, 10).map((row) => {
                        const lbs = toNumber(getStaffLbs(row));
                        const pods = toNumber(getStaffPodsChanged(row));
                        const note = getStaffNote(row) || "";
                        const shortNote = note.length > 60 ? note.slice(0, 60) + "…" : note;
                        return (
                          <tr key={row.rowNumber}>
                            <td style={tdStyle}>{formatDateTimeDisplay(getStaffTimestamp(row))}</td>
                            <td style={tdStyle}>{getStaffMode(row)}</td>
                            <td style={tdStyle}>{getStaffTower(row)}</td>
                            <td style={tdStyle}>{getStaffCrop(row)}</td>
                            <td style={tdStyle}>{lbs > 0 ? Math.round(lbs * 100) / 100 : ""}</td>
                            <td style={tdStyle}>{pods > 0 ? pods : ""}</td>
                            <td style={{ ...tdStyle, maxWidth: 220 }} title={note}>{shortNote}</td>
                            <td style={tdStyle}>
                              <button
                                onClick={() => {
                                  setEditingStaffRow(row);
                                  setEditLbs(String(toNumber(getStaffLbs(row))));
                                  setEditPods(String(toNumber(getStaffPodsChanged(row))));
                                  setEditNote(getStaffNote(row) || "");
                                  setEditMessage("");
                                }}
                                style={{ ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12, minHeight: 32 }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Showing 10 most recent entries.
              </div>
            </Panel>
          </div>
        )}

        {activePage === "inventory" && (
          <div style={sectionStackStyle}>
            <Panel title="Add Production Inventory">
              <FormGrid columns={3}>
                <Field label="Tower">
                  <input value={inventoryTower} onChange={(e) => setInventoryTower(e.target.value)} style={inputStyle} placeholder="R1" />
                </Field>

                <Field label="Tower Type">
                  <select value={inventoryTowerType} onChange={(e) => setInventoryTowerType(e.target.value)} style={inputStyle}>
                    <option value="Low Density">Low Density (44 pods)</option>
                    <option value="High Density">High Density (160 pods)</option>
                  </select>
                </Field>

                <Field label="Max Pods">
                  <input value={inventoryMaxPods} onChange={(e) => setInventoryMaxPods(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Active Pods">
                  <input value={inventoryActivePods} onChange={(e) => setInventoryActivePods(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Crop">
                  <select value={inventoryCrop} onChange={(e) => setInventoryCrop(e.target.value)} style={inputStyle}>
                    <option value="">Select Crop</option>
                    {uniqueCrops.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Stage">
                  <select value={inventoryStage} onChange={(e) => setInventoryStage(e.target.value)} style={inputStyle}>
                    <option value="Seeded">Seeded</option>
                    <option value="Transplanted">Transplanted</option>
                    <option value="Growing">Growing</option>
                    <option value="Ready">Ready</option>
                    <option value="Harvested">Harvested</option>
                    <option value="Scrapped">Scrapped</option>
                  </select>
                </Field>

                <Field label="Harvest Type">
                  <select
                    value={inventoryHarvestType || (inventoryCrop ? (isRepeatHarvestCrop(inventoryCrop) ? "Trim Harvest" : "Full Harvest") : "Full Harvest")}
                    onChange={(e) => setInventoryHarvestType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Full Harvest">Full Harvest (harvest once)</option>
                    <option value="Trim Harvest">Trim Harvest (trim up to 5×)</option>
                  </select>
                  {inventoryCrop && (
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                      Default for {inventoryCrop}: {isRepeatHarvestCrop(inventoryCrop) ? "Trim Harvest" : "Full Harvest"}
                    </span>
                  )}
                </Field>

                <Field label="Seeded Date">
                  <input type="date" value={inventorySeededDate} onChange={(e) => setInventorySeededDate(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Transplant Date">
                  <input
                    type="date"
                    value={inventoryTransplantDate}
                    onChange={(e) => setInventoryTransplantDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Estimated Ready Date">
                  <input
                    type="date"
                    value={inventoryEstimatedReadyDate}
                    onChange={(e) => setInventoryEstimatedReadyDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Expected Lbs">
                  <input value={inventoryExpectedLbs} onChange={(e) => setInventoryExpectedLbs(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Remaining Expected Lbs">
                  <input value={inventoryRemainingExpectedLbs} onChange={(e) => setInventoryRemainingExpectedLbs(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Status">
                  <select value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value)} style={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Harvested">Harvested</option>
                    <option value="Lost">Lost</option>
                    <option value="Scrapped">Scrapped</option>
                    <option value="Closed">Closed</option>
                  </select>
                </Field>
              </FormGrid>

              <Field label="Notes">
                <input value={inventoryNotes} onChange={(e) => setInventoryNotes(e.target.value)} style={inputStyle} />
              </Field>

              <ActionRow message={inventoryMessage}>
                <button onClick={handleSaveInventory} style={primaryButtonStyle} disabled={inventorySaving}>
                  {inventorySaving ? "Saving..." : "Save Production Inventory"}
                </button>
              </ActionRow>
            </Panel>

            <div id="edit-production-inventory">
  <Panel title="Edit Production Inventory">
              <FormGrid columns={3}>
                <Field label="Selected Row">
                  <input value={editingInventoryRowNumber} readOnly style={inputStyle} placeholder="Click Edit on a row below" />
                </Field>

                <Field label="Tower">
                  <input value={editInventoryTower} onChange={(e) => setEditInventoryTower(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Tower Type">
                  <select value={editInventoryTowerType} onChange={(e) => setEditInventoryTowerType(e.target.value)} style={inputStyle}>
                    <option value="Low Density">Low Density (44 pods)</option>
                    <option value="High Density">High Density (160 pods)</option>
                  </select>
                </Field>

                <Field label="Max Pods">
                  <input value={editInventoryMaxPods} onChange={(e) => setEditInventoryMaxPods(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Active Pods">
                  <input value={editInventoryActivePods} onChange={(e) => setEditInventoryActivePods(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Crop">
                  <select value={editInventoryCrop} onChange={(e) => setEditInventoryCrop(e.target.value)} style={inputStyle}>
                    <option value="">Select Crop</option>
                    {uniqueCrops.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Stage">
                  <select value={editInventoryStage} onChange={(e) => setEditInventoryStage(e.target.value)} style={inputStyle}>
                    <option value="Seeded">Seeded</option>
                    <option value="Transplanted">Transplanted</option>
                    <option value="Growing">Growing</option>
                    <option value="Ready">Ready</option>
                    <option value="Harvested">Harvested</option>
                    <option value="Scrapped">Scrapped</option>
                  </select>
                </Field>

                <Field label="Harvest Type">
                  <select
                    value={editInventoryHarvestType || (editInventoryCrop ? (isRepeatHarvestCrop(editInventoryCrop) ? "Trim Harvest" : "Full Harvest") : "Full Harvest")}
                    onChange={(e) => setEditInventoryHarvestType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Full Harvest">Full Harvest (harvest once)</option>
                    <option value="Trim Harvest">Trim Harvest (trim up to 5×)</option>
                  </select>
                  {editInventoryCrop && (
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                      Default for {editInventoryCrop}: {isRepeatHarvestCrop(editInventoryCrop) ? "Trim Harvest" : "Full Harvest"}
                    </span>
                  )}
                </Field>

                <Field label="Seeded Date">
                  <input type="date" value={editInventorySeededDate} onChange={(e) => setEditInventorySeededDate(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Transplant Date">
                  <input type="date" value={editInventoryTransplantDate} onChange={(e) => setEditInventoryTransplantDate(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Estimated Ready Date">
                  <input
                    type="date"
                    value={editInventoryEstimatedReadyDate}
                    onChange={(e) => setEditInventoryEstimatedReadyDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Expected Lbs">
                  <input value={editInventoryExpectedLbs} onChange={(e) => setEditInventoryExpectedLbs(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Remaining Expected Lbs">
                  <input
                    value={editInventoryRemainingExpectedLbs}
                    onChange={(e) => setEditInventoryRemainingExpectedLbs(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Status">
                  <select value={editInventoryStatus} onChange={(e) => setEditInventoryStatus(e.target.value)} style={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Harvested">Harvested</option>
                    <option value="Lost">Lost</option>
                    <option value="Scrapped">Scrapped</option>
                    <option value="Closed">Closed</option>
                  </select>
                </Field>
              </FormGrid>

              <Field label="Notes">
                <input value={editInventoryNotes} onChange={(e) => setEditInventoryNotes(e.target.value)} style={inputStyle} />
              </Field>

              <ActionRow message={editInventoryMessage}>
                <button onClick={handleSaveInventoryEdits} style={primaryButtonStyle} disabled={editInventorySaving}>
                  {editInventorySaving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={clearEditInventoryForm} style={secondaryButtonStyle}>
                  Clear
                </button>
              </ActionRow>
            </Panel>
</div>

            <Panel title="Adjust Inventory After Harvest / Scrapped">
              <FormGrid columns={3}>
                <Field label="Inventory Row">
                  <select value={adjustInventoryRow} onChange={(e) => setAdjustInventoryRow(e.target.value)} style={inputStyle}>
                    <option value="">Select Tower / Crop</option>
                    {activeInventory.map((row) => (
                      <option key={row.rowNumber} value={row.rowNumber}>
                        {getInventoryTower(row) || "(No Tower)"} | {getInventoryCrop(row)} | Active Pods {getInventoryActivePods(row)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Action">
                  <select value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as "Harvest" | "Scrapped")} style={inputStyle}>
                    <option value="Harvest">Harvest</option>
                    <option value="Scrapped">Scrapped</option>
                  </select>
                </Field>

                <Field label="Pods Removed">
                  <input value={adjustPods} onChange={(e) => setAdjustPods(e.target.value)} style={inputStyle} />
                </Field>

                <Field label="Lbs Removed (optional)">
                  <input value={adjustLbs} onChange={(e) => setAdjustLbs(e.target.value)} style={inputStyle} />
                </Field>

                {adjustMode === "Scrapped" && (
                  <Field label="Scrap Type">
                    <input value={adjustScrapType} onChange={(e) => setAdjustScrapType(e.target.value)} style={inputStyle} />
                  </Field>
                )}
              </FormGrid>

              <Field label="Note">
                <input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} style={inputStyle} />
              </Field>

              <ActionRow message={adjustMessage}>
                <button onClick={handleInventoryAdjustment} style={primaryButtonStyle}>
                  Save Inventory Adjustment
                </button>
              </ActionRow>
            </Panel>

            <Panel title="Current Production Inventory">
              <TableScroll>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Tower</th>
                      <th style={thStyle}>Tower Type</th>
                      <th style={thStyle}>Max Pods</th>
                      <th style={thStyle}>Active Pods</th>
                      <th style={thStyle}>Crop</th>
                      <th style={thStyle}>Stage</th>
                      <th style={thStyle}>Seeded</th>
                      <th style={thStyle}>Transplant</th>
                      <th style={thStyle}>Ready Date</th>
                      <th style={thStyle}>Expected Lbs</th>
                      <th style={thStyle}>Remaining Lbs</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Notes</th>
                      <th style={thStyle}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionInventory.length === 0 ? (
                      <tr>
                        <td colSpan={14} style={tdStyle}>
                          No production inventory found.
                        </td>
                      </tr>
                    ) : (
                      productionInventory
                        .slice()
.sort(sortInventoryByTowerLayout)
                        .map((item) => (
                          <tr key={item.rowNumber}>
                            <td style={tdStyle}>{getInventoryTower(item)}</td>
                            <td style={tdStyle}>{getInventoryTowerType(item)}</td>
                            <td style={tdStyle}>{getInventoryMaxPods(item)}</td>
                            <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                            <td style={tdStyle}>{getInventoryCrop(item)}</td>
                            <td style={tdStyle}>{getInventoryStage(item)}</td>
                            <td style={tdStyle}>{formatDateDisplay(getInventorySeededDate(item))}</td>
                            <td style={tdStyle}>{formatDateDisplay(getInventoryTransplantDate(item))}</td>
                            <td style={tdStyle}>{formatDateDisplay(getInventoryEffectiveReadyDate(item))}</td>
                            <td style={tdStyle}>{getInventoryExpectedLbs(item)}</td>
                            <td style={tdStyle}>{getInventoryRemainingExpectedLbs(item)}</td>
                            <td style={tdStyle}>
                              <select
                                value={getInventoryStatus(item) || "Active"}
                                onChange={(e) => handleProductionStatusChange(item.rowNumber, e.target.value)}
                                style={compactInputStyle}
                              >
                                <option value="Active">Active</option>
                                <option value="Harvested">Harvested</option>
                                <option value="Lost">Lost</option>
                                <option value="Scrapped">Scrapped</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </td>
                            <td style={tdStyle}>{getInventoryNotes(item)}</td>
                            <td style={tdStyle}>
                              <button onClick={() => handleEditInventory(item)} style={primaryButtonStyle}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </TableScroll>
            </Panel>
          </div>
        )}

     {activePage === "staffDaily" && (
  <div style={sectionStackStyle}>
    <Panel title="Crop Lookup">
      <FormGrid columns={2}>
        <Field label="Select Crop">
          <select value={staffLookupCrop} onChange={(e) => setStaffLookupCrop(e.target.value)} style={inputStyle}>
            <option value="">Select Crop</option>
            {uniqueCrops.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>
      </FormGrid>
      {staffLookupCrop ? (
        <MetricGrid>
          <MiniMetric label="Towers in Production" value={inventoryByCrop.get(staffLookupCrop)?.towers || 0} />
          <MiniMetric label="Pods in Production" value={inventoryByCrop.get(staffLookupCrop)?.podsInTowers || 0} />
          <MiniMetric label="Lbs in Production" value={Math.round((inventoryByCrop.get(staffLookupCrop)?.availableLbs || 0) * 100) / 100} />
          <MiniMetric label="Ready Now Lbs" value={Math.round((inventoryByCrop.get(staffLookupCrop)?.readyNowLbs || 0) * 100) / 100} />
          <MiniMetric label="Pipeline Towers" value={inventoryByCrop.get(staffLookupCrop)?.pipelineTowers || 0} />
          <MiniMetric label="Ready Date Range" value={(() => {
            const c = inventoryByCrop.get(staffLookupCrop);
            if (!c?.nextReadyDate) return "-";
            if (!c.lastReadyDate || c.nextReadyDate === c.lastReadyDate) return formatDateDisplay(c.nextReadyDate);
            return `${formatDateDisplay(c.nextReadyDate)} – ${formatDateDisplay(c.lastReadyDate)}`;
          })()} />
        </MetricGrid>
      ) : (
        <div style={{ marginTop: 12, fontSize: 14, color: "#475569" }}>Choose a crop to see towers, pods, and pounds in production.</div>
      )}
    </Panel>



    {/* Farmers Market Standing Orders */}
    <div style={{ background: "rgba(248,250,252,0.98)", border: "2px solid #111827", borderRadius: 18, padding: 22, boxShadow: "0 14px 34px rgba(0,0,0,0.16)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>🌿 Farmers Market</span>
          {marketConfig.enabled && !marketConfig.manualPause && (() => {
            const m = new Date().getMonth() + 1;
            const { seasonStart, seasonEnd } = marketConfig;
            const inSeason = seasonStart <= seasonEnd ? m >= seasonStart && m <= seasonEnd : m >= seasonStart || m <= seasonEnd;
            return <span style={{ background: inSeason ? "#dcfce7" : "#fef9c3", color: inSeason ? "#166534" : "#854d0e", border: `1px solid ${inSeason ? "#86efac" : "#fde047"}`, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{inSeason ? "In Season" : "Off Season"}</span>;
          })()}
          {marketConfig.manualPause && <span style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>Paused</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setMarketConfig(c => ({ ...c, manualPause: !c.manualPause }))} style={{ ...secondaryButtonStyle, fontSize: 13, padding: "6px 12px" }}>
            {marketConfig.manualPause ? "Resume Market" : "Pause Market"}
          </button>
          <button onClick={() => setShowMarketSettings(s => !s)} style={{ ...secondaryButtonStyle, fontSize: 13, padding: "6px 12px" }}>
            {showMarketSettings ? "Hide Settings" : "Edit Settings"}
          </button>
        </div>
      </div>

      {showMarketSettings && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <label style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={marketConfig.enabled} onChange={e => setMarketConfig(c => ({ ...c, enabled: e.target.checked }))} />
              Standing orders active
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>Season:</span>
              <select value={marketConfig.seasonStart} onChange={e => setMarketConfig(c => ({ ...c, seasonStart: Number(e.target.value) }))} style={{ ...inputStyle, width: "auto", padding: "4px 8px", fontSize: 13 }}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <span style={{ color: "#64748b" }}>to</span>
              <select value={marketConfig.seasonEnd} onChange={e => setMarketConfig(c => ({ ...c, seasonEnd: Number(e.target.value) }))} style={{ ...inputStyle, width: "auto", padding: "4px 8px", fontSize: 13 }}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ ...tableStyle, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Active</th>
                  <th style={thStyle}>Crop</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Qty / Week</th>
                </tr>
              </thead>
              <tbody>
                {marketConfig.items.map(item => (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={item.active} onChange={e => setMarketConfig(c => ({ ...c, items: c.items.map(i => i.id === item.id ? { ...i, active: e.target.checked } : i) }))} />
                    </td>
                    <td style={tdStyle}>{item.crop}</td>
                    <td style={{ ...tdStyle, color: "#64748b", fontSize: 12 }}>{item.unitType}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="0"
                        value={item.weeklyQty}
                        onChange={e => setMarketConfig(c => ({ ...c, items: c.items.map(i => i.id === item.id ? { ...i, weeklyQty: Math.max(0, Number(e.target.value)) } : i) }))}
                        style={{ ...inputStyle, width: 70, padding: "4px 8px", fontSize: 13 }}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => saveMarketConfig(marketConfig)}
              disabled={marketConfigSaveStatus === "saving"}
              className={marketConfigSaveStatus === "saving" ? "btn-saving" : ""}
              style={{ ...primaryButtonStyle, padding: "10px 20px", fontSize: 14 }}
            >
              {marketConfigSaveStatus === "saving" ? "Saving…" : "Save Settings"}
            </button>
            {marketConfigSaveStatus === "saved" && (
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Saved ✓</span>
            )}
            {marketConfigSaveStatus === "error" && (
              <span style={{ fontSize: 13, color: "#dc2626" }}>Save failed — check connection</span>
            )}
          </div>
        </div>
      )}
    </div>

    <Panel title="Seed Today / Seeding Schedule">
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "#64748b" }}>Default view shows what needs to be seeded today.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={seedScheduleFilter} onChange={(e) => setSeedScheduleFilter(e.target.value as "Today" | "This Week" | "This Month" | "3 Months")} style={{ ...inputStyle, width: "auto", minWidth: 140 }}>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="3 Months">3 Months</option>
          </select>
          <button
            style={secondaryButtonStyle}
            onClick={() => printSection(
              `Seeding Schedule — ${seedScheduleFilter}`,
              ["Seed By", "Status", "Crop", "Trays Needed", "Ready By", "Orders"],
              filteredPlantTodayTasks.map(task => {
                const displaySeedByDate = task.seedByDate && task.seedByDate < formatDateInput(new Date()) ? formatDateInput(new Date()) : task.seedByDate;
                const full = Math.floor(task.totalTowers / 2);
                const half = task.totalTowers % 2;
                const trays = full > 0 && half > 0 ? `${full} full + 1 half` : full > 0 ? `${full} full` : `${half} half`;
                return [
                  formatDateDisplay(displaySeedByDate),
                  task.urgency,
                  task.crop,
                  trays,
                  formatDateDisplay(task.earliestDueDate),
                  task.orders.join(", "),
                ];
              })
            )}
          >
            🖨 Print
          </button>
        </div>
      </div>
      {(() => {
        const todayDow = new Date().getDay();
        const daysUntilWed = (3 - todayDow + 7) % 7;
        const nextWed = addDays(formatDateInput(new Date()), daysUntilWed);
        return (
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
            {todayDow === 3
              ? <span>Today is seeding day — tasks shown below.</span>
              : <span>Seeding day is <strong>Wednesday</strong>. Next seeding: <strong>{formatDateDisplay(nextWed)}</strong>. Use <em>This Month</em> or wider to preview upcoming tasks.</span>
            }
          </div>
        );
      })()}
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Seed By</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Trays Needed</th>
              <th style={thStyle}>Ready By</th>
              <th style={thStyle}>Available Lbs</th>
              <th style={thStyle}>Available Plants</th>
              <th style={thStyle}>Seeded</th>
              <th style={thStyle}>Pipeline</th>
              <th style={thStyle}>Orders</th>
              <th style={thStyle}>Tray Type</th>
              <th style={thStyle}># Trays</th>
              <th style={thStyle}>Seeded Date</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const visibleTasks = filteredPlantTodayTasks.filter((t) => !dismissedSeedTasks.has(`${t.seedByDate}__${t.crop}`));
              if (visibleTasks.length === 0) return <tr><td colSpan={14} style={tdStyle}>No seeding tasks for this period.</td></tr>;
              return visibleTasks.map((task) => {
                return (
                <tr key={`${task.seedByDate}-${task.crop}`}>
                  <td style={tdStyle}>{formatDateDisplay(task.seedByDate)}</td>
                  <td style={tdStyle}>{task.urgency}</td>
                  <td style={tdStyle}>{task.crop}</td>
                  <td style={tdStyle}>
                    {(() => {
                      const full = Math.floor(task.totalTowers / 2);
                      const half = task.totalTowers % 2;
                      if (full > 0 && half > 0) return `${full} full + 1 half`;
                      if (full > 0) return `${full} full`;
                      return `${half} half`;
                    })()}
                  </td>
                  <td style={tdStyle}>{formatDateDisplay(task.earliestDueDate)}</td>
                  <td style={tdStyle}>{Math.round(task.currentAvailableLbs * 100) / 100}</td>
                  <td style={tdStyle}>{task.currentAvailablePlants}</td>
                  <td style={tdStyle}>{task.seededCount}</td>
                  <td style={tdStyle}>{task.pipelineCount}</td>
                  <td style={tdStyle}>{task.orders.join(", ")}</td>
                  <td style={tdStyle}>
                    <select
                      value={plantingTrayType[task.crop] || "Full Tray"}
                      onChange={(e) =>
                        setPlantingTrayType((prev) => ({
                          ...prev,
                          [task.crop]: e.target.value as "Full Tray" | "Half Tray",
                        }))
                      }
                      style={compactInputStyle}
                    >
                      <option value="Full Tray">Full Tray (88 seeds)</option>
                      <option value="Half Tray">Half Tray (44 seeds)</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    {(() => {
                      const trayType = plantingTrayType[task.crop] || "Full Tray";
                      const suggested = trayType === "Full Tray" ? Math.ceil(task.totalTowers / 2) : task.totalTowers;
                      return (
                        <input
                          type="number"
                          min={1}
                          value={plantingTrayCount[task.crop] ?? String(suggested)}
                          onChange={e => setPlantingTrayCount(prev => ({ ...prev, [task.crop]: e.target.value }))}
                          style={{ ...compactInputStyle, width: 52 }}
                          title="Override number of trays to plant"
                        />
                      );
                    })()}
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={plantedDates[task.crop] || ""}
                      onChange={(e) =>
                        setPlantedDates((prev) => ({ ...prev, [task.crop]: e.target.value }))
                      }
                      style={{ ...compactInputStyle, minWidth: 130 }}
                      placeholder={formatDateInput(new Date())}
                    />
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleMarkPlanted(task)} style={primaryButtonStyle}>
                      Mark Planted
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => dismissSeedTask(task.seedByDate, task.crop)}
                      style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                      title="Dismiss this task"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Seeded Section">
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#166534", marginBottom: 10 }}>Manually Add a Seeded Tray</div>
        <FormGrid columns={2}>
          <Field label="Crop *">
            <select value={addTrayCrop} onChange={e => setAddTrayCrop(e.target.value)} style={inputStyle}>
              <option value="">Select crop</option>
              {uniqueCrops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tray Type">
            <select value={addTrayType} onChange={e => setAddTrayType(e.target.value as "Full Tray" | "Half Tray")} style={inputStyle}>
              <option value="Full Tray">Full Tray (88 pods)</option>
              <option value="Half Tray">Half Tray (44 pods)</option>
            </select>
          </Field>
          <Field label="Seeded Date *">
            <input type="date" value={addTrayDate} onChange={e => setAddTrayDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Tower Name (optional)">
            <input value={addTrayTower} onChange={e => setAddTrayTower(e.target.value)} style={inputStyle} placeholder="e.g. R1 (fill in after transplant)" />
          </Field>
        </FormGrid>
        <ActionRow message={addTrayMessage}>
          <button style={primaryButtonStyle} disabled={addTraySaving} onClick={handleAddSeededTray}>
            {addTraySaving ? "Saving…" : "Add Tray"}
          </button>
        </ActionRow>
      </div>
      <div style={{ maxHeight: 480, overflowY: "auto", overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tower</th>
              <th style={thStyle}>Tower Type</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Active Pods</th>
              <th style={thStyle}>Seeded Date</th>
              <th style={thStyle}>Ready Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seededInventory.length === 0 ? (
              <tr>
                <td colSpan={7} style={tdStyle}>
                  No seeded inventory entries yet.
                </td>
              </tr>
            ) : (
              seededInventory.map((item) => {
                const isEditing = seededEditRowNumber === item.rowNumber;
                if (isEditing) {
                  return (
                    <tr key={item.rowNumber} style={{ background: "#f8fafc" }}>
                      <td style={tdStyle}>
                        <input
                          value={seededEditTower}
                          onChange={(e) => setSeededEditTower(e.target.value)}
                          style={{ ...compactInputStyle, width: 60 }}
                          placeholder="R1"
                        />
                      </td>
                      <td style={tdStyle}>{getInventoryTowerType(item)}</td>
                      <td style={tdStyle}>
                        <select
                          value={seededEditCrop}
                          onChange={(e) => setSeededEditCrop(e.target.value)}
                          style={compactInputStyle}
                        >
                          <option value="">-- crop --</option>
                          {uniqueCrops.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={seededEditActivePods}
                          onChange={(e) => setSeededEditActivePods(e.target.value)}
                          style={{ ...compactInputStyle, width: 60 }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="date"
                          value={seededEditSeededDate}
                          onChange={(e) => setSeededEditSeededDate(e.target.value)}
                          style={{ ...compactInputStyle, minWidth: 130 }}
                        />
                      </td>
                      <td style={tdStyle}>{seededEditSeededDate ? formatDateDisplay(addDays(seededEditSeededDate, 42)) : "-"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={handleSaveSeededEdit}
                            disabled={seededEditSaving}
                            style={primaryButtonStyle}
                          >
                            {seededEditSaving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={cancelEditSeededEntry} style={secondaryButtonStyle}>Cancel</button>
                        </div>
                        {seededEditMessage && <div style={{ fontSize: 12, marginTop: 4, color: seededEditMessage.startsWith("Entry updated") ? "#16a34a" : "#dc2626" }}>{seededEditMessage}</div>}
                      </td>
                    </tr>
                  );
                }
                const isTransplanting = seededTransplantRowNumber === item.rowNumber;
                return (
                  <React.Fragment key={item.rowNumber}>
                    <tr>
                      <td style={tdStyle}>{getInventoryTower(item) || "-"}</td>
                      <td style={tdStyle}>{getInventoryTowerType(item)}</td>
                      <td style={tdStyle}>{getInventoryCrop(item)}</td>
                      <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                      <td style={tdStyle}>{formatDateDisplay(getInventorySeededDate(item))}</td>
                      <td style={tdStyle}>{formatDateDisplay(getInventoryEffectiveReadyDate(item))}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => {
                              setSeededTransplantRowNumber(isTransplanting ? null : item.rowNumber);
                              setSeededTransplantTower("");
                              setSeededTransplantTowerType("Low Density");
                              setSeededTransplantDate(formatDateInput(new Date()));
                              setSeededTransplantMessage("");
                              cancelEditSeededEntry();
                            }}
                            style={isTransplanting ? { ...primaryButtonStyle, background: "#64748b" } : primaryButtonStyle}
                          >
                            Transplant
                          </button>
                          <button onClick={() => { startEditSeededEntry(item); setSeededTransplantRowNumber(null); }} style={secondaryButtonStyle}>Edit</button>
                          <button
                            onClick={() => { if (window.confirm("Delete this seeded entry?")) handleDeleteSeededEntry(item.rowNumber); }}
                            style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isTransplanting && (
                      <tr style={{ background: "#f0fdf4" }}>
                        <td colSpan={7} style={{ ...tdStyle, paddingTop: 10, paddingBottom: 10 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <label style={{ fontSize: 13 }}>Tower:
                              <input
                                value={seededTransplantTower}
                                onChange={(e) => setSeededTransplantTower(e.target.value)}
                                style={{ ...compactInputStyle, width: 70, marginLeft: 6 }}
                                placeholder="R1"
                                autoFocus
                              />
                            </label>
                            <label style={{ fontSize: 13 }}>Type:
                              <select
                                value={seededTransplantTowerType}
                                onChange={(e) => setSeededTransplantTowerType(e.target.value)}
                                style={{ ...compactInputStyle, marginLeft: 6 }}
                              >
                                <option value="Low Density">Low Density (44)</option>
                                <option value="High Density">High Density (160)</option>
                              </select>
                            </label>
                            <label style={{ fontSize: 13 }}>Date:
                              <input
                                type="date"
                                value={seededTransplantDate}
                                onChange={(e) => setSeededTransplantDate(e.target.value)}
                                style={{ ...compactInputStyle, minWidth: 130, marginLeft: 6 }}
                              />
                            </label>
                            <button
                              onClick={handleTransplantSeeded}
                              disabled={seededTransplantSaving}
                              style={primaryButtonStyle}
                            >
                              {seededTransplantSaving ? "Saving…" : "Save Transplant"}
                            </button>
                            <button onClick={() => setSeededTransplantRowNumber(null)} style={secondaryButtonStyle}>Cancel</button>
                            {seededTransplantMessage && <span style={{ fontSize: 12, color: "#dc2626" }}>{seededTransplantMessage}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </TableScroll>
      </div>
    </Panel>


    <Panel title="Orders Due This Week">
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          style={secondaryButtonStyle}
          onClick={() => printSection(
            "Orders Due This Week",
            ["Due Date", "Customer", "Crop", "Qty", "Unit", "Status"],
            harvestTodayTasks.map(task => [
              formatDateDisplay(task.dueDate),
              task.customer,
              task.crop,
              String(task.quantityNeeded),
              task.unitType,
              task.status,
            ])
          )}
        >
          🖨 Print
        </button>
      </div>
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Qty Remaining</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {harvestTodayTasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={tdStyle}>No orders due in the next 7 days.</td>
              </tr>
            ) : (
              harvestTodayTasks.map((task) => {
                const overdue = isOverdue(task.dueDate);
                const dueToday = isDueToday(task.dueDate);
                const dotColor = overdue ? "#dc2626" : dueToday ? "#d97706" : "#16a34a";
                const dateLabel = overdue ? `${formatDateDisplay(task.dueDate)} Overdue` : dueToday ? `${formatDateDisplay(task.dueDate)} Today` : formatDateDisplay(task.dueDate);
                return (
                  <tr key={task.rowNumber}>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontWeight: (overdue || dueToday) ? 700 : undefined }}>{dateLabel}</span>
                      </span>
                    </td>
                    <td style={tdStyle}>{task.customer}</td>
                    <td style={tdStyle}>{task.crop}</td>
                    <td style={tdStyle}>{task.quantityNeeded}</td>
                    <td style={tdStyle}>{task.unitType}</td>
                    <td style={tdStyle}>{task.status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Harvest a Tower">
      {/* Step 1: pick a tower */}
      <FormGrid columns={2}>
        <Field label="Select Tower">
          <select
            value={qhRowNumber}
            onChange={(e) => { setQhRowNumber(e.target.value); setQhType(null); setQhQty(""); setQhPods(""); setQhOrderRowNumber(""); setQhMessage(""); }}
            style={inputStyle}
          >
            <option value="">— choose a tower —</option>
            {activeInventory
              .filter((item) => { const s = normalizeStatus(getInventoryStage(item)); return !!getInventoryTower(item) && s !== "seeded" && s !== "empty"; })
              .slice()
              .sort(sortInventoryByTowerLayout)
              .map((item) => (
                <option key={item.rowNumber} value={String(item.rowNumber)}>
                  {getInventoryTower(item)} — {getInventoryCrop(item)} ({getInventoryStage(item)})
                </option>
              ))}
          </select>
        </Field>
      </FormGrid>

      {/* Step 2: show tower stats + harvest type buttons */}
      {qhRowNumber && (() => {
        const sel = activeInventory.find((r) => String(r.rowNumber) === qhRowNumber);
        if (!sel) return null;
        const activePods = toNumber(getInventoryActivePods(sel));
        const remainingLbs = toNumber(getInventoryRemainingExpectedLbs(sel));
        const expectedLbs = toNumber(getInventoryExpectedLbs(sel));
        const selCropKey = (getInventoryCrop(sel) || "").trim().toLowerCase();
        const matchingOrders = salesOrders.filter((o) => {
          const st = normalizeStatus(getOrderStatus(o));
          return (getOrderCrop(o) || "").trim().toLowerCase() === selCropKey && st !== "harvested" && st !== "cancelled" && st !== "packed";
        });
        return (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0", padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14 }}>
              <span><strong>Crop:</strong> {getInventoryCrop(sel)}</span>
              <span><strong>Stage:</strong> {getInventoryStage(sel)}</span>
              <span><strong>Active Pods:</strong> {activePods}</span>
              <span><strong>Expected Lbs:</strong> {expectedLbs}</span>
              <span><strong>Remaining Lbs:</strong> {remainingLbs}</span>
            </div>

            {matchingOrders.length > 0 && (
              <FormGrid columns={2}>
                <Field label="Fulfilling Order (optional)">
                  <select value={qhOrderRowNumber} onChange={(e) => setQhOrderRowNumber(e.target.value)} style={inputStyle}>
                    <option value="">— none —</option>
                    {matchingOrders.map((o) => (
                      <option key={o.rowNumber} value={String(o.rowNumber)}>
                        {getOrderCustomer(o)} — {getOrderQuantityNeeded(o)} {getOrderUnitType(o)}
                        {getOrderRequestedDeliveryDate(o) ? ` (due ${formatDateDisplay(getOrderRequestedDeliveryDate(o))})` : ""}
                        {getOrderStatus(o) ? ` [${getOrderStatus(o)}]` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </FormGrid>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { setQhType("Trim Harvest"); setQhQty(""); setQhPods(""); setQhScrapReason(""); }}
                style={qhType === "Trim Harvest"
                  ? { ...primaryButtonStyle, background: "#0891b2" }
                  : { ...secondaryButtonStyle, fontWeight: 600 }}
              >
                Trim Harvest
              </button>
              <button
                onClick={() => { setQhType("Full Harvest"); setQhQty(""); setQhPods(String(activePods)); setQhScrapReason(""); }}
                style={qhType === "Full Harvest"
                  ? { ...primaryButtonStyle, background: "#16a34a" }
                  : { ...secondaryButtonStyle, fontWeight: 600 }}
              >
                Pods Harvested
              </button>
              <button
                onClick={() => { setQhType("Scrap"); setQhQty(""); setQhPods(""); setQhNote(""); }}
                style={qhType === "Scrap"
                  ? { ...primaryButtonStyle, background: "#dc2626" }
                  : { ...secondaryButtonStyle, fontWeight: 600, color: "#dc2626", borderColor: "#dc2626" }}
              >
                Scrap Tower
              </button>
            </div>

            {qhType === "Scrap" && (
              <>
                <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 14, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                  Scrap Tower — the entire tower will be marked as scrapped. All {activePods} pods ({remainingLbs} lbs) will be logged to Scrapped This Week.
                </div>
                <FormGrid columns={2}>
                  <Field label="Reason for Scrapping">
                    <input
                      value={qhScrapReason}
                      onChange={(e) => setQhScrapReason(e.target.value)}
                      style={inputStyle}
                      placeholder="Disease, damage, poor growth, etc."
                      autoFocus
                    />
                  </Field>
                </FormGrid>
                <ActionRow message={qhMessage}>
                  <button onClick={handleQuickHarvest} disabled={qhSaving} style={{ ...primaryButtonStyle, background: "#dc2626" }}>
                    {qhSaving ? "Saving…" : "Confirm Scrap"}
                  </button>
                  <button onClick={() => { setQhRowNumber(""); setQhType(null); setQhScrapReason(""); setQhOrderRowNumber(""); setQhMessage(""); }} style={secondaryButtonStyle}>
                    Clear
                  </button>
                </ActionRow>
              </>
            )}

            {(qhType === "Trim Harvest" || qhType === "Full Harvest") && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14, padding: "8px 12px", background: "#f1f5f9", borderRadius: 8 }}>
                  {qhType === "Trim Harvest"
                    ? "Trim Harvest — cut leaves from the plant and it stays in the tower. Enter the weight of greens you cut, and how many pods you trimmed from."
                    : "Full Harvest — the entire plant is pulled. Enter the total weight harvested and confirm the pod count (pre-filled for you)."}
                </div>
                <FormGrid columns={3}>
                  <Field label={qhType === "Trim Harvest" ? "Weight of Greens Cut" : "Total Weight Harvested"}>
                    <input
                      type="number"
                      value={qhQty}
                      onChange={(e) => setQhQty(e.target.value)}
                      style={inputStyle}
                      placeholder="auto-filled from pods"
                      autoFocus
                    />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>auto-estimated — edit if actual differs</div>
                  </Field>
                  <Field label="Unit">
                    <select value={qhUnit} onChange={(e) => setQhUnit(e.target.value as OrderUnitType)} style={inputStyle}>
                      <option value="Lbs">Lbs</option>
                      <option value="6oz Bag">6oz Bag</option>
                      <option value="6oz Clamshell">6oz Clamshell</option>
                      <option value="0.75oz Small Bag">0.75oz Small Bag</option>
                      <option value="Plants">Plants</option>
                    </select>
                  </Field>
                  <Field label={qhType === "Trim Harvest" ? "Pods Trimmed" : "Pods Harvested"}>
                    <input
                      type="number"
                      value={qhPods}
                      onChange={(e) => {
                        const pods = e.target.value;
                        setQhPods(pods);
                        const est = calculateExpectedLbs(getInventoryCrop(sel), toNumber(pods), getInventoryTowerType(sel));
                        if (est > 0) setQhQty(String(est));
                      }}
                      style={inputStyle}
                      placeholder={String(activePods)}
                    />
                  </Field>
                  <Field label="Note (optional)">
                    <input value={qhNote} onChange={(e) => setQhNote(e.target.value)} style={inputStyle} placeholder="Quality, issues, etc." />
                  </Field>
                </FormGrid>
                <ActionRow message={qhMessage}>
                  <button onClick={handleQuickHarvest} disabled={qhSaving} style={primaryButtonStyle}>
                    {qhSaving ? "Saving…" : `Save ${qhType}`}
                  </button>
                  <button onClick={() => { setQhRowNumber(""); setQhType(null); setQhQty(""); setQhPods(""); setQhNote(""); setQhOrderRowNumber(""); setQhMessage(""); }} style={secondaryButtonStyle}>
                    Clear
                  </button>
                </ActionRow>
              </>
            )}
          </>
        );
      })()}
    </Panel>

    <Panel title="Ready to Harvest">
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>Only 10 rows show at a time. Scroll to see more. Use Mark Harvested to record a full harvest or a trim harvest.</div>
      <div style={{ maxHeight: 440, overflowY: "auto", overflowX: "hidden", border: "1px solid #e5e7eb", borderRadius: 10 }}>
        <TableScroll>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Tower</th>
                <th style={thStyle}>Crop</th>
                <th style={thStyle}>Active Pods</th>
                <th style={thStyle}>Remaining Lbs</th>
                <th style={thStyle}>Ready Date</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {readyToHarvestInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={tdStyle}>
                    No inventory entries are ready to harvest today.
                  </td>
                </tr>
              ) : (
                readyToHarvestInventory.map((item) => {
                  const isActiveRow = String(item.rowNumber) === activeHarvestRowNumber;
                  return (
                    <React.Fragment key={item.rowNumber}>
                      <tr>
                        <td style={tdStyle}>{getInventoryTower(item) || "-"}</td>
                        <td style={tdStyle}>{getInventoryCrop(item)}</td>
                        <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                        <td style={tdStyle}>{getInventoryRemainingExpectedLbs(item)}</td>
                        <td style={tdStyle}>{formatDateDisplay(getInventoryEffectiveReadyDate(item))}</td>
                        <td style={tdStyle}>
                          <button onClick={() => startReadyHarvestAction(item)} style={primaryButtonStyle}>
                            Mark Harvested
                          </button>
                        </td>
                      </tr>
                      {isActiveRow ? (
                        <tr>
                          <td colSpan={6} style={{ ...tdStyle, background: "#f8fafc" }}>
                            <FormGrid columns={3}>
                              <Field label="Harvest Type">
                                <select value={harvestActionType} onChange={(e) => setHarvestActionType(e.target.value as "Full Harvest" | "Trim Harvest")} style={compactInputStyle}>
                                  <option value="Full Harvest">Full Harvest</option>
                                  <option value="Trim Harvest">Trim Harvest</option>
                                </select>
                              </Field>
                              <Field label={harvestActionType === "Trim Harvest" ? "Pods Trimmed" : "Pods Harvested"}>
                                <input value={harvestPodsValue} onChange={(e) => setHarvestPodsValue(e.target.value)} style={compactInputStyle} />
                              </Field>
                              <Field label="Output Unit">
                                <select value={harvestOutputUnit} onChange={(e) => setHarvestOutputUnit(e.target.value as OrderUnitType)} style={compactInputStyle}>
                                  <option value="Lbs">Lbs</option>
                                  <option value="6oz Bag">6oz Bag</option>
                                  <option value="6oz Clamshell">6oz Clamshell</option>
                      <option value="0.75oz Small Bag">0.75oz Small Bag</option>
                                </select>
                              </Field>
                              <Field label="Harvested Qty">
                                <input value={harvestOutputQty} onChange={(e) => setHarvestOutputQty(e.target.value)} style={compactInputStyle} />
                              </Field>
                              <Field label="Harvested Lbs">
                                <input value={String(quantityToLbs(harvestOutputUnit, toNumber(harvestOutputQty)))} readOnly style={{ ...compactInputStyle, background: "#f1f5f9" }} />
                              </Field>
                            </FormGrid>
                            <Field label="Notes">
                              <input value={harvestNote} onChange={(e) => setHarvestNote(e.target.value)} style={compactInputStyle} />
                            </Field>
                            <ActionRow message={dailyMessage}>
                              <button onClick={handleReadyHarvestSubmit} style={primaryButtonStyle}>Save Harvest</button>
                              <button onClick={clearReadyHarvestAction} style={secondaryButtonStyle}>Cancel</button>
                            </ActionRow>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScroll>
      </div>
    </Panel>


    <Panel title="Pack Today">
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
        <button
          style={secondaryButtonStyle}
          onClick={() => printSection(
            "Pack Today",
            ["Customer", "Crop", "Unit", "Qty to Pack", "Due Date", "Status"],
            packTodayTasks.map(task => [
              task.customer,
              task.crop,
              task.unitType,
              String(task.quantityNeeded),
              formatDateDisplay(task.dueDate),
              task.status,
            ])
          )}
        >
          🖨 Print
        </button>
      </div>
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Qty to Pack</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {packTodayTasks.length === 0 ? (
              <tr>
                <td colSpan={7} style={tdStyle}>
                  No packing tasks due today.
                </td>
              </tr>
            ) : (
              packTodayTasks.map((task) => (
                <tr key={task.rowNumber}>
                  <td style={tdStyle}>{task.customer}</td>
                  <td style={tdStyle}>{task.crop}</td>
                  <td style={tdStyle}>{task.unitType}</td>
                  <td style={tdStyle}>{task.quantityNeeded}</td>
                  <td style={tdStyle}>{formatDateDisplay(task.dueDate)}</td>
                  <td style={tdStyle}>{task.status}</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleMarkPacked(task)} style={primaryButtonStyle}>
                      Mark Packed
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Overdue Orders">
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {overdueOrders.length === 0 ? (
              <tr>
                <td colSpan={4} style={tdStyle}>No overdue orders.</td>
              </tr>
            ) : (
              overdueOrders.map((order) => (
                <tr key={order.rowNumber}>
                  <td style={tdStyle}>{getOrderCustomer(order)}</td>
                  <td style={tdStyle}>{getOrderCrop(order)}</td>
                  <td style={tdStyle}>{formatDateDisplay(getOrderRequestedDeliveryDate(order))}</td>
                  <td style={tdStyle}>{getOrderStatus(order)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Recent Activity">
      <div style={{ maxHeight: 290, overflowY: "auto", overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>Mode</th>
              <th style={thStyle}>Tower</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Lbs</th>
              <th style={thStyle}>Pods</th>
              <th style={thStyle}>Note</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecentActivity.length === 0 ? (
              <tr>
                <td colSpan={8} style={tdStyle}>No recent activity found.</td>
              </tr>
            ) : (
              filteredRecentActivity.map((row) => {
                const lbs = toNumber(getStaffLbs(row));
                const pods = toNumber(getStaffPodsChanged(row));
                const note = getStaffNote(row) || "";
                const shortNote = note.length > 60 ? note.slice(0, 60) + "…" : note;
                return (
                  <tr key={row.rowNumber}>
                    <td style={tdStyle}>{formatDateTimeDisplay(getStaffTimestamp(row))}</td>
                    <td style={tdStyle}>{getStaffMode(row)}</td>
                    <td style={tdStyle}>{getStaffTower(row)}</td>
                    <td style={tdStyle}>{getStaffCrop(row)}</td>
                    <td style={tdStyle}>{lbs > 0 ? Math.round(lbs * 100) / 100 : ""}</td>
                    <td style={tdStyle}>{pods > 0 ? pods : ""}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }} title={note}>{shortNote}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => {
                          setEditingStaffRow(row);
                          setEditLbs(String(toNumber(getStaffLbs(row))));
                          setEditPods(String(toNumber(getStaffPodsChanged(row))));
                          setEditNote(getStaffNote(row) || "");
                          setEditMessage("");
                        }}
                        style={{ ...secondaryButtonStyle, padding: "4px 10px", fontSize: 12, minHeight: 32 }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        Scroll to see more entries.
      </div>
    </Panel>
  </div>
)}
      </div>

      {/* Staff Action Edit Modal */}
      {editingStaffRow && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 1000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "white", borderRadius: 16, padding: 24,
            maxWidth: 480, width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Correct Staff Entry</h3>

            {/* Entry summary */}
            <div style={{
              background: "#f1f5f9", borderRadius: 8, padding: 12,
              marginBottom: 16, fontSize: 13,
            }}>
              <strong>{getStaffMode(editingStaffRow)}</strong>
              {getStaffTower(editingStaffRow) ? ` — ${getStaffTower(editingStaffRow)}` : ""}
              {getStaffCrop(editingStaffRow) ? ` — ${getStaffCrop(editingStaffRow)}` : ""}
              <div style={{ color: "#64748b", marginTop: 4 }}>
                {formatDateTimeDisplay(getStaffTimestamp(editingStaffRow))}
              </div>
            </div>

            {/* Undo confirmation panel */}
            {editUndoConfirm ? (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5",
                borderRadius: 10, padding: 16, marginBottom: 16,
              }}>
                <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>
                  Undo this harvest?
                </div>
                <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 12 }}>
                  This will add <strong>{toNumber(getStaffPodsChanged(editingStaffRow))} pods</strong> and{" "}
                  <strong>{Math.round(toNumber(getStaffLbs(editingStaffRow)) * 100) / 100} lbs</strong> back
                  to <strong>{getStaffTower(editingStaffRow) || "this entry"}</strong> and
                  restore the stage to Ready. The staff log entry will be marked [REVERSED].
                  {(() => {
                    const tower = getStaffTower(editingStaffRow);
                    const invRow = tower
                      ? [...productionInventory]
                          .filter(r => normalizeStatus(getInventoryStatus(r)) !== "closed")
                          .sort((a, b) => b.rowNumber - a.rowNumber)
                          .find(r => getInventoryTower(r) === tower)
                      : null;
                    const wasFullyHarvested = invRow && (
                      normalizeStatus(getInventoryStage(invRow)) === "empty" ||
                      normalizeStatus(getInventoryStatus(invRow)) === "harvested"
                    );
                    return wasFullyHarvested ? (
                      <div style={{ marginTop: 8, color: "#b45309", fontWeight: 600 }}>
                        Note: this was a full harvest — seeded and transplant dates were
                        cleared and will need to be re-entered in Production Inventory.
                      </div>
                    ) : null;
                  })()}
                </div>
                <ActionRow message={editMessage}>
                  <button
                    onClick={handleUndoStaffAction}
                    disabled={editSaving}
                    className={editSaving ? "btn-saving" : ""}
                    style={{ ...primaryButtonStyle, background: "#dc2626" }}
                  >
                    {editSaving ? "Restoring…" : "Yes, Undo Harvest"}
                  </button>
                  <button
                    onClick={() => setEditUndoConfirm(false)}
                    style={secondaryButtonStyle}
                    disabled={editSaving}
                  >
                    Go Back
                  </button>
                </ActionRow>
              </div>
            ) : (
              <>
                {/* Correction fields */}
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
                  Update only the fields that were wrong — leave the others as-is.
                </div>
                <FormGrid columns={2}>
                  <Field label="Lbs (corrected)">
                    <input
                      type="number" min="0" step="0.01"
                      value={editLbs}
                      onChange={e => setEditLbs(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Pods Changed (corrected)">
                    <input
                      type="number" min="0"
                      value={editPods}
                      onChange={e => setEditPods(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </FormGrid>
                <div style={{ marginTop: 12 }}>
                  <Field label="Reason for correction">
                    <textarea
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                      style={textareaStyle}
                      placeholder="e.g. Entered 44 pods by mistake, should be 14"
                    />
                  </Field>
                </div>
                <ActionRow message={editMessage}>
                  <button
                    onClick={handleEditStaffAction}
                    disabled={editSaving}
                    className={editSaving ? "btn-saving" : ""}
                    style={primaryButtonStyle}
                  >
                    {editSaving ? "Saving…" : "Save Correction"}
                  </button>
                  {getStaffTower(editingStaffRow) && (
                    <button
                      onClick={() => { setEditUndoConfirm(true); setEditMessage(""); }}
                      style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                      disabled={editSaving}
                    >
                      Undo Harvest
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingStaffRow(null); setEditUndoConfirm(false); }}
                    style={secondaryButtonStyle}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                </ActionRow>
              </>
            )}
          </div>
        </div>
      )}

        {activePage === "contracts" && <ContractBuilder />}

        {activePage === "staffBoard" && (() => {
          const today = formatDateInput(new Date());

          const getDotColor = (dueDate: string | undefined, status: string | undefined) => {
            const norm = (status || "").toLowerCase();
            if (norm === "completed" || norm === "purchased") return "#9ca3af";
            if (!dueDate) return "#9ca3af";
            const due = dueDate.toString().slice(0, 10);
            if (due >= today) return "#16a34a";
            const daysOver = Math.floor((new Date(today).getTime() - new Date(due).getTime()) / 86400000);
            return daysOver >= 5 ? "#dc2626" : "#d97706";
          };

          const notesByCategory = (cat: string) =>
            staffNotes.filter(n => (n.Category || "") === cat)
              .sort((a, b) => {
                const da = (a["Due Date"] || "").toString().slice(0, 10);
                const db = (b["Due Date"] || "").toString().slice(0, 10);
                return da.localeCompare(db);
              });

          const handleSaveNote = async () => {
            if (!noteDescription.trim()) { setNoteMessage("Description is required."); return; }
            setNoteSaving(true); setNoteMessage("");
            const result = await postToBackend({
              action: "saveStaffNote",
              category: noteCategory,
              description: noteDescription.trim(),
              assignedTo: noteAssignedTo.trim(),
              dueDate: noteDueDate,
              status: "In Progress",
            });
            if (result.ok) {
              setNoteDescription(""); setNoteAssignedTo(""); setNoteDueDate("");
              setNoteMessage("Saved.");
              await loadStaffNotes();
            } else {
              setNoteMessage("Error: " + result.message);
            }
            setNoteSaving(false);
          };

          const handleUpdateNote = async (rowNumber: number) => {
            setEditNoteSaving(true);
            await postToBackend({ action: "updateStaffNote", rowNumber, status: editNoteStatus, assignedTo: editNoteAssignedTo });
            setEditingNoteRow(null);
            await loadStaffNotes();
            setEditNoteSaving(false);
          };

          const handleDeleteNote = async (rowNumber: number) => {
            if (!window.confirm("Delete this item?")) return;
            await postToBackend({ action: "deleteStaffNote", rowNumber });
            await loadStaffNotes();
          };

          const handleSaveMaint = async () => {
            if (!maintNote.trim()) { setMaintMessage("Note is required."); return; }
            setMaintSaving(true); setMaintMessage("");
            const result = await postToBackend({ action: "saveMaintenanceLog", date: maintDate, note: maintNote.trim() });
            if (result.ok) {
              setMaintNote(""); setMaintMessage("Saved.");
              await loadMaintenanceLogs();
            } else {
              setMaintMessage("Error: " + result.message);
            }
            setMaintSaving(false);
          };

          const handleDeleteMaint = async (rowNumber: number) => {
            if (!window.confirm("Delete this log entry?")) return;
            await postToBackend({ action: "deleteMaintenanceLog", rowNumber });
            await loadMaintenanceLogs();
          };

          const NoteTable = ({ category }: { category: string }) => {
            const items = notesByCategory(category);
            const statusOptions = category === "Purchase"
              ? ["In Progress", "Purchased", "Completed"]
              : ["In Progress", "Completed"];
            return (
              <Panel title={category === "Equipment" ? "Equipment Needs" : "Purchase Needs"}>
                <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 8, alignItems: "end" }}>
                  <Field label="Description">
                    <input style={inputStyle} value={noteCategory === category ? noteDescription : ""}
                      onFocus={() => setNoteCategory(category as "Equipment" | "Purchase")}
                      onChange={e => { setNoteCategory(category as "Equipment" | "Purchase"); setNoteDescription(e.target.value); }}
                      placeholder="Describe the need..." />
                  </Field>
                  <Field label="Assign To">
                    <input style={inputStyle} value={noteCategory === category ? noteAssignedTo : ""}
                      onFocus={() => setNoteCategory(category as "Equipment" | "Purchase")}
                      onChange={e => { setNoteCategory(category as "Equipment" | "Purchase"); setNoteAssignedTo(e.target.value); }}
                      placeholder="Staff name (optional)" />
                  </Field>
                  <Field label="Due Date">
                    <input style={inputStyle} type="date" value={noteCategory === category ? noteDueDate : ""}
                      onFocus={() => setNoteCategory(category as "Equipment" | "Purchase")}
                      onChange={e => { setNoteCategory(category as "Equipment" | "Purchase"); setNoteDueDate(e.target.value); }} />
                  </Field>
                  <div style={{ paddingBottom: 0 }}>
                    <button style={primaryButtonStyle} disabled={noteSaving || noteCategory !== category} onClick={handleSaveNote}>
                      {noteSaving && noteCategory === category ? "Saving…" : "Add"}
                    </button>
                  </div>
                </div>
                {noteCategory === category && noteMessage && (
                  <div style={{ fontSize: 13, color: "#166534", marginBottom: 8 }}>{noteMessage}</div>
                )}
                {items.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280", padding: "12px 0" }}>No items yet.</div>
                ) : (
                  <TableScroll>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}></th>
                          <th style={thStyle}>Description</th>
                          <th style={thStyle}>Assigned To</th>
                          <th style={thStyle}>Due Date</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const dueStr = (item["Due Date"] || "").toString().slice(0, 10);
                          const dot = getDotColor(dueStr, item.Status);
                          const isEditing = editingNoteRow === item.rowNumber;
                          return (
                            <tr key={item.rowNumber} style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td style={tdStyle}>
                                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: dot }} />
                              </td>
                              <td style={tdStyle}>{item.Description}</td>
                              <td style={tdStyle}>{item["Assigned To"] || "—"}</td>
                              <td style={tdStyle}>{dueStr ? formatDateDisplay(dueStr) : "—"}</td>
                              <td style={tdStyle}>
                                {isEditing ? (
                                  <select style={{ ...inputStyle, width: "auto" }} value={editNoteStatus}
                                    onChange={e => setEditNoteStatus(e.target.value)}>
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                ) : (
                                  <span style={{ fontSize: 13, color: item.Status === "Completed" || item.Status === "Purchased" ? "#6b7280" : "#1f2937" }}>
                                    {item.Status || "In Progress"}
                                  </span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                {isEditing ? (
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button style={primaryButtonStyle} disabled={editNoteSaving} onClick={() => handleUpdateNote(item.rowNumber)}>
                                      {editNoteSaving ? "…" : "Save"}
                                    </button>
                                    <button style={secondaryButtonStyle} onClick={() => setEditingNoteRow(null)}>Cancel</button>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button style={secondaryButtonStyle} onClick={() => {
                                      setEditingNoteRow(item.rowNumber);
                                      setEditNoteStatus(item.Status || "In Progress");
                                      setEditNoteAssignedTo(item["Assigned To"] || "");
                                    }}>Edit</button>
                                    <button style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                                      onClick={() => handleDeleteNote(item.rowNumber)}>Delete</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableScroll>
                )}
              </Panel>
            );
          };

          const sortedLogs = [...maintenanceLogs].sort((a, b) =>
            (b.Date || "").toString().localeCompare((a.Date || "").toString())
          );

          return (
            <div style={sectionStackStyle}>
              <NoteTable category="Equipment" />
              <NoteTable category="Purchase" />
              <Panel title="Plant Maintenance Log">
                <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "end" }}>
                  <Field label="Date">
                    <input style={inputStyle} type="date" value={maintDate} onChange={e => setMaintDate(e.target.value)} />
                  </Field>
                  <Field label="Note (treatment, chemical, area treated, etc.)">
                    <input style={inputStyle} value={maintNote} onChange={e => setMaintNote(e.target.value)}
                      placeholder="e.g. Sprayed towers 1-4 for aphids with neem oil" />
                  </Field>
                  <div>
                    <button style={primaryButtonStyle} disabled={maintSaving} onClick={handleSaveMaint}>
                      {maintSaving ? "Saving…" : "Log"}
                    </button>
                  </div>
                </div>
                {maintMessage && <div style={{ fontSize: 13, color: "#166534", marginBottom: 8 }}>{maintMessage}</div>}
                {sortedLogs.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280", padding: "12px 0" }}>No maintenance entries yet.</div>
                ) : (
                  <TableScroll>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Note</th>
                          <th style={thStyle}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLogs.map(log => (
                          <tr key={log.rowNumber} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDateDisplay((log.Date || "").toString().slice(0, 10))}</td>
                            <td style={tdStyle}>{log.Note}</td>
                            <td style={tdStyle}>
                              <button style={{ ...secondaryButtonStyle, color: "#dc2626", borderColor: "#fca5a5" }}
                                onClick={() => handleDeleteMaint(log.rowNumber)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                )}
              </Panel>
            </div>
          );
        })()}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: "clamp(18px, 3vw, 22px)", lineHeight: 1.2 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const display = typeof value === "number" ? Math.round(value) : value;
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700 }}>{display}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  const display = typeof value === "number" ? Math.round(value) : value;
  return (
    <div style={miniMetricStyle}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, wordBreak: "break-word" }}>{display}</div>
    </div>
  );
}

function TableScroll({ children }: { children: React.ReactNode }) {
  return <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>{children}</div>;
}

function ActionRow({ children, message }: { children: React.ReactNode; message: string }) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      {children}
      <span style={{ fontSize: 14, color: "#334155", wordBreak: "break-word" }}>{message}</span>
    </div>
  );
}

function ResponsiveStatGrid({ children }: { children: React.ReactNode }) {
  return <div style={responsiveStatGridStyle}>{children}</div>;
}

function ResponsiveTwoPanelGrid({ children }: { children: React.ReactNode }) {
  return <div style={responsiveTwoPanelGridStyle}>{children}</div>;
}

function FormGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 | 3 }) {
  const minWidth = columns === 3 ? 180 : columns === 2 ? 220 : 320;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
        marginTop: 12,
      }}
    >
      {children}
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#e5e7eb",
  color: "#1f2937",
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
  padding: 16,
  boxSizing: "border-box",
  width: "100%",
};

const headerStyle: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  padding: 18,
  borderRadius: 14,
  marginBottom: 18,
};

const navWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
};

const navButtonsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const navButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#e5e7eb",
  color: "#111827",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

const navButtonActiveStyle: React.CSSProperties = {
  ...navButtonStyle,
  background: "#1d4ed8",
  color: "white",
  border: "1px solid #1d4ed8",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#111827",
  cursor: "pointer",
  minHeight: 44,
  fontSize: 14,
};

const sectionStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const responsiveStatGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
};

const responsiveTwoPanelGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
};

const panelStyle: React.CSSProperties = {
  background: "#f8fafc",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  minWidth: 0,
};

const statCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

const miniMetricStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 10,
  border: "1px solid #94a3b8",
  background: "white",
  boxSizing: "border-box",
  fontSize: 16,
  minHeight: 44,
};

const compactInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 8,
  border: "1px solid #94a3b8",
  background: "white",
  boxSizing: "border-box",
  fontSize: 14,
  minHeight: 40,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 88,
  resize: "vertical",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #cbd5e1",
  background: "#e2e8f0",
  position: "sticky",
  top: 0,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
  background: "white",
  fontSize: 14,
};