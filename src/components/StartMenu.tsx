import React, { useState } from "react";
import {
  Play,
  Trophy,
  Volume2,
  VolumeX,
  Smartphone,
  Keyboard,
  X,
  Medal,
} from "lucide-react";
import { HighScoreEntry } from "../game/types";

interface StartMenuProps {
  bestScore: number;
  totalCoins: number;
  leaderboard: HighScoreEntry[];
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  bestScore,
  totalCoins,
  leaderboard,
  muted,
  onToggleMute,
  onStart,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
      {/* Top Bar: Stats & Sound/Leaderboard Toggles */}
      <div className="flex items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border-2 border-amber-400/70 bg-slate-950/85 px-3.5 py-2 shadow-xl backdrop-blur-md">
          <Trophy className="h-5 w-5 text-amber-400" />
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              HIGH SCORE
            </div>
            <div className="font-score text-lg leading-tight font-extrabold text-white">
              {bestScore.toLocaleString()}
            </div>
          </div>
          <div className="mx-1 h-7 w-px bg-white/15" />
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-950">
              ৳
            </span>
            <span className="font-score text-base font-extrabold text-amber-300">
              {totalCoins.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="flex h-12 items-center gap-2 rounded-2xl border-2 border-amber-400/70 bg-slate-950/85 px-3.5 text-xs font-extrabold text-amber-300 shadow-lg backdrop-blur-md transition active:scale-95 hover:bg-slate-900"
          >
            <Medal className="h-4 w-4" />
            <span className="hidden sm:inline">TOP RUNNERS</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/85 text-white shadow-lg backdrop-blur-md transition active:scale-95 hover:border-amber-400/60"
          >
            {muted ? (
              <VolumeX className="h-5 w-5 text-rose-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Title Emblem Floating Above the Live 3D Runner */}
      <div className="my-auto flex flex-col items-center text-center pt-2 pb-16 sm:pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-emerald-950/90 px-4 py-1 text-xs font-extrabold tracking-wide text-amber-300 shadow-lg backdrop-blur-md mb-2.5">
          <span>🇧🇩 ঢাকার রাস্তায় দৌড়!</span>
          <span>•</span>
          <span>3D STREET RUNNER</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_6px_0_rgba(15,23,42,0.95)]">
          <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            DHAKA TRAFFIC
          </span>
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-white to-rose-400 bg-clip-text text-transparent">
            ESCAPE
          </span>
        </h1>
      </div>

      {/* Bottom Launch Panel */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-3xl border-2 border-amber-400/80 bg-slate-950/88 p-4 shadow-2xl backdrop-blur-md">
        <div className="rickshaw-ribbon h-1.5 w-full rounded-full" />

        <button
          type="button"
          onClick={onStart}
          className="animate-cta-glow flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 py-4 text-xl font-extrabold tracking-wide text-white shadow-xl transition transform active:scale-95 hover:brightness-110 cursor-pointer"
        >
          <Play className="h-6 w-6 fill-current" />
          <span className="font-display">TAP TO RUN!</span>
        </button>

        {/* Concise Dual Control Legend */}
        <div className="grid w-full grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
            <Smartphone className="h-4 w-4 shrink-0 text-amber-400" />
            <div className="leading-tight">
              <div className="font-bold text-white">Mobile Touch</div>
              <div className="text-slate-300">Swipe ◀ ▶ ▲ ▼</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
            <Keyboard className="h-4 w-4 shrink-0 text-emerald-400" />
            <div className="leading-tight">
              <div className="font-bold text-white">Desktop PC</div>
              <div className="text-slate-300">WASD / Arrows</div>
            </div>
          </div>
        </div>
      </div>

      {/* Local High-Score Leaderboard Modal */}
      {showLeaderboard && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-2 border-amber-400 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-400" />
                <h2 className="font-display text-xl font-bold text-white">
                  Dhaka Street Leaderboard
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaderboard(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rickshaw-ribbon h-1.5 w-full rounded-full mb-4" />

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {leaderboard.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 ${
                    entry.isPlayer
                      ? "border-amber-400/80 bg-amber-500/15"
                      : "border-white/10 bg-slate-800/75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-score flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                        idx === 0
                          ? "bg-amber-400 text-slate-950"
                          : idx === 1
                          ? "bg-slate-300 text-slate-950"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {entry.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {entry.zone} • {entry.distance}m • ৳{entry.coins}
                      </div>
                    </div>
                  </div>
                  <div className="font-score text-base font-extrabold text-amber-300">
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowLeaderboard(false);
                onStart();
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-display text-base font-bold text-white shadow-lg active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              BEAT THE RECORD!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
