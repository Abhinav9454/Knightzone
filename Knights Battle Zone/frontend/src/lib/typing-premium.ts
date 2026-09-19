export type PremiumPlan = "FREE" | "PRO" | "ELITE";

export type PremiumFeatureKey =
  | "unlimited_custom_texts"
  | "advanced_heatmaps"
  | "no_ads"
  | "custom_themes"
  | "streak_freezes"
  | "early_access_modes";

export type BattlePassTrack = "FREE" | "PAID";

export type CosmeticType = "AVATAR" | "NAME_STYLE" | "EMOTE" | "PARTICLE";

export interface PremiumFeature {
  key: PremiumFeatureKey;
  title: string;
  description: string;
  freeIncluded: boolean;
}

export interface BattlePassTierReward {
  id: string;
  tier: number;
  track: BattlePassTrack;
  title: string;
  cosmeticType: CosmeticType;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

export interface BattlePassSeason {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  xpPerTier: number;
  totalTiers: number;
}

export interface CosmeticItem {
  id: string;
  type: CosmeticType;
  name: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  owned: boolean;
  equipped: boolean;
  premiumOnly: boolean;
}

export interface TypingPremiumState {
  plan: PremiumPlan;
  streakFreezes: number;
  battlePassPaid: boolean;
  seasonXp: number;
  unlockedRewardIds: string[];
  cosmetics: CosmeticItem[];
}

export const TYPING_PREMIUM_STORAGE_KEY = "typing-premium-state-v1";

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    key: "unlimited_custom_texts",
    title: "Unlimited custom texts",
    description: "Create and store unlimited practice passages.",
    freeIncluded: false,
  },
  {
    key: "advanced_heatmaps",
    title: "Advanced analytics heatmaps",
    description: "Visual keyboard key heatmaps with weak-zone insight.",
    freeIncluded: false,
  },
  {
    key: "no_ads",
    title: "No ads",
    description: "Removes sponsored training cards and promo bars.",
    freeIncluded: false,
  },
  {
    key: "custom_themes",
    title: "Custom themes",
    description: "Unlock additional highlight palettes and arena skins.",
    freeIncluded: false,
  },
  {
    key: "streak_freezes",
    title: "Streak freezes",
    description: "Protect streak when a daily session is missed.",
    freeIncluded: false,
  },
  {
    key: "early_access_modes",
    title: "Early access to new modes",
    description: "Try upcoming practice modes before public release.",
    freeIncluded: false,
  },
];

export const ACTIVE_SEASON: BattlePassSeason = {
  id: "season-01",
  name: "Neon Sprint Season",
  startsAt: "2026-03-01T00:00:00.000Z",
  endsAt: "2026-05-31T23:59:59.000Z",
  xpPerTier: 220,
  totalTiers: 10,
};

export const BATTLE_PASS_REWARDS: BattlePassTierReward[] = [
  { id: "free-t1", tier: 1, track: "FREE", title: "Starter Emote Pack", cosmeticType: "EMOTE", rarity: "COMMON" },
  { id: "paid-t1", tier: 1, track: "PAID", title: "Pulse Avatar Frame", cosmeticType: "AVATAR", rarity: "RARE" },
  { id: "free-t2", tier: 2, track: "FREE", title: "Blue Name Accent", cosmeticType: "NAME_STYLE", rarity: "COMMON" },
  { id: "paid-t2", tier: 2, track: "PAID", title: "Neon Comet Particles", cosmeticType: "PARTICLE", rarity: "RARE" },
  { id: "free-t3", tier: 3, track: "FREE", title: "Victory Clap Emote", cosmeticType: "EMOTE", rarity: "COMMON" },
  { id: "paid-t3", tier: 3, track: "PAID", title: "Aurora Badge", cosmeticType: "NAME_STYLE", rarity: "EPIC" },
  { id: "free-t4", tier: 4, track: "FREE", title: "Silver Nameplate", cosmeticType: "NAME_STYLE", rarity: "RARE" },
  { id: "paid-t4", tier: 4, track: "PAID", title: "Reactive Typing Trail", cosmeticType: "PARTICLE", rarity: "EPIC" },
  { id: "free-t5", tier: 5, track: "FREE", title: "Focus Avatar", cosmeticType: "AVATAR", rarity: "RARE" },
  { id: "paid-t5", tier: 5, track: "PAID", title: "Prismatic Name Glow", cosmeticType: "NAME_STYLE", rarity: "EPIC" },
  { id: "free-t6", tier: 6, track: "FREE", title: "Cheer Emote", cosmeticType: "EMOTE", rarity: "RARE" },
  { id: "paid-t6", tier: 6, track: "PAID", title: "Meteor Win Effect", cosmeticType: "PARTICLE", rarity: "EPIC" },
  { id: "free-t7", tier: 7, track: "FREE", title: "Classic Champion Avatar", cosmeticType: "AVATAR", rarity: "RARE" },
  { id: "paid-t7", tier: 7, track: "PAID", title: "Quantum Avatar Frame", cosmeticType: "AVATAR", rarity: "LEGENDARY" },
  { id: "free-t8", tier: 8, track: "FREE", title: "Signature Emote", cosmeticType: "EMOTE", rarity: "EPIC" },
  { id: "paid-t8", tier: 8, track: "PAID", title: "Legend Name Aura", cosmeticType: "NAME_STYLE", rarity: "LEGENDARY" },
  { id: "free-t9", tier: 9, track: "FREE", title: "Victory Spark", cosmeticType: "PARTICLE", rarity: "EPIC" },
  { id: "paid-t9", tier: 9, track: "PAID", title: "Animated Crown Avatar", cosmeticType: "AVATAR", rarity: "LEGENDARY" },
  { id: "free-t10", tier: 10, track: "FREE", title: "Season Finisher Badge", cosmeticType: "NAME_STYLE", rarity: "LEGENDARY" },
  { id: "paid-t10", tier: 10, track: "PAID", title: "Mythic Galaxy Particles", cosmeticType: "PARTICLE", rarity: "LEGENDARY" },
];

