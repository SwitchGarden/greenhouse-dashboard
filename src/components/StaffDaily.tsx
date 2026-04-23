import React from "react";
import type { ProductionInventoryRow, SalesOrderRow, StaffActionRow, OrderUnitType, CropInventoryEntry } from "../lib/types";
import type { HarvestFormState, HarvestFormAction } from "../hooks/useHarvestForm";
import {
  Panel,
  Field,
  ActionRow,
  TableScroll,
  FormGrid,
  MetricGrid,
  MiniMetric,
} from "./ui";
import {
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
  compactInputStyle,
  textareaStyle,
  tableStyle,
  thStyle,
  tdStyle,
  sectionStackStyle,
} from "../lib/styles";
import { formatDateDisplay, formatDateTimeDisplay, formatDateInput } from "../lib/utils/dateUtils";
import {
  getInventoryTower,
  getInventoryTowerType,
  getInventoryActivePods,
  getInventoryCrop,
  getInventoryStage,
  getInventorySeededDate,
  getInventoryEffectiveReadyDate,
  getInventoryExpectedLbs,
  getInventoryRemainingExpectedLbs,
} from "../lib/utils/inventoryUtils";
import {
  getOrderCustomer,
  getOrderCrop,
  getOrderRequestedDeliveryDate,
  getOrderStatus,
  getOrderNewTowersToPlant,
} from "../lib/utils/orderUtils";
import {
  getStaffMode,
  getStaffTower,
  getStaffCrop,
  getStaffLbs,
  getStaffPodsChanged,
  getStaffTimestamp,
  getStaffDate,
} from "../lib/utils/staffUtils";
import { quantityToLbs } from "../lib/utils/cropUtils";
import { toNumber } from "../lib/utils/inventoryUtils";

type PlantTask = {
  crop: string;
  seedByDate: string;
  earliestDueDate: string;
  totalTowers: number;
  currentAvailableLbs: number;
  currentAvailablePlants: number;
  seededCount: number;
  pipelineCount: number;
  orders: string[];
  urgency: string;
};

type PackTask = {
  rowNumber: number;
  customer: string;
  crop: string;
  unitType: string;
  quantityNeeded: number;
  dueDate: string;
  status: string;
};

type WeeklyMetrics = {
  harvestedThisWeek: number;
  scrappedThisWeek: number;
};

type DashboardStats = {
  podsInProduction: number;
  [key: string]: number;
};

