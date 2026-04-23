import { useReducer } from 'react';
import type { OrderUnitType, ProductionInventoryRow } from '../lib/types';
import { isRepeatHarvestCrop } from '../lib/utils/cropUtils';
import { getInventoryCrop, getInventoryActivePods, getInventoryRemainingExpectedLbs } from '../lib/utils/inventoryUtils';

export type HarvestFormState = {
  activeRowNumber: string;
  actionType: "Full Harvest" | "Trim Harvest";
  podsValue: string;
  outputUnit: OrderUnitType;
  outputQty: string;
  note: string;
};

const initialState: HarvestFormState = {
  activeRowNumber: "",
  actionType: "Full Harvest",
  podsValue: "",
  outputUnit: "Lbs",
  outputQty: "",
  note: "",
};

export type HarvestFormAction =
  | { type: "START"; item: ProductionInventoryRow; actionType?: "Full Harvest" | "Trim Harvest" }
  | { type: "SET_FIELD"; field: keyof HarvestFormState; value: string }
  | { type: "CLEAR" };

type Action = HarvestFormAction;

function reducer(state: HarvestFormState, action: Action): HarvestFormState {
  switch (action.type) {
    case "START": {
      const item = action.item;
      const defaultType = isRepeatHarvestCrop(getInventoryCrop(item)) ? "Trim Harvest" : "Full Harvest";
      return {
        ...state,
        activeRowNumber: String(item.rowNumber),
        actionType: action.actionType ?? defaultType,
        podsValue: String(getInventoryActivePods(item) || ""),
        outputUnit: "Lbs",
        outputQty: String(getInventoryRemainingExpectedLbs(item) || ""),
        note: "",
      };
    }
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

export function useHarvestForm() {
  return useReducer(reducer, initialState);
}