const defaultCosmetics = (): CosmeticItem[] => [
  { id: "cos-avatar-classic", type: "AVATAR", name: "Classic Coder", rarity: "COMMON", owned: true, equipped: true, premiumOnly: false },
  { id: "cos-name-default", type: "NAME_STYLE", name: "Default Name", rarity: "COMMON", owned: true, equipped: true, premiumOnly: false },
  { id: "cos-emote-wave", type: "EMOTE", name: "Wave", rarity: "COMMON", owned: true, equipped: false, premiumOnly: false },
  { id: "cos-particle-comet", type: "PARTICLE", name: "Comet Trail", rarity: "EPIC", owned: false, equipped: false, premiumOnly: true },
  { id: "cos-avatar-neon", type: "AVATAR", name: "Neon Hero", rarity: "RARE", owned: false, equipped: false, premiumOnly: true },
  { id: "cos-name-rainbow", type: "NAME_STYLE", name: "Rainbow Tag", rarity: "EPIC", owned: false, equipped: false, premiumOnly: true },
  { id: "cos-emote-hype", type: "EMOTE", name: "Hype Emote", rarity: "RARE", owned: false, equipped: false, premiumOnly: true },
];

export const createDefaultTypingPremiumState = (): TypingPremiumState => ({
  plan: "FREE",
  streakFreezes: 0,
  battlePassPaid: false,
  seasonXp: 0,
  unlockedRewardIds: [],
  cosmetics: defaultCosmetics(),
});

export const getTierByXp = (xp: number, season: BattlePassSeason = ACTIVE_SEASON) =>
  Math.min(season.totalTiers, Math.max(1, Math.floor(xp / season.xpPerTier) + 1));

export const getTierProgress = (xp: number, season: BattlePassSeason = ACTIVE_SEASON) => {
  const currentTier = getTierByXp(xp, season);
  const intoTier = xp % season.xpPerTier;
  const percent = Math.round((intoTier / season.xpPerTier) * 100);
  return { currentTier, intoTier, percent };
};

export const grantBattlePassRewardsForXp = (
  state: TypingPremiumState,
  nextXp: number,
  season: BattlePassSeason = ACTIVE_SEASON,
) => {
  const previousTier = getTierByXp(state.seasonXp, season);
  const nextTier = getTierByXp(nextXp, season);
  if (nextTier <= previousTier) return state;

  const unlockedRewardIds = new Set(state.unlockedRewardIds);
  const unlockedCosmeticNames = new Set<string>();

  for (let tier = previousTier + 1; tier <= nextTier; tier += 1) {
    const freeReward = BATTLE_PASS_REWARDS.find((reward) => reward.tier === tier && reward.track === "FREE");
    if (freeReward) {
      unlockedRewardIds.add(freeReward.id);
      unlockedCosmeticNames.add(freeReward.title);
    }
    if (state.battlePassPaid) {
      const paidReward = BATTLE_PASS_REWARDS.find((reward) => reward.tier === tier && reward.track === "PAID");
      if (paidReward) {
        unlockedRewardIds.add(paidReward.id);
        unlockedCosmeticNames.add(paidReward.title);
      }
    }
  }

  const cosmetics = state.cosmetics.map((item) => ({
    ...item,
    owned: item.owned || unlockedCosmeticNames.has(item.name),
  }));

  return {
    ...state,
    seasonXp: nextXp,
    unlockedRewardIds: Array.from(unlockedRewardIds),
    cosmetics,
  };
};

export const canUseFeature = (state: TypingPremiumState, feature: PremiumFeatureKey) => {
  if (state.plan === "FREE") return PREMIUM_FEATURES.find((entry) => entry.key === feature)?.freeIncluded ?? false;
  return true;
};

export const loadTypingPremiumState = (): TypingPremiumState => {
  if (typeof window === "undefined") return createDefaultTypingPremiumState();
  try {
    const raw = window.localStorage.getItem(TYPING_PREMIUM_STORAGE_KEY);
    if (!raw) return createDefaultTypingPremiumState();
    const parsed = JSON.parse(raw) as Partial<TypingPremiumState>;
    const safe = createDefaultTypingPremiumState();
    return {
      ...safe,
      ...parsed,
      cosmetics: Array.isArray(parsed.cosmetics) && parsed.cosmetics.length ? parsed.cosmetics : safe.cosmetics,
      unlockedRewardIds: Array.isArray(parsed.unlockedRewardIds) ? parsed.unlockedRewardIds : safe.unlockedRewardIds,
      plan:
        parsed.plan === "PRO" || parsed.plan === "ELITE" || parsed.plan === "FREE"
          ? parsed.plan
          : safe.plan,
    };
  } catch {
    return createDefaultTypingPremiumState();
  }
};

export const saveTypingPremiumState = (state: TypingPremiumState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TYPING_PREMIUM_STORAGE_KEY, JSON.stringify(state));
};
