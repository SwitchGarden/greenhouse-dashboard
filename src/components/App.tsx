import React, { useEffect, useMemo, useState } from "react";

type PageKey = "dashboard" | "inventory" | "staffDaily";

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
};

type OrderUnitType = "Lbs" | "Plants" | "6oz Bag" | "6oz Clamshell";

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
const REPEAT_HARVEST_CROPS = new Set(["brassica"]);

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isContainerUnit = (unitType: string) => unitType === "6oz Bag" || unitType === "6oz Clamshell";

const quantityToLbs = (unitType: string, quantity: number) => {
  if (unitType === "Plants") return 0;
  if (isContainerUnit(unitType)) return Math.round(quantity * SIX_OZ_IN_LBS * 100) / 100;
  return Math.round(quantity * 100) / 100;
};

const availableLbsToUnitQty = (unitType: string, lbs: number, plants: number) => {
  if (unitType === "Plants") return Math.max(0, Math.floor(plants));
  if (isContainerUnit(unitType)) return Math.max(0, Math.floor(lbs / SIX_OZ_IN_LBS));
  return Math.max(0, Math.round(lbs * 100) / 100);
};

const getUnitLabel = (unitType: string) => {
  if (unitType === "Plants") return "Plants";
  if (unitType === "6oz Bag") return "Bags";
  if (unitType === "6oz Clamshell") return "Clamshells";
  return "Lbs";
};

