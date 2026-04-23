import type { SalesOrderRow } from '../types';

export const getOrderCustomer = (row: SalesOrderRow): string => row.customer || row.Customer || "";

export const getOrderCrop = (row: SalesOrderRow): string => row.crop || row.Crop || "";

export const getOrderUnitType = (row: SalesOrderRow): string =>
  row.unitType || row["Unit Type"] || "Lbs";

export const getOrderQuantityNeeded = (row: SalesOrderRow): number | string =>
  row.quantityNeeded ?? row["Quantity Needed"] ?? 0;

export const getOrderRequestedDeliveryDate = (row: SalesOrderRow): string =>
  row.requestedDeliveryDate || row["Requested Delivery Date"] || "";

export const getOrderPipelineTowers = (row: SalesOrderRow): number | string =>
  row.pipelineTowers ?? row["Pipeline Towers"] ?? 0;

export const getOrderNewTowersToPlant = (row: SalesOrderRow): number | string =>
  row.newTowersToPlant ?? row["New Towers To Plant"] ?? 0;

export const getOrderEstimatedReadyDate = (row: SalesOrderRow): string =>
  row.estimatedReadyDate || row["Estimated Ready Date"] || "";

export const getOrderStatus = (row: SalesOrderRow): string => row.status || row.Status || "";

export const getOrderType = (row: SalesOrderRow): string =>
  row.orderType || row["Order Type"] || "One-Time";

export const getOrderFrequency = (row: SalesOrderRow): string =>
  row.frequency || row.Frequency || "";

export const getOrderContractStartDate = (row: SalesOrderRow): string =>
  row.contractStartDate || row["Contract Start Date"] || "";

export const getOrderContractEndDate = (row: SalesOrderRow): string =>
  row.contractEndDate || row["Contract End Date"] || "";
