export type KnightTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Grandmaster";

export type CommandDeckPlayer = {
  name: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number;
  tier: KnightTier;
  rating: number;
};

export type QuestProgress = {
  id: string;
  label: string;
  current: number;
  target: number;
  rewardXp: number;
  complete: boolean;
};
