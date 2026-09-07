import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Gamepad2,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { onGame } from "@/game/bus";
import { unlockAudio, startMusic, stopMusic, sfx, setSfxVolume, setMusicVolume } from "@/game/audio";
import { COMBOS, ENDINGS, HEROES, LORE, MINIGAMES, PROMO_CODES, type HeroId, type Rank } from "@/game/data/world";
import { resetSave } from "@/game/save";
import { HMR_EVENT } from "@/game/runtime";
import { useGame, type Screen } from "@/store/game-store";
import { TouchPad } from "./touch-pad";

function unlock() {
  unlockAudio();
  startMusic();
  sfx.ui();
}

export function GameApp() {
  const { screen, setScreen, save, persist, setHud, lastRank, toast, setToast } = useGame();
  const host = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);
  const [ready, setReady] = useState(false);
  const [bootKey, setBootKey] = useState(0);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");

  const goTitle = () => {
    stopMusic();
    setBooted(false);
    setReady(false);
    void import("@/game/phaserGame").then((m) => m.destroyGame());
    setScreen("title");
  };

  useEffect(() => {
    const off = onGame((e) => {
      if (e.t === "hud") {
        setHud({
          score: e.score,
          combo: e.combo,
          lives: e.lives,
          hp: e.hp,
          maxHp: e.maxHp,
          candy: e.candy,
          timer: e.timer,
          pizza: e.pizza,
          rank: e.rank,
          label: e.label,
          meter: e.meter,
        });
      } else if (e.t === "pause") setScreen("pause");
      else if (e.t === "rank") {
        useGame.setState({ lastRank: { levelId: e.levelId, rank: e.rank as Rank, score: e.score } });
        setScreen("rank");
      } else if (e.t === "over") setScreen("over");
      else if (e.t === "win") {
        useGame.setState({ ending: e.ending });
        setScreen("ending");
      } else if (e.t === "interact") setScreen("gallery");
      else if (e.t === "toast") setToast(e.text);
      else if (e.t === "ready") setReady(true);
    });
    return () => {
      off();
    };
  }, [setHud, setScreen, setToast]);

  useEffect(() => {
    if (!booted || !host.current) return;
    let alive = true;
    let destroy: (() => void) | undefined;
    void import("@/game/phaserGame").then((m) => {
      if (!alive || !host.current) return;
      m.destroyGame();
      m.mountGame(host.current);
      destroy = () => m.destroyGame();
    });
    return () => {
      alive = false;
      destroy?.();
    };
  }, [booted, bootKey]);

  useEffect(() => {
    const s = useGame.getState().screen;
    if (s === "playing" || s === "pause" || s === "rank" || s === "over") {
      setReady(false);
      setBooted(true);
      setBootKey((k) => k + 1);
    }
  }, []);

  useEffect(() => {
    const onHmr = () => {
      const s = useGame.getState().screen;
      if (s === "playing" || s === "pause" || s === "rank" || s === "over" || booted) {
        setReady(false);
        setBooted(true);
        setBootKey((k) => k + 1);
      }
    };
    window.addEventListener(HMR_EVENT, onHmr);
    return () => window.removeEventListener(HMR_EVENT, onHmr);
  }, [booted]);

  useEffect(() => {
    setSfxVolume(save.settings.sfx);
    setMusicVolume(save.settings.music);
  }, [save.settings.sfx, save.settings.music]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);

  const playAs = (hero: HeroId) => {
    unlock();
    useGame.getState().pickHero(hero);
    setReady(false);
    setBooted(true);
    setBootKey((k) => k + 1);
    setScreen("playing");
  };

  const resume = () => {
    void import("@/game/phaserGame").then((m) => {
      const play = m.getPlay();
      if (play) play.unfreeze();
      else {
        setReady(false);
        setBooted(true);
        setBootKey((k) => k + 1);
      }
    });
    setScreen("playing");
  };

  const toHub = () => {
    void import("@/game/phaserGame").then((m) => {
      const play = m.getPlay();
      if (play) play.goHub();
      else {
        setReady(false);
        setBooted(true);
        setBootKey((k) => k + 1);
      }
    });
    setScreen("playing");
  };

  const overlay = screen !== "playing" && screen !== "title" && screen !== "select";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink text-cream">
      <div
        ref={host}
        id="game-root"
        className={`pointer-events-none absolute inset-0 z-0 ${booted ? "opacity-100" : "opacity-0"}`}
        style={{ touchAction: "none" }}
      />

      {screen === "playing" && (
        <>
          {!ready && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-ink">
              <p className="font-display text-3xl">Loading the pumpkin...</p>
              <Btn onClick={goTitle}>Title</Btn>
            </div>
          )}
          <HudBar />
          <TouchPad />
          <button
            type="button"
            className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 bg-ink/70"
            onClick={() => {
              sfx.ui();
              void import("@/game/phaserGame").then((m) => m.getPlay()?.freeze());
              setScreen("pause");
            }}
            aria-label="Pause"
          >
            <Pause className="size-5" />
          </button>
        </>
      )}

      {screen === "title" && (
        <Title
          onPlay={() => {
            unlock();
            setBooted(false);
            setReady(false);
            void import("@/game/phaserGame").then((m) => m.destroyGame());
            setScreen("select");
          }}
          go={setScreen}
        />
      )}
      {screen === "select" && <Select onPick={playAs} onBack={goTitle} />}
      {screen === "pause" && (
        <Modal title="Paused">
          <Btn onClick={resume}>Resume</Btn>
          <Btn onClick={toHub} tone="ghost">Floor hub</Btn>
          <Btn onClick={() => setScreen("how")} tone="ghost">Controls</Btn>
          <Btn onClick={goTitle} tone="ghost">
            Title
          </Btn>
        </Modal>
      )}
      {screen === "rank" && lastRank && (
        <Modal title={lastRank.levelId}>
          <p className="font-display text-7xl text-candy">{lastRank.rank}</p>
          <p className="text-cream-dim">Score {lastRank.score.toLocaleString()}</p>
          <Btn onClick={toHub}>Back to hub</Btn>
        </Modal>
      )}
      {screen === "over" && (
        <Modal title="Game over">
          <p className="text-cream-dim">The candy cubes crumple. Try the hub again.</p>
          <Btn onClick={toHub}>Retry hub</Btn>
          <Btn onClick={goTitle} tone="ghost">Title</Btn>
        </Modal>
      )}
      {screen === "ending" && <Ending go={setScreen} />}
      {screen === "how" && <How go={setScreen} />}
      {screen === "lore" && <Lore go={setScreen} />}
      {screen === "gallery" && <Gallery go={setScreen} />}
      {screen === "minigames" && <Minis go={setScreen} />}
      {screen === "codes" && (
        <Codes
          go={setScreen}
          value={code}
          setValue={setCode}
          msg={codeMsg}
          onSubmit={() => {
            const hit = PROMO_CODES.find((p) => p.code === code.trim().toUpperCase());
            if (!hit) {
              setCodeMsg("Unknown code.");
              sfx.hurt();
              return;
            }
            if (!save.promo.includes(hit.reward)) persist({ promo: [...save.promo, hit.reward] });
            setCodeMsg(`Unlocked — ${hit.label}`);
            sfx.win();
          }}
        />
      )}
      {screen === "endings" && <Endings go={setScreen} />}

      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-cream/15 bg-ink/80 px-4 py-2 text-sm font-bold">
          {toast}
        </div>
      )}

      {overlay && screen !== "pause" && screen !== "rank" && screen !== "over" && screen !== "ending" && (
        <button
          type="button"
          className="absolute left-3 top-3 z-40 rounded-full border border-cream/15 bg-ink/70 px-3 py-2 text-xs font-bold uppercase tracking-wide"
          onClick={() => setScreen(booted ? "pause" : "title")}
        >
          Back
        </button>
      )}
    </div>
  );
}

