export type GamePhase = "menu" | "playing" | "paused" | "gameover";

export type LaneIndex = -1 | 0 | 1;

export type ObstacleKind =
  | "bus"
  | "cng"
  | "rickshaw"
  | "car"
  | "barrier_low"
  | "barrier_high";

export type CollectibleKind = "coin" | "magnet" | "chai";

export interface FloatingCallout {
  id: number;
  text: string;
  subtext?: string;
  color: "gold" | "emerald" | "crimson" | "cyan";
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  coins: number;
  distance: number;
  multiplier: number;
  speedKmh: number;
  zoneName: string;
  nearMisses: number;
  magnetTimeLeft: number; // seconds, 0 if inactive
  chaiShieldActive: boolean;
  chaiTimeLeft: number; // seconds, 0 if inactive
  crashReason?: string;
}

export interface HighScoreEntry {
  id: string;
  name: string;
  score: number;
  coins: number;
  distance: number;
  zone: string;
  date: string;
  isPlayer?: boolean;
}
