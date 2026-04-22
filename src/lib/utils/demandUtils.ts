import type { CropInventoryEntry } from '../types';
import { quantityToLbs, availableLbsToUnitQty } from './cropUtils';

export type CropPool = {
  readyLbs: number;
  readyPlants: number;
  futureEntries: Array<{ readyDate: string; lbs: number; plants: number }>;
};

export function buildCropPools(inventoryByCrop: Map<string, CropInventoryEntry>): Map<string, CropPool> {
  const pools = new Map<string, CropPool>();
  for (const [cropName, entry] of inventoryByCrop.entries()) {
    pools.set(cropName, {
      readyLbs: entry.readyNowLbs,
      readyPlants: entry.readyNowPlants,
      futureEntries: entry.futureEntries.map((e) => ({ ...e })),
    });
  }
  return pools;
}

export type AllocationResult = {
  availableLbsByDue: number;
  availablePlantsByDue: number;
  shortageLbs: number;
  shortageQty: number;
  newTowersNeeded: number;
  consumedLbs: number;
  consumedPlants: number;
};

export function allocateOrderAgainstPool(
  pool: CropPool,
  cropName: string,
  dueDate: string,
  unitType: string,
  qtyNeeded: number,
  avgLbsPerTower: number,
  mutate = true
): AllocationResult {
  // cropName is kept for signature compatibility
  void cropName;

  const qtyNeededInLbs = quantityToLbs(unitType, qtyNeeded);
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
  const newTowersNeeded = shortageLbs > 0 ? Math.ceil(shortageLbs / avgLbsPerTower) : 0;
  const consumedLbs = Math.min(qtyNeededInLbs, availableLbsByDue);
  const consumedPlants = Math.min(
    unitType === "Plants" ? qtyNeeded : Math.round((consumedLbs * 16) / 6),
    availablePlantsByDue
  );

  if (mutate) {
    pool.readyLbs = Math.max(0, availableLbsByDue - consumedLbs);
    pool.readyPlants = Math.max(0, availablePlantsByDue - consumedPlants);
    pool.futureEntries = remainingFutureEntries;
  }

  return {
    availableLbsByDue,
    availablePlantsByDue,
    shortageLbs,
    shortageQty,
    newTowersNeeded,
    consumedLbs,
    consumedPlants,
  };
}
