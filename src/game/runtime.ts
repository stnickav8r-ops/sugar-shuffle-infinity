export const HMR_EVENT = "ssi-hmr";

export type SsiSlot = {
  game: {
    destroy: (removeCanvas: boolean) => void;
    canvas?: HTMLCanvasElement;
    scene: { getScene: (k: string) => unknown };
  } | null;
  bus: Set<(e: unknown) => void>;
  held: Set<string>;
  injected: Set<string>;
  inputAbort: AbortController | null;
  prevJump: boolean;
  prevAttack: boolean;
  prevUp: boolean;
  prevPause: boolean;
  prevSpecial: boolean;
};

function emptySlot(): SsiSlot {
  return {
    game: null,
    bus: new Set(),
    held: new Set(),
    injected: new Set(),
    inputAbort: null,
    prevJump: false,
    prevAttack: false,
    prevUp: false,
    prevPause: false,
    prevSpecial: false,
  };
}

const ssrSlot = emptySlot();

export function ssi(): SsiSlot {
  if (typeof window === "undefined") {
    return ssrSlot;
  }
  const w = window as Window & { __ssi?: SsiSlot };
  if (!w.__ssi) {
    w.__ssi = emptySlot();
  }
  return w.__ssi;
}

export function notifyGameHmr() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HMR_EVENT));
}
