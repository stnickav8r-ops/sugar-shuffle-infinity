import { SAVE_KEY, SAVE_VERSION } from "./config";
import type { HeroId, Rank } from "./data/world";

export interface SaveData {
  version: number;
  hero: HeroId;
  floor: number;
  unlockedFloors: number[];
  completed: string[];
  bosses: string[];
  ranks: Record<string, Rank>;
  candyBux: number;
  highScore: number;
  lore: string[];
  endings: string[];
  promo: string[];
  combos: { cuboe: string[]; cubro: string[] };
  pits: number;
  saiyanKills: number;
  minigames: Record<string, Rank>;
  settings: { sfx: number; music: number; shake: boolean };
}

const DEFAULTS: SaveData = {
  version: SAVE_VERSION,
  hero: "cuboe",
  floor: 1,
  unlockedFloors: [1],
  completed: [],
  bosses: [],
  ranks: {},
  candyBux: 0,
  highScore: 0,
  lore: [],
  endings: [],
  promo: [],
  combos: { cuboe: [], cubro: [] },
  pits: 0,
  saiyanKills: 0,
  minigames: {},
  settings: { sfx: 0.8, music: 0.45, shake: true },
};

function migrate(raw: SaveData): SaveData {
  return { ...DEFAULTS, ...raw, version: SAVE_VERSION, settings: { ...DEFAULTS.settings, ...raw.settings } };
}

export function loadSave(): SaveData {
  try {
    const txt = localStorage.getItem(SAVE_KEY);
    if (!txt) return structuredClone(DEFAULTS);
    return migrate(JSON.parse(txt) as SaveData);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    /* private mode */
  }
}

export function resetSave(): SaveData {
  const next = structuredClone(DEFAULTS);
  writeSave(next);
  return next;
}
