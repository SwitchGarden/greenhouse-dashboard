import React from "react";
import type {
  SalesOrderRow,
  DraftOrderLine,
  SalesPlannerResult,
  StaffActionRow,
} from "../lib/types";
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
import { formatDateDisplay, formatDateTimeDisplay } from "../lib/utils/dateUtils";
import {
  getOrderCrop,
  getOrderUnitType,
  getOrderQuantityNeeded,
  getOrderNewTowersToPlant,
  getOrderStatus,
  getOrderType,
  getOrderFrequency,
  getOrderRequestedDeliveryDate,
  getOrderCustomer,
} from "../lib/utils/orderUtils";
import {
  getStaffMode,
  getStaffTower,
  getStaffCrop,
  getStaffLbs,
  getStaffPodsChanged,
  getStaffNote,
  getStaffTimestamp,
} from "../lib/utils/staffUtils";
import { quantityToLbs } from "../lib/utils/cropUtils";
import { toNumber } from "../lib/utils/inventoryUtils";

type GroupedOrder = {
  key: string;
  customer: string;
  dueDate: string;
  status: string;
  items: SalesOrderRow[];
  totalNewTowers: number;
};

type ShortageAlert = {
  rowNumber: number;
  customer: string;
  crop: string;
  dueDate: string;
  shortageQty: number;
  newTowers: number;
  status: string;
};

type ExecutiveAlert = {
  level: string;
  title: string;
  detail: string;
};

type SeedingCalendarItem = {
  crop: string;
  towers: number;
  seedByDate: string;
  firstDueDate: string;
  orders: string;
};

export type DashboardProps = {
  dashboardStats: {
    totalQtyOnOrder: number;
    totalNewTowersNeeded: number;
    activeInventoryCount: number;
    readyInventory: number;
    overdueOrders: number;
    harvestedThisWeek: number;
    scrappedThisWeek: number;
    harvestedPrevWeek: number;
    scrappedPrevWeek: number;
    podsInProduction: number;
  };
  executiveAlerts: ExecutiveAlert[];
  shortageAlerts: ShortageAlert[];
  seedingCalendar: [string, SeedingCalendarItem[]][];
  filteredRecentActivity: StaffActionRow[];
  groupedSavedOrders: GroupedOrder[];
  uniqueModes: string[];
  uniqueCrops: string[];
  uniqueTowers: string[];
  uniqueOrderStatuses: string[];
  uniqueCustomers: string[];

  salesCustomer: string;
  salesNotes: string;
  salesPlanner: SalesPlannerResult;
  salesOrderType: "One-Time" | "Contract";
  salesFrequency: string;
  salesDeliveryDate: string;
  salesContractStartDate: string;
  salesContractEndDate: string;
  draftOrderLines: DraftOrderLine[];
  editingSalesOrderRowNumber: number | null;
  salesSaving: boolean;
  salesSaveMessage: string;

  savedOrderStatusFilter: string;
  savedOrderCropFilter: string;
  savedOrderCustomerFilter: string;
  savedOrderDueFilter: "All" | "Current Week";
  expandedSavedOrderGroups: Record<string, boolean>;

  filterMode: string;
  filterCrop: string;
  filterTower: string;

  setSalesCustomer: (v: string) => void;
  setSalesNotes: (v: string) => void;
  setSalesOrderType: (v: "One-Time" | "Contract") => void;
  setSalesFrequency: (v: string) => void;
  setSalesDeliveryDate: (v: string) => void;
  setSalesContractStartDate: (v: string) => void;
  setSalesContractEndDate: (v: string) => void;
  setSavedOrderStatusFilter: (v: string) => void;
  setSavedOrderCropFilter: (v: string) => void;
  setSavedOrderCustomerFilter: (v: string) => void;
  setSavedOrderDueFilter: (v: "All" | "Current Week") => void;
  setExpandedSavedOrderGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setFilterMode: (v: string) => void;
  setFilterCrop: (v: string) => void;
  setFilterTower: (v: string) => void;

  updateDraftOrderLine: (id: string, field: "crop" | "unitType" | "quantityNeeded", value: string) => void;
  addDraftOrderRow: () => void;
  cancelEditSalesOrder: () => void;
  handleSaveOrder: () => void;
  handleOrderStatusChange: (rowNumber: number, status: string) => void;
  startEditSalesOrder: (order: SalesOrderRow) => void;
  handleCancelSalesOrder: (rowNumber: number) => void;
  removeDraftOrderLine: (id: string) => void;
};