const isRepeatHarvestCrop = (crop: string) => REPEAT_HARVEST_CROPS.has(normalizeCropKey(crop));

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
  brassica: { expectedLbsPerTower: 3.52 },
  cilantro: { expectedLbsPerTower: 6.4 },
  dill: { expectedLbsPerTower: 3.52 },
  fennel: { expectedLbsPerTower: 3.52 },
  five_star: { expectedLbsPerTower: 3.52 },
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
  const date = new Date(value);
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

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [loadingData, setLoadingData] = useState(false);

  const [staffRows, setStaffRows] = useState<StaffActionRow[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderRow[]>([]);
  const [productionInventory, setProductionInventory] = useState<ProductionInventoryRow[]>([]);

  const [message, setMessage] = useState("");

  // Quick Action form
  const [mode, setMode] = useState("Harvest");
  const [tower, setTower] = useState("");
  const [crop, setCrop] = useState("");
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
  const [salesCrop, setSalesCrop] = useState("");
  const [salesUnitType, setSalesUnitType] = useState<OrderUnitType>("Lbs");
  const [salesQuantityNeeded, setSalesQuantityNeeded] = useState("");
  const [draftOrderLines, setDraftOrderLines] = useState<DraftOrderLine[]>([]);
  const [editingSalesOrderRowNumber, setEditingSalesOrderRowNumber] = useState<number | null>(null);
  const [salesDeliveryDate, setSalesDeliveryDate] = useState("");
  const [salesNotes, setSalesNotes] = useState("");
  const [salesSaveMessage, setSalesSaveMessage] = useState("");
  const [salesSaving, setSalesSaving] = useState(false);
  const [salesOrderType, setSalesOrderType] = useState<"One-Time" | "Contract">("One-Time");
  const [salesFrequency, setSalesFrequency] = useState("Weekly");
  const [salesContractStartDate, setSalesContractStartDate] = useState("");
  const [salesContractEndDate, setSalesContractEndDate] = useState("");

  const [savedOrderStatusFilter, setSavedOrderStatusFilter] = useState("All");
  const [savedOrderCropFilter, setSavedOrderCropFilter] = useState("All");
  const [savedOrderCustomerFilter, setSavedOrderCustomerFilter] = useState("All");

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
  const [editInventoryExpectedLbs, setEditInventoryExpectedLbs] = useState("");
  const [editInventoryRemainingExpectedLbs, setEditInventoryRemainingExpectedLbs] = useState("");
  const [editInventoryStatus, setEditInventoryStatus] = useState("Active");
  const [editInventoryNotes, setEditInventoryNotes] = useState("");
  const [editInventoryMessage, setEditInventoryMessage] = useState("");
  const [editInventorySaving, setEditInventorySaving] = useState(false);

  // Staff Daily action helpers
  const [dailyMessage, setDailyMessage] = useState("");
  const [plantingTowerType, setPlantingTowerType] = useState<Record<string, string>>({});
  const [activeHarvestRowNumber, setActiveHarvestRowNumber] = useState("");
  const [harvestActionType, setHarvestActionType] = useState<"Full Harvest" | "Trim Harvest">("Full Harvest");
  const [harvestPodsValue, setHarvestPodsValue] = useState("");
  const [harvestOutputUnit, setHarvestOutputUnit] = useState<OrderUnitType>("Lbs");
  const [harvestOutputQty, setHarvestOutputQty] = useState("");
  const [harvestNote, setHarvestNote] = useState("");
  const [staffLookupCrop, setStaffLookupCrop] = useState("");
  const [quickEntryUnitType, setQuickEntryUnitType] = useState<OrderUnitType>("Lbs");

  // Transplant form
  const [transplantRowNumber, setTransplantRowNumber] = useState("");
  const [transplantTower, setTransplantTower] = useState("");
  const [transplantTowerType, setTransplantTowerType] = useState("Low Density");
  const [transplantMaxPods, setTransplantMaxPods] = useState(String(getTowerMaxPods("Low Density")));
  const [transplantActivePods, setTransplantActivePods] = useState(String(getTowerMaxPods("Low Density")));
  const [transplantDate, setTransplantDate] = useState(formatDateInput(new Date()));
  const [transplantReadyDate, setTransplantReadyDate] = useState(addDays(formatDateInput(new Date()), 21));
  const [transplantNotes, setTransplantNotes] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

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

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      await Promise.all([loadStaffActions(), loadSalesOrders(), loadProductionInventory()]);
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
        pipelineTowers: number;
        nextReadyDate: string;
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
        pipelineTowers: 0,
        nextReadyDate: "",
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

      if (
        itemStatus === "active" ||
        itemStage === "growing" ||
        itemStage === "transplanted" ||
        itemStage === "ready" ||
        itemStage === "seeded"
      ) {
        current.pipelineTowers += 1;
      }

      if (readyNow) {
        current.readyNowLbs += remainingLbs;
        current.readyNowPlants += activePods;
      } else if (readyDate) {
        current.futureEntries.push({ readyDate, lbs: remainingLbs, plants: activePods });
      }

      if (readyDate) {
        if (!current.nextReadyDate || new Date(readyDate) < new Date(current.nextReadyDate)) {
          current.nextReadyDate = formatDateInput(readyDate);
        }
      }

      map.set(cropName, current);
    });

    for (const value of map.values()) {
      value.futureEntries.sort((a, b) => new Date(a.readyDate).getTime() - new Date(b.readyDate).getTime());
    }

    return map;
  }, [activeInventory]);

  const currentLineQtyNeeded = toNumber(salesQuantityNeeded);
  const currentLineQtyInLbs = quantityToLbs(salesUnitType, currentLineQtyNeeded);

  const salesPlanner: SalesPlannerResult = useMemo(() => {
    const qtyNeeded = toNumber(salesQuantityNeeded);
    const cropName = (salesCrop || "").trim();
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
    const availableQty = availableLbsToUnitQty(salesUnitType, readyNowLbs, readyNowPlants);
    const shortageQty = Math.max(0, qtyNeeded - availableQty);

    const qtyNeededInLbs = quantityToLbs(salesUnitType, qtyNeeded);
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
      unitLabel: getUnitLabel(salesUnitType),
      qtyNeededInLbs,
    };
  }, [
    salesCrop,
    salesQuantityNeeded,
    salesDeliveryDate,
    inventoryByCrop,
    salesUnitType,
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
    return salesOrders
      .filter((row) => (savedOrderStatusFilter === "All" ? true : getOrderStatus(row) === savedOrderStatusFilter))
      .filter((row) => (savedOrderCropFilter === "All" ? true : getOrderCrop(row) === savedOrderCropFilter))
      .filter((row) => (savedOrderCustomerFilter === "All" ? true : getOrderCustomer(row) === savedOrderCustomerFilter))
      .sort((a, b) => new Date(getOrderRequestedDeliveryDate(a)).getTime() - new Date(getOrderRequestedDeliveryDate(b)).getTime());
  }, [salesOrders, savedOrderStatusFilter, savedOrderCropFilter, savedOrderCustomerFilter]);

 const seededInventory = useMemo(() => {
  return activeInventory
    .filter((item) => normalizeStatus(getInventoryStage(item)) === "seeded")
    .sort(
      (a, b) =>
        new Date(getInventorySeededDate(a) || "2100-01-01").getTime() -
        new Date(getInventorySeededDate(b) || "2100-01-01").getTime()
    );
}, [activeInventory]);

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

  for (const [cropName, cropInventory] of inventoryByCrop.entries()) {
    cropPools.set(cropName, {
      readyLbs: cropInventory.readyNowLbs,
      readyPlants: cropInventory.readyNowPlants,
      futureEntries: cropInventory.futureEntries.map((entry) => ({ ...entry })),
    });
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

  const today = formatDateInput(new Date());

  for (const order of openOrders) {
    const cropName = getOrderCrop(order) || "Unknown Crop";
    const dueDate = getOrderRequestedDeliveryDate(order);
    if (!dueDate) continue;

    const unitType = getOrderUnitType(order);
    const qtyNeeded = toNumber(getOrderQuantityNeeded(order));
    const qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
    const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));
    const seedByDate = addDays(dueDate, -42);

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
      if (entry.readyDate && entry.readyDate <= dueDate) {
        availableLbsByDue += entry.lbs;
        availablePlantsByDue += entry.plants;
      } else {
        remainingFutureEntries.push(entry);
      }
    }

    const shortageLbs = Math.max(0, qtyNeededInLbs - availableLbsByDue);
    const newTowersNeeded = shortageLbs > 0 ? Math.ceil(shortageLbs / avgQtyPerTower) : 0;

    const consumedLbs = Math.min(qtyNeededInLbs, availableLbsByDue);
    const consumedPlants = Math.min(
      unitType === "Plants" ? qtyNeeded : Math.round((consumedLbs * 16) / 6),
      availablePlantsByDue
    );

    pool.readyLbs = Math.max(0, availableLbsByDue - consumedLbs);
    pool.readyPlants = Math.max(0, availablePlantsByDue - consumedPlants);
    pool.futureEntries = remainingFutureEntries;
    cropPools.set(cropName, pool);

    if (newTowersNeeded <= 0 || !seedByDate) continue;

    const seededCount = activeInventory.filter(
      (item) => getInventoryCrop(item) === cropName && normalizeStatus(getInventoryStage(item)) === "seeded"
    ).length;

    const pipelineCount = activeInventory.filter(
      (item) =>
        getInventoryCrop(item) === cropName &&
        ["seeded", "transplanted", "growing", "ready"].includes(normalizeStatus(getInventoryStage(item))) &&
        !["harvested", "lost", "scrapped", "closed"].includes(normalizeStatus(getInventoryStatus(item)))
    ).length;

    const cropInventory = inventoryByCrop.get(cropName);
    const key = `${seedByDate}__${cropName}`;
    const urgency: "Overdue" | "Today" | "Upcoming" =
      seedByDate < today ? "Overdue" : seedByDate === today ? "Today" : "Upcoming";

    const current = grouped.get(key) || {
      crop: cropName,
      totalTowers: 0,
      orders: [],
      orderCount: 0,
      seedByDate,
      earliestDueDate: dueDate,
      currentAvailableLbs: cropInventory ? cropInventory.availableLbs : 0,
      currentAvailablePlants: cropInventory ? cropInventory.availablePlants : 0,
      seededCount,
      pipelineCount,
      urgency,
    };

    current.totalTowers += newTowersNeeded;
    current.orderCount += 1;
    current.orders.push(`${getOrderCustomer(order)} (${newTowersNeeded} towers)`);
    if (!current.earliestDueDate || new Date(dueDate) < new Date(current.earliestDueDate)) {
      current.earliestDueDate = dueDate;
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const dateCompare =
      new Date(a.seedByDate || "2100-01-01").getTime() - new Date(b.seedByDate || "2100-01-01").getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.crop.localeCompare(b.crop);
  });
}, [openOrders, activeInventory, inventoryByCrop]);

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
  return openOrders
    .filter((order) => {
      const status = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "harvested", "packed"].includes(status)) return false;

      const dueDate = getOrderRequestedDeliveryDate(order);
      const cropName = getOrderCrop(order);

      const hasReadyInventory = readyToHarvestInventory.some(
        (item) => getInventoryCrop(item) === cropName
      );

      return (
  isDueTodayOrTomorrow(dueDate) ||
  isOverdue(dueDate)
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
}, [openOrders, readyToHarvestInventory]);

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
    const podsInProduction = activeInventory.reduce((sum, row) => sum + toNumber(getInventoryActivePods(row)), 0);

    return {
      activeOrders: activeOrders.length,
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
        const qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
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
      const qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
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

    if ((!tower && mode !== "Farmers Market") || !crop || !entryDate) {
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

    const payload = {
      action: "saveStaffAction",
      mode,
      tower: mode === "Farmers Market" ? "" : tower,
      crop,
      lbs: convertedLbs,
      podsChanged: convertedPods,
      status: entryStatus,
      stage,
      date: entryDate,
      scrapType,
      note: [note, ["Harvest", "Farmers Market", "Pack"].includes(mode) ? `Unit: ${quickEntryUnitType}; Qty Entered: ${enteredQty}` : ""].filter(Boolean).join(" | "),
    };

    try {
      const result = await postToBackend(payload);

      if (result.ok) {
        setMessage("Saved to Staff_Actions.");
        setTower("");
        setCrop("");
        setLbs("");
        setPodsChanged("");
        setQuickEntryUnitType("Lbs");
        setEntryStatus("");
        setStage("");
        setScrapType("");
        setNote("");
        await loadStaffActions();
      } else {
        setMessage(result.message || "Unable to save entry.");
      }
    } catch (error) {
      console.error("saveQuickAction error:", error);
      setMessage("Error saving entry.");
    }
  };

  const addCurrentLineToBatch = () => {
    if (!salesCrop || !salesQuantityNeeded) {
      setSalesSaveMessage("Please choose crop, unit, and quantity before adding a line item.");
      return;
    }
    setDraftOrderLines((prev) => [
      ...prev,
      { id: makeId(), crop: salesCrop, unitType: salesUnitType, quantityNeeded: salesQuantityNeeded },
    ]);
    setSalesCrop("");
    setSalesUnitType("Lbs");
    setSalesQuantityNeeded("");
    setSalesSaveMessage("Line item added to order.");
  };

  const removeDraftOrderLine = (id: string) => {
    setDraftOrderLines((prev) => prev.filter((line) => line.id !== id));
  };

  const startEditSalesOrder = (order: SalesOrderRow) => {
    setEditingSalesOrderRowNumber(order.rowNumber);
    setDraftOrderLines([]);
    setSalesCustomer(getOrderCustomer(order));
    setSalesCrop(getOrderCrop(order));
    setSalesUnitType((getOrderUnitType(order) as OrderUnitType) || "Lbs");
    setSalesQuantityNeeded(String(getOrderQuantityNeeded(order) || ""));
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
    setSalesCrop("");
    setSalesUnitType("Lbs");
    setSalesQuantityNeeded("");
    setSalesDeliveryDate("");
    setSalesNotes("");
    setSalesOrderType("One-Time");
    setSalesFrequency("Weekly");
    setSalesContractStartDate("");
    setSalesContractEndDate("");
    setDraftOrderLines([]);
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
    const currentLineValid = !!salesCrop && !!toNumber(salesQuantityNeeded);
    const lineItems = editingSalesOrderRowNumber
      ? currentLineValid
        ? [{ id: makeId(), crop: salesCrop, unitType: salesUnitType, quantityNeeded: salesQuantityNeeded }]
        : []
      : [...draftOrderLines, ...(currentLineValid ? [{ id: makeId(), crop: salesCrop, unitType: salesUnitType, quantityNeeded: salesQuantityNeeded }] : [])];

    if (!salesCustomer || lineItems.length === 0) {
      setSalesSaveMessage("Please enter customer and at least one line item.");
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
        const result = await postToBackend({
          action: "updateSalesOrderRow",
          rowNumber: editingSalesOrderRowNumber,
          customer: salesCustomer,
          crop: salesCrop,
          unitType: salesUnitType,
          quantityNeeded: toNumber(salesQuantityNeeded),
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

  const handleSaveInventory = async () => {
    if (!inventoryTower || !inventoryCrop) {
      setInventoryMessage("Please enter tower and crop.");
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

    const keepRowActiveForRepeatHarvest = adjustMode === "Harvest" && isRepeatHarvestCrop(cropName) && podsToRemove === 0;
    const newStatus = keepRowActiveForRepeatHarvest ? (getInventoryStatus(selected) || "Active") : (newActivePods === 0 ? (adjustMode === "Harvest" ? "Harvested" : "Scrapped") : getInventoryStatus(selected) || "Active");
    const newStage = keepRowActiveForRepeatHarvest ? (getInventoryStage(selected) || "Growing") : (newActivePods === 0 ? (adjustMode === "Harvest" ? "Harvested" : "Scrapped") : getInventoryStage(selected) || "Growing");
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
        tower: getInventoryTower(selected),
        towerType: getInventoryTowerType(selected),
        maxPods,
        activePods: newActivePods,
        crop: cropName,
        stage: newStage,
        seededDate: getInventorySeededDate(selected),
        transplantDate: getInventoryTransplantDate(selected),
        estimatedReadyDate: getInventoryEstimatedReadyDate(selected),
        expectedLbs: currentExpectedLbs,
        remainingExpectedLbs: newRemainingLbs,
        status: newStatus,
        notes: updatedNotes,
      });

      if (updateResult.ok) {
        setAdjustMessage(`${adjustMode} adjustment saved.`);
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
    setEditInventoryMessage("");
  };

  const handleMarkPlanted = async (task: { crop: string; totalTowers: number; earliestDueDate: string }) => {
    try {
      setDailyMessage("");

      const selectedTowerType = plantingTowerType[task.crop] || "Low Density";
      const maxPods = getTowerMaxPods(selectedTowerType);
      const expectedLbs = calculateExpectedLbs(task.crop, maxPods, selectedTowerType);

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

      const actionResult = await postToBackend({
        action: "saveStaffAction",
        mode: "Plant",
        tower: "",
        crop: task.crop,
        lbs: "",
        podsChanged: maxPods * task.totalTowers,
        status: "Completed",
        stage: "Seeded",
        date: formatDateInput(new Date()),
        scrapType: "",
        note: `Planted ${task.totalTowers} towers for due date ${task.earliestDueDate || ""}. Tower Type: ${selectedTowerType}`,
      });

      if (!actionResult.ok) {
        setDailyMessage("Unable to log planted action.");
        return;
      }

      for (let i = 0; i < task.totalTowers; i += 1) {
        const invResult = await postToBackend({
          action: "saveProductionInventory",
          tower: "",
          towerType: selectedTowerType,
          maxPods,
          activePods: maxPods,
          crop: task.crop,
          stage: "Seeded",
          seededDate: formatDateInput(new Date()),
          transplantDate: "",
          estimatedReadyDate: addDays(formatDateInput(new Date()), 42),
          expectedLbs,
          remainingExpectedLbs: expectedLbs,
          status: "Active",
          notes: `Created from Plant Today task. Due by ${task.earliestDueDate || ""}`,
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
    setHarvestActionType(isRepeatHarvestCrop(getInventoryCrop(item)) ? "Trim Harvest" : "Full Harvest");
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
      const newStatus = isFinished ? "Harvested" : getInventoryStatus(selected) || "Active";
      const newStage = isFinished ? "Harvested" : getInventoryStage(selected) || "Ready";
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
        tower: getInventoryTower(selected),
        towerType: getInventoryTowerType(selected),
        maxPods: toNumber(getInventoryMaxPods(selected)),
        activePods: newActivePods,
        crop: getInventoryCrop(selected),
        stage: newStage,
        seededDate: getInventorySeededDate(selected),
        transplantDate: getInventoryTransplantDate(selected),
        estimatedReadyDate: getInventoryEstimatedReadyDate(selected),
        expectedLbs: currentExpectedLbs,
        remainingExpectedLbs: newRemainingLbs,
        status: newStatus,
        notes: updatedNotes,
      });

      if (!updateResult.ok) {
        setDailyMessage(updateResult.message || "Unable to update ready-to-harvest inventory row.");
        return;
      }

      setDailyMessage(
        isFinished
          ? `Harvest saved for ${getInventoryCrop(selected)}. That row is complete and removed from Ready to Harvest.`
          : `Harvest saved for ${getInventoryCrop(selected)}.`
      );
      clearReadyHarvestAction();
      await Promise.all([loadProductionInventory(), loadStaffActions()]);
    } catch (error) {
      console.error("handleReadyHarvestSubmit error:", error);
      setDailyMessage("Error marking harvested.");
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
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0, fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.15 }}>
            Switchpoint Greenhouse Dashboard
          </h1>
          <p style={{ margin: "10px 0 0 0", opacity: 0.9, fontSize: 15 }}>
            Mobile-friendly operations build for dashboard, production inventory, and staff daily tasks.
          </p>
        </header>

        <div style={navWrapStyle}>
          <div style={navButtonsStyle}>
            <button onClick={() => setActivePage("dashboard")} style={activePage === "dashboard" ? navButtonActiveStyle : navButtonStyle}>
              Dashboard
            </button>
            <button onClick={() => setActivePage("inventory")} style={activePage === "inventory" ? navButtonActiveStyle : navButtonStyle}>
              Production Inventory
            </button>
            <button onClick={() => setActivePage("staffDaily")} style={activePage === "staffDaily" ? navButtonActiveStyle : navButtonStyle}>
              Staff Daily
            </button>
          </div>

          <button onClick={loadAllData} style={secondaryButtonStyle}>
            {loadingData ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {activePage === "dashboard" && (
          <div style={sectionStackStyle}>
            <ResponsiveStatGrid>
              <StatCard label="Active Orders" value={dashboardStats.activeOrders} />
              <StatCard label="Qty on Order" value={dashboardStats.totalQtyOnOrder} />
              <StatCard label="New Towers Needed" value={dashboardStats.totalNewTowersNeeded} />
              <StatCard label="Active Inventory Entries" value={dashboardStats.activeInventoryCount} />
              <StatCard label="Ready Inventory" value={dashboardStats.readyInventory} />
              <StatCard label="Overdue Orders" value={dashboardStats.overdueOrders} />
              <StatCard label="Harvested This Week (lbs)" value={dashboardStats.harvestedThisWeek} />
              <StatCard label="Scrapped This Week (lbs)" value={dashboardStats.scrappedThisWeek} />
              <StatCard label="Harvested Prev Week (lbs)" value={dashboardStats.harvestedPrevWeek} />
              <StatCard label="Scrapped Prev Week (lbs)" value={dashboardStats.scrappedPrevWeek} />
              <StatCard label="Pods in Production" value={dashboardStats.podsInProduction} />
            </ResponsiveStatGrid>

            <ResponsiveTwoPanelGrid>
              <Panel title="Executive Alerts">
                <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "auto" }}>
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
                          <td colSpan={6} style={tdStyle}>No critical alerts right now.</td>
                        </tr>
                      ) : (
                        executiveAlerts.map((alert, index) => (
                          <tr key={`${alert.title}-${index}`}>
                            <td style={tdStyle}>{alert.level}</td>
                            <td style={tdStyle}>{alert.title}</td>
                            <td style={tdStyle}>{alert.detail}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Short Orders / Planting Pressure">
                <TableScroll>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Crop</th>
                        <th style={thStyle}>Due Date</th>
                        <th style={thStyle}>Shortage Qty</th>
                        <th style={thStyle}>New Towers</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
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
            </ResponsiveTwoPanelGrid>

            <ResponsiveTwoPanelGrid>
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
                          <td colSpan={3} style={tdStyle}>No seeding needed yet.</td>
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

              <Panel title="Sales Planner / Order Planner">
                <FormGrid columns={2}>
                  <Field label="Customer">
                    <input value={salesCustomer} onChange={(e) => setSalesCustomer(e.target.value)} style={inputStyle} />
                  </Field>

                  <Field label="Current Crop Line">
                    <select value={salesCrop} onChange={(e) => setSalesCrop(e.target.value)} style={inputStyle}>
                      <option value="">Select Crop</option>
                      {uniqueCrops.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Order Type">
                    <select value={salesOrderType} onChange={(e) => setSalesOrderType(e.target.value as "One-Time" | "Contract")} style={inputStyle}>
                      <option value="One-Time">One-Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </Field>

                  <Field label="Unit Type">
                    <select value={salesUnitType} onChange={(e) => setSalesUnitType(e.target.value as OrderUnitType)} style={inputStyle}>
                      <option value="Lbs">Lbs</option>
                      <option value="Plants">Plants</option>
                      <option value="6oz Bag">6oz Bag</option>
                      <option value="6oz Clamshell">6oz Clamshell</option>
                    </select>
                  </Field>

                  <Field label={salesUnitType === "Plants" ? "Plants Needed" : salesUnitType === "Lbs" ? "Lbs Needed" : `Qty ${salesUnitType}`}>
                    <input value={salesQuantityNeeded} onChange={(e) => setSalesQuantityNeeded(e.target.value)} style={inputStyle} />
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

                <Field label="Notes">
                  <textarea value={salesNotes} onChange={(e) => setSalesNotes(e.target.value)} style={textareaStyle} />
                </Field>

                <MetricGrid>
                  <MiniMetric label={`Available ${salesPlanner.unitLabel}`} value={salesPlanner.availableQty} />
                  <MiniMetric label={`Shortage ${salesPlanner.unitLabel}`} value={salesPlanner.shortageQty} />
                  <MiniMetric label="Current Line Lbs" value={salesPlanner.qtyNeededInLbs} />
                  <MiniMetric label="Towers Needed" value={salesPlanner.towersNeeded} />
                  <MiniMetric label="Pipeline Towers" value={salesPlanner.pipelineTowers} />
                  <MiniMetric label="New Towers To Plant" value={salesPlanner.newTowersToPlant} />
                  <MiniMetric label="Estimated Ready Date" value={salesPlanner.estimatedReadyDate || "-"} />
                  <MiniMetric label="Feasible" value={salesPlanner.deliveryFeasible ? "Yes" : "No"} />
                </MetricGrid>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  {!editingSalesOrderRowNumber && (
                    <button onClick={addCurrentLineToBatch} style={secondaryButtonStyle}>
                      Add Line Item
                    </button>
                  )}
                  {editingSalesOrderRowNumber ? (
                    <button onClick={cancelEditSalesOrder} style={secondaryButtonStyle}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>

                {(draftOrderLines.length > 0 || editingSalesOrderRowNumber) && (
                  <TableScroll>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Crop</th>
                          <th style={thStyle}>Unit</th>
                          <th style={thStyle}>Qty</th>
                          <th style={thStyle}>Approx Lbs</th>
                          {!editingSalesOrderRowNumber && <th style={thStyle}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {draftOrderLines.map((line) => (
                          <tr key={line.id}>
                            <td style={tdStyle}>{line.crop}</td>
                            <td style={tdStyle}>{line.unitType}</td>
                            <td style={tdStyle}>{line.quantityNeeded}</td>
                            <td style={tdStyle}>{quantityToLbs(line.unitType, toNumber(line.quantityNeeded))}</td>
                            {!editingSalesOrderRowNumber && (
                              <td style={tdStyle}>
                                <button onClick={() => removeDraftOrderLine(line.id)} style={secondaryButtonStyle}>Remove</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                )}

                <ActionRow message={salesSaveMessage}>
                  <button onClick={handleSaveOrder} style={primaryButtonStyle} disabled={salesSaving}>
                    {salesSaving ? "Saving..." : editingSalesOrderRowNumber ? "Update Order" : "Save Order"}
                  </button>
                </ActionRow>
              </Panel>
            </ResponsiveTwoPanelGrid>

            <div style={sectionStackStyle}>
              <Panel title="Recent Activity">
                <FormGrid columns={3}>
                  <Field label="Mode Filter">
                    <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueModes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Crop Filter">
                    <select value={filterCrop} onChange={(e) => setFilterCrop(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueCrops.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tower Filter">
                    <select value={filterTower} onChange={(e) => setFilterTower(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueTowers.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecentActivity.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={tdStyle}>
                            No recent activity.
                          </td>
                        </tr>
                      ) : (
                        filteredRecentActivity.slice(0, 10).map((row) => (
                          <tr key={row.rowNumber}>
                            <td style={tdStyle}>{formatDateTimeDisplay(getStaffTimestamp(row))}</td>
                            <td style={tdStyle}>{getStaffMode(row)}</td>
                            <td style={tdStyle}>{getStaffTower(row)}</td>
                            <td style={tdStyle}>{getStaffCrop(row)}</td>
                            <td style={tdStyle}>{getStaffLbs(row)}</td>
                            <td style={tdStyle}>{getStaffPodsChanged(row)}</td>
                            <td style={tdStyle}>{getStaffNote(row)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Showing 10 most recent entries.
                </div>
              </Panel>

              <Panel title="Saved Orders">
                <FormGrid columns={3}>
                  <Field label="Status Filter">
                    <select value={savedOrderStatusFilter} onChange={(e) => setSavedOrderStatusFilter(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueOrderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Crop Filter">
                    <select value={savedOrderCropFilter} onChange={(e) => setSavedOrderCropFilter(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueCrops.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Customer Filter">
                    <select value={savedOrderCustomerFilter} onChange={(e) => setSavedOrderCustomerFilter(e.target.value)} style={inputStyle}>
                      <option value="All">All</option>
                      {uniqueCustomers.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormGrid>

                <div style={{ maxHeight: 290, overflowY: "auto", overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Crop</th>
                        <th style={thStyle}>Unit</th>
                        <th style={thStyle}>Qty</th>
                        <th style={thStyle}>Delivery</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>New Towers</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSavedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={tdStyle}>
                            No saved orders.
                          </td>
                        </tr>
                      ) : (
                        filteredSavedOrders.map((order) => (
                          <tr key={order.rowNumber}>
                            <td style={tdStyle}>{getOrderCustomer(order)}</td>
                            <td style={tdStyle}>{getOrderCrop(order)}</td>
                            <td style={tdStyle}>{getOrderUnitType(order)}</td>
                            <td style={tdStyle}>{getOrderQuantityNeeded(order)}</td>
                            <td style={tdStyle}>{formatDateDisplay(getOrderRequestedDeliveryDate(order))}</td>
                            <td style={tdStyle}>
                              {getOrderType(order)}
                              {getOrderFrequency(order) ? ` / ${getOrderFrequency(order)}` : ""}
                            </td>
                            <td style={tdStyle}>{getOrderNewTowersToPlant(order)}</td>
                            <td style={tdStyle}>
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
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button onClick={() => startEditSalesOrder(order)} style={primaryButtonStyle}>Edit</button>
                                <button onClick={() => handleCancelSalesOrder(order.rowNumber)} style={secondaryButtonStyle}>Cancel</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Showing 5 visible rows. Scroll to see the rest.
                </div>
              </Panel>
            </div>
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
    <Panel title="Staff Daily Overview">
      <MetricGrid>
        <MiniMetric label="Plant Tasks" value={plantTodayTasks.length} />
        <MiniMetric label="Seeded Entries" value={seededInventory.length} />
        <MiniMetric label="Ready to Harvest" value={readyToHarvestInventory.length} />
        <MiniMetric label="Transplant Tasks" value={transplantTodayTasks.length} />
        <MiniMetric label="Harvest Tasks" value={harvestTodayTasks.length} />
        <MiniMetric label="Pack Tasks" value={packTodayTasks.length} />
        <MiniMetric label="Overdue Orders" value={overdueOrders.length} />
        <MiniMetric label="Harvested This Week (lbs)" value={weeklyMetrics.harvestedThisWeek} />
        <MiniMetric label="Scrapped This Week (lbs)" value={weeklyMetrics.scrappedThisWeek} />
        <MiniMetric label="Pods in Production" value={dashboardStats.podsInProduction} />
      </MetricGrid>
      <div style={{ marginTop: 12, fontSize: 14, color: "#334155" }}>{dailyMessage}</div>
    </Panel>

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
          <MiniMetric label="Pods in Production" value={inventoryByCrop.get(staffLookupCrop)?.availablePlants || 0} />
          <MiniMetric label="Lbs in Production" value={Math.round((inventoryByCrop.get(staffLookupCrop)?.availableLbs || 0) * 100) / 100} />
          <MiniMetric label="Ready Now Lbs" value={Math.round((inventoryByCrop.get(staffLookupCrop)?.readyNowLbs || 0) * 100) / 100} />
          <MiniMetric label="Pipeline Towers" value={inventoryByCrop.get(staffLookupCrop)?.pipelineTowers || 0} />
          <MiniMetric label="Next Ready Date" value={inventoryByCrop.get(staffLookupCrop)?.nextReadyDate || "-"} />
        </MetricGrid>
      ) : (
        <div style={{ marginTop: 12, fontSize: 14, color: "#475569" }}>Choose a crop to see towers, pods, and pounds in production.</div>
      )}
    </Panel>

                  <Panel title="Quick Action / Staff Entry">
                <FormGrid columns={2}>
                  <Field label="Mode">
                    <select value={mode} onChange={(e) => setMode(e.target.value)} style={inputStyle}>
                      <option value="Harvest">Harvest</option>
                      <option value="Farmers Market">Farmers Market</option>
                      <option value="Scrapped">Scrapped</option>
                      <option value="Seed">Seed</option>
                      <option value="Transplant">Transplant</option>
                      <option value="Pack">Pack</option>
                    </select>
                  </Field>

                  <Field label="Tower">
                    <input value={tower} onChange={(e) => setTower(e.target.value)} style={inputStyle} placeholder="R1" />
                  </Field>

                  <Field label="Crop">
                    <select value={crop} onChange={(e) => setCrop(e.target.value)} style={inputStyle}>
                      <option value="">Select Crop</option>
                      {uniqueCrops.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={quickEntryUnitType === "Plants" ? "Plants / Pods" : quickEntryUnitType === "Lbs" ? "Lbs" : `Qty (${quickEntryUnitType})`}>
                    <input value={lbs} onChange={(e) => setLbs(e.target.value)} style={inputStyle} placeholder="12" />
                  </Field>

                  <Field label="Entry Unit">
                    <select value={quickEntryUnitType} onChange={(e) => setQuickEntryUnitType(e.target.value as OrderUnitType)} style={inputStyle}>
                      <option value="Lbs">Lbs</option>
                      <option value="Plants">Plants</option>
                      <option value="6oz Bag">6oz Bag</option>
                      <option value="6oz Clamshell">6oz Clamshell</option>
                    </select>
                  </Field>

                  <Field label="Pods Changed">
                    <input value={podsChanged} onChange={(e) => setPodsChanged(e.target.value)} style={inputStyle} placeholder="20" />
                  </Field>

                  <Field label="Status">
                    <input value={entryStatus} onChange={(e) => setEntryStatus(e.target.value)} style={inputStyle} placeholder="Completed" />
                  </Field>

                  <Field label="Stage">
                    <input value={stage} onChange={(e) => setStage(e.target.value)} style={inputStyle} placeholder="Growing / Ready" />
                  </Field>

                  <Field label="Date">
                    <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inputStyle} />
                  </Field>

                  <Field label="Scrap Type">
                    <input value={scrapType} onChange={(e) => setScrapType(e.target.value)} style={inputStyle} placeholder="Disease / Damage" />
                  </Field>
                </FormGrid>

                <Field label="Note">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} style={textareaStyle} />
                </Field>

                <ActionRow message={message}>
                  <button onClick={saveQuickAction} style={primaryButtonStyle}>
                    Save to Staff_Actions
                  </button>
                </ActionRow>
              </Panel>


    <Panel title="Seed Today / Seeding Schedule">
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Seed By</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Towers to Seed</th>
              <th style={thStyle}>Ready By</th>
              <th style={thStyle}>Available Lbs</th>
              <th style={thStyle}>Available Plants</th>
              <th style={thStyle}>Seeded</th>
              <th style={thStyle}>Pipeline</th>
              <th style={thStyle}>Orders</th>
              <th style={thStyle}>Tower Type</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {plantTodayTasks.length === 0 ? (
              <tr>
                <td colSpan={12} style={tdStyle}>
                  No seeding tasks right now.
                </td>
              </tr>
            ) : (
              plantTodayTasks.map((task) => (
                <tr key={`${task.seedByDate}-${task.crop}`}>
                  <td style={tdStyle}>{formatDateDisplay(task.seedByDate)}</td>
                  <td style={tdStyle}>{task.urgency}</td>
                  <td style={tdStyle}>{task.crop}</td>
                  <td style={tdStyle}>{task.totalTowers}</td>
                  <td style={tdStyle}>{formatDateDisplay(task.earliestDueDate)}</td>
                  <td style={tdStyle}>{Math.round(task.currentAvailableLbs * 100) / 100}</td>
                  <td style={tdStyle}>{task.currentAvailablePlants}</td>
                  <td style={tdStyle}>{task.seededCount}</td>
                  <td style={tdStyle}>{task.pipelineCount}</td>
                  <td style={tdStyle}>{task.orders.join(", ")}</td>
                  <td style={tdStyle}>
                    <select
                      value={plantingTowerType[task.crop] || "Low Density"}
                      onChange={(e) =>
                        setPlantingTowerType((prev) => ({
                          ...prev,
                          [task.crop]: e.target.value,
                        }))
                      }
                      style={compactInputStyle}
                    >
                      <option value="Low Density">Low Density</option>
                      <option value="High Density">High Density</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleMarkPlanted(task)} style={primaryButtonStyle}>
                      Mark Planted
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Seeded Section">
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
            </tr>
          </thead>
          <tbody>
            {seededInventory.length === 0 ? (
              <tr>
                <td colSpan={6} style={tdStyle}>
                  No seeded inventory entries yet.
                </td>
              </tr>
            ) : (
              seededInventory.map((item) => (
                <tr key={item.rowNumber}>
                  <td style={tdStyle}>{getInventoryTower(item) || "-"}</td>
                  <td style={tdStyle}>{getInventoryTowerType(item)}</td>
                  <td style={tdStyle}>{getInventoryCrop(item)}</td>
                  <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                  <td style={tdStyle}>{formatDateDisplay(getInventorySeededDate(item))}</td>
                  <td style={tdStyle}>{formatDateDisplay(getInventoryEffectiveReadyDate(item))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScroll>
    </Panel>

    <Panel title="Transplant Today">
      <FormGrid columns={3}>
        <Field label="Seeded Item">
          <select
            value={transplantRowNumber}
            onChange={(e) => setTransplantRowNumber(e.target.value)}
            style={compactInputStyle}
          >
            <option value="">Select seeded item</option>
            {transplantTodayTasks.map((item) => (
              <option key={item.rowNumber} value={item.rowNumber}>
                {getInventoryCrop(item)} - {formatDateDisplay(getInventorySeededDate(item))}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tower">
          <input
            value={transplantTower}
            onChange={(e) => setTransplantTower(e.target.value)}
            style={compactInputStyle}
            placeholder="R1"
          />
        </Field>

        <Field label="Tower Type">
          <select
            value={transplantTowerType}
            onChange={(e) => setTransplantTowerType(e.target.value)}
            style={compactInputStyle}
          >
            <option value="Low Density">Low Density (44)</option>
            <option value="High Density">High Density (160)</option>
          </select>
        </Field>

        <Field label="Max Pods">
          <input
            value={transplantMaxPods}
            onChange={(e) => setTransplantMaxPods(e.target.value)}
            style={compactInputStyle}
          />
        </Field>

        <Field label="Active Pods">
          <input
            value={transplantActivePods}
            onChange={(e) => setTransplantActivePods(e.target.value)}
            style={compactInputStyle}
          />
        </Field>

        <Field label="Transplant Date">
          <input
            type="date"
            value={transplantDate}
            onChange={(e) => setTransplantDate(e.target.value)}
            style={compactInputStyle}
          />
        </Field>

        <Field label="Estimated Ready Date">
          <input
            type="date"
            value={transplantReadyDate}
            onChange={(e) => setTransplantReadyDate(e.target.value)}
            style={compactInputStyle}
          />
        </Field>
      </FormGrid>

      <Field label="Notes">
        <input
          value={transplantNotes}
          onChange={(e) => setTransplantNotes(e.target.value)}
          style={compactInputStyle}
        />
      </Field>

      <ActionRow message={dailyMessage}>
        <button onClick={handleMarkTransplanted} style={primaryButtonStyle}>
          Mark Transplanted
        </button>
      </ActionRow>
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
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>Active Pods</th>
                <th style={thStyle}>Expected Lbs</th>
                <th style={thStyle}>Remaining Lbs</th>
                <th style={thStyle}>Ready Date</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {readyToHarvestInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={tdStyle}>
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
                        <td style={tdStyle}>{getInventoryStage(item)}</td>
                        <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                        <td style={tdStyle}>{getInventoryExpectedLbs(item)}</td>
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
                          <td colSpan={8} style={{ ...tdStyle, background: "#f8fafc" }}>
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

    <Panel title="Overdue / Due Soon">
      <TableScroll>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Crop</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>New Towers</th>
            </tr>
          </thead>
          <tbody>
            {overdueOrders.length === 0 ? (
              <tr>
                <td colSpan={5} style={tdStyle}>
                  No overdue orders.
                </td>
              </tr>
            ) : (
              overdueOrders.map((order) => (
                <tr key={order.rowNumber}>
                  <td style={tdStyle}>{getOrderCustomer(order)}</td>
                  <td style={tdStyle}>{getOrderCrop(order)}</td>
                  <td style={tdStyle}>{formatDateDisplay(getOrderRequestedDeliveryDate(order))}</td>
                  <td style={tdStyle}>{getOrderStatus(order)}</td>
                  <td style={tdStyle}>{getOrderNewTowersToPlant(order)}</td>
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
              <th style={thStyle}>Pods Changed</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecentActivity.length === 0 ? (
              <tr>
                <td colSpan={7} style={tdStyle}>
                  No recent activity found.
                </td>
              </tr>
            ) : (
              filteredRecentActivity.map((row) => (
                <tr key={row.rowNumber}>
                  <td style={tdStyle}>{formatDateTimeDisplay(getStaffTimestamp(row))}</td>
                  <td style={tdStyle}>{getStaffMode(row)}</td>
                  <td style={tdStyle}>{getStaffTower(row)}</td>
                  <td style={tdStyle}>{getStaffCrop(row)}</td>
                  <td style={tdStyle}>{getStaffLbs(row)}</td>
                  <td style={tdStyle}>{getStaffPodsChanged(row)}</td>
                  <td style={tdStyle}>{formatDateDisplay(getStaffDate(row))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        Showing 5 visible rows. Scroll to see the rest.
      </div>
    </Panel>
  </div>
)}
      </div>
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
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={miniMetricStyle}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
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
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1440,
  margin: "0 auto",
  padding: 16,
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
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
  minWidth: 680,
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