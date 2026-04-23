export const makeId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const MAX_TRIMS = 5;
export const TRIM_REGROWTH_DAYS = 14;

export const SIX_OZ_IN_LBS = 6 / 16;
export const SMALL_BAG_OZ_IN_LBS = 0.75 / 16;
export const REPEAT_HARVEST_CROPS = new Set(["brassica"]);

export const CROP_PROFILES: Record<string, { expectedLbsPerTower: number }> = {
  arugula: { expectedLbsPerTower: 1.76 },
  basil: { expectedLbsPerTower: 3.52 },
  thai_basil: { expectedLbsPerTower: 3.52 },
  butterhead: { expectedLbsPerTower: 3.52 },
  brassica: { expectedLbsPerTower: 3.52 },
  cilantro: { expectedLbsPerTower: 6.4 },
  dill: { expectedLbsPerTower: 3.52 },
  fennel: { expectedLbsPerTower: 3.52 },
  five_star: { expectedLbsPerTower: 5.5 },
  green_mizuna: { expectedLbsPerTower: 3.52 },
  red_mizuna: { expectedLbsPerTower: 3.52 },
  kale: { expectedLbsPerTower: 3.52 },
  lettuce_mix: { expectedLbsPerTower: 3.52 },
  mint: { expectedLbsPerTower: 3.52 },
  muir: { expectedLbsPerTower: 5.6 },
  oakleaf: { expectedLbsPerTower: 3.52 },
  parsley: { expectedLbsPerTower: 3.52 },
  romaine: { expectedLbsPerTower: 3.52 },
  swiss_chard: { expectedLbsPerTower: 3.52 },
  mizuna: { expectedLbsPerTower: 3.52 },
  wildfire: { expectedLbsPerTower: 5.5 },
};

export const normalizeCropKey = (crop: string = ""): string =>
  crop
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/\s+/g, "_");

export const cropAliases: Record<string, string> = {
  thaibasil: "thai_basil",
  thai_basil: "thai_basil",
  greenmizuna: "green_mizuna",
  green_mizuna: "green_mizuna",
  redmizuna: "red_mizuna",
  red_mizuna: "red_mizuna",
  lettucemix: "lettuce_mix",
  lettuce_mix: "lettuce_mix",
  fivestar: "five_star",
  five_star: "five_star",
  swisschard: "swiss_chard",
  swiss_chard: "swiss_chard",
};

export const getCropProfile = (crop: string): { expectedLbsPerTower: number } => {
  const normalized = normalizeCropKey(crop);
  const aliasKey = cropAliases[normalized] || normalized;
  return CROP_PROFILES[aliasKey] || { expectedLbsPerTower: 3.52 };
};

export const formatCropLabel = (crop: string): string => {
  const normalized = normalizeCropKey(crop);
  const aliasKey = cropAliases[normalized] || normalized;
  return aliasKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getExpectedLbs = (crop: string): number => {
  const profile = getCropProfile(crop);
  return profile ? profile.expectedLbsPerTower : 0;
};

export const calculateExpectedLbs = (crop: string, activePods: number, towerType = "Low Density"): number => {
  const profile = getCropProfile(crop);
  const fullTowerPods = towerType === "High Density" ? 160 : 44;
  return Math.round(((activePods / fullTowerPods) * profile.expectedLbsPerTower) * 100) / 100;
};

export const isRepeatHarvestCrop = (crop: string): boolean => REPEAT_HARVEST_CROPS.has(normalizeCropKey(crop));

export const isContainerUnit = (unitType: string): boolean =>
  unitType === "6oz Bag" || unitType === "6oz Clamshell" || unitType === "0.75oz Small Bag";

export const quantityToLbs = (unitType: string, quantity: number): number => {
  if (unitType === "Plants") return 0;
  if (unitType === "0.75oz Small Bag") return Math.round(quantity * SMALL_BAG_OZ_IN_LBS * 100) / 100;
  if (isContainerUnit(unitType)) return Math.round(quantity * SIX_OZ_IN_LBS * 100) / 100;
  return Math.round(quantity * 100) / 100;
};

export const availableLbsToUnitQty = (unitType: string, lbs: number, plants: number): number => {
  if (unitType === "Plants") return Math.max(0, Math.floor(plants));
  if (unitType === "0.75oz Small Bag") return Math.max(0, Math.floor(lbs / SMALL_BAG_OZ_IN_LBS));
  if (isContainerUnit(unitType)) return Math.max(0, Math.floor(lbs / SIX_OZ_IN_LBS));
  return Math.max(0, Math.round(lbs * 100) / 100);
};

export const getUnitLabel = (unitType: string): string => {
  if (unitType === "Plants") return "Plants";
  if (unitType === "0.75oz Small Bag") return "Small Bags";
  if (unitType === "6oz Bag") return "Bags";
  if (unitType === "6oz Clamshell") return "Clamshells";
  return "Lbs";
};
