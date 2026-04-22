import { useReducer } from 'react';
import type { ProductionInventoryRow } from '../lib/types';
import { getTowerMaxPods } from '../lib/utils/inventoryUtils';
import {
  getInventoryTower,
  getInventoryTowerType,
  getInventoryMaxPods,
  getInventoryActivePods,
  getInventoryCrop,
  getInventoryStage,
  getInventorySeededDate,
  getInventoryTransplantDate,
  getInventoryEffectiveReadyDate,
  getInventoryExpectedLbs,
  getInventoryRemainingExpectedLbs,
  getInventoryStatus,
  getInventoryNotes,
} from '../lib/utils/inventoryUtils';
import { addDays, formatDateInput } from '../lib/utils/dateUtils';

export type EditInventoryFormState = {
  rowNumber: string;
  tower: string;
  towerType: string;
  maxPods: string;
  activePods: string;
  crop: string;
  stage: string;
  seededDate: string;
  transplantDate: string;
  estimatedReadyDate: string;
  expectedLbs: string;
  remainingExpectedLbs: string;
  status: string;
  notes: string;
  message: string;
  saving: boolean;
};

const initialState: EditInventoryFormState = {
  rowNumber: "",
  tower: "",
  towerType: "Low Density",
  maxPods: "",
  activePods: "",
  crop: "",
  stage: "Growing",
  seededDate: "",
  transplantDate: "",
  estimatedReadyDate: "",
  expectedLbs: "",
  remainingExpectedLbs: "",
  status: "Active",
  notes: "",
  message: "",
  saving: false,
};

export type EditInventoryFormAction =
  | { type: "SET_FIELD"; field: keyof EditInventoryFormState; value: string | boolean }
  | { type: "SET_TOWER_TYPE"; towerType: string }
  | { type: "SET_SEEDED_DATE"; seededDate: string }
  | { type: "LOAD"; item: ProductionInventoryRow }
  | { type: "RESET" };

type Action = EditInventoryFormAction;

function reducer(state: EditInventoryFormState, action: Action): EditInventoryFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_TOWER_TYPE": {
      const max = getTowerMaxPods(action.towerType);
      const activePods =
        !state.activePods || Number(state.activePods) > max ? String(max) : state.activePods;
      return { ...state, towerType: action.towerType, maxPods: String(max), activePods };
    }
    case "SET_SEEDED_DATE": {
      const estimatedReadyDate = !state.estimatedReadyDate
        ? addDays(action.seededDate, 42)
        : state.estimatedReadyDate;
      return { ...state, seededDate: action.seededDate, estimatedReadyDate };
    }
    case "LOAD": {
      const item = action.item;
      return {
        ...state,
        rowNumber: String(item.rowNumber),
        tower: getInventoryTower(item),
        towerType: getInventoryTowerType(item) || "Low Density",
        maxPods: String(getInventoryMaxPods(item)),
        activePods: String(getInventoryActivePods(item)),
        crop: getInventoryCrop(item),
        stage: getInventoryStage(item) || "Growing",
        seededDate: formatDateInput(getInventorySeededDate(item)),
        transplantDate: formatDateInput(getInventoryTransplantDate(item)),
        estimatedReadyDate: formatDateInput(getInventoryEffectiveReadyDate(item)),
        expectedLbs: String(getInventoryExpectedLbs(item)),
        remainingExpectedLbs: String(getInventoryRemainingExpectedLbs(item)),
        status: getInventoryStatus(item) || "Active",
        notes: getInventoryNotes(item),
        message: "",
        saving: false,
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useEditInventoryForm() {
  return useReducer(reducer, initialState);
}
