import { HighScoreEntry } from "../game/types";

const LEADERBOARD_KEY = "dhaka_escape_leaderboard_v1";
const TOTAL_COINS_KEY = "dhaka_escape_total_coins_v1";
const SOUND_MUTED_KEY = "dhaka_escape_muted_v1";
const PLAYER_NAME_KEY = "dhaka_escape_player_name_v1";

const DEFAULT_LEADERBOARD: HighScoreEntry[] = [
  {
    id: "seed-1",
    name: "Nadia • Dhanmondi",
    score: 1650,
    coins: 48,
    distance: 410,
    zone: "Farmgate Rush",
    date: "Local Ace",
  },
  {
    id: "seed-2",
    name: "Tanvir • Mirpur",
    score: 1120,
    coins: 34,
    distance: 295,
    zone: "Shahbagh Crossing",
    date: "Street Pro",
  },
  {
    id: "seed-3",
    name: "Sadia • Uttara",
    score: 740,
    coins: 22,
    distance: 195,
    zone: "Shahbagh Crossing",
    date: "Sprinter",
  },
  {
    id: "seed-4",
    name: "Fahim • Banani",
    score: 420,
    coins: 14,
    distance: 120,
    zone: "Dhanmondi Morning",
    date: "Runner",
  },
  {
    id: "seed-5",
    name: "Ayman • Old Dhaka",
    score: 210,
    coins: 8,
    distance: 65,
    zone: "Dhanmondi Morning",
    date: "Rookie",
  },
];

export function loadLeaderboard(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
      return [...DEFAULT_LEADERBOARD];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 7);
    }
  } catch {
    // ignore storage errors
  }
  return [...DEFAULT_LEADERBOARD];
}

export function getBestScore(): number {
  const entries = loadLeaderboard();
  return entries.reduce((max, item) => Math.max(max, item.score), 0);
}

export function getPlayerBestScore(): number {
  const entries = loadLeaderboard();
  const playerEntries = entries.filter((e) => e.isPlayer);
  if (playerEntries.length === 0) return 0;
  return playerEntries.reduce((max, item) => Math.max(max, item.score), 0);
}

export function recordRunScore(entry: Omit<HighScoreEntry, "id" | "date">): {
  leaderboard: HighScoreEntry[];
  insertedId: string;
  rank: number | null;
} {
  const current = loadLeaderboard();
  const insertedId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nowLabel = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const newEntry: HighScoreEntry = {
    ...entry,
    id: insertedId,
    date: nowLabel,
    isPlayer: true,
  };

  const combined = [...current, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const rankIndex = combined.findIndex((item) => item.id === insertedId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(combined));
  } catch {
    // ignore storage errors
  }

  return { leaderboard: combined, insertedId, rank };
}

export function updateLeaderboardEntryName(id: string, newName: string): HighScoreEntry[] {
  const trimmed = newName.trim().slice(0, 18) || "Rahul";
  savePlayerName(trimmed);
  const current = loadLeaderboard().map((item) =>
    item.id === id ? { ...item, name: trimmed } : item
  );
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
  return current;
}

export function loadTotalCoins(): number {
  try {
    const val = Number(localStorage.getItem(TOTAL_COINS_KEY) || "0");
    return Number.isFinite(val) && val >= 0 ? val : 0;
  } catch {
    return 0;
  }
}

export function addTotalCoins(amount: number): number {
  const next = loadTotalCoins() + Math.max(0, Math.floor(amount));
  try {
    localStorage.setItem(TOTAL_COINS_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
}

export function loadSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(SOUND_MUTED_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || "Rahul";
  } catch {
    return "Rahul";
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim().slice(0, 18) || "Rahul");
  } catch {
    // ignore
  }
}