function HudBar() {
  const { hud, save } = useGame();
  const hero = HEROES[save.hero];
  const face = hud.hp <= 0 ? "over" : hud.hp / Math.max(1, hud.maxHp) < 0.4 ? "low" : "high";
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pt-[max(10px,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 rounded-[18px] border border-cream/12 bg-ink/70 px-3 py-2">
        <div className="h-11 w-11 overflow-hidden rounded-xl">
          <img
            src={hero.portrait}
            alt=""
            className={
              "h-11 w-11 object-cover " +
              (face === "low" ? "brightness-75 saturate-50" : face === "over" ? "grayscale" : "")
            }
          />
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-tight">{hud.label || "Sugar Shuffle"}</p>
          <p className="text-xs text-cream-dim">
            Score {hud.score.toLocaleString()}
            {hud.combo > 1 ? `  ·  x${hud.combo}` : ""}
          </p>
          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-ink">
            <div className="h-full bg-candy" style={{ width: `${Math.max(0, Math.min(100, hud.meter))}%` }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hud.pizza && (
          <div className="rounded-[18px] border border-candy/40 bg-candy/20 px-3 py-2 font-display text-xl tabular-nums text-candy">
            {formatTime(hud.timer)}
          </div>
        )}
        <div className="rounded-[18px] border border-cream/12 bg-ink/70 px-3 py-2 text-right">
          <p className="font-display text-2xl leading-none text-cream">{hud.rank}</p>
          <p className="text-xs text-cream-dim">
            {hud.hp}/{hud.maxHp} hp · {hud.lives} lives · {hud.candy} bux
          </p>
        </div>
      </div>
    </div>
  );
}

function Title({ onPlay, go }: { onPlay: () => void; go: (s: Screen) => void }) {
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-cover bg-center px-5"
      style={{ backgroundImage: "linear-gradient(#140c0acc,#140c0ae6), url('/game/bg/candy-corn-valley.jpg')" }}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-candy">Inside the giant pumpkin</p>
      <h1 className="mt-2 text-center font-display text-5xl leading-[0.9] tracking-tight sm:text-7xl">
        Sugar Shuffle
        <span className="block text-candy">Infinity</span>
      </h1>
      <div className="mt-4 flex items-end gap-6">
        <img src={HEROES.cuboe.portrait} alt="" className="h-16 w-16 object-contain" />
        <img src={HEROES.cubro.portrait} alt="" className="h-16 w-16 object-contain" />
      </div>
      <p className="mt-4 max-w-md text-center text-sm text-cream-dim">
        Cuboe and Cubro sprint through five candy floors to save Halloween from the Candy Warlock.
      </p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-2">
        <Btn onClick={onPlay}>
          <Play className="size-4" /> Play
        </Btn>
        <div className="grid grid-cols-2 gap-2">
          <Btn tone="ghost" onClick={() => { sfx.ui(); go("how"); }}>
            <Keyboard className="size-4" /> Controls
          </Btn>
          <Btn tone="ghost" onClick={() => { sfx.ui(); go("minigames"); }}>
            <Gamepad2 className="size-4" /> Minis
          </Btn>
          <Btn tone="ghost" onClick={() => { sfx.ui(); go("lore"); }}>
            <BookOpen className="size-4" /> Lore
          </Btn>
          <Btn tone="ghost" onClick={() => { sfx.ui(); go("codes"); }}>
            <Sparkles className="size-4" /> Codes
          </Btn>
        </div>
        <Btn tone="ghost" onClick={() => { sfx.ui(); go("endings"); }}>
          <Trophy className="size-4" /> Endings
        </Btn>
      </div>
      <SettingsRow />
    </div>
  );
}

