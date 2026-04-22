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

type SalesPlannerResult = {
  availableQty: number;
  shortageQty: number;
  towersNeeded: number;
  pipelineTowers: number;
  newTowersToPlant: number;
  estimatedReadyDate: string;
  deliveryFeasible: boolean;
  unitLabel: string;
};

const API_URL = import.meta.env.VITE_API_BASE_URL;

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
  const [salesUnitType, setSalesUnitType] = useState<"Lbs" | "Plants">("Lbs");
  const [salesQuantityNeeded, setSalesQuantityNeeded] = useState("");
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
    if (salesCrop) {
   setSalesUnitType("Lbs");
    }
  }, [salesCrop]);

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
      }
    >();

    activeInventory.forEach((item) => {
      const cropName = (getInventoryCrop(item) || "").trim();
      if (!cropName) return;

      const current = map.get(cropName) || {
        towers: 0,
        availableLbs: 0,
        availablePlants: 0,
        pipelineTowers: 0,
        nextReadyDate: "",
      };

      current.towers += 1;
      current.availableLbs += toNumber(getInventoryRemainingExpectedLbs(item));
      current.availablePlants += toNumber(getInventoryActivePods(item));

      const itemStatus = normalizeStatus(getInventoryStatus(item));
      const itemStage = normalizeStatus(getInventoryStage(item));

      if (
        itemStatus === "active" ||
        itemStage === "growing" ||
        itemStage === "transplanted" ||
        itemStage === "ready" ||
        itemStage === "seeded"
      ) {
        current.pipelineTowers += 1;
      }

      const readyDate = getInventoryEstimatedReadyDate(item);
      if (readyDate) {
        if (!current.nextReadyDate || new Date(readyDate) < new Date(current.nextReadyDate)) {
          current.nextReadyDate = formatDateInput(readyDate);
        }
      }

      map.set(cropName, current);
    });

    return map;
  }, [activeInventory]);

  const salesPlanner: SalesPlannerResult = useMemo(() => {
    const qtyNeeded = toNumber(salesQuantityNeeded);
    const cropName = (salesCrop || "").trim();
    const cropInventory = inventoryByCrop.get(cropName);

    const availableQty =
      salesUnitType === "Plants"
        ? cropInventory
          ? cropInventory.availablePlants
          : 0
        : cropInventory
        ? Math.round(cropInventory.availableLbs * 100) / 100
        : 0;

    const shortageQty = Math.max(0, qtyNeeded - availableQty);

    const avgQtyPerTower =
      salesUnitType === "Plants"
        ? 44
        : Math.max(0.1, calculateExpectedLbs(cropName, 44));

    const towersNeeded = qtyNeeded > 0 ? Math.ceil(qtyNeeded / avgQtyPerTower) : 0;
    const pipelineTowers = cropInventory ? cropInventory.pipelineTowers : 0;
    const newTowersToPlant = Math.max(0, towersNeeded - pipelineTowers);

    let estimatedReadyDate = cropInventory?.nextReadyDate || "";
    if (!estimatedReadyDate) {
      const baseDate = salesOrderType === "Contract" ? salesContractStartDate : salesDeliveryDate;
      if (baseDate) estimatedReadyDate = addDays(baseDate, 42);
    }

    const targetDate = salesOrderType === "Contract" ? salesContractStartDate : salesDeliveryDate;
    const deliveryFeasible =
      !!targetDate &&
      !!estimatedReadyDate &&
      new Date(estimatedReadyDate).getTime() <= new Date(targetDate).getTime();

    return {
      availableQty,
      shortageQty,
      towersNeeded,
      pipelineTowers,
      newTowersToPlant,
      estimatedReadyDate,
      deliveryFeasible,
      unitLabel: salesUnitType,
    };
  }, [
    salesCrop,
    salesQuantityNeeded,
    salesDeliveryDate,
    inventoryByCrop,
    salesUnitType,
    salesOrderType,
    salesContractStartDate,
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
      .sort((a, b) => new Date(getInventorySeededDate(a) || "2100-01-01").getTime() - new Date(getInventorySeededDate(b) || "2100-01-01").getTime());
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

  const plantTodayTasks = useMemo(() => {
    const grouped = new Map<
      string,
      {
        crop: string;
        totalTowers: number;
        orders: string[];
        earliestDueDate: string;
      }
    >();

    salesOrders.forEach((order) => {
      const orderStatus = normalizeStatus(getOrderStatus(order));
      if (["completed", "cancelled", "harvested", "packed"].includes(orderStatus)) return;

      const cropName = getOrderCrop(order) || "Unknown Crop";
      const towersNeeded = toNumber(getOrderNewTowersToPlant(order));
      if (towersNeeded <= 0) return;

      const alreadySeeded = activeInventory.filter(
        (item) =>
          getInventoryCrop(item) === cropName &&
          normalizeStatus(getInventoryStage(item)) === "seeded"
      ).length;

      const stillNeedToSeed = Math.max(0, towersNeeded - alreadySeeded);
      if (stillNeedToSeed <= 0) return;

      const current = grouped.get(cropName) || {
        crop: cropName,
        totalTowers: 0,
        orders: [],
        earliestDueDate: "",
      };

      current.totalTowers += stillNeedToSeed;
      current.orders.push(`${getOrderCustomer(order)} (${stillNeedToSeed} towers)`);

      const dueDate = getOrderRequestedDeliveryDate(order);
      if (dueDate) {
        if (!current.earliestDueDate || new Date(dueDate) < new Date(current.earliestDueDate)) {
          current.earliestDueDate = dueDate;
        }
      }

      grouped.set(cropName, current);
    });

    return Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(a.earliestDueDate || "2100-01-01").getTime() -
        new Date(b.earliestDueDate || "2100-01-01").getTime()
    );
  }, [salesOrders, activeInventory]);

  const harvestTodayTasks = useMemo(() => {
    return salesOrders
      .filter((order) => {
        const orderStatus = normalizeStatus(getOrderStatus(order));
        if (["completed", "cancelled", "harvested", "packed"].includes(orderStatus)) return false;
        return isDueTodayOrTomorrow(getOrderRequestedDeliveryDate(order)) || isOverdue(getOrderRequestedDeliveryDate(order));
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
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [salesOrders]);

  const packTodayTasks = useMemo(() => {
    return salesOrders
      .filter((order) => {
        const orderStatus = normalizeStatus(getOrderStatus(order));
        if (["completed", "cancelled", "packed"].includes(orderStatus)) return false;
        return (
          orderStatus === "harvested" &&
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
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [salesOrders]);

  const overdueOrders = useMemo(() => {
    return salesOrders
      .filter((order) => {
        const orderStatus = normalizeStatus(getOrderStatus(order));
        if (["completed", "cancelled", "packed"].includes(orderStatus)) return false;
        return isOverdue(getOrderRequestedDeliveryDate(order));
      })
      .sort((a, b) => new Date(getOrderRequestedDeliveryDate(a)).getTime() - new Date(getOrderRequestedDeliveryDate(b)).getTime());
  }, [salesOrders]);

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

  const saveQuickAction = async () => {
    setMessage("");

    if ((!tower && mode !== "Farmers Market") || !crop || !entryDate) {
      setMessage("Please select crop and date.");
      return;
    }

    if ((mode === "Harvest" || mode === "Farmers Market" || mode === "Scrapped" || mode === "Pack") && !lbs) {
      setMessage("Please enter pounds for this action.");
      return;
    }

    const payload = {
      action: "saveStaffAction",
      mode,
      tower: mode === "Farmers Market" ? "" : tower,
      crop,
      lbs: ["Harvest", "Farmers Market", "Scrapped", "Pack"].includes(mode) ? Number(lbs || 0) : "",
      podsChanged: podsChanged ? Number(podsChanged) : "",
      status: entryStatus,
      stage,
      date: entryDate,
      scrapType,
      note,
    };

    try {
      const result = await postToBackend(payload);

      if (result.ok) {
        setMessage("Saved to Staff_Actions.");
        setTower("");
        setCrop("");
        setLbs("");
        setPodsChanged("");
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

  const handleSaveOrder = async () => {
    const quantityNeeded = toNumber(salesQuantityNeeded);

    if (!salesCustomer || !salesCrop || !quantityNeeded) {
      setSalesSaveMessage("Please enter customer, crop, and quantity needed.");
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

      const orders = dates.map((deliveryDate) => ({
        customer: salesCustomer,
        crop: salesCrop,
        unitType: salesUnitType,
        quantityNeeded,
        requestedDeliveryDate: deliveryDate,
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
      }));

      const result = await postToBackend({
        action: "saveSalesOrder",
        orders,
      });

      if (result.ok) {
        setSalesSaveMessage(
          salesOrderType === "Contract"
            ? `Contract order saved. ${result.count || dates.length} occurrences created.`
            : "Sales order saved to Google Sheets."
        );
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
        await loadSalesOrders();
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
    if (!podsToRemove) {
      setAdjustMessage("Please enter pods to adjust.");
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

    const newStatus = newActivePods === 0 ? (adjustMode === "Harvest" ? "Harvested" : "Scrapped") : getInventoryStatus(selected) || "Active";
    const newStage = newActivePods === 0 ? (adjustMode === "Harvest" ? "Harvested" : "Scrapped") : getInventoryStage(selected) || "Growing";
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
  setEditInventoryEstimatedReadyDate(formatDateInput(getInventoryEstimatedReadyDate(item)));
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

  const handleMarkHarvested = async (task: {
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
        mode: "Harvest",
        tower: "",
        crop: task.crop,
        lbs: task.unitType === "Lbs" ? task.quantityNeeded : "",
        podsChanged: task.unitType === "Plants" ? task.quantityNeeded : "",
        status: "Completed",
        stage: "Harvested",
        date: formatDateInput(new Date()),
        scrapType: "",
        note: `Harvested for ${task.customer}. Due date ${task.dueDate || ""}`,
      });

      if (!result.ok) {
        setDailyMessage(result.message || "Unable to mark harvested.");
        return;
      }

      const statusResult = await postToBackend({
        action: "updateOrderStatus",
        rowNumber: task.rowNumber,
        status: "Harvested",
      });

      if (statusResult.ok) {
        setDailyMessage(`Marked harvested for ${task.customer} - ${task.crop}.`);
        await Promise.all([loadStaffActions(), loadSalesOrders()]);
      } else {
        setDailyMessage("Harvest logged, but order status was not updated.");
      }
    } catch (error) {
      console.error("handleMarkHarvested error:", error);
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
        lbs: task.unitType === "Lbs" ? task.quantityNeeded : "",
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
    new Set([
      ...Object.keys(CROP_PROFILES),
      ...staffRows.map((r) => getStaffCrop(r)),
      ...salesOrders.map((r) => getOrderCrop(r)),
      ...productionInventory.map((r) => getInventoryCrop(r)),
    ].filter(Boolean))
  ).sort();
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
              <Panel title="Quick Action">
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

                  <Field label="Lbs">
                    <input value={lbs} onChange={(e) => setLbs(e.target.value)} style={inputStyle} placeholder="12" />
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

              <Panel title="Sales Planner / Order Planner">
                <FormGrid columns={2}>
                  <Field label="Customer">
                    <input value={salesCustomer} onChange={(e) => setSalesCustomer(e.target.value)} style={inputStyle} />
                  </Field>

                  <Field label="Crop">
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
                    <select value={salesUnitType} onChange={(e) => setSalesUnitType(e.target.value as "Lbs" | "Plants")} style={inputStyle}>
                      <option value="Lbs">Lbs</option>
                      <option value="Plants">Plants</option>
                    </select>
                  </Field>

                  <Field label={salesUnitType === "Plants" ? "Plants Needed" : "Lbs Needed"}>
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
                  <MiniMetric label="Towers Needed" value={salesPlanner.towersNeeded} />
                  <MiniMetric label="Pipeline Towers" value={salesPlanner.pipelineTowers} />
                  <MiniMetric label="New Towers To Plant" value={salesPlanner.newTowersToPlant} />
                  <MiniMetric label="Estimated Ready Date" value={salesPlanner.estimatedReadyDate || "-"} />
                  <MiniMetric label="Feasible" value={salesPlanner.deliveryFeasible ? "Yes" : "No"} />
                </MetricGrid>

                <ActionRow message={salesSaveMessage}>
                  <button onClick={handleSaveOrder} style={primaryButtonStyle} disabled={salesSaving}>
                    {salesSaving ? "Saving..." : "Save Order"}
                  </button>
                </ActionRow>
              </Panel>
            </ResponsiveTwoPanelGrid>

            <ResponsiveTwoPanelGrid>
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

                <TableScroll>
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
                        filteredRecentActivity.map((row) => (
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
                </TableScroll>
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

                <TableScroll>
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSavedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={tdStyle}>
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </TableScroll>
              </Panel>
            </ResponsiveTwoPanelGrid>
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
                        .sort(
                          (a, b) =>
                            new Date(getInventoryEstimatedReadyDate(a) || "2100-01-01").getTime() -
                            new Date(getInventoryEstimatedReadyDate(b) || "2100-01-01").getTime()
                        )
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
                            <td style={tdStyle}>{formatDateDisplay(getInventoryEstimatedReadyDate(item))}</td>
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

            <Panel title="Plant Today">
              <TableScroll>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Crop</th>
                      <th style={thStyle}>Towers to Plant</th>
                      <th style={thStyle}>Needed By</th>
                      <th style={thStyle}>Orders</th>
                      <th style={thStyle}>Tower Type</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantTodayTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={tdStyle}>
                          No planting tasks right now.
                        </td>
                      </tr>
                    ) : (
                      plantTodayTasks.map((task) => (
                        <tr key={task.crop}>
                          <td style={tdStyle}>{task.crop}</td>
                          <td style={tdStyle}>{task.totalTowers}</td>
                          <td style={tdStyle}>{formatDateDisplay(task.earliestDueDate)}</td>
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
                          <td style={tdStyle}>{getInventoryTower(item)}</td>
                          <td style={tdStyle}>{getInventoryTowerType(item)}</td>
                          <td style={tdStyle}>{getInventoryCrop(item)}</td>
                          <td style={tdStyle}>{getInventoryActivePods(item)}</td>
                          <td style={tdStyle}>{formatDateDisplay(getInventorySeededDate(item))}</td>
                          <td style={tdStyle}>{formatDateDisplay(getInventoryEstimatedReadyDate(item))}</td>
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
                    style={inputStyle}
                  >
                    <option value="">Select seeded item</option>
                    {transplantTodayTasks.map((item) => (
                      <option key={item.rowNumber} value={item.rowNumber}>
                        {getInventoryCrop(item)} | Seeded {formatDateDisplay(getInventorySeededDate(item))} | Pods {getInventoryActivePods(item)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tower">
                  <input
                    value={transplantTower}
                    onChange={(e) => setTransplantTower(e.target.value)}
                    style={inputStyle}
                    placeholder="R1"
                  />
                </Field>

                <Field label="Tower Type">
                  <select
                    value={transplantTowerType}
                    onChange={(e) => setTransplantTowerType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Low Density">Low Density (44 pods)</option>
                    <option value="High Density">High Density (160 pods)</option>
                  </select>
                </Field>

                <Field label="Max Pods">
                  <input
                    value={transplantMaxPods}
                    onChange={(e) => setTransplantMaxPods(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Active Pods">
                  <input
                    value={transplantActivePods}
                    onChange={(e) => setTransplantActivePods(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Transplant Date">
                  <input
                    type="date"
                    value={transplantDate}
                    onChange={(e) => setTransplantDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Estimated Ready Date">
                  <input
                    type="date"
                    value={transplantReadyDate}
                    onChange={(e) => setTransplantReadyDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </FormGrid>

              <Field label="Notes">
                <input
                  value={transplantNotes}
                  onChange={(e) => setTransplantNotes(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <ActionRow message="">
                <button onClick={handleMarkTransplanted} style={primaryButtonStyle}>
                  Mark Transplanted
                </button>
              </ActionRow>
            </Panel>

            <Panel title="Harvest Today">
              <TableScroll>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Crop</th>
                      <th style={thStyle}>Unit</th>
                      <th style={thStyle}>Qty Needed</th>
                      <th style={thStyle}>Due Date</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestTodayTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={tdStyle}>
                          No harvest tasks due today or tomorrow.
                        </td>
                      </tr>
                    ) : (
                      harvestTodayTasks.map((task) => (
                        <tr key={task.rowNumber}>
                          <td style={tdStyle}>{task.customer}</td>
                          <td style={tdStyle}>{task.crop}</td>
                          <td style={tdStyle}>{task.unitType}</td>
                          <td style={tdStyle}>{task.quantityNeeded}</td>
                          <td style={tdStyle}>{formatDateDisplay(task.dueDate)}</td>
                          <td style={tdStyle}>{task.status}</td>
                          <td style={tdStyle}>
                            <button onClick={() => handleMarkHarvested(task)} style={primaryButtonStyle}>
                              Mark Harvested
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </TableScroll>
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
                    {salesOrders
                      .filter((order) => {
                        const status = normalizeStatus(getOrderStatus(order));
                        if (status === "completed" || status === "cancelled" || status === "packed") return false;
                        return isOverdue(getOrderRequestedDeliveryDate(order)) || isDueTodayOrTomorrow(getOrderRequestedDeliveryDate(order));
                      })
                      .sort(
                        (a, b) =>
                          new Date(getOrderRequestedDeliveryDate(a)).getTime() - new Date(getOrderRequestedDeliveryDate(b)).getTime()
                      )
                      .map((order) => (
                        <tr key={order.rowNumber}>
                          <td style={tdStyle}>{getOrderCustomer(order)}</td>
                          <td style={tdStyle}>{getOrderCrop(order)}</td>
                          <td style={tdStyle}>{formatDateDisplay(getOrderRequestedDeliveryDate(order))}</td>
                          <td style={tdStyle}>{getOrderStatus(order)}</td>
                          <td style={tdStyle}>{getOrderNewTowersToPlant(order)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </TableScroll>
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
  minWidth: 760,
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