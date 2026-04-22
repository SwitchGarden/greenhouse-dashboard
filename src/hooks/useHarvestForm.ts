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

type Action =
  | { type: "START"; item: ProductionInventoryRow }
  | { type: "SET_FIELD"; field: keyof HarvestFormState; value: string }
  | { type: "CLEAR" };

function reducer(state: HarvestFormState, action: Action): HarvestFormState {
  switch (action.type) {
    case "START": {
      const item = action.item;
      return {
        ...state,
        activeRowNumber: String(item.rowNumber),
        actionType: isRepeatHarvestCrop(getInventoryCrop(item)) ? "Trim Harvest" : "Full Harvest",
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
