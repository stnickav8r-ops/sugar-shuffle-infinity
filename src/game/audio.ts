let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicTimer: number | null = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);
    sfxBus.gain.value = 0.8;
    musicBus.gain.value = 0.35;
    master.gain.value = 0.9;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setSfxVolume(v: number) {
  if (sfxBus) sfxBus.gain.setTargetAtTime(v * v, ctx!.currentTime, 0.02);
}
export function setMusicVolume(v: number) {
  if (musicBus) musicBus.gain.setTargetAtTime(v * v, ctx!.currentTime, 0.05);
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) {
  if (!ctx || !sfxBus) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ctx.currentTime + dur);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(sfxBus);
  o.start();
  o.stop(ctx.currentTime + dur + 0.02);
}

export const sfx = {
  jump: () => beep(420, 0.12, "square", 0.08, 180),
  land: () => beep(140, 0.08, "triangle", 0.1, -40),
  attack: () => beep(220, 0.09, "sawtooth", 0.09, 320),
  hit: () => {
    beep(180, 0.14, "square", 0.12, -80);
    beep(90, 0.18, "triangle", 0.1, -30);
  },
  pickup: () => beep(660, 0.1, "square", 0.07, 400),
  combo: () => beep(880, 0.08, "square", 0.06, 200),
  hurt: () => beep(110, 0.22, "sawtooth", 0.14, -70),
  door: () => beep(300, 0.16, "triangle", 0.08, 80),
  pizza: () => {
    beep(520, 0.12, "square", 0.1, 0);
    setTimeout(() => beep(780, 0.16, "square", 0.1, 0), 90);
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, "square", 0.08), i * 90));
  },
  lose: () => beep(200, 0.4, "sawtooth", 0.12, -140),
  ui: () => beep(480, 0.06, "square", 0.05),
  boom: () => beep(70, 0.28, "triangle", 0.16, -20),
};

export function startMusic() {
  if (!ctx || !musicBus) return;
  stopMusic();
  const notes = [196, 247, 294, 330, 392, 330, 294, 247];
  let i = 0;
  const tick = () => {
    if (!ctx || !musicBus) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = notes[i % notes.length]!;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    o.connect(g);
    g.connect(musicBus);
    o.start();
    o.stop(ctx.currentTime + 0.3);
    i++;
    musicTimer = window.setTimeout(tick, 320);
  };
  tick();
}

export function stopMusic() {
  if (musicTimer != null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void ctx?.resume();
  });
}
