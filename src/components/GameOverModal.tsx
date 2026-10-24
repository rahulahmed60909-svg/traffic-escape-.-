import React, { useState } from "react";
import { RotateCcw, Home, Trophy, Crown, Sparkles, Check } from "lucide-react";
import { HighScoreEntry, HudSnapshot } from "../game/types";

interface GameOverModalProps {
  hud: HudSnapshot;
  isNewRecord: boolean;
  rank: number | null;
  insertedId: string | null;
  playerName: string;
  leaderboard: HighScoreEntry[];
  onRenameEntry: (newName: string) => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  isNewRecord,
  rank,
  insertedId,
  playerName,
  leaderboard,
  onRenameEntry,
  onRestart,
  onMainMenu,
}) => {
  const [nameInput, setNameInput] = useState(playerName);
  const [savedTag, setSavedTag] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    onRenameEntry(nameInput);
    setSavedTag(true);
    setTimeout(() => setSavedTag(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="my-auto flex w-full max-w-md flex-col rounded-3xl border-2 border-amber-400/85 bg-slate-900/95 p-4 sm:p-5 shadow-2xl">
        <div className="rickshaw-ribbon h-1.5 w-full rounded-full mb-3" />

        {/* Header & Crash Reason */}
        <div className="text-center">
          {isNewRecord ? (
            <div className="mx-auto mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-3.5 py-1 text-xs font-extrabold text-slate-950 shadow">
              <Crown className="h-3.5 w-3.5" />
              NEW DHAKA RECORD!
            </div>
          ) : rank !== null && rank <= 5 ? (
            <div className="mx-auto mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              RANKED #{rank} ON LEADERBOARD!
            </div>
          ) : null}

          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            TRAFFIC JAMMED!
          </h2>
          {hud.crashReason && (
            <p className="mt-0.5 text-xs font-semibold text-rose-300">
              {hud.crashReason}
            </p>
          )}
        </div>

        {/* Big Score & Stats Grid */}
        <div className="mt-3 rounded-2xl border border-amber-400/35 bg-slate-950/80 p-3 text-center">
          <div className="text-[10px] font-bold tracking-widest text-amber-300/80 uppercase">
            FINAL SCORE
          </div>
          <div className="font-score text-4xl font-extrabold text-white">
            {hud.score.toLocaleString()}
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/10 pt-2.5">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                DISTANCE
              </div>
              <div className="font-score text-sm font-extrabold text-slate-100">
                {hud.distance}m
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                TAKA COINS
              </div>
              <div className="font-score text-sm font-extrabold text-amber-300">
                ৳{hud.coins}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                NEAR MISS
              </div>
              <div className="font-score text-sm font-extrabold text-emerald-300">
                {hud.nearMisses}
              </div>
            </div>
          </div>
        </div>

        {/* Optional Runner Name Tag Editor if on Leaderboard */}
        {rank !== null && rank <= 5 && (
          <form
            onSubmit={handleSaveName}
            className="mt-2.5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-3 py-1.5"
          >
            <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
              Runner Tag:
            </span>
            <input
              type="text"
              maxLength={18}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs font-bold text-amber-300 focus:outline-none"
              placeholder="Your Name"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 transition active:scale-95 cursor-pointer"
            >
              {savedTag ? <Check className="h-3.5 w-3.5" /> : "SAVE"}
            </button>
          </form>
        )}

        {/* Compact Local Top-5 High-Score Table */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold text-amber-300">
            <span className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              HIGH SCORES (LOCAL TOP 5)
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              SCORE
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-0.5">
            {leaderboard.slice(0, 5).map((entry, idx) => {
              const isCurrentRun = entry.id === insertedId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs ${
                    isCurrentRun
                      ? "border-amber-400 bg-amber-400/20 text-white"
                      : "border-white/10 bg-slate-800/60 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-score flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        idx === 0
                          ? "bg-amber-400 text-slate-950"
                          : idx === 1
                          ? "bg-slate-300 text-slate-950"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate font-bold">{entry.name}</span>
                    {isCurrentRun && (
                      <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-slate-950">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="font-score font-extrabold text-amber-300 ml-2">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instant Restart & Main Menu Actions */}
        <div className="mt-3.5 flex gap-2.5">
          <button
            type="button"
            onClick={onMainMenu}
            aria-label="Main Menu"
            className="flex h-13 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-slate-800 text-slate-200 transition active:scale-95 hover:bg-slate-700 cursor-pointer"
          >
            <Home className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="animate-cta-glow flex h-13 flex-1 items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 font-display text-lg font-extrabold text-white shadow-xl transition active:scale-95 hover:brightness-110 cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" />
            PLAY AGAIN!
          </button>
        </div>
      </div>
    </div>
  );
};
