import React from "react";
import { Pause, Volume2, VolumeX, Crown, Sparkles } from "lucide-react";
import { FloatingCallout, HudSnapshot } from "../game/types";

interface HUDProps {
  hud: HudSnapshot;
  callouts: FloatingCallout[];
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

const CALLOUT_COLORS: Record<FloatingCallout["color"], string> = {
  gold: "from-amber-400 to-yellow-300 text-slate-950 border-amber-200",
  emerald: "from-emerald-400 to-teal-300 text-slate-950 border-emerald-200",
  crimson: "from-rose-500 to-red-400 text-white border-rose-200",
  cyan: "from-sky-400 to-cyan-300 text-slate-950 border-sky-200",
};

export const HUD: React.FC<HUDProps> = ({
  hud,
  callouts,
  muted,
  onToggleMute,
  onPause,
}) => {
  const isBeatingRecord = hud.score > 0 && hud.score >= hud.highScore;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Score + Multiplier + Zone */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-400/70 bg-slate-950/80 px-3.5 py-2 shadow-xl backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-300/90 uppercase">
                <span>SCORE</span>
                {isBeatingRecord && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950">
                    <Crown className="h-2.5 w-2.5" /> BEST!
                  </span>
                )}
              </div>
              <div className="font-score text-2xl leading-none font-extrabold text-white sm:text-3xl">
                {hud.score.toLocaleString()}
              </div>
            </div>

            {hud.multiplier > 1 && (
              <div className="ml-1 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 px-2.5 py-1 text-xs font-extrabold text-slate-950 shadow">
                x{hud.multiplier}
              </div>
            )}
          </div>

          {/* Compact Zone & Distance Pill */}
          <div className="flex items-center gap-2 self-start rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="truncate max-w-[145px] sm:max-w-none">{hud.zoneName}</span>
            <span className="font-score text-amber-300">{hud.distance}m</span>
          </div>
        </div>

        {/* Top-Right: Taka Coins + Mute + Pause */}
        <div className="flex items-center gap-2">
          {/* Golden Taka Counter */}
          <div className="flex items-center gap-2 rounded-2xl border-2 border-amber-400/70 bg-slate-950/80 px-3 py-2 shadow-xl backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-sm font-black text-amber-950 shadow-inner">
              ৳
            </span>
            <span className="font-score text-lg font-extrabold text-amber-300 sm:text-xl">
              {hud.coins}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/80 text-white shadow-lg backdrop-blur-md transition active:scale-90 hover:border-amber-400/60"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-400/75 bg-slate-950/85 text-amber-300 shadow-lg backdrop-blur-md transition active:scale-90 hover:bg-slate-900"
          >
            <Pause className="h-5 w-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Center Active Powerups & Floating Callouts */}
      <div className="relative flex flex-col items-center">
        {/* Active Power-Up Pills */}
        {(hud.magnetTimeLeft > 0 || hud.chaiShieldActive) && (
          <div className="mb-2 flex flex-wrap justify-center gap-2">
            {hud.magnetTimeLeft > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-sky-300/60 bg-sky-950/85 px-3.5 py-1 text-xs font-extrabold text-sky-200 shadow-lg backdrop-blur-md">
                <span>🧲 MAGNET</span>
                <span className="font-score text-sky-300">{hud.magnetTimeLeft}s</span>
              </div>
            )}
            {hud.chaiShieldActive && (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-950/85 px-3.5 py-1 text-xs font-extrabold text-emerald-200 shadow-lg backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>☕ CHA SHIELD</span>
                <span className="font-score text-amber-300">{hud.chaiTimeLeft}s</span>
              </div>
            )}
          </div>
        )}

        {/* Juicy Floating Callouts */}
        <div className="relative h-16 w-full">
          {callouts.map((c) => (
            <div
              key={c.id}
              className={`animate-popup absolute left-1/2 top-0 flex flex-col items-center rounded-2xl border-2 bg-gradient-to-r px-4 py-1.5 text-center shadow-2xl ${CALLOUT_COLORS[c.color]}`}
            >
              <span className="font-display text-sm font-extrabold tracking-wide whitespace-nowrap sm:text-base">
                {c.text}
              </span>
              {c.subtext && (
                <span className="text-[10px] font-bold opacity-85 whitespace-nowrap">
                  {c.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subtle First-Seconds Control Hint that fades automatically */}
      <div className="flex justify-center">
        {hud.distance < 32 && (
          <div className="rounded-full border border-white/15 bg-slate-950/70 px-4 py-1.5 text-center text-xs font-semibold text-slate-200 shadow-lg backdrop-blur-md">
            <span className="hidden sm:inline">
              <strong>A / D</strong> or <strong>◀ ▶</strong> Lanes •{" "}
              <strong>W / ▲ / Space</strong> Jump • <strong>S / ▼</strong> Slide
            </span>
            <span className="sm:hidden">
              Swipe <strong>◀ ▶</strong> Lanes • <strong>▲</strong> Jump •{" "}
              <strong>▼</strong> Slide
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
