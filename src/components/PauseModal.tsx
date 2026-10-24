import React from "react";
import { Play, RotateCcw, Home, Volume2, VolumeX } from "lucide-react";
import { HudSnapshot } from "../game/types";

interface PauseModalProps {
  hud: HudSnapshot;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  muted,
  onResume,
  onRestart,
  onToggleMute,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/85 bg-slate-900/95 p-6 text-center shadow-2xl">
        <div className="rickshaw-ribbon h-1.5 w-full rounded-full mb-4" />

        <h2 className="font-display text-3xl font-bold text-white">
          GAME PAUSED
        </h2>
        <p className="mt-1 text-xs font-semibold text-amber-300">
          {hud.zoneName} • {hud.distance}m
        </p>

        {/* Current Run Mini Summary */}
        <div className="my-4 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              SCORE
            </div>
            <div className="font-score text-xl font-extrabold text-white">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">
              TAKA COINS
            </div>
            <div className="font-score text-xl font-extrabold text-amber-300">
              ৳{hud.coins}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 font-display text-lg font-bold text-white shadow-lg transition active:scale-95 hover:brightness-110 cursor-pointer"
          >
            <Play className="h-5 w-5 fill-current" />
            RESUME RUN
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-400/60 bg-slate-800 py-3.5 font-display text-base font-bold text-amber-300 transition active:scale-95 hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" />
            INSTANT RESTART
          </button>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-800/80 py-3 text-xs font-bold text-slate-200 transition active:scale-95 hover:bg-slate-800 cursor-pointer"
            >
              {muted ? (
                <>
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  <span>MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                  <span>SOUND ON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onMainMenu}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-800/80 py-3 text-xs font-bold text-slate-200 transition active:scale-95 hover:bg-slate-800 cursor-pointer"
            >
              <Home className="h-4 w-4 text-amber-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
