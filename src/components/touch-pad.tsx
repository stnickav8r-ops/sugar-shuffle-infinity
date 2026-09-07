import type { PointerEvent } from "react";
import { setTouch } from "@/game/input";

function PadBtn({
  code,
  label,
  className,
}: {
  code: string;
  label: string;
  className?: string;
}) {
  const press = (e: PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setTouch(code, true);
  };
  const release = (e: PointerEvent) => {
    e.preventDefault();
    setTouch(code, false);
  };
  return (
    <button
      type="button"
      className={
        "select-none rounded-[18px] border border-cream/15 bg-ink/70 text-cream shadow-[0_8px_0_#00000055] " +
        "text-sm font-extrabold uppercase tracking-wide active:translate-y-0.5 active:shadow-none " +
        (className ?? "h-14 w-14")
      }
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {label}
    </button>
  );
}

export function TouchPad() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:p-4">
      <div className="pointer-events-auto flex gap-2">
        <PadBtn code="ArrowLeft" label="A" />
        <PadBtn code="ArrowRight" label="D" />
        <PadBtn code="ArrowUp" label="Up" />
      </div>
      <div className="pointer-events-auto flex gap-2">
        <PadBtn code="ShiftLeft" label="Run" className="h-14 w-[4.2rem]" />
        <PadBtn code="KeyJ" label="Hit" className="h-14 w-[4.2rem] bg-candy/80" />
        <PadBtn code="Space" label="Jump" className="h-16 w-16 bg-cream text-ink" />
      </div>
    </div>
  );
}
