import type { StaffActionRow } from '../types';

export const getStaffMode = (row: StaffActionRow): string => row.mode || row.Mode || "";

export const getStaffTower = (row: StaffActionRow): string => row.tower || row.Tower || "";

export const getStaffCrop = (row: StaffActionRow): string => row.crop || row.Crop || "";

export const getStaffLbs = (row: StaffActionRow): number | string =>
  row.lbs ?? row.Lbs ?? row.LBS ?? "";

export const getStaffPodsChanged = (row: StaffActionRow): number | string =>
  row.podsChanged ?? row["Pods Changed"] ?? 0;

export const getStaffNote = (row: StaffActionRow): string => row.note || row.Note || "";

export const getStaffTimestamp = (row: StaffActionRow): string =>
  row.timestamp || row.Timestamp || "";

export const getStaffDate = (row: StaffActionRow): string => row.date || row.Date || "";