export function Dashboard({
  dashboardStats,
  executiveAlerts,
  shortageAlerts,
  seedingCalendar,
  filteredRecentActivity,
  groupedSavedOrders,
  uniqueModes,
  uniqueCrops,
  uniqueTowers,
  uniqueOrderStatuses,
  uniqueCustomers,
  salesCustomer,
  salesNotes,
  salesPlanner,
  salesOrderType,
  salesFrequency,
  salesDeliveryDate,
  salesContractStartDate,
  salesContractEndDate,
  draftOrderLines,
  editingSalesOrderRowNumber,
  salesSaving,
  salesSaveMessage,
  savedOrderStatusFilter,
  savedOrderCropFilter,
  savedOrderCustomerFilter,
  savedOrderDueFilter,
  expandedSavedOrderGroups,
  filterMode,
  filterCrop,
  filterTower,
  setSalesCustomer,
  setSalesNotes,
  setSalesOrderType,
  setSalesFrequency,
  setSalesDeliveryDate,
  setSalesContractStartDate,
  setSalesContractEndDate,
  setSavedOrderStatusFilter,
  setSavedOrderCropFilter,
  setSavedOrderCustomerFilter,
  setSavedOrderDueFilter,
  setExpandedSavedOrderGroups,
  setFilterMode,
  setFilterCrop,
  setFilterTower,
  updateDraftOrderLine,
  addDraftOrderRow,
  cancelEditSalesOrder,
  handleSaveOrder,
  handleOrderStatusChange,
  startEditSalesOrder,
  handleCancelSalesOrder,
  removeDraftOrderLine,
}: DashboardProps) {
  return (
    <div style={sectionStackStyle}>
      <ResponsiveStatGrid>
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
        <Panel title="Executive Alerts">
          <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Alert</th>
                  <th style={thStyle}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {executiveAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={tdStyle}>No critical alerts right now.</td>
                  </tr>
                ) : (
                  executiveAlerts.map((alert, index) => (
                    <tr key={`${alert.title}-${index}`}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: alert.level === "High" ? "#ef4444" : "#eab308",
                            flexShrink: 0,
                          }} />
                          {alert.level}
                        </div>
                      </td>
                      <td style={tdStyle}>{alert.title}</td>
                      <td style={tdStyle}>{alert.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Sales Planner / Order Planner">
          <FormGrid columns={2}>
            <Field label="Customer">
              <input value={salesCustomer} onChange={(e) => setSalesCustomer(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Order Type">
              <select value={salesOrderType} onChange={(e) => setSalesOrderType(e.target.value as "One-Time" | "Contract")} style={inputStyle}>
                <option value="One-Time">One-Time</option>
                <option value="Contract">Contract</option>
              </select>
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

          <div style={{ marginBottom: 8 }}>
            <TableScroll>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Crop</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Approx Lbs</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {draftOrderLines.map((line) => (
                    <tr key={line.id}>
                      <td style={tdStyle}>
                        <select
                          value={line.crop}
                          onChange={(e) => updateDraftOrderLine(line.id, "crop", e.target.value)}
                          style={compactInputStyle}
                        >
                          <option value="">Select Crop</option>
                          {uniqueCrops.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={line.unitType}
                          onChange={(e) => updateDraftOrderLine(line.id, "unitType", e.target.value)}
                          style={compactInputStyle}
                        >
                          <option value="Lbs">Lbs</option>
                          <option value="Plants">Plants</option>
                          <option value="6oz Bag">6oz Bag</option>
                          <option value="6oz Clamshell">6oz Clamshell</option>
                          <option value="0.75oz Small Bag">0.75oz Small Bag</option>
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="0"
                          value={line.quantityNeeded}
                          onChange={(e) => updateDraftOrderLine(line.id, "quantityNeeded", e.target.value)}
                          style={{ ...compactInputStyle, width: 80 }}
                          placeholder="0"
                        />
                      </td>
                      <td style={tdStyle}>{quantityToLbs(line.unitType, toNumber(line.quantityNeeded))}</td>
                      <td style={tdStyle}>
                        {draftOrderLines.length > 1 && (
                          <button
                            onClick={() => removeDraftOrderLine(line.id)}
                            style={{ ...secondaryButtonStyle, padding: "4px 8px" }}
                            aria-label="Remove row"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            {!editingSalesOrderRowNumber && (
              <button onClick={addDraftOrderRow} style={{ ...secondaryButtonStyle, marginTop: 6 }}>
                + Add Row
              </button>
            )}
          </div>

          <Field label="Notes">
            <textarea value={salesNotes} onChange={(e) => setSalesNotes(e.target.value)} style={textareaStyle} />
          </Field>

          <MetricGrid>
            <MiniMetric label="Available Lbs" value={salesPlanner.availableQty} />
            <MiniMetric label="Shortage Lbs" value={salesPlanner.shortageQty} />
            <MiniMetric label="Total Order Lbs" value={salesPlanner.qtyNeededInLbs} />
            <MiniMetric label="Towers Needed" value={salesPlanner.towersNeeded} />
            <MiniMetric label="Pipeline Towers" value={salesPlanner.pipelineTowers} />
            <MiniMetric label="New Towers To Plant" value={salesPlanner.newTowersToPlant} />
            <MiniMetric
              label={salesOrderType === "Contract" ? "First Problem Delivery" : "Earliest Delivery Date"}
              value={salesPlanner.estimatedReadyDate ? formatDateDisplay(salesPlanner.estimatedReadyDate) : salesPlanner.deliveryFeasible ? "Can Fulfill" : "-"}
            />
            <MiniMetric label="Feasible" value={salesPlanner.deliveryFeasible ? "Yes" : salesPlanner.shortageQty > 0 ? "No" : "-"} />
          </MetricGrid>

          {editingSalesOrderRowNumber && (
            <div style={{ marginBottom: 14 }}>
              <button onClick={cancelEditSalesOrder} style={secondaryButtonStyle}>
                Cancel Edit
              </button>
            </div>
          )}

          <ActionRow message={salesSaveMessage}>
            <button onClick={handleSaveOrder} style={primaryButtonStyle} disabled={salesSaving}>
              {salesSaving ? "Saving..." : editingSalesOrderRowNumber ? "Update Order" : "Save Order"}
            </button>
          </ActionRow>
        </Panel>
      </ResponsiveTwoPanelGrid>

      <div style={sectionStackStyle}>
        <Panel title="Saved Orders">
          <FormGrid columns={4}>
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

            <Field label="Due Filter">
              <select value={savedOrderDueFilter} onChange={(e) => setSavedOrderDueFilter(e.target.value as "All" | "Current Week")} style={inputStyle}>
                <option value="All">All</option>
                <option value="Current Week">Current Week</option>
              </select>
            </Field>
          </FormGrid>

          <div style={{ maxHeight: 290, overflowY: "auto", overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Delivery</th>
                  <th style={thStyle}>Items</th>
                  <th style={thStyle}>New Towers</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedSavedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={tdStyle}>
                      No saved orders.
                    </td>
                  </tr>
                ) : (
                  groupedSavedOrders.flatMap((group) => {
                    const expanded = !!expandedSavedOrderGroups[group.key];
                    const summaryRow = (
                      <tr key={group.key}>
                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              setExpandedSavedOrderGroups((prev) => ({
                                ...prev,
                                [group.key]: !prev[group.key],
                              }))
                            }
                            style={{ ...secondaryButtonStyle, padding: "6px 10px", minWidth: 38 }}
                            aria-label={expanded ? `Collapse ${group.customer} order` : `Expand ${group.customer} order`}
                            aria-expanded={expanded}
                          >
                            {expanded ? "▾" : "▸"}
                          </button>
                        </td>
                        <td style={tdStyle}>{group.customer}</td>
                        <td style={tdStyle}>{formatDateDisplay(group.dueDate)}</td>
                        <td style={tdStyle}>{group.items.length}</td>
                        <td style={tdStyle}>{group.totalNewTowers}</td>
                        <td style={tdStyle}>{group.status}</td>
                      </tr>
                    );

                    if (!expanded) return [summaryRow];

                    const detailRows = group.items.map((order) => (
                      <tr key={`${group.key}-${order.rowNumber}`}>
                        <td style={tdStyle}></td>
                        <td style={{ ...tdStyle, paddingLeft: 24 }} colSpan={2}>
                          {getOrderCrop(order)} — {getOrderUnitType(order)} × {getOrderQuantityNeeded(order)}
                        </td>
                        <td style={tdStyle}>{getOrderType(order)}{getOrderFrequency(order) ? ` / ${getOrderFrequency(order)}` : ""}</td>
                        <td style={tdStyle}>{getOrderNewTowersToPlant(order)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <select
                              value={getOrderStatus(order) || "Planned"}
                              onChange={(e) => handleOrderStatusChange(order.rowNumber, e.target.value)}
                              style={compactInputStyle}
                              aria-label={`Order status for ${getOrderCrop(order)} - ${group.customer}`}
                            >
                              <option value="Planned">Planned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Harvested">Harvested</option>
                              <option value="Packed">Packed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button onClick={() => startEditSalesOrder(order)} style={primaryButtonStyle}>Edit</button>
                            <button onClick={() => handleCancelSalesOrder(order.rowNumber)} style={secondaryButtonStyle}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ));

                    return [summaryRow, ...detailRows];
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
            Orders marked Completed or Cancelled are removed from this section. Recurring orders stay visible for future dates until each occurrence is completed.
          </div>
        </Panel>
      </div>

      <ResponsiveTwoPanelGrid>
        <Panel title="Short Orders / Planting Pressure">
          <TableScroll>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Crop</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Shortage Qty</th>
                  <th style={thStyle}>New Towers</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shortageAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={tdStyle}>No shortage warnings right now.</td>
                  </tr>
                ) : (
                  shortageAlerts.slice(0, 10).map((item) => (
                    <tr key={item.rowNumber}>
                      <td style={tdStyle}>{item.customer}</td>
                      <td style={tdStyle}>{item.crop}</td>
                      <td style={tdStyle}>{formatDateDisplay(item.dueDate)}</td>
                      <td style={tdStyle}>{item.shortageQty}</td>
                      <td style={tdStyle}>{item.newTowers}</td>
                      <td style={tdStyle}>{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScroll>
        </Panel>

        <Panel title="Seeding Calendar">
          <TableScroll>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Seed Week</th>
                  <th style={thStyle}>Crop</th>
                  <th style={thStyle}>Towers</th>
                  <th style={thStyle}>Seed By</th>
                  <th style={thStyle}>Ready By</th>
                  <th style={thStyle}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {seedingCalendar.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={tdStyle}>No seeding needed yet.</td>
                  </tr>
                ) : (
                  seedingCalendar.flatMap(([weekOf, items]) =>
                    items.map((item, index) => (
                      <tr key={`${weekOf}-${item.crop}-${item.seedByDate}`}>
                        <td style={tdStyle}>{index === 0 ? formatDateDisplay(weekOf) : ""}</td>
                        <td style={tdStyle}>{item.crop}</td>
                        <td style={tdStyle}>{item.towers}</td>
                        <td style={tdStyle}>{formatDateDisplay(item.seedByDate)}</td>
                        <td style={tdStyle}>{formatDateDisplay(item.firstDueDate)}</td>
                        <td style={tdStyle}>{item.orders}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </TableScroll>
        </Panel>
      </ResponsiveTwoPanelGrid>

      <div style={sectionStackStyle}>
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

          <div style={{ maxHeight: 420, overflowY: "auto", overflowX: "auto" }}>
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
                  filteredRecentActivity.slice(0, 10).map((row) => (
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
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
            Showing 10 most recent entries.
          </div>
        </Panel>
      </div>
    </div>
  );
}
