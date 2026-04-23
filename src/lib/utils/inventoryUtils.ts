import type { ProductionInventoryRow } from '../types';
import { calculateExpectedLbs } from './cropUtils';
import { formatDateInput, addDays } from './dateUtils';

export const normalizeStatus = (status: string): string => (status || "").trim().toLowerCase();

export const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const getTowerMaxPods = (towerType: string): number => {
  return towerType === "High Density" ? 160 : 44;
};

export const TOWER_ROW_ORDER = ["R", "O", "Y", "G", "B", "I", "V"];

export const parseTowerForSort = (tower: string): { rowIndex: number; towerNumber: number } => {
  const raw = (tower || "").trim().toUpperCase();
  const match = raw.match(/^([A-Z]+)\s*0*(\d+)?/);

  if (!match) {
    return { rowIndex: 999, towerNumber: 9999 };
  }

  const rowKey = match[1];
  const towerNumber = match[2] ? Number(match[2]) : 9999;

  return {
    rowIndex: TOWER_ROW_ORDER.indexOf(rowKey),
    towerNumber,
  };
};

export const sortInventoryByTowerLayout = (a: ProductionInventoryRow, b: ProductionInventoryRow): number => {
  const towerA = parseTowerForSort(getInventoryTower(a));
  const towerB = parseTowerForSort(getInventoryTower(b));

  if (towerA.rowIndex !== towerB.rowIndex) {
    return towerA.rowIndex - towerB.rowIndex;
  }

  return towerA.towerNumber - towerB.towerNumber;
};

export const getInventoryTower = (row: ProductionInventoryRow): string => row.tower || row.Tower || "";

export const getInventoryTowerType = (row: ProductionInventoryRow): string =>
  row.towerType || row["Tower Type"] || "Low Density";

export const getInventoryMaxPods = (row: ProductionInventoryRow): number | string =>
  row.maxPods ?? row["Max Pods"] ?? getTowerMaxPods(getInventoryTowerType(row));

export const getInventoryActivePods = (row: ProductionInventoryRow): number | string =>
  row.activePods ?? row["Active Pods"] ?? getInventoryMaxPods(row);

export const getInventoryCrop = (row: ProductionInventoryRow): string => row.crop || row.Crop || "";

export const getInventoryStage = (row: ProductionInventoryRow): string => row.stage || row.Stage || "";

export const getInventorySeededDate = (row: ProductionInventoryRow): string =>
  row.seededDate || row["Seeded Date"] || "";

export const getInventoryTransplantDate = (row: ProductionInventoryRow): string =>
  row.transplantDate || row["Transplant Date"] || "";

export const getInventoryEstimatedReadyDate = (row: ProductionInventoryRow): string =>
  row.estimatedReadyDate || row["Estimated Ready Date"] || "";

export const getInventoryEffectiveReadyDate = (row: ProductionInventoryRow): string => {
  const explicitReadyDate = formatDateInput(getInventoryEstimatedReadyDate(row));
  if (explicitReadyDate) return explicitReadyDate;

  const seededDate = formatDateInput(getInventorySeededDate(row));
  if (seededDate) return addDays(seededDate, 42);

  return "";
};

export const getInventoryExpectedLbs = (row: ProductionInventoryRow): number | string => {
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

export const getInventoryRemainingExpectedLbs = (row: ProductionInventoryRow): number | string => {
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

export const getInventoryStatus = (row: ProductionInventoryRow): string => row.status || row.Status || "";

export const getInventoryNotes = (row: ProductionInventoryRow): string => row.notes || row.Notes || "";

export const getInventoryTrimCount = (row: ProductionInventoryRow): number | string =>
  row.trimCount ?? row["Trim Count"] ?? 0;
