import React, { useEffect, useMemo, useState } from "react";
import { useInventoryForm } from "../hooks/useInventoryForm";
import { useEditInventoryForm } from "../hooks/useEditInventoryForm";
import { useHarvestForm } from "../hooks/useHarvestForm";
import { Dashboard } from "./Dashboard";
import { ProductionInventory } from "./ProductionInventory";
import { StaffDaily } from "./StaffDaily";
import type {
  PageKey,
  StaffActionRow,
  SalesOrderRow,
  ProductionInventoryRow,
  OrderUnitType,
  SalesPlannerResult,
  DraftOrderLine,
  CropInventoryEntry,
} from "../lib/types";
import {
  makeId,
  isContainerUnit,
  quantityToLbs,
  availableLbsToUnitQty,
  getUnitLabel,
  isRepeatHarvestCrop,
  CROP_PROFILES,
  normalizeCropKey,
  cropAliases,
  getCropProfile,
  formatCropLabel,
  getExpectedLbs,
  calculateExpectedLbs,
  SIX_OZ_IN_LBS,
  SMALL_BAG_OZ_IN_LBS,
  REPEAT_HARVEST_CROPS,
  MAX_TRIMS,
  TRIM_REGROWTH_DAYS,
} from "../lib/utils/cropUtils";
import {
  toNumber,
  normalizeStatus,
  getTowerMaxPods,
  TOWER_ROW_ORDER,
  parseTowerForSort,
  sortInventoryByTowerLayout,
  getInventoryTower,
  getInventoryTowerType,
  getInventoryMaxPods,
  getInventoryActivePods,
  getInventoryCrop,
  getInventoryStage,
  getInventorySeededDate,
  getInventoryTransplantDate,
  getInventoryEstimatedReadyDate,
  getInventoryEffectiveReadyDate,
  getInventoryExpectedLbs,
  getInventoryRemainingExpectedLbs,
  getInventoryStatus,
  getInventoryNotes,
  getInventoryTrimCount,
} from "../lib/utils/inventoryUtils";
import {
  getOrderCustomer,
  getOrderCrop,
  getOrderUnitType,
  getOrderQuantityNeeded,
  getOrderRequestedDeliveryDate,
  getOrderPipelineTowers,
  getOrderNewTowersToPlant,
  getOrderEstimatedReadyDate,
  getOrderStatus,
  getOrderType,
  getOrderFrequency,
  getOrderContractEndDate,
} from "../lib/utils/orderUtils";
import {
  getStaffMode,
  getStaffTower,
  getStaffCrop,
  getStaffLbs,
  getStaffPodsChanged,
  getStaffNote,
  getStaffTimestamp,
  getStaffDate,
} from "../lib/utils/staffUtils";
import {
  formatDateInput,
  formatDateDisplay,
  formatDateTimeDisplay,
  addDays,
  getStartOfWeek,
  getEndOfWeek,
  generateRecurringDates,
  isDueTodayOrTomorrow,
  isDueToday,
  isOverdue,
} from "../lib/utils/dateUtils";
import { postToBackend } from "../lib/api";
import { buildCropPools, allocateOrderAgainstPool } from "../lib/utils/demandUtils";
import {
  Panel,
  Field,
  ActionRow,
  TableScroll,
  StatCard,
  MiniMetric,
  ResponsiveStatGrid,
  ResponsiveTwoPanelGrid,
  FormGrid,
  MetricGrid,
} from "./ui";
import {
  pageStyle,
  containerStyle,
  headerStyle,
  navWrapStyle,
  navButtonsStyle,
  navButtonStyle,
  navButtonActiveStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionStackStyle,
  inputStyle,
  compactInputStyle,
  textareaStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "../lib/styles";

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [loadingData, setLoadingData] = useState(false);

  // Loading states for async handlers
  const [markPlantedLoading, setMarkPlantedLoading] = useState<string | null>(null);
  const [transplantLoading, setTransplantLoading] = useState(false);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [packLoadingRow, setPackLoadingRow] = useState<number | null>(null);

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
  const [draftOrderLines, setDraftOrderLines] = useState<DraftOrderLine[]>([
    { id: makeId(), crop: "", unitType: "Lbs", quantityNeeded: "" },
  ]);
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
  const [savedOrderDueFilter, setSavedOrderDueFilter] = useState<"All" | "Current Week">("All");
  const [expandedSavedOrderGroups, setExpandedSavedOrderGroups] = useState<Record<string, boolean>>({});

  // Production Inventory form (useReducer)
  const [inventoryForm, dispatchInventory] = useInventoryForm();

  // Inventory adjustment
  const [adjustInventoryRow, setAdjustInventoryRow] = useState("");
  const [adjustMode, setAdjustMode] = useState<"Harvest" | "Scrapped">("Harvest");
  const [adjustPods, setAdjustPods] = useState("");
  const [adjustLbs, setAdjustLbs] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustScrapType, setAdjustScrapType] = useState("");
  const [adjustMessage, setAdjustMessage] = useState("");

  // Edit inventory (useReducer)
  const [editInventoryForm, dispatchEditInventory] = useEditInventoryForm();

  // Staff Daily action helpers
  const [dailyMessage, setDailyMessage] = useState("");
  const [plantingTowerType, setPlantingTowerType] = useState<Record<string, string>>({});
  // Harvest form (useReducer)
  const [harvestForm, dispatchHarvest] = useHarvestForm();
  const [staffLookupCrop, setStaffLookupCrop] = useState("");
  const [quickEntryUnitType, setQuickEntryUnitType] = useState<OrderUnitType>("Lbs");
  const [seedScheduleFilter, setSeedScheduleFilter] = useState<"Today" | "This Week" | "This Month">("Today");

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
      const readyNow = !!readyDate && readyDate <= today && ["transplanted", "growing", "ready", "trimmed"].includes(itemStage);

      current.towers += 1;
      current.availableLbs += remainingLbs;
      current.availablePlants += activePods;

      if (
        itemStatus === "active" ||
        itemStage === "growing" ||
        itemStage === "transplanted" ||
        itemStage === "ready" ||
        itemStage === "seeded" ||
        itemStage === "trimmed"
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

  const salesPlanner: SalesPlannerResult = useMemo(() => {
    const today = formatDateInput(new Date());
    const validLines = draftOrderLines.filter(l => l.crop.trim() && toNumber(l.quantityNeeded) > 0);

    const empty: SalesPlannerResult = {
      availableQty: 0, shortageQty: 0, towersNeeded: 0, pipelineTowers: 0,
      newTowersToPlant: 0, estimatedReadyDate: "", deliveryFeasible: false,
      unitLabel: "Lbs", qtyNeededInLbs: 0,
    };

    if (!validLines.length) return empty;

    const newOrderDates: string[] =
      salesOrderType === "Contract"
        ? generateRecurringDates(salesContractStartDate, salesContractEndDate, salesFrequency)
        : salesDeliveryDate ? [salesDeliveryDate] : [];

    if (!newOrderDates.length) return empty;

    let totalAvailableLbs = 0;
    let totalShortageLbs = 0;
    let totalTowersNeeded = 0;
    let totalPipelineTowers = 0;
    let totalNewTowersToPlant = 0;
    let totalQtyInLbs = 0;
    let allFeasible = true;
    let firstProblemDate = "";
    let latestEstimatedReadyDate = "";

    for (const line of validLines) {
      const cropName = line.crop.trim();
      const qtyNeeded = toNumber(line.quantityNeeded);
      const qtyNeededInLbs = quantityToLbs(line.unitType, qtyNeeded);
      const avgLbsPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));
      const cropInventory = inventoryByCrop.get(cropName);
      const pipelineTowers = cropInventory?.pipelineTowers || 0;
      totalQtyInLbs += qtyNeededInLbs;

      const pool = buildCropPools(inventoryByCrop).get(cropName) || { readyLbs: 0, readyPlants: 0, futureEntries: [] };

      const existingDeliveries: Array<{ dueDate: string; unitType: string; qty: number }> = [];
      for (const order of salesOrders) {
        if (editingSalesOrderRowNumber && order.rowNumber === editingSalesOrderRowNumber) continue;
        if ((getOrderCrop(order) || "").trim() !== cropName) continue;
        const status = normalizeStatus(getOrderStatus(order));
        if (["completed", "cancelled", "packed"].includes(status)) continue;
        const dueDate = getOrderRequestedDeliveryDate(order);
        if (!dueDate) continue;
        const unitType = getOrderUnitType(order);
        const qty = toNumber(getOrderQuantityNeeded(order));
        const orderType = getOrderType(order);
        const frequency = getOrderFrequency(order);
        const contractEnd = getOrderContractEndDate(order);
        if (orderType === "Contract" && frequency && contractEnd) {
          for (const date of generateRecurringDates(dueDate, contractEnd, frequency)) {
            existingDeliveries.push({ dueDate: date, unitType, qty });
          }
        } else {
          existingDeliveries.push({ dueDate, unitType, qty });
        }
      }

      type Delivery = { dueDate: string; unitType: string; qty: number; isNew: boolean };
      const allDeliveries: Delivery[] = [
        ...existingDeliveries.map(d => ({ ...d, isNew: false })),
        ...newOrderDates.map(date => ({ dueDate: date, unitType: line.unitType as string, qty: qtyNeeded, isNew: true })),
      ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      let firstAvailableLbs = 0;
      let worstShortageQty = 0;
      let worstShortageLbs = 0;
      let lineProblemDate = "";
      let newOrderSeen = false;

      for (const delivery of allDeliveries) {
        const result = allocateOrderAgainstPool(pool, cropName, delivery.dueDate, delivery.unitType, delivery.qty, avgLbsPerTower, true);
        if (delivery.isNew) {
          if (!newOrderSeen) { firstAvailableLbs = result.availableLbsByDue; newOrderSeen = true; }
          if (result.shortageQty > worstShortageQty) {
            worstShortageQty = result.shortageQty;
            worstShortageLbs = result.shortageLbs;
          }
          if (result.shortageQty > 0 && !lineProblemDate) lineProblemDate = delivery.dueDate;
        }
      }

      totalAvailableLbs += firstAvailableLbs;
      totalShortageLbs += worstShortageLbs;
      const towersNeeded = qtyNeededInLbs > 0 ? Math.ceil(qtyNeededInLbs / avgLbsPerTower) : 0;
      const newTowersToPlant = worstShortageLbs > 0 ? Math.ceil(worstShortageLbs / avgLbsPerTower) : 0;
      totalTowersNeeded += towersNeeded;
      totalPipelineTowers += pipelineTowers;
      totalNewTowersToPlant += newTowersToPlant;

      if (worstShortageQty > 0) {
        allFeasible = false;
        let lineEstimatedDate = "";
        if (salesOrderType === "Contract") {
          lineEstimatedDate = lineProblemDate;
        } else {
          let running = pool.readyLbs;
          for (const entry of pool.futureEntries) {
            running += entry.lbs;
            if (running >= qtyNeededInLbs) { lineEstimatedDate = entry.readyDate; break; }
          }
          if (!lineEstimatedDate) lineEstimatedDate = addDays(today, 42);
        }
        if (!firstProblemDate && lineProblemDate) firstProblemDate = lineProblemDate;
        if (!latestEstimatedReadyDate || (lineEstimatedDate && new Date(lineEstimatedDate) > new Date(latestEstimatedReadyDate))) {
          latestEstimatedReadyDate = lineEstimatedDate;
        }
      }
    }

    const estimatedReadyDate = allFeasible ? "" : (salesOrderType === "Contract" ? firstProblemDate : latestEstimatedReadyDate);

    return {
      availableQty: totalAvailableLbs,
      shortageQty: totalShortageLbs,
      towersNeeded: totalTowersNeeded,
      pipelineTowers: totalPipelineTowers,
      newTowersToPlant: totalNewTowersToPlant,
      estimatedReadyDate,
      deliveryFeasible: validLines.length > 0 && allFeasible,
      unitLabel: "Lbs",
      qtyNeededInLbs: totalQtyInLbs,
    };
  }, [
    draftOrderLines,
    salesDeliveryDate,
    salesContractStartDate,
    salesContractEndDate,
    salesFrequency,
    salesOrderType,
    inventoryByCrop,
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
        return !["completed", "cancelled"].includes(status);
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
    const STATUS_RANK: Record<string, number> = {
      "planned": 0, "in progress": 1, "harvested": 2, "packed": 3, "completed": 4, "cancelled": 5,
    };
    const today = formatDateInput(new Date());
    const groups = new Map<string, { key: string; customer: string; dueDate: string; status: string; cropSummary: string; isOverdue: boolean; items: SalesOrderRow[]; totalNewTowers: number }>();

    filteredSavedOrders.forEach((order) => {
      const customer = getOrderCustomer(order) || "Unknown Customer";
      const dueDate = getOrderRequestedDeliveryDate(order) || "";
      const key = `${customer}__${dueDate}`;
      const current = groups.get(key) || {
        key, customer, dueDate,
        status: getOrderStatus(order) || "Planned",
        cropSummary: "",
        isOverdue: false,
        items: [],
        totalNewTowers: 0,
      };
      current.items.push(order);
      current.totalNewTowers += toNumber(getOrderNewTowersToPlant(order));
      groups.set(key, current);
    });

    for (const group of groups.values()) {
      const statuses = group.items.map(i => getOrderStatus(i) || "Planned");
      group.status = statuses.reduce((worst, curr) => {
        return (STATUS_RANK[normalizeStatus(curr)] ?? 0) < (STATUS_RANK[normalizeStatus(worst)] ?? 0) ? curr : worst;
      }, statuses[0]);

      const uniqueCrops = [...new Set(group.items.map(i => getOrderCrop(i)).filter(Boolean))];
      group.cropSummary = uniqueCrops.length <= 4
        ? uniqueCrops.join(", ")
        : `${uniqueCrops.slice(0, 3).join(", ")} +${uniqueCrops.length - 3} more`;

      const notDone = !["completed", "cancelled", "packed", "harvested"].includes(normalizeStatus(group.status));
      group.isOverdue = !!group.dueDate && group.dueDate < today && notDone;
    }

    return Array.from(groups.values()).sort((a, b) => new Date(a.dueDate || "2100-01-01").getTime() - new Date(b.dueDate || "2100-01-01").getTime());
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
  const cropPools = buildCropPools(inventoryByCrop);

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
    const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));
    const seedByDate = addDays(dueDate, -42);

    const pool = cropPools.get(cropName) || {
      readyLbs: 0,
      readyPlants: 0,
      futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
    };

    const result = allocateOrderAgainstPool(pool, cropName, dueDate, unitType, qtyNeeded, avgQtyPerTower, true);
    cropPools.set(cropName, pool);

    const newTowersNeeded = result.newTowersNeeded;

    if (newTowersNeeded <= 0 || !seedByDate) continue;

    const seededCount = activeInventory.filter(
      (item) => getInventoryCrop(item) === cropName && normalizeStatus(getInventoryStage(item)) === "seeded"
    ).length;

    const pipelineCount = activeInventory.filter(
      (item) =>
        getInventoryCrop(item) === cropName &&
        ["seeded", "transplanted", "growing", "ready", "trimmed"].includes(normalizeStatus(getInventoryStage(item))) &&
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
    const key = `${seedByDate}__${cropName}`;

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
        seedByDate,
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
}, [openOrders, activeInventory, inventoryByCrop]);