export type StaffDailyProps = {
  plantTodayTasks: PlantTask[];
  filteredPlantTodayTasks: PlantTask[];
  seededInventory: ProductionInventoryRow[];
  transplantTodayTasks: ProductionInventoryRow[];
  readyToHarvestInventory: ProductionInventoryRow[];
  harvestTodayTasks: ProductionInventoryRow[];
  packTodayTasks: PackTask[];
  overdueOrders: SalesOrderRow[];
  filteredRecentActivity: StaffActionRow[];

  dashboardStats: DashboardStats;
  weeklyMetrics: WeeklyMetrics;
  inventoryByCrop: Map<string, CropInventoryEntry>;

  markPlantedLoading: string | null;
  transplantLoading: boolean;
  harvestLoading: boolean;
  packLoadingRow: number | null;

  harvestForm: HarvestFormState;
  dispatchHarvest: React.Dispatch<HarvestFormAction>;

  transplantRowNumber: string;
  transplantTower: string;
  transplantTowerType: string;
  transplantMaxPods: string;
  transplantActivePods: string;
  transplantDate: string;
  transplantReadyDate: string;
  transplantNotes: string;
  setTransplantRowNumber: (v: string) => void;
  setTransplantTower: (v: string) => void;
  setTransplantTowerType: (v: string) => void;
  setTransplantMaxPods: (v: string) => void;
  setTransplantActivePods: (v: string) => void;
  setTransplantDate: (v: string) => void;
  setTransplantReadyDate: (v: string) => void;
  setTransplantNotes: (v: string) => void;

  mode: string;
  tower: string;
  crop: string;
  lbs: string;
  podsChanged: string;
  entryStatus: string;
  stage: string;
  entryDate: string;
  scrapType: string;
  note: string;
  quickEntryUnitType: OrderUnitType;
  message: string;
  setMode: (v: string) => void;
  setTower: (v: string) => void;
  setCrop: (v: string) => void;
  setLbs: (v: string) => void;
  setPodsChanged: (v: string) => void;
  setEntryStatus: (v: string) => void;
  setStage: (v: string) => void;
  setEntryDate: (v: string) => void;
  setScrapType: (v: string) => void;
  setNote: (v: string) => void;
  setQuickEntryUnitType: (v: OrderUnitType) => void;

  dailyMessage: string;
  plantingTowerType: Record<string, string>;
  setPlantingTowerType: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  staffLookupCrop: string;
  setStaffLookupCrop: (v: string) => void;
  seedScheduleFilter: "Today" | "This Week" | "This Month";
  setSeedScheduleFilter: (v: "Today" | "This Week" | "This Month") => void;

  uniqueCrops: string[];
  uniqueTowers: string[];

  handleMarkPlanted: (task: PlantTask) => void;
  handleMarkTransplanted: () => void;
  handleReadyHarvestSubmit: () => void;
  handleMarkPacked: (task: PackTask) => void;
  saveQuickAction: () => void;
  startReadyHarvestAction: (item: ProductionInventoryRow) => void;
  clearReadyHarvestAction: () => void;
};

