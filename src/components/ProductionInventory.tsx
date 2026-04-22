import React from "react";
import type { ProductionInventoryRow } from "../lib/types";
import type { InventoryFormState, InventoryFormAction } from "../hooks/useInventoryForm";
import type { EditInventoryFormState, EditInventoryFormAction } from "../hooks/useEditInventoryForm";
import {
  Panel,
  Field,
  ActionRow,
  TableScroll,
  FormGrid,
} from "./ui";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
  compactInputStyle,
  tableStyle,
  thStyle,
  tdStyle,
  sectionStackStyle,
} from "../lib/styles";
import { formatDateDisplay } from "../lib/utils/dateUtils";
import {
  sortInventoryByTowerLayout,
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
} from "../lib/utils/inventoryUtils";

export type ProductionInventoryProps = {
  inventoryForm: InventoryFormState;
  dispatchInventory: React.Dispatch<InventoryFormAction>;
  editInventoryForm: EditInventoryFormState;
  dispatchEditInventory: React.Dispatch<EditInventoryFormAction>;

  adjustInventoryRow: string;
  adjustMode: "Harvest" | "Scrapped";
  adjustPods: string;
  adjustLbs: string;
  adjustNote: string;
  adjustScrapType: string;
  adjustMessage: string;

  uniqueCrops: string[];
  activeInventory: ProductionInventoryRow[];
  productionInventory: ProductionInventoryRow[];

  setAdjustInventoryRow: (v: string) => void;
  setAdjustMode: (v: "Harvest" | "Scrapped") => void;
  setAdjustPods: (v: string) => void;
  setAdjustLbs: (v: string) => void;
  setAdjustNote: (v: string) => void;
  setAdjustScrapType: (v: string) => void;

  handleSaveInventory: () => void;
  handleSaveInventoryEdits: () => void;
  clearEditInventoryForm: () => void;
  handleInventoryAdjustment: () => void;
  handleProductionStatusChange: (rowNumber: number, status: string) => void;
  handleEditInventory: (item: ProductionInventoryRow) => void;
};