const filteredPlantTodayTasks = useMemo(() => {
  const today = new Date(formatDateInput(new Date()));
  const weekEnd = getEndOfWeek(today);
  const monthEnd = new Date(today);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const normalizeSeedDate = (seedByDate: string) => {
    const parsed = new Date(seedByDate || today.toISOString());
    if (parsed < today) return new Date(today);
    return parsed;
  };

  return plantTodayTasks.filter((task) => {
    const compareDate = normalizeSeedDate(task.seedByDate);
    if (seedScheduleFilter === "Today") {
      return compareDate.toDateString() === today.toDateString();
    }
    if (seedScheduleFilter === "This Week") {
      return compareDate >= today && compareDate <= weekEnd;
    }
    return compareDate >= today && compareDate <= monthEnd;
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
      if (!["transplanted", "growing", "ready", "trimmed"].includes(stage)) return false;
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

    const cropPools = buildCropPools(inventoryByCrop);

    const alerts = openOrders
      .map((row) => {
        const cropName = (getOrderCrop(row) || "").trim();
        const dueDate = getOrderRequestedDeliveryDate(row);
        const unitType = getOrderUnitType(row);
        const qtyNeeded = toNumber(getOrderQuantityNeeded(row));
        const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));

        const pool = cropPools.get(cropName) || {
          readyLbs: 0,
          readyPlants: 0,
          futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
        };

        const result = allocateOrderAgainstPool(pool, cropName, dueDate, unitType, qtyNeeded, avgQtyPerTower, true);
        cropPools.set(cropName, pool);

        return {
          rowNumber: row.rowNumber,
          customer: getOrderCustomer(row),
          crop: cropName,
          dueDate,
          shortageQty: result.shortageQty,
          newTowers: result.newTowersNeeded,
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

    const cropPools = buildCropPools(inventoryByCrop);

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
      const avgQtyPerTower = Math.max(0.1, calculateExpectedLbs(cropName, 44));

      const pool = cropPools.get(cropName) || {
        readyLbs: 0,
        readyPlants: 0,
        futureEntries: [] as Array<{ readyDate: string; lbs: number; plants: number }>,
      };

      const result = allocateOrderAgainstPool(pool, cropName, dueDate, unitType, qtyNeeded, avgQtyPerTower, true);
      cropPools.set(cropName, pool);

      const newTowers = result.newTowersNeeded;

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

  const updateDraftOrderLine = (id: string, field: "crop" | "unitType" | "quantityNeeded", value: string) => {
    setDraftOrderLines((prev) => prev.map((line) => line.id === id ? { ...line, [field]: value } : line));
  };

  const addDraftOrderRow = () => {
    setDraftOrderLines((prev) => [...prev, { id: makeId(), crop: "", unitType: "Lbs" as OrderUnitType, quantityNeeded: "" }]);
  };

  const removeDraftOrderLine = (id: string) => {
    setDraftOrderLines((prev) => prev.filter((line) => line.id !== id));
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
    setDraftOrderLines([{ id: makeId(), crop: "", unitType: "Lbs", quantityNeeded: "" }]);
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
    const lineItems = draftOrderLines.filter(l => l.crop.trim() && toNumber(l.quantityNeeded) > 0);

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
        const editLine = lineItems[0];
        if (!editLine) {
          setSalesSaveMessage("Please enter crop and quantity.");
          return;
        }
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
    }
  };

  const handleOrderStatusChange = async (rowNumber: number, status: string) => {
    try {
      const result = await postToBackend({ action: "updateOrderStatus", rowNumber, status });
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
        group.items.map((item) => postToBackend({ action: "updateOrderStatus", rowNumber: item.rowNumber, status }))
      );
      await loadSalesOrders();
    } catch (error) {
      console.error("handleGroupStatusChange error:", error);
    }
  };

  const handleSaveInventory = async () => {
    if (!inventoryForm.tower || !inventoryForm.crop) {
      dispatchInventory({ type: "SET_FIELD", field: "message", value: "Please enter tower and crop." });
      return;
    }

    try {
      dispatchInventory({ type: "SET_FIELD", field: "saving", value: true });
      dispatchInventory({ type: "SET_FIELD", field: "message", value: "" });

      const maxPods = toNumber(inventoryForm.maxPods) || getTowerMaxPods(inventoryForm.towerType);
      const activePods = toNumber(inventoryForm.activePods) || maxPods;
      const expectedLbs = inventoryForm.expectedLbs
        ? Number(inventoryForm.expectedLbs)
        : calculateExpectedLbs(inventoryForm.crop, activePods, inventoryForm.towerType);
      const remainingExpectedLbs = inventoryForm.remainingExpectedLbs ? Number(inventoryForm.remainingExpectedLbs) : expectedLbs;

      const result = await postToBackend({
        action: "saveProductionInventory",
        tower: inventoryForm.tower,
        towerType: inventoryForm.towerType,
        maxPods,
        activePods,
        crop: inventoryForm.crop,
        stage: inventoryForm.stage,
        seededDate: inventoryForm.seededDate,
        transplantDate: inventoryForm.transplantDate,
        estimatedReadyDate: inventoryForm.estimatedReadyDate,
        expectedLbs,
        remainingExpectedLbs,
        status: inventoryForm.status,
        notes: inventoryForm.notes,
      });

      if (result.ok) {
        dispatchInventory({ type: "SET_FIELD", field: "message", value: "Production inventory saved." });
        dispatchInventory({ type: "RESET" });
        await loadProductionInventory();
      } else {
        dispatchInventory({ type: "SET_FIELD", field: "message", value: result.message || "Unable to save production inventory." });
      }
    } catch (error) {
      console.error("handleSaveInventory error:", error);
      dispatchInventory({ type: "SET_FIELD", field: "message", value: "Error saving production inventory." });
    } finally {
      dispatchInventory({ type: "SET_FIELD", field: "saving", value: false });
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
  dispatchEditInventory({ type: "LOAD", item });

  setTimeout(() => {
    const editPanel = document.getElementById("edit-production-inventory");
    if (editPanel) {
      editPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
};
  const handleSaveInventoryEdits = async () => {
    if (!editInventoryForm.rowNumber) {
      dispatchEditInventory({ type: "SET_FIELD", field: "message", value: "No inventory row selected." });
      return;
    }

    if (!editInventoryForm.tower || !editInventoryForm.crop) {
      dispatchEditInventory({ type: "SET_FIELD", field: "message", value: "Please enter tower and crop." });
      return;
    }

    try {
      dispatchEditInventory({ type: "SET_FIELD", field: "saving", value: true });
      dispatchEditInventory({ type: "SET_FIELD", field: "message", value: "" });

      const result = await postToBackend({
        action: "updateProductionInventoryRow",
        rowNumber: Number(editInventoryForm.rowNumber),
        tower: editInventoryForm.tower,
        towerType: editInventoryForm.towerType,
        maxPods: toNumber(editInventoryForm.maxPods),
        activePods: toNumber(editInventoryForm.activePods),
        crop: editInventoryForm.crop,
        stage: editInventoryForm.stage,
        seededDate: editInventoryForm.seededDate,
        transplantDate: editInventoryForm.transplantDate,
        estimatedReadyDate: editInventoryForm.estimatedReadyDate,
        expectedLbs: toNumber(editInventoryForm.expectedLbs),
        remainingExpectedLbs: toNumber(editInventoryForm.remainingExpectedLbs),
        status: editInventoryForm.status,
        notes: editInventoryForm.notes,
      });

      if (result.ok) {
        dispatchEditInventory({ type: "SET_FIELD", field: "message", value: "Inventory changes saved." });
        await loadProductionInventory();
      } else {
        dispatchEditInventory({ type: "SET_FIELD", field: "message", value: result.message || "Unable to save inventory changes." });
      }
    } catch (error) {
      console.error("handleSaveInventoryEdits error:", error);
      dispatchEditInventory({ type: "SET_FIELD", field: "message", value: "Error saving inventory changes." });
    } finally {
      dispatchEditInventory({ type: "SET_FIELD", field: "saving", value: false });
    }
  };

  const clearEditInventoryForm = () => {
    dispatchEditInventory({ type: "RESET" });
  };

  const handleMarkPlanted = async (task: { crop: string; totalTowers: number; earliestDueDate: string }) => {
    try {
      setDailyMessage("");
      setMarkPlantedLoading(task.crop);

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
    } finally {
      setMarkPlantedLoading(null);
    }
  };

  const handleMarkTransplanted = async () => {
    try {
      setDailyMessage("");
      setTransplantLoading(true);

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
    } finally {
      setTransplantLoading(false);
    }
  };

  const startReadyHarvestAction = (item: ProductionInventoryRow) => {
    dispatchHarvest({ type: "START", item });
  };

  const clearReadyHarvestAction = () => {
    dispatchHarvest({ type: "CLEAR" });
  };

  const handleReadyHarvestSubmit = async () => {
    try {
      setDailyMessage("");
      setHarvestLoading(true);

      const selected = productionInventory.find((row) => String(row.rowNumber) === harvestForm.activeRowNumber);
      if (!selected) {
        setDailyMessage("Please choose a ready-to-harvest row.");
        return;
      }

      const outputQty = toNumber(harvestForm.outputQty);
      const podsWorked = toNumber(harvestForm.podsValue);
      const currentActivePods = toNumber(getInventoryActivePods(selected));
      const currentRemainingLbs = toNumber(getInventoryRemainingExpectedLbs(selected));
      const currentExpectedLbs = toNumber(getInventoryExpectedLbs(selected));
      const harvestLbs = quantityToLbs(harvestForm.outputUnit, outputQty);

      if (!outputQty || harvestLbs < 0) {
        setDailyMessage("Please enter harvested quantity.");
        return;
      }

      if (!podsWorked) {
        setDailyMessage(harvestForm.actionType === "Trim Harvest" ? "Please enter how many pods were trimmed." : "Please enter how many pods were harvested.");
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

      const isFullHarvest = harvestForm.actionType === "Full Harvest";
      const newActivePods = isFullHarvest ? Math.max(0, currentActivePods - podsWorked) : currentActivePods;
      const newRemainingLbs = Math.max(0, Math.round((currentRemainingLbs - harvestLbs) * 100) / 100);
      const isFinished = newActivePods <= 0 || newRemainingLbs <= 0.01;
      const currentTrimCount = toNumber(getInventoryTrimCount(selected));
      const newTrimCount = !isFullHarvest && !isFinished ? currentTrimCount + 1 : currentTrimCount;
      const isFinalTrim = newTrimCount >= MAX_TRIMS;
      const newStatus = isFinished || isFinalTrim ? "Harvested" : getInventoryStatus(selected) || "Active";
      const newStage = isFinished || isFinalTrim ? "Harvested" : !isFullHarvest ? "Trimmed" : getInventoryStage(selected) || "Ready";
      const newEstimatedReadyDate = !isFinished && !isFinalTrim && !isFullHarvest
        ? addDays(formatDateInput(new Date()), TRIM_REGROWTH_DAYS)
        : getInventoryEstimatedReadyDate(selected);
      const actionNote = [
        harvestForm.actionType,
        `${outputQty} ${getUnitLabel(harvestForm.outputUnit)}`,
        isFullHarvest ? `${podsWorked} pods harvested` : `${podsWorked} pods trimmed`,
        harvestForm.note,
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
        stage: isFinished ? "Harvested" : harvestForm.actionType === "Trim Harvest" ? "Trimmed" : "Ready",
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
        estimatedReadyDate: newEstimatedReadyDate,
        expectedLbs: currentExpectedLbs,
        remainingExpectedLbs: newRemainingLbs,
        status: newStatus,
        trimCount: newTrimCount,
        notes: updatedNotes,
      });

      if (!updateResult.ok) {
        setDailyMessage(updateResult.message || "Unable to update ready-to-harvest inventory row.");
        return;
      }

      setDailyMessage(
        isFinished
          ? `Harvest saved for ${getInventoryCrop(selected)}. That row is complete and removed from Ready to Harvest.`
          : isFinalTrim
          ? `Final trim saved for ${getInventoryCrop(selected)}. Tower is complete — time to seed a replacement.`
          : !isFullHarvest
          ? `Trim ${newTrimCount}/${MAX_TRIMS} saved for ${getInventoryCrop(selected)}. Ready again in ${TRIM_REGROWTH_DAYS} days.`
          : `Harvest saved for ${getInventoryCrop(selected)}.`
      );
      clearReadyHarvestAction();
      await Promise.all([loadProductionInventory(), loadStaffActions()]);
    } catch (error) {
      console.error("handleReadyHarvestSubmit error:", error);
      setDailyMessage("Error marking harvested.");
    } finally {
      setHarvestLoading(false);
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
      setPackLoadingRow(task.rowNumber);

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
    } finally {
      setPackLoadingRow(null);
    }
  };

  const uniqueModes = useMemo(
    () => Array.from(new Set(staffRows.map((r) => getStaffMode(r)).filter(Boolean))).sort(),
    [staffRows]
  );

  const uniqueCrops = useMemo(
    () =>
      Array.from(
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
      ).sort((a, b) => a.localeCompare(b)),
    [staffRows, salesOrders, productionInventory]
  );

  const uniqueTowers = useMemo(
    () =>
      Array.from(
        new Set(
          [...staffRows.map((r) => getStaffTower(r)), ...productionInventory.map((r) => getInventoryTower(r))].filter(
            Boolean
          )
        )
      ).sort(),
    [staffRows, productionInventory]
  );

  const uniqueCustomers = useMemo(
    () => Array.from(new Set(salesOrders.map((r) => getOrderCustomer(r)).filter(Boolean))).sort(),
    [salesOrders]
  );

  const uniqueOrderStatuses = useMemo(
    () => Array.from(new Set(salesOrders.map((r) => getOrderStatus(r)).filter(Boolean))).sort(),
    [salesOrders]
  );

  return (
    <div style={pageStyle}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0, flex: "1 1 420px" }}>
            <img
              src="/gardennobkgd.png"
              alt="Switchpoint Garden"
              style={{
                height: 112,
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
              <p style={{ margin: "10px 0 0 0", opacity: 0.9, fontSize: 15 }}>
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
          <Dashboard
            dashboardStats={dashboardStats}
            executiveAlerts={executiveAlerts}
            shortageAlerts={shortageAlerts}
            seedingCalendar={seedingCalendar}
            filteredRecentActivity={filteredRecentActivity}
            groupedSavedOrders={groupedSavedOrders}
            uniqueModes={uniqueModes}
            uniqueCrops={uniqueCrops}
            uniqueTowers={uniqueTowers}
            uniqueOrderStatuses={uniqueOrderStatuses}
            uniqueCustomers={uniqueCustomers}
            salesCustomer={salesCustomer}
            salesNotes={salesNotes}
            salesPlanner={salesPlanner}
            salesOrderType={salesOrderType}
            salesFrequency={salesFrequency}
            salesDeliveryDate={salesDeliveryDate}
            salesContractStartDate={salesContractStartDate}
            salesContractEndDate={salesContractEndDate}
            draftOrderLines={draftOrderLines}
            editingSalesOrderRowNumber={editingSalesOrderRowNumber}
            salesSaving={salesSaving}
            salesSaveMessage={salesSaveMessage}
            savedOrderStatusFilter={savedOrderStatusFilter}
            savedOrderCropFilter={savedOrderCropFilter}
            savedOrderCustomerFilter={savedOrderCustomerFilter}
            savedOrderDueFilter={savedOrderDueFilter}
            expandedSavedOrderGroups={expandedSavedOrderGroups}
            filterMode={filterMode}
            filterCrop={filterCrop}
            filterTower={filterTower}
            setSalesCustomer={setSalesCustomer}
            setSalesNotes={setSalesNotes}
            setSalesOrderType={setSalesOrderType}
            setSalesFrequency={setSalesFrequency}
            setSalesDeliveryDate={setSalesDeliveryDate}
            setSalesContractStartDate={setSalesContractStartDate}
            setSalesContractEndDate={setSalesContractEndDate}
            setSavedOrderStatusFilter={setSavedOrderStatusFilter}
            setSavedOrderCropFilter={setSavedOrderCropFilter}
            setSavedOrderCustomerFilter={setSavedOrderCustomerFilter}
            setSavedOrderDueFilter={setSavedOrderDueFilter}
            setExpandedSavedOrderGroups={setExpandedSavedOrderGroups}
            setFilterMode={setFilterMode}
            setFilterCrop={setFilterCrop}
            setFilterTower={setFilterTower}
            updateDraftOrderLine={updateDraftOrderLine}
            addDraftOrderRow={addDraftOrderRow}
            cancelEditSalesOrder={cancelEditSalesOrder}
            handleSaveOrder={handleSaveOrder}
            handleOrderStatusChange={handleOrderStatusChange}
            handleGroupStatusChange={handleGroupStatusChange}
            startEditSalesOrder={startEditSalesOrder}
            handleCancelSalesOrder={handleCancelSalesOrder}
            removeDraftOrderLine={removeDraftOrderLine}
          />
        )}

        {activePage === "inventory" && (
          <ProductionInventory
            inventoryForm={inventoryForm}
            dispatchInventory={dispatchInventory}
            editInventoryForm={editInventoryForm}
            dispatchEditInventory={dispatchEditInventory}
            adjustInventoryRow={adjustInventoryRow}
            adjustMode={adjustMode}
            adjustPods={adjustPods}
            adjustLbs={adjustLbs}
            adjustNote={adjustNote}
            adjustScrapType={adjustScrapType}
            adjustMessage={adjustMessage}
            uniqueCrops={uniqueCrops}
            activeInventory={activeInventory}
            productionInventory={productionInventory}
            setAdjustInventoryRow={setAdjustInventoryRow}
            setAdjustMode={setAdjustMode}
            setAdjustPods={setAdjustPods}
            setAdjustLbs={setAdjustLbs}
            setAdjustNote={setAdjustNote}
            setAdjustScrapType={setAdjustScrapType}
            handleSaveInventory={handleSaveInventory}
            handleSaveInventoryEdits={handleSaveInventoryEdits}
            clearEditInventoryForm={clearEditInventoryForm}
            handleInventoryAdjustment={handleInventoryAdjustment}
            handleProductionStatusChange={handleProductionStatusChange}
            handleEditInventory={handleEditInventory}
          />
        )}

        {activePage === "staffDaily" && (
          <StaffDaily
            plantTodayTasks={plantTodayTasks}
            filteredPlantTodayTasks={filteredPlantTodayTasks}
            seededInventory={seededInventory}
            transplantTodayTasks={transplantTodayTasks}
            readyToHarvestInventory={readyToHarvestInventory}
            harvestTodayTasks={harvestTodayTasks}
            packTodayTasks={packTodayTasks}
            overdueOrders={overdueOrders}
            filteredRecentActivity={filteredRecentActivity}
            dashboardStats={dashboardStats}
            weeklyMetrics={weeklyMetrics}
            inventoryByCrop={inventoryByCrop}
            markPlantedLoading={markPlantedLoading}
            transplantLoading={transplantLoading}
            harvestLoading={harvestLoading}
            packLoadingRow={packLoadingRow}
            harvestForm={harvestForm}
            dispatchHarvest={dispatchHarvest}
            transplantRowNumber={transplantRowNumber}
            transplantTower={transplantTower}
            transplantTowerType={transplantTowerType}
            transplantMaxPods={transplantMaxPods}
            transplantActivePods={transplantActivePods}
            transplantDate={transplantDate}
            transplantReadyDate={transplantReadyDate}
            transplantNotes={transplantNotes}
            setTransplantRowNumber={setTransplantRowNumber}
            setTransplantTower={setTransplantTower}
            setTransplantTowerType={setTransplantTowerType}
            setTransplantMaxPods={setTransplantMaxPods}
            setTransplantActivePods={setTransplantActivePods}
            setTransplantDate={setTransplantDate}
            setTransplantReadyDate={setTransplantReadyDate}
            setTransplantNotes={setTransplantNotes}
            mode={mode}
            tower={tower}
            crop={crop}
            lbs={lbs}
            podsChanged={podsChanged}
            entryStatus={entryStatus}
            stage={stage}
            entryDate={entryDate}
            scrapType={scrapType}
            note={note}
            quickEntryUnitType={quickEntryUnitType}
            message={message}
            setMode={setMode}
            setTower={setTower}
            setCrop={setCrop}
            setLbs={setLbs}
            setPodsChanged={setPodsChanged}
            setEntryStatus={setEntryStatus}
            setStage={setStage}
            setEntryDate={setEntryDate}
            setScrapType={setScrapType}
            setNote={setNote}
            setQuickEntryUnitType={setQuickEntryUnitType}
            dailyMessage={dailyMessage}
            plantingTowerType={plantingTowerType}
            setPlantingTowerType={setPlantingTowerType}
            staffLookupCrop={staffLookupCrop}
            setStaffLookupCrop={setStaffLookupCrop}
            seedScheduleFilter={seedScheduleFilter}
            setSeedScheduleFilter={setSeedScheduleFilter}
            uniqueCrops={uniqueCrops}
            uniqueTowers={uniqueTowers}
            handleMarkPlanted={handleMarkPlanted}
            handleMarkTransplanted={handleMarkTransplanted}
            handleReadyHarvestSubmit={handleReadyHarvestSubmit}
            handleMarkPacked={handleMarkPacked}
            saveQuickAction={saveQuickAction}
            startReadyHarvestAction={startReadyHarvestAction}
            clearReadyHarvestAction={clearReadyHarvestAction}
          />
        )}
      </div>
    </div>
  );
}


