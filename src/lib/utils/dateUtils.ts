export const formatDateInput = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const formatDateDisplay = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

export const formatDateTimeDisplay = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export const addDays = (dateString: string, days: number): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const generateRecurringDates = (startDate: string, endDate: string, frequency: string): string[] => {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDateInput(current));

    if (frequency === "Weekly") {
      current.setDate(current.getDate() + 7);
    } else if (frequency === "Bi-Weekly") {
      current.setDate(current.getDate() + 14);
    } else if (frequency === "Monthly") {
      current.setMonth(current.getMonth() + 1);
    } else {
      break;
    }
  }

  return dates;
};

export const isDueTodayOrTomorrow = (dateString: string): boolean => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowOnly = new Date(todayOnly);
  tomorrowOnly.setDate(tomorrowOnly.getDate() + 1);

  const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return targetOnly.getTime() === todayOnly.getTime() || targetOnly.getTime() === tomorrowOnly.getTime();
};

export const isDueToday = (dateString: string): boolean => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
};

export const isOverdue = (dateString: string): boolean => {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return targetOnly.getTime() < todayOnly.getTime();
};