export function ProductionInventory({
  inventoryForm,
  dispatchInventory,
  editInventoryForm,
  dispatchEditInventory,
  adjustInventoryRow,
  adjustMode,
  adjustPods,
  adjustLbs,
  adjustNote,
  adjustScrapType,
  adjustMessage,
  uniqueCrops,
  activeInventory,
  productionInventory,
  setAdjustInventoryRow,
  setAdjustMode,
  setAdjustPods,
  setAdjustLbs,
  setAdjustNote,
  setAdjustScrapType,
  handleSaveInventory,
  handleSaveInventoryEdits,
  clearEditInventoryForm,
  handleInventoryAdjustment,
  handleProductionStatusChange,
  handleEditInventory,
}: ProductionInventoryProps) {
  return (
    <div style={sectionStackStyle}>
      <Panel title="Add Production Inventory">
        <FormGrid columns={3}>
          <Field label="Tower">
            <input value={inventoryForm.tower} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "tower", value: e.target.value })} style={inputStyle} placeholder="R1" />
          </Field>

          <Field label="Tower Type">
            <select value={inventoryForm.towerType} onChange={(e) => dispatchInventory({ type: "SET_TOWER_TYPE", towerType: e.target.value })} style={inputStyle}>
              <option value="Low Density">Low Density (44 pods)</option>
              <option value="High Density">High Density (160 pods)</option>
            </select>
          </Field>

          <Field label="Max Pods">
            <input value={inventoryForm.maxPods} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "maxPods", value: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Active Pods">
            <input value={inventoryForm.activePods} onChange={(e) => dispatchInventory({ type: "SET_CROP_OR_PODS", activePods: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Crop">
            <select value={inventoryForm.crop} onChange={(e) => dispatchInventory({ type: "SET_CROP_OR_PODS", crop: e.target.value })} style={inputStyle}>
              <option value="">Select Crop</option>
              {uniqueCrops.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stage">
            <select value={inventoryForm.stage} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "stage", value: e.target.value })} style={inputStyle}>
              <option value="Seeded">Seeded</option>
              <option value="Transplanted">Transplanted</option>
              <option value="Growing">Growing</option>
              <option value="Ready">Ready</option>
              <option value="Harvested">Harvested</option>
              <option value="Scrapped">Scrapped</option>
            </select>
          </Field>

          <Field label="Seeded Date">
            <input type="date" value={inventoryForm.seededDate} onChange={(e) => dispatchInventory({ type: "SET_SEEDED_DATE", seededDate: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Transplant Date">
            <input
              type="date"
              value={inventoryForm.transplantDate}
              onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "transplantDate", value: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Estimated Ready Date">
            <input
              type="date"
              value={inventoryForm.estimatedReadyDate}
              onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "estimatedReadyDate", value: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Expected Lbs">
            <input value={inventoryForm.expectedLbs} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "expectedLbs", value: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Remaining Expected Lbs">
            <input value={inventoryForm.remainingExpectedLbs} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "remainingExpectedLbs", value: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="Status">
            <select value={inventoryForm.status} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "status", value: e.target.value })} style={inputStyle}>
              <option value="Active">Active</option>
              <option value="Harvested">Harvested</option>
              <option value="Lost">Lost</option>
              <option value="Scrapped">Scrapped</option>
              <option value="Closed">Closed</option>
            </select>
          </Field>
        </FormGrid>

        <Field label="Notes">
          <input value={inventoryForm.notes} onChange={(e) => dispatchInventory({ type: "SET_FIELD", field: "notes", value: e.target.value })} style={inputStyle} />
        </Field>

        <ActionRow message={inventoryForm.message}>
          <button onClick={handleSaveInventory} style={primaryButtonStyle} disabled={inventoryForm.saving}>
            {inventoryForm.saving ? "Saving..." : "Save Production Inventory"}
          </button>
        </ActionRow>
      </Panel>

      <div id="edit-production-inventory">
        <Panel title="Edit Production Inventory">
          <FormGrid columns={3}>
            <Field label="Selected Row">
              <input value={editInventoryForm.rowNumber} readOnly style={inputStyle} placeholder="Click Edit on a row below" />
            </Field>

            <Field label="Tower">
              <input value={editInventoryForm.tower} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "tower", value: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Tower Type">
              <select value={editInventoryForm.towerType} onChange={(e) => dispatchEditInventory({ type: "SET_TOWER_TYPE", towerType: e.target.value })} style={inputStyle}>
                <option value="Low Density">Low Density (44 pods)</option>
                <option value="High Density">High Density (160 pods)</option>
              </select>
            </Field>

            <Field label="Max Pods">
              <input value={editInventoryForm.maxPods} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "maxPods", value: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Active Pods">
              <input value={editInventoryForm.activePods} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "activePods", value: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Crop">
              <select value={editInventoryForm.crop} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "crop", value: e.target.value })} style={inputStyle}>
                <option value="">Select Crop</option>
                {uniqueCrops.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Stage">
              <select value={editInventoryForm.stage} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "stage", value: e.target.value })} style={inputStyle}>
                <option value="Seeded">Seeded</option>
                <option value="Transplanted">Transplanted</option>
                <option value="Growing">Growing</option>
                <option value="Ready">Ready</option>
                <option value="Harvested">Harvested</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </Field>

            <Field label="Seeded Date">
              <input type="date" value={editInventoryForm.seededDate} onChange={(e) => dispatchEditInventory({ type: "SET_SEEDED_DATE", seededDate: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Transplant Date">
              <input type="date" value={editInventoryForm.transplantDate} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "transplantDate", value: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Estimated Ready Date">
              <input
                type="date"
                value={editInventoryForm.estimatedReadyDate}
                onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "estimatedReadyDate", value: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Expected Lbs">
              <input value={editInventoryForm.expectedLbs} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "expectedLbs", value: e.target.value })} style={inputStyle} />
            </Field>

            <Field label="Remaining Expected Lbs">
              <input
                value={editInventoryForm.remainingExpectedLbs}
                onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "remainingExpectedLbs", value: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Status">
              <select value={editInventoryForm.status} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "status", value: e.target.value })} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Harvested">Harvested</option>
                <option value="Lost">Lost</option>
                <option value="Scrapped">Scrapped</option>
                <option value="Closed">Closed</option>
              </select>
            </Field>
          </FormGrid>

          <Field label="Notes">
            <input value={editInventoryForm.notes} onChange={(e) => dispatchEditInventory({ type: "SET_FIELD", field: "notes", value: e.target.value })} style={inputStyle} />
          </Field>

          <ActionRow message={editInventoryForm.message}>
            <button onClick={handleSaveInventoryEdits} style={primaryButtonStyle} disabled={editInventoryForm.saving}>
              {editInventoryForm.saving ? "Saving..." : "Save Changes"}
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
  );
}
