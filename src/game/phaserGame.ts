import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "./config";
import { PlayScene } from "./scenes/PlayScene";
import { notifyGameHmr, ssi } from "./runtime";

let SceneClass: typeof PlayScene = PlayScene;

export function mountGame(parent: HTMLElement) {
  destroyGame();
  parent.querySelectorAll("canvas").forEach((c) => c.remove());

  const instance = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: "#140c0a",
    pixelArt: false,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_W,
      height: GAME_H,
    },
    scene: [SceneClass],
    input: { activePointers: 4 },
    banner: false,
  });

  ssi().game = instance as unknown as ReturnType<typeof ssi>["game"];

  const mutePointers = () => {
    parent.querySelectorAll("canvas").forEach((c) => {
      (c as HTMLCanvasElement).style.pointerEvents = "none";
    });
  };
  instance.events.once("ready", mutePointers);
  window.setTimeout(mutePointers, 0);
  return instance;
}

export function destroyGame() {
  if (typeof window === "undefined") return;
  const st = ssi();
  const g = st.game;
  st.game = null;
  if (!g) return;
  try {
    g.destroy(true);
  } catch {
    /* already tearing down */
  }
}

export function getPlay(): PlayScene | undefined {
  if (typeof window === "undefined") return undefined;
  const g = ssi().game;
  if (!g) return undefined;
  try {
    return g.scene.getScene("play") as PlayScene | undefined;
  } catch {
    return undefined;
  }
}

if (import.meta.hot) {
  import.meta.hot.accept("./scenes/PlayScene", (mod) => {
    if (mod?.PlayScene) SceneClass = mod.PlayScene;
    destroyGame();
    notifyGameHmr();
  });
  import.meta.hot.accept(() => {
    notifyGameHmr();
  });
  import.meta.hot.dispose(() => {
    destroyGame();
  });
}
