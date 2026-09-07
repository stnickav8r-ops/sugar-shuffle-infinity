import { ssi } from "./runtime";

export type GameEvent =
  | {
      t: "hud";
      score: number;
      combo: number;
      lives: number;
      hp: number;
      maxHp: number;
      candy: number;
      timer: number;
      pizza: boolean;
      rank: string;
      label: string;
      meter: number;
    }
  | { t: "toast"; text: string }
  | { t: "pause" }
  | { t: "resume" }
  | { t: "rank"; levelId: string; rank: string; score: number }
  | { t: "over" }
  | { t: "win"; ending: string }
  | { t: "hub" }
  | { t: "interact"; kind: string; id: string }
  | { t: "ready" };

type Fn = (e: GameEvent) => void;

function listeners() {
  return ssi().bus as Set<Fn>;
}

export function onGame(fn: Fn) {
  const set = listeners();
  set.add(fn);
  return () => set.delete(fn);
}

export function emitGame(e: GameEvent) {
  listeners().forEach((fn) => fn(e));
}
