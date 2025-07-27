export interface ReputationEvent {
  id: string;
  playerId: string;
  timestamp: Date;
  oldReputation: number;
  newReputation: number;
  change: number;
  reason: 'match_result' | 'manual_adjustment' | 'initial_setup';
  matchId?: string;
  details?: string;
}

export interface Player {
  id: string;
  name: string;
  initialVaultedPrincipal: number;
  currentVaultedPrincipal: number;
  reputation: number;
  faction: 'Shadow Syndicate' | 'Free Agents' | 'Lumina Collective';
  totalMatches: number;
  score: number;
  vaultRewards: number;
  trustPercentage: number; // Strategy: % chance to trust
  tokenRewards: Record<string, number>; // Map of tokenType to amount
  createdAt: Date;
  // New: Reputation history tracking
  reputationHistory: ReputationEvent[];
}

export interface Match {
  id: string;
  round: number;
  playerA: Player;
  playerB: Player | null; // null if matched with Arbiter
  actionA: 'trust' | 'betray';
  actionB: 'trust' | 'betray';
  result: 'trust-trust' | 'betray-trust' | 'trust-betray' | 'betray-betray';
  scoreChangeA: number;
  scoreChangeB: number;
  reputationChangeA: number;
  reputationChangeB: number;
  vaultRewardsShareA: number;
  vaultRewardsShareB: number;
  totalVaultRewardsGenerated: number;
  timestamp: Date;
}

export interface PayoutMatrix {
  trustTrust: {
    scoreA: number;
    scoreB: number;
    vaultRewardsShareA: number;
    vaultRewardsShareB: number;
  };
  betrayTrust: {
    scoreA: number;
    scoreB: number;
    vaultRewardsShareA: number;
    vaultRewardsShareB: number;
  };
  trustBetray: {
    scoreA: number;
    scoreB: number;
    vaultRewardsShareA: number;
    vaultRewardsShareB: number;
  };
  betrayBetray: {
    scoreA: number;
    scoreB: number;
    vaultRewardsShareA: number;
    vaultRewardsShareB: number;
    burnPercentage: number;
  };
}

export type SimulationMode = 'rounds' | 'days' | 'weeks' | 'months';

export type ProtocolFeeType = 'yield_spread' | 'flat_fee' | 'incentive_tax';

export interface ProtocolRevenue {
  id: string;
  matchId: string;
  timestamp: Date;
  feeType: ProtocolFeeType;
  feeRate: number;
  baseYield: number;
  protocolFee: number;
  playerYield: number;
  buybackAmount: number;
  burnAmount: number;
  netRevenue: number;
}

export interface ProtocolConfig {
  enabled: boolean;
  feeType: ProtocolFeeType;
  feeRate: number; // 0-1 decimal
  buybackAllocation: number; // 0-1 decimal
  burnRate: number; // 0-1 decimal
}

export interface SimulationConfig {
  globalAPY: number; // Annual Percentage Yield
  matchDurationMinutes: number;
  matchesPerDay: number;
  monthlyIncentivePool: number;
  payoutMatrix: PayoutMatrix;
  simulationStartDate: Date;
  currentDate: Date;
  isPaused: boolean;
  // New simulation mode controls
  simulationMode: SimulationMode;
  targetAmount: number; // Number of rounds/days/weeks/months to simulate
  simulationSpeed: number; // Speed multiplier (1-100x)
  // Protocol revenue configuration
  protocol: ProtocolConfig;
}

export interface VaultRewardsCalculation {
  playerId: string;
  dailyVaultRewards: number;
  totalVaultRewardsAccrued: number;
  vaultRewardsFromMatches: number;
  lastCalculated: Date;
}

export interface TokenDistribution {
  playerId: string;
  weightedClaim: number; // vaultedPrincipal * score
  tokenReward: number;
  tokenType: string; // e.g., 'HOOPS', 'REP', 'BONUS'
  tokenSymbol: string; // e.g., '$HOOPS', '$REP', '$BONUS'
  month: number;
  year: number;
}

export interface SimulationState {
  players: Player[];
  matches: Match[];
  config: SimulationConfig;
  vaultRewardsCalculations: VaultRewardsCalculation[];
  tokenDistributions: TokenDistribution[];
  reputationEvents: ReputationEvent[];
  protocolRevenue: ProtocolRevenue[];
  currentRound: number;
  totalVaultValue: number;
  statistics: {
    totalMatches: number;
    trustTrustMatches: number;
    betrayTrustMatches: number;
    betrayBetrayMatches: number;
    totalVaultRewardsGenerated: number;
    totalTokensDistributed: number;
    totalProtocolRevenue: number;
    totalBuybacks: number;
    totalBurns: number;
  };
}

export interface ScenarioExport {
  id: string;
  name: string;
  description: string;
  tags: string;
  version: string;
  exportDate: Date;
  players: Player[];
  matches: Match[];
  config: SimulationConfig;
  statistics: SimulationState['statistics'];
}

export const getFactionByReputation = (reputation: number): Player['faction'] => {
  if (reputation >= 0 && reputation <= 40) return 'Shadow Syndicate';
  if (reputation >= 41 && reputation <= 59) return 'Free Agents';
  return 'Lumina Collective';
};

export const getDefaultPayoutMatrix = (): PayoutMatrix => ({
  trustTrust: {
    scoreA: 2,
    scoreB: 2,
    vaultRewardsShareA: 50,
    vaultRewardsShareB: 50,
  },
  betrayTrust: {
    scoreA: 3,
    scoreB: -3,
    vaultRewardsShareA: 100,
    vaultRewardsShareB: 0,
  },
  trustBetray: {
    scoreA: -3,
    scoreB: 3,
    vaultRewardsShareA: 0,
    vaultRewardsShareB: 100,
  },
  betrayBetray: {
    scoreA: -1,
    scoreB: -1,
    vaultRewardsShareA: 25,
    vaultRewardsShareB: 25,
    burnPercentage: 50,
  },
});

export const getDefaultSimulationConfig = (): SimulationConfig => ({
  globalAPY: 10,
  matchDurationMinutes: 10,
  matchesPerDay: 144, // Every 10 minutes = 144 matches max per day
  monthlyIncentivePool: 10000,
  payoutMatrix: getDefaultPayoutMatrix(),
  simulationStartDate: new Date(),
  currentDate: new Date(),
  isPaused: false,
  simulationMode: 'rounds',
  targetAmount: 100,
  simulationSpeed: 1,
  protocol: {
    enabled: true,
    feeType: 'yield_spread',
    feeRate: 0.05, // 5% yield spread
    buybackAllocation: 0.2, // 20% of protocol revenue goes to buybacks
    burnRate: 0.1, // 10% of protocol revenue goes to burns
  },
}); 