export function StaffDaily({
  plantTodayTasks,
  filteredPlantTodayTasks,
  seededInventory,
  transplantTodayTasks,
  readyToHarvestInventory,
  harvestTodayTasks,
  packTodayTasks,
  overdueOrders,
  filteredRecentActivity,
  dashboardStats,
  weeklyMetrics,
  inventoryByCrop,
  markPlantedLoading,
  transplantLoading,
  harvestLoading,
  packLoadingRow,
  harvestForm,
  dispatchHarvest,
  transplantRowNumber,
  transplantTower,
  transplantTowerType,
  transplantMaxPods,
  transplantActivePods,
  transplantDate,
  transplantReadyDate,
  transplantNotes,
  setTransplantRowNumber,
  setTransplantTower,
  setTransplantTowerType,
  setTransplantMaxPods,
  setTransplantActivePods,
  setTransplantDate,
  setTransplantReadyDate,
  setTransplantNotes,
  mode,
  tower,
  crop,
  lbs,
  podsChanged,
  entryStatus,
  stage,
  entryDate,
  scrapType,
  note,
  quickEntryUnitType,
  message,
  setMode,
  setTower,
  setCrop,
  setLbs,
  setPodsChanged,
  setEntryStatus,
  setStage,
  setEntryDate,
  setScrapType,
  setNote,
  setQuickEntryUnitType,
  dailyMessage,
  plantingTowerType,
  setPlantingTowerType,
  staffLookupCrop,
  setStaffLookupCrop,
  seedScheduleFilter,
  setSeedScheduleFilter,
  uniqueCrops,
  handleMarkPlanted,
  handleMarkTransplanted,
  handleReadyHarvestSubmit,
  handleMarkPacked,
  saveQuickAction,
  startReadyHarvestAction,
  clearReadyHarvestAction,
}: StaffDailyProps) {
  return (
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
            <select value={staffLookupCrop} onChange={(e) => setStaffLookupCrop(e.target.value)} style={inputStyle} aria-label="Crop lookup selector">
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
                <option key={item} value={item}>{item}</option>
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
              <option value="0.75oz Small Bag">0.75oz Small Bag</option>
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
          <button onClick={saveQuickAction} style={primaryButtonStyle}>Save to Staff_Actions</button>
        </ActionRow>
      </Panel>

      <Panel title="Seed Today / Seeding Schedule">
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>Default view shows what needs to be seeded today.</div>
          <select
            value={seedScheduleFilter}
            onChange={(e) => setSeedScheduleFilter(e.target.value as "Today" | "This Week" | "This Month")}
            style={{ ...inputStyle, width: 180 }}
            aria-label="Seed schedule filter"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
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
              {filteredPlantTodayTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} style={tdStyle}>No seeding tasks right now.</td>
                </tr>
              ) : (
                filteredPlantTodayTasks.map((task) => {
                  const displaySeedByDate = task.seedByDate && task.seedByDate < formatDateInput(new Date()) ? formatDateInput(new Date()) : task.seedByDate;
                  return (
                    <tr key={`${task.seedByDate}-${task.crop}`}>
                      <td style={tdStyle}>{formatDateDisplay(displaySeedByDate)}</td>
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
                          onChange={(e) => setPlantingTowerType((prev) => ({ ...prev, [task.crop]: e.target.value }))}
                          style={compactInputStyle}
                          aria-label={`Tower type for ${task.crop}`}
                        >
                          <option value="Low Density">Low Density</option>
                          <option value="High Density">High Density</option>
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleMarkPlanted(task)}
                          style={primaryButtonStyle}
                          disabled={markPlantedLoading === task.crop}
                          aria-label={`Mark ${task.crop} planted (${task.totalTowers} towers)`}
                        >
                          {markPlantedLoading === task.crop ? "Planting..." : "Mark Planted"}
                        </button>
                      </td>
                    </tr>
                  );
                })
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
                  <td colSpan={6} style={tdStyle}>No seeded inventory entries yet.</td>
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
            <select value={transplantRowNumber} onChange={(e) => setTransplantRowNumber(e.target.value)} style={compactInputStyle}>
              <option value="">Select seeded item</option>
              {transplantTodayTasks.map((item) => (
                <option key={item.rowNumber} value={item.rowNumber}>
                  {getInventoryCrop(item)} - {formatDateDisplay(getInventorySeededDate(item))}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tower">
            <input value={transplantTower} onChange={(e) => setTransplantTower(e.target.value)} style={compactInputStyle} placeholder="R1" />
          </Field>
          <Field label="Tower Type">
            <select value={transplantTowerType} onChange={(e) => setTransplantTowerType(e.target.value)} style={compactInputStyle}>
              <option value="Low Density">Low Density (44)</option>
              <option value="High Density">High Density (160)</option>
            </select>
          </Field>
          <Field label="Max Pods">
            <input value={transplantMaxPods} onChange={(e) => setTransplantMaxPods(e.target.value)} style={compactInputStyle} />
          </Field>
          <Field label="Active Pods">
            <input value={transplantActivePods} onChange={(e) => setTransplantActivePods(e.target.value)} style={compactInputStyle} />
          </Field>
          <Field label="Transplant Date">
            <input type="date" value={transplantDate} onChange={(e) => setTransplantDate(e.target.value)} style={compactInputStyle} />
          </Field>
          <Field label="Estimated Ready Date">
            <input type="date" value={transplantReadyDate} onChange={(e) => setTransplantReadyDate(e.target.value)} style={compactInputStyle} />
          </Field>
        </FormGrid>
        <Field label="Notes">
          <input value={transplantNotes} onChange={(e) => setTransplantNotes(e.target.value)} style={compactInputStyle} />
        </Field>
        <ActionRow message={dailyMessage}>
          <button onClick={handleMarkTransplanted} style={primaryButtonStyle} disabled={transplantLoading}>
            {transplantLoading ? "Transplanting..." : "Mark Transplanted"}
          </button>
        </ActionRow>
      </Panel>

      <Panel title="Ready to Harvest">
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
          Only 10 rows show at a time. Scroll to see more. Use Mark Harvested to record a full harvest or a trim harvest.
        </div>
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
                    <td colSpan={8} style={tdStyle}>No inventory entries are ready to harvest today.</td>
                  </tr>
                ) : (
                  readyToHarvestInventory.map((item) => {
                    const isActiveRow = String(item.rowNumber) === harvestForm.activeRowNumber;
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
                            <button
                              onClick={() => startReadyHarvestAction(item)}
                              style={primaryButtonStyle}
                              aria-label={`Mark ${getInventoryCrop(item)} in tower ${getInventoryTower(item) || "unassigned"} as harvested`}
                            >
                              Mark Harvested
                            </button>
                          </td>
                        </tr>
                        {isActiveRow && (
                          <tr>
                            <td colSpan={8} style={{ ...tdStyle, background: "#f8fafc" }}>
                              <FormGrid columns={3}>
                                <Field label="Harvest Type">
                                  <select value={harvestForm.actionType} onChange={(e) => dispatchHarvest({ type: "SET_FIELD", field: "actionType", value: e.target.value })} style={compactInputStyle}>
                                    <option value="Full Harvest">Full Harvest</option>
                                    <option value="Trim Harvest">Trim Harvest</option>
                                  </select>
                                </Field>
                                <Field label={harvestForm.actionType === "Trim Harvest" ? "Pods Trimmed" : "Pods Harvested"}>
                                  <input value={harvestForm.podsValue} onChange={(e) => dispatchHarvest({ type: "SET_FIELD", field: "podsValue", value: e.target.value })} style={compactInputStyle} />
                                </Field>
                                <Field label="Output Unit">
                                  <select value={harvestForm.outputUnit} onChange={(e) => dispatchHarvest({ type: "SET_FIELD", field: "outputUnit", value: e.target.value })} style={compactInputStyle}>
                                    <option value="Lbs">Lbs</option>
                                    <option value="6oz Bag">6oz Bag</option>
                                    <option value="6oz Clamshell">6oz Clamshell</option>
                                    <option value="0.75oz Small Bag">0.75oz Small Bag</option>
                                  </select>
                                </Field>
                                <Field label="Harvested Qty">
                                  <input value={harvestForm.outputQty} onChange={(e) => dispatchHarvest({ type: "SET_FIELD", field: "outputQty", value: e.target.value })} style={compactInputStyle} />
                                </Field>
                                <Field label="Harvested Lbs">
                                  <input value={String(quantityToLbs(harvestForm.outputUnit, toNumber(harvestForm.outputQty)))} readOnly style={{ ...compactInputStyle, background: "#f1f5f9" }} />
                                </Field>
                              </FormGrid>
                              <Field label="Notes">
                                <input value={harvestForm.note} onChange={(e) => dispatchHarvest({ type: "SET_FIELD", field: "note", value: e.target.value })} style={compactInputStyle} />
                              </Field>
                              <ActionRow message={dailyMessage}>
                                <button onClick={handleReadyHarvestSubmit} style={primaryButtonStyle} disabled={harvestLoading}>
                                  {harvestLoading ? "Saving..." : "Save Harvest"}
                                </button>
                                <button onClick={clearReadyHarvestAction} style={secondaryButtonStyle}>Cancel</button>
                              </ActionRow>
                            </td>
                          </tr>
                        )}
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
                  <td colSpan={7} style={tdStyle}>No packing tasks due today.</td>
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
                      <button
                        onClick={() => handleMarkPacked(task)}
                        style={primaryButtonStyle}
                        disabled={packLoadingRow === task.rowNumber}
                        aria-label={`Mark ${task.crop} for ${task.customer} as packed`}
                      >
                        {packLoadingRow === task.rowNumber ? "Packing..." : "Mark Packed"}
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
                  <td colSpan={5} style={tdStyle}>No overdue orders.</td>
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
                  <td colSpan={7} style={tdStyle}>No recent activity found.</td>
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
        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Showing 5 visible rows. Scroll to see the rest.</div>
      </Panel>
    </div>
  );
}
