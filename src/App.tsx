import React, { useCallback, useEffect, useRef, useState } from "react";
import { DhakaRunnerEngine } from "./game/DhakaRunnerEngine";
import {
  FloatingCallout,
  GamePhase,
  HighScoreEntry,
  HudSnapshot,
} from "./game/types";
import { soundEngine } from "./game/sound";
import {
  addTotalCoins,
  getBestScore,
  loadLeaderboard,
  loadPlayerName,
  loadSoundMuted,
  loadTotalCoins,
  recordRunScore,
  saveSoundMuted,
  updateLeaderboardEntryName,
} from "./utils/storage";
import { HUD } from "./components/HUD";
import { StartMenu } from "./components/StartMenu";
import { PauseModal } from "./components/PauseModal";
import { GameOverModal } from "./components/GameOverModal";

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  highScore: 0,
  coins: 0,
  distance: 0,
  multiplier: 1,
  speedKmh: 48,
  zoneName: "Dhanmondi Morning",
  nearMisses: 0,
  magnetTimeLeft: 0,
  chaiShieldActive: false,
  chaiTimeLeft: 0,
};

export function App() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<DhakaRunnerEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    highScore: getBestScore(),
  }));
  const [callouts, setCallouts] = useState<FloatingCallout[]>([]);

  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>(() =>
    loadLeaderboard()
  );
  const [bestScore, setBestScore] = useState<number>(() => getBestScore());
  const [totalCoins, setTotalCoins] = useState<number>(() => loadTotalCoins());
  const [playerName, setPlayerName] = useState<string>(() => loadPlayerName());
  const [muted, setMuted] = useState<boolean>(() => {
    const initialMuted = loadSoundMuted();
    soundEngine.setMuted(initialMuted);
    return initialMuted;
  });

  // Game Over metadata
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [lastRunRank, setLastRunRank] = useState<number | null>(null);
  const [lastInsertedId, setLastInsertedId] = useState<string | null>(null);

  // Touch gesture tracking ref
  const touchStateRef = useRef<{
    active: boolean;
    anchorX: number;
    anchorY: number;
    lastDir: "left" | "right" | "jump" | "slide" | null;
    lastTriggerAt: number;
  }>({
    active: false,
    anchorX: 0,
    anchorY: 0,
    lastDir: null,
    lastTriggerAt: 0,
  });

  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  // Initialize 3D Engine once
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const currentBest = getBestScore();
    const engine = new DhakaRunnerEngine(container, currentBest, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onPhaseChange: (nextPhase, finalSnap) => {
        setPhase(nextPhase);
        setHud(finalSnap);

        if (nextPhase === "gameover") {
          const prevBest = getBestScore();
          const beatTop = finalSnap.score > prevBest && finalSnap.score > 0;
          setIsNewRecord(beatTop);

          const updatedBank = addTotalCoins(finalSnap.coins);
          setTotalCoins(updatedBank);

          if (finalSnap.score > 0) {
            const result = recordRunScore({
              name: playerNameRef.current,
              score: finalSnap.score,
              coins: finalSnap.coins,
              distance: finalSnap.distance,
              zone: finalSnap.zoneName,
              isPlayer: true,
            });
            setLeaderboard(result.leaderboard);
            setLastInsertedId(result.insertedId);
            setLastRunRank(result.rank);

            const nextBest = Math.max(prevBest, finalSnap.score);
            setBestScore(nextBest);
            engine.setHighScore(nextBest);
          } else {
            setLastInsertedId(null);
            setLastRunRank(null);
          }
        }
      },
      onCallout: (callout) => {
        setCallouts((prev) => [...prev.slice(-3), callout]);
        window.setTimeout(() => {
          setCallouts((prev) => prev.filter((item) => item.id !== callout.id));
        }, 950);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartOrRestart = useCallback(() => {
    setCallouts([]);
    engineRef.current?.startGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleMainMenu = useCallback(() => {
    setCallouts([]);
    engineRef.current?.returnToMenu();
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      saveSoundMuted(next);
      if (!next) {
        soundEngine.unlock();
        if (phase === "playing") {
          soundEngine.startStreetBeat();
        }
      }
      return next;
    });
  }, [phase]);

  const handleRenameEntry = useCallback(
    (newName: string) => {
      const clean = newName.trim().slice(0, 18) || "Rafi";
      setPlayerName(clean);
      if (lastInsertedId) {
        const updated = updateLeaderboardEntryName(lastInsertedId, clean);
        setLeaderboard(updated);
      }
    },
    [lastInsertedId]
  );

  // Desktop Keyboard Controls + Instant Space/Enter Start & Restart
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if typing in an input field
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.repeat) return;

      if (phase === "playing") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          engineRef.current?.handleInput("left");
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          engineRef.current?.handleInput("right");
        } else if (
          e.code === "ArrowUp" ||
          e.code === "KeyW" ||
          e.code === "Space"
        ) {
          e.preventDefault();
          engineRef.current?.handleInput("jump");
        } else if (e.code === "ArrowDown" || e.code === "KeyS") {
          e.preventDefault();
          engineRef.current?.handleInput("slide");
        } else if (e.code === "Escape" || e.code === "KeyP") {
          e.preventDefault();
          engineRef.current?.pauseGame();
        }
        return;
      }

      if (phase === "paused") {
        if (
          e.code === "Escape" ||
          e.code === "KeyP" ||
          e.code === "Space" ||
          e.code === "Enter"
        ) {
          e.preventDefault();
          engineRef.current?.resumeGame();
        }
        return;
      }

      if (phase === "menu" || phase === "gameover") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          handleStartOrRestart();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, handleStartOrRestart]);

  // Auto-pause if player switches tabs or locks screen on mobile
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && phase === "playing") {
        engineRef.current?.pauseGame();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [phase]);

  // Unified Low-Latency Swipe Gesture Helper (Touch + Pointer/Mouse Drag)
  const beginSwipe = (clientX: number, clientY: number) => {
    touchStateRef.current = {
      active: true,
      anchorX: clientX,
      anchorY: clientY,
      lastDir: null,
      lastTriggerAt: 0,
    };
  };

  const moveSwipe = (clientX: number, clientY: number) => {
    if (phase !== "playing" || !touchStateRef.current.active) return;

    const state = touchStateRef.current;
    const dx = clientX - state.anchorX;
    const dy = clientY - state.anchorY;
    const dist = Math.hypot(dx, dy);

    // 25px swipe threshold triggers instantaneously mid-gesture!
    if (dist < 25) return;

    const action: "left" | "right" | "jump" | "slide" =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
        ? "slide"
        : "jump";

    const now = performance.now();
    // Prevent accidental repeat along same stroke while allowing instant reversal (e.g., Jump -> Fast-Fall Slide!)
    if (action !== state.lastDir || now - state.lastTriggerAt > 280) {
      engineRef.current?.handleInput(action);
      state.lastDir = action;
      state.lastTriggerAt = now;
      state.anchorX = clientX;
      state.anchorY = clientY;
    }
  };

  const endSwipe = () => {
    touchStateRef.current.active = false;
    touchStateRef.current.lastDir = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (phase !== "playing" || e.touches.length === 0) return;
    if ((e.target as HTMLElement | null)?.closest("button")) return;
    beginSwipe(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || phase !== "playing") return;
    if ((e.target as HTMLElement | null)?.closest("button")) return;
    beginSwipe(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    moveSwipe(e.clientX, e.clientY);
  };

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-slate-950 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={endSwipe}
      onTouchCancel={endSwipe}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
    >
      {/* Full-Viewport 3D Dhaka Street Canvas */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* Subtle Warm Vignette for Arcade Readability */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(9,13,26,0.46)_100%)]" />

      {/* UI Overlays per Game Phase */}
      {phase === "menu" && (
        <StartMenu
          bestScore={bestScore}
          totalCoins={totalCoins}
          leaderboard={leaderboard}
          muted={muted}
          onToggleMute={handleToggleMute}
          onStart={handleStartOrRestart}
        />
      )}

      {phase === "playing" && (
        <HUD
          hud={hud}
          callouts={callouts}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {phase === "paused" && (
        <PauseModal
          hud={hud}
          muted={muted}
          onResume={handleResume}
          onRestart={handleStartOrRestart}
          onToggleMute={handleToggleMute}
          onMainMenu={handleMainMenu}
        />
      )}

      {phase === "gameover" && (
        <GameOverModal
          hud={hud}
          isNewRecord={isNewRecord}
          rank={lastRunRank}
          insertedId={lastInsertedId}
          playerName={playerName}
          leaderboard={leaderboard}
          onRenameEntry={handleRenameEntry}
          onRestart={handleStartOrRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </main>
  );
}

export default App;