function Select({ onPick, onBack }: { onPick: (h: HeroId) => void; onBack: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink px-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-candy">Choose a cube</p>
      <h2 className="mt-1 font-display text-4xl">Who walks in?</h2>
      <div className="mt-8 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {(Object.keys(HEROES) as HeroId[]).map((id) => {
          const h = HEROES[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="rounded-[28px] border border-cream/12 bg-surface p-5 text-left transition hover:border-candy/50"
            >
              <img src={h.portrait} alt="" className="mx-auto h-28 w-28 object-contain" />
              <p className="mt-3 font-display text-3xl">{h.name}</p>
              <p className="text-xs font-extrabold uppercase tracking-widest text-candy">
                {h.tag} · {h.lives} lives
              </p>
              <p className="mt-2 text-sm text-cream-dim">{h.blurb}</p>
            </button>
          );
        })}
      </div>
      <button type="button" className="mt-6 text-sm text-cream-dim" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function How({ go }: { go: (s: Screen) => void }) {
  return (
    <Modal title="Controls">
      <ul className="space-y-1 text-left text-sm text-cream-dim">
        <li>A / D or arrows — move</li>
        <li>Space / K — jump (coyote + buffer). Down + jump drops through</li>
        <li>J — attack · Q / C — special (Cuboe shield, Cubro barrier)</li>
        <li>Up + J — Cuboe beams / Cubro burst · Up + Q — black hole / infinity</li>
        <li>Shift — mach run · Up / W — enter doors</li>
        <li>Esc — pause</li>
      </ul>
      <p className="text-left text-sm text-cream-dim">
        Grab the end door to start Sugar Time, then race back to the start. Pay 400 candy bux after four rooms to open the boss gate.
      </p>
      <Btn onClick={() => go("title")}>Close</Btn>
    </Modal>
  );
}

