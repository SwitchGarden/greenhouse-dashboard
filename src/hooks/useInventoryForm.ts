import { useReducer } from 'react';
import { getTowerMaxPods } from '../lib/utils/inventoryUtils';
import { calculateExpectedLbs } from '../lib/utils/cropUtils';
import { addDays } from '../lib/utils/dateUtils';

export type InventoryFormState = {
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

const initialState: InventoryFormState = {
  tower: "",
  towerType: "Low Density",
  maxPods: String(getTowerMaxPods("Low Density")),
  activePods: String(getTowerMaxPods("Low Density")),
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

type Action =
  | { type: "SET_FIELD"; field: keyof InventoryFormState; value: string | boolean }
  | { type: "SET_TOWER_TYPE"; towerType: string }
  | { type: "SET_CROP_OR_PODS"; crop?: string; activePods?: string; towerType?: string }
  | { type: "SET_SEEDED_DATE"; seededDate: string }
  | { type: "RESET" };

function reducer(state: InventoryFormState, action: Action): InventoryFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_TOWER_TYPE": {
      const max = getTowerMaxPods(action.towerType);
      const activePods =
        !state.activePods || Number(state.activePods) > max ? String(max) : state.activePods;
      return { ...state, towerType: action.towerType, maxPods: String(max), activePods };
    }
    case "SET_CROP_OR_PODS": {
      const crop = action.crop ?? state.crop;
      const activePods = action.activePods ?? state.activePods;
      const towerType = action.towerType ?? state.towerType;
      if (crop) {
        const expected = calculateExpectedLbs(crop, Number(activePods), towerType);
        return {
          ...state,
          crop,
          activePods,
          towerType,
          expectedLbs: String(expected),
          remainingExpectedLbs: String(expected),
        };
      }
      return { ...state, crop, activePods, towerType };
    }
    case "SET_SEEDED_DATE": {
      const estimatedReadyDate = !state.estimatedReadyDate
        ? addDays(action.seededDate, 42)
        : state.estimatedReadyDate;
      return { ...state, seededDate: action.seededDate, estimatedReadyDate };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useInventoryForm() {
  return useReducer(reducer, initialState);
}
