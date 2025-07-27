export type StrategyType = 'percentage' | 'tit_for_tat' | 'always_cooperate' | 'always_defect' | 'random' | 'tit_for_two_tats' | 'grim_trigger' | 'pavlov' | 'generous_tit_for_tat' | 'firm_but_fair' | 'suspicious_tit_for_tat' | 'soft_majority' | 'hard_majority' | 'prober' | 'random_tit_for_tat' | 'contrite_tit_for_tat' | 'adaptive';

export interface Strategy {
  type: StrategyType;
  name: string;
  description: string;
  trustPercentage?: number; // Only for percentage strategy
}

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
  initialDeposit: number;
  currentDeposit: number;
  reputation: number;
  faction: 'Shadow Syndicate' | 'Free Agents' | 'Lumina Collective';
  totalMatches: number;
  score: number;
  finalYield: number;
  strategy: Strategy;
  tokenRewards: Record<string, number>; // Map of tokenType to amount
  createdAt: Date;
  // New: Reputation history tracking
  reputationHistory: ReputationEvent[];
  // New: Match history for strategy decisions
  matchHistory: Array<{
    matchId: string;
    opponentId: string;
    myAction: 'trust' | 'betray';
    opponentAction: 'trust' | 'betray';
    result: string;
    timestamp: Date;
  }>;
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
  yieldShareA: number;
  yieldShareB: number;
  totalYieldGenerated: number;
  timestamp: Date;
}

export interface PayoutMatrix {
  trustTrust: {
    scoreA: number;
    scoreB: number;
    yieldShareA: number;
    yieldShareB: number;
  };
  betrayTrust: {
    scoreA: number;
    scoreB: number;
    yieldShareA: number;
    yieldShareB: number;
  };
  trustBetray: {
    scoreA: number;
    scoreB: number;
    yieldShareA: number;
    yieldShareB: number;
  };
  betrayBetray: {
    scoreA: number;
    scoreB: number;
    yieldShareA: number;
    yieldShareB: number;
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

export interface YieldCalculation {
  playerId: string;
  dailyYield: number;
  totalYieldAccrued: number;
  yieldFromMatches: number;
  lastCalculated: Date;
}

export interface TokenDistribution {
  playerId: string;
  weightedClaim: number; // deposit * score
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
  yieldCalculations: YieldCalculation[];
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
    totalYieldGenerated: number;
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

// Strategy definitions
export const STRATEGIES: Record<StrategyType, Strategy> = {
  percentage: {
    type: 'percentage',
    name: 'Percentage Trust',
    description: 'Uses a fixed percentage chance to trust in each match',
  },
  tit_for_tat: {
    type: 'tit_for_tat',
    name: 'Tit-for-Tat',
    description: 'Cooperate on the first move, then copy the opponent\'s last action',
  },
  always_cooperate: {
    type: 'always_cooperate',
    name: 'Always Cooperate',
    description: 'Always chooses to cooperate, regardless of the opponent\'s move',
  },
  always_defect: {
    type: 'always_defect',
    name: 'Always Defect',
    description: 'Always defects, ignoring the opponent\'s choices',
  },
  random: {
    type: 'random',
    name: 'Random',
    description: 'Chooses randomly between cooperation and defection with equal probability',
  },
  tit_for_two_tats: {
    type: 'tit_for_two_tats',
    name: 'Tit-for-Two-Tats',
    description: 'Cooperates unless the opponent defects twice in a row, then defects once',
  },
  grim_trigger: {
    type: 'grim_trigger',
    name: 'Grim Trigger',
    description: 'Cooperates until the opponent defects once, then defects forever',
  },
  pavlov: {
    type: 'pavlov',
    name: 'Pavlov (Win-Stay, Lose-Shift)',
    description: 'Repeats previous move if it resulted in a high payoff, otherwise switches',
  },
  generous_tit_for_tat: {
    type: 'generous_tit_for_tat',
    name: 'Generous Tit-for-Tat',
    description: 'Like Tit-for-Tat but occasionally forgives a defection and cooperates anyway',
  },
  firm_but_fair: {
    type: 'firm_but_fair',
    name: 'Firm-but-Fair',
    description: 'Cooperates until defected against, then defects once, then returns to cooperation if the opponent does',
  },
  suspicious_tit_for_tat: {
    type: 'suspicious_tit_for_tat',
    name: 'Suspicious Tit-for-Tat',
    description: 'Starts by defecting, then mimics the opponent\'s previous move',
  },
  soft_majority: {
    type: 'soft_majority',
    name: 'Soft Majority',
    description: 'Cooperates if the opponent has cooperated at least half the time so far, otherwise defects',
  },
  hard_majority: {
    type: 'hard_majority',
    name: 'Hard Majority',
    description: 'Cooperates only if the opponent has cooperated more than half the time so far',
  },
  prober: {
    type: 'prober',
    name: 'Prober',
    description: 'Defects on the first, third, and fourth moves to test the opponent, then mimics if cooperation is detected',
  },
  random_tit_for_tat: {
    type: 'random_tit_for_tat',
    name: 'Random Tit-for-Tat',
    description: 'Follows Tit-for-Tat with a random chance to cooperate regardless of the opponent\'s action',
  },
  contrite_tit_for_tat: {
    type: 'contrite_tit_for_tat',
    name: 'Contrite Tit-for-Tat',
    description: 'Cooperates unless the previous outcome was mutual defection, then attempts to re-establish cooperation',
  },
  adaptive: {
    type: 'adaptive',
    name: 'Adaptive',
    description: 'Changes strategy based on the opponent\'s pattern—may start as Tit-for-Tat and switch to All-D if exploited',
  },
};

export const getStrategyByName = (name: string): Strategy | undefined => {
  return Object.values(STRATEGIES).find(strategy => strategy.name === name);
};

export const getRandomStrategy = (): Strategy => {
  const strategyTypes = Object.keys(STRATEGIES).filter(type => type !== 'percentage') as StrategyType[];
  const randomType = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
  return STRATEGIES[randomType];
};

export const getDefaultPayoutMatrix = (): PayoutMatrix => ({
  trustTrust: {
    scoreA: 2,
    scoreB: 2,
    yieldShareA: 50,
    yieldShareB: 50,
  },
  betrayTrust: {
    scoreA: 3,
    scoreB: -3,
    yieldShareA: 100,
    yieldShareB: 0,
  },
  trustBetray: {
    scoreA: -3,
    scoreB: 3,
    yieldShareA: 0,
    yieldShareB: 100,
  },
  betrayBetray: {
    scoreA: -1,
    scoreB: -1,
    yieldShareA: 25,
    yieldShareB: 25,
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