function Lore({ go }: { go: (s: Screen) => void }) {
  const { save } = useGame();
  return (
    <Sheet title="Secret collectibles">
      <ul className="space-y-3">
        {LORE.map((l) => {
          const have = save.lore.includes(l.id);
          return (
            <li key={l.id} className="rounded-2xl border border-cream/10 bg-surface p-3">
              <p className="font-display text-lg">{have ? l.name : "Sealed lore"}</p>
              <p className="text-sm text-cream-dim">{l.how}</p>
            </li>
          );
        })}
      </ul>
      <h3 className="mt-6 font-display text-xl">Combos</h3>
      <ComboList />
      <Btn onClick={() => go("title")}>Close</Btn>
    </Sheet>
  );
}

function ComboList() {
  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
      {(Object.keys(COMBOS) as HeroId[]).map((id) => (
        <div key={id} className="rounded-2xl border border-cream/10 bg-surface p-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-candy">{HEROES[id].name}</p>
          <ul className="mt-2 space-y-1 text-sm text-cream-dim">
            {COMBOS[id].map((c) => (
              <li key={c.id}>
                <span className="text-cream">{c.name}</span> — {c.input}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Gallery({ go }: { go: (s: Screen) => void }) {
  return (
    <Sheet title="Pumpkin station">
      <p className="text-sm text-cream-dim">The hub PC. Press Up on the station in a floor hub to return here anytime.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Btn onClick={() => go("lore")}>Lore gallery</Btn>
        <Btn onClick={() => go("codes")} tone="ghost">Promo codes</Btn>
        <Btn onClick={() => go("minigames")} tone="ghost">Minigames</Btn>
        <Btn onClick={() => go("endings")} tone="ghost">Endings</Btn>
      </div>
    </Sheet>
  );
}

function Codes({
  go,
  value,
  setValue,
  msg,
  onSubmit,
}: {
  go: (s: Screen) => void;
  value: string;
  setValue: (v: string) => void;
  msg: string;
  onSubmit: () => void;
}) {
  const { save } = useGame();
  return (
    <Sheet title="Promo code station">
      <p className="text-sm text-cream-dim">Type a code from the storyboards, then enter.</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="SYIOX"
          className="h-12 flex-1 rounded-2xl border border-cream/15 bg-ink px-3 uppercase tracking-widest outline-none"
        />
        <Btn>Enter</Btn>
      </form>
      {msg && <p className="mt-2 text-sm text-mint">{msg}</p>}
      <ul className="mt-4 space-y-1 text-sm text-cream-dim">
        {PROMO_CODES.map((p) => (
          <li key={p.code}>{save.promo.includes(p.reward) ? p.label : "••••"}</li>
        ))}
      </ul>
      <Btn tone="ghost" onClick={() => go("title")}>
        Close
      </Btn>
    </Sheet>
  );
}

function Endings({ go }: { go: (s: Screen) => void }) {
  const { save } = useGame();
  return (
    <Sheet title="Endings">
      <ul className="space-y-3">
        {ENDINGS.map((e) => (
          <li key={e.id} className="rounded-2xl border border-cream/10 bg-surface p-3">
            <p className="font-display text-lg">{save.endings.includes(e.id) ? e.name : "???"}</p>
            <p className="text-sm text-cream-dim">{e.how}</p>
          </li>
        ))}
      </ul>
      <Btn onClick={() => go("title")}>Close</Btn>
    </Sheet>
  );
}

function Ending({ go }: { go: (s: Screen) => void }) {
  const ending = useGame((s) => s.ending);
  const meta = ENDINGS.find((e) => e.id === ending);
  return (
    <Modal title={meta?.name ?? "Ending"}>
      <p className="text-cream-dim">{meta?.how}</p>
      <Btn onClick={() => go("title")}>Title</Btn>
    </Modal>
  );
}

function Minis({ go }: { go: (s: Screen) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const { save } = useGame();
  const ranked = (id: string) => {
    const r = save.minigames[id];
    return r === "P" || r === "A" || r === "S";
  };
  const puppetOpen = ranked("match") && ranked("wreck") && ranked("bomb") && ranked("fit");
  if (active === "match") return <Match onDone={() => setActive(null)} />;
  if (active === "wreck") return <Wreck onDone={() => setActive(null)} />;
  if (active === "bomb") return <Bomb onDone={() => setActive(null)} />;
  if (active === "fit") return <Fit onDone={() => setActive(null)} />;
  if (active === "glitch") return <Glitch onDone={() => setActive(null)} />;
  return (
    <Sheet title="Mini game console">
      <p className="text-sm text-cream-dim">Get A or P on every mini to wake the Glitch Puppet.</p>
      <div className="mt-4 grid gap-2">
        {MINIGAMES.map((m) => {
          const locked = m.id === "glitch" && !puppetOpen;
          return (
            <button
              key={m.id}
              type="button"
              disabled={locked}
              className="rounded-2xl border border-cream/12 bg-surface px-4 py-3 text-left disabled:opacity-40"
              onClick={() => setActive(m.id)}
            >
              <p className="font-display text-xl">{m.name}</p>
              <p className="text-sm text-cream-dim">{locked ? "Locked — rank the other four first." : m.blurb}</p>
              {save.minigames[m.id] && <p className="text-xs font-extrabold text-candy">{save.minigames[m.id]} rank</p>}
            </button>
          );
        })}
      </div>
      <Btn tone="ghost" onClick={() => go("title")}>
        Close
      </Btn>
    </Sheet>
  );
}

function Match({ onDone }: { onDone: () => void }) {
  const faces = ["c", "l", "g", "p", "c", "l", "g", "p"];
  const [deck, setDeck] = useState(() => shuffle(faces.map((f, i) => ({ id: i, f, on: false, gone: false }))));
  const [pick, setPick] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const t0 = useRef(performance.now());
  const labels: Record<string, string> = { c: "Corn", l: "Lolly", g: "Ghost", p: "Pump" };

  useEffect(() => {
    if (pick.length !== 2) return;
    const [a, b] = pick;
    const A = deck[a!];
    const B = deck[b!];
    const t = window.setTimeout(() => {
      setDeck((d) =>
        d.map((c, i) => {
          if (i === a || i === b) {
            if (A && B && A.f === B.f) return { ...c, gone: true, on: false };
            return { ...c, on: false };
          }
          return c;
        }),
      );
      setPick([]);
    }, 480);
    return () => window.clearTimeout(t);
  }, [pick, deck]);

  useEffect(() => {
    if (deck.length && deck.every((c) => c.gone)) {
      const sec = (performance.now() - t0.current) / 1000;
      const rank = sec <= 20 ? "P" : sec <= 30 ? "A" : "C";
      const save = useGame.getState().save;
      useGame.getState().persist({ minigames: { ...save.minigames, match: rank } });
    }
  }, [deck]);

  return (
    <Sheet title="Match and Hang">
      <div className="grid grid-cols-4 gap-2">
        {deck.map((c, i) => (
          <button
            key={c.id}
            type="button"
            disabled={c.gone || c.on || pick.length === 2}
            className="flex h-16 items-center justify-center rounded-2xl border border-cream/15 bg-surface font-display text-sm disabled:opacity-30"
            onClick={() => {
              if (pick.includes(i)) return;
              setMoves((m) => m + 1);
              setDeck((d) => d.map((x, j) => (j === i ? { ...x, on: true } : x)));
              setPick((p) => [...p, i]);
              sfx.ui();
            }}
          >
            {c.on || c.gone ? labels[c.f] : "?"}
          </button>
        ))}
      </div>
      <p className="text-sm text-cream-dim">Moves {moves}</p>
      <Btn onClick={onDone}>Close</Btn>
    </Sheet>
  );
}

function Wreck({ onDone }: { onDone: () => void }) {
  const [hp, setHp] = useState(12);
  useEffect(() => {
    if (hp !== 0) return;
    const save = useGame.getState().save;
    useGame.getState().persist({ minigames: { ...save.minigames, wreck: "P" } });
  }, [hp]);
  return (
    <Sheet title="Wrecking Wednesday">
      <p className="text-sm text-cream-dim">Mash Attack to flatten the licorice tower.</p>
      <button
        type="button"
        className="mx-auto mt-4 flex h-40 w-24 flex-col-reverse overflow-hidden rounded-md border border-cream/20"
        onClick={() => {
          sfx.hit();
          setHp((h) => Math.max(0, h - 1));
        }}
      >
        {Array.from({ length: hp }).map((_, i) => (
          <span key={i} className="block h-3 w-full bg-candy/80 even:bg-choc" />
        ))}
      </button>
      <p className="font-display text-2xl">{hp === 0 ? "P rank" : `${hp} floors left`}</p>
      {hp === 0 && <p className="text-sm text-cream-dim">Tower down.</p>}
      <Btn onClick={onDone}>Close</Btn>
    </Sheet>
  );
}

function Bomb({ onDone }: { onDone: () => void }) {
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState(20);
  useEffect(() => {
    const id = window.setInterval(() => setPos((p) => (p + 8) % 100), 80);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Sheet title="Bomb for All">
      <p className="text-sm text-cream-dim">Toss when the pip is over the target.</p>
      <div className="relative mt-4 h-3 rounded-full bg-surface-2">
        <span className="absolute top-1/2 h-6 w-10 -translate-y-1/2 rounded-full bg-candy/30" style={{ left: "42%" }} />
        <span className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-cream" style={{ left: `${pos}%` }} />
      </div>
      <Btn
        onClick={() => {
          if (pos > 40 && pos < 58) {
            sfx.boom();
            setHits((h) => {
              const n = h + 1;
              if (n >= 5) {
                const save = useGame.getState().save;
                useGame.getState().persist({ minigames: { ...save.minigames, bomb: "P" } });
              }
              return n;
            });
          } else sfx.hurt();
        }}
      >
        Toss
      </Btn>
      <p className="text-sm text-cream-dim">{hits} hits</p>
      <Btn tone="ghost" onClick={onDone}>
        Close
      </Btn>
    </Sheet>
  );
}

function Fit({ onDone }: { onDone: () => void }) {
  const [ok, setOk] = useState(false);
  const [held, setHeld] = useState(0);
  useEffect(() => {
    if (!ok) return;
    const id = window.setInterval(() => setHeld((h) => h + 1), 200);
    return () => window.clearInterval(id);
  }, [ok]);
  useEffect(() => {
    if (held < 8) return;
    const save = useGame.getState().save;
    useGame.getState().persist({ minigames: { ...save.minigames, fit: "P" } });
  }, [held]);
  return (
    <Sheet title="Mr. Game and Fit">
      <p className="text-sm text-cream-dim">Hold a pose. Match the silhouette — arms up.</p>
      <button
        type="button"
        className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-full border border-cream/20 bg-surface font-display text-2xl"
        onPointerDown={() => setOk(true)}
        onPointerUp={() => setOk(false)}
      >
        {ok ? "FIT" : "POSE"}
      </button>
      <p className="text-sm text-cream-dim">{held >= 8 ? "P rank" : "Hold to fit"}</p>
      <Btn onClick={onDone}>Close</Btn>
    </Sheet>
  );
}

function Glitch({ onDone }: { onDone: () => void }) {
  const [hp, setHp] = useState(6);
  const [armed, setArmed] = useState(false);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!armed) return;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const s = 10 - (performance.now() - t0) / 1000;
      setLeft(Math.max(0, s));
      if (s <= 0) setArmed(false);
    }, 80);
    return () => window.clearInterval(id);
  }, [armed]);
  useEffect(() => {
    if (hp > 0) return;
    const save = useGame.getState().save;
    useGame.getState().persist({ minigames: { ...save.minigames, glitch: "P" } });
  }, [hp]);
  return (
    <Sheet title="Glitch Puppet">
      <p className="text-sm text-cream-dim">Land a fist on the spiky rocks, then strike within 10 seconds.</p>
      <div className="mt-4 flex items-end justify-center gap-6">
        <button
          type="button"
          className="h-20 w-24 rounded-2xl border border-cream/20 bg-surface font-display"
          onClick={() => {
            sfx.hit();
            setArmed(true);
            setLeft(10);
          }}
        >
          Rocks
        </button>
        <button
          type="button"
          className="flex h-40 w-28 flex-col items-center justify-center rounded-[28px] border border-candy/40 bg-ink font-display text-xl"
          onClick={() => {
            if (!armed || hp <= 0) {
              sfx.hurt();
              return;
            }
            sfx.boom();
            setHp((h) => Math.max(0, h - 1));
          }}
        >
          <span className="text-candy">{hp === 0 ? "KO" : "PUPPET"}</span>
          <span className="text-sm text-cream-dim">{hp} hp</span>
        </button>
      </div>
      <p className="text-sm text-cream-dim">{armed ? `${left.toFixed(1)}s to strike` : "Arm on the rocks first."}</p>
      {hp === 0 && <p className="font-display text-2xl text-candy">P rank</p>}
      <Btn onClick={onDone}>Close</Btn>
    </Sheet>
  );
}

function SettingsRow() {
  const { save, persist } = useGame();
  return (
    <div className="mt-6 flex items-center gap-3 text-cream-dim">
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15"
        onClick={() => persist({ settings: { ...save.settings, music: save.settings.music > 0 ? 0 : 0.45 } })}
        aria-label="Toggle music"
      >
        {save.settings.music > 0 ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </button>
      <button
        type="button"
        className="flex h-11 items-center gap-1 rounded-full border border-cream/15 px-3 text-xs font-bold uppercase"
        onClick={() => {
          persist(resetSave());
          sfx.ui();
        }}
      >
        <RotateCcw className="size-3.5" /> Reset save
      </button>
    </div>
  );
}

function Modal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-[32px] border border-cream/12 bg-surface p-6 text-center">
        <h2 className="font-display text-3xl">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-ink px-4 py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
        <h2 className="font-display text-4xl">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  tone = "solid",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "solid" | "ghost";
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      className={
        "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 font-extrabold " +
        (tone === "solid" ? "bg-cream text-ink" : "border border-cream/15 bg-transparent text-cream")
      }
    >
      {children}
    </button>
  );
}

function formatTime(t: number) {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  const cs = Math.floor((s * 100) % 100);
  return `${m}:${r.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
