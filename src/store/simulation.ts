import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Player, 
  Match, 
  SimulationState, 
  SimulationConfig, 
  PayoutMatrix, 
  VaultRewardsCalculation, 
  TokenDistribution,
  getFactionByReputation,
  getDefaultSimulationConfig,
  ScenarioExport,
  SimulationMode,
  ReputationEvent,
  ProtocolRevenue,
  ProtocolConfig
} from '@/types/simulation';



interface SimulationStore extends SimulationState {
  // Player Management
  addPlayer: (player: Pick<Player, 'name' | 'initialVaultedPrincipal' | 'reputation' | 'trustPercentage'>) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  resetPlayerData: (playerId: string) => void;
  clearAllPlayers: () => void;
  
  // Match Management
  simulateMatch: (playerAId: string, playerBId?: string, forceActions?: { actionA: 'trust' | 'betray', actionB: 'trust' | 'betray' }) => void;
  simulateRound: (roundCount?: number) => void;
  
  // Configuration
  updateConfig: (updates: Partial<SimulationConfig>) => void;
  updatePayoutMatrix: (matrix: PayoutMatrix) => void;
  
  // Yield Calculations
  calculateYield: (playerId: string, days: number) => number;
  updateAllYields: () => void;
  
  // Token Distribution
  calculateMonthlyTokens: () => void;
  addExtraTokens: (data: {
    distributionType: 'specific' | 'all' | 'top_performers' | 'faction';
    tokenAmount: number;
    tokenType: string;
    tokenSymbol: string;
    targetPlayer?: string;
    targetFaction?: 'Shadow Syndicate' | 'Free Agents' | 'Lumina Collective';
    topPerformersCount?: number;
    reason?: string;
  }) => void;
  
  // Simulation Controls
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  advanceTime: (days: number) => void;
  advanceTimeWithMatches: (days: number) => void;
  simulateMatchesBulk: (matchCount: number) => void;
  createMatch: (playerA: Player, playerB: Player | null) => Match | null;
  // New granular simulation controls
  executeSimulation: (mode: SimulationMode, amount: number) => void;
  calculateMatchesForMode: (mode: SimulationMode, amount: number) => number;
  updateSimulationMode: (mode: SimulationMode, targetAmount: number) => void;
  advanceTimeByMode: (mode: SimulationMode, amount: number) => void;
  // Reputation tracking
  addReputationEvent: (playerId: string, oldReputation: number, newReputation: number, reason: ReputationEvent['reason'], matchId?: string, details?: string) => void;
  getPlayerReputationHistory: (playerId: string) => ReputationEvent[];
  // Protocol revenue tracking
  calculateProtocolRevenue: (baseYield: number, playerADeposit: number, playerBDeposit: number) => ProtocolRevenue;
  addProtocolRevenue: (revenue: ProtocolRevenue) => void;
  updateProtocolConfig: (config: Partial<ProtocolConfig>) => void;
  
  // Export/Import
      exportScenario: (name: string, description: string, tags: string) => ScenarioExport;
  importScenario: (scenario: ScenarioExport) => void;
  
  // Statistics
  updateStatistics: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createArbiterAction = (): 'trust' | 'betray' => {
  // Tit-for-Tat AI: Start with trust, then copy opponent's last action
  // For simplicity, we'll use a 70% trust rate for the Arbiter
  return Math.random() < 0.7 ? 'trust' : 'betray';
};

const getMatchResult = (actionA: 'trust' | 'betray', actionB: 'trust' | 'betray'): Match['result'] => {
  if (actionA === 'trust' && actionB === 'trust') return 'trust-trust';
  if (actionA === 'betray' && actionB === 'trust') return 'betray-trust';
  if (actionA === 'trust' && actionB === 'betray') return 'trust-betray';
  return 'betray-betray';
};

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      // Initial State
      players: [],
      matches: [],
      config: getDefaultSimulationConfig(),
      vaultRewardsCalculations: [],
      tokenDistributions: [],
      reputationEvents: [],
      protocolRevenue: [],
      currentRound: 0,
      totalVaultValue: 0,
      statistics: {
        totalMatches: 0,
        trustTrustMatches: 0,
        betrayTrustMatches: 0,
        betrayBetrayMatches: 0,
        totalVaultRewardsGenerated: 0,
        totalTokensDistributed: 0,
        totalProtocolRevenue: 0,
        totalBuybacks: 0,
        totalBurns: 0,
      },

      // Player Management
      addPlayer: (playerData) => set((state) => {
        const faction = getFactionByReputation(playerData.reputation);
        const newPlayer: Player = {
          ...playerData,
          id: generateId(),
          faction,
          currentVaultedPrincipal: playerData.initialVaultedPrincipal,
          totalMatches: 0,
          score: 0,
          vaultRewards: 0,
          tokenRewards: {},
          createdAt: new Date(),
          reputationHistory: [],
        };
        
        // Add initial reputation event
        const initialReputationEvent: ReputationEvent = {
          id: generateId(),
          playerId: newPlayer.id,
          oldReputation: 0,
          newReputation: playerData.reputation,
          change: playerData.reputation,
          reason: 'initial_setup',
          details: 'Player created with initial reputation',
          timestamp: new Date(),
        };

        return {
          players: [...state.players, newPlayer],
          totalVaultValue: state.totalVaultValue + newPlayer.initialVaultedPrincipal,
          reputationEvents: [...state.reputationEvents, initialReputationEvent],
        };
      }),

      removePlayer: (playerId) => set((state) => {
        const player = state.players.find(p => p.id === playerId);
        const newPlayers = state.players.filter(p => p.id !== playerId);
        
        return {
          players: newPlayers,
          totalVaultValue: player ? state.totalVaultValue - player.currentDeposit : state.totalVaultValue,
          yieldCalculations: state.yieldCalculations.filter(yc => yc.playerId !== playerId),
          tokenDistributions: state.tokenDistributions.filter(td => td.playerId !== playerId),
        };
      }),

      updatePlayer: (playerId, updates) => set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? { 
                ...player, 
                ...updates,
                faction: updates.reputation !== undefined 
                  ? getFactionByReputation(updates.reputation) 
                  : player.faction
              }
            : player
        ),
      })),

      resetPlayerData: (playerId) => set((state) => ({
        players: state.players.map(player => 
          player.id === playerId 
            ? {
                ...player,
                currentDeposit: player.initialDeposit,
                totalMatches: 0,
                score: 0,
                finalYield: 0,
                tokenRewards: {},
              }
            : player
        ),
        matches: state.matches.filter(match => 
          match.playerA.id !== playerId && (match.playerB?.id !== playerId)
        ),
        yieldCalculations: state.yieldCalculations.filter(yc => yc.playerId !== playerId),
        tokenDistributions: state.tokenDistributions.filter(td => td.playerId !== playerId),
      })),

      clearAllPlayers: () => set((state) => ({
        players: [],
        matches: [],
        yieldCalculations: [],
        tokenDistributions: [],
        currentRound: 0,
        totalVaultValue: 0,
        statistics: {
          totalMatches: 0,
          trustTrustMatches: 0,
          betrayTrustMatches: 0,
          betrayBetrayMatches: 0,
          totalYieldGenerated: 0,
          totalTokensDistributed: 0,
          totalProtocolRevenue: 0,
          totalBuybacks: 0,
          totalBurns: 0,
        },
      })),

      // Match Simulation
      simulateMatch: (playerAId, playerBId, forceActions) => set((state) => {
        const playerA = state.players.find(p => p.id === playerAId);
        if (!playerA) return state;

                 const playerB = playerBId ? state.players.find(p => p.id === playerBId) || null : null;
        let actionA: 'trust' | 'betray';
        let actionB: 'trust' | 'betray';

        if (forceActions) {
          actionA = forceActions.actionA;
          actionB = forceActions.actionB;
        } else {
          actionA = Math.random() < (playerA.trustPercentage / 100) ? 'trust' : 'betray';
          actionB = playerB 
            ? Math.random() < (playerB.trustPercentage / 100) ? 'trust' : 'betray'
            : createArbiterAction();
        }

        const result = getMatchResult(actionA, actionB);
        const { payoutMatrix } = state.config;
        
        let scoreChangeA = 0, scoreChangeB = 0;
        let yieldShareA = 0, yieldShareB = 0;
        
        switch (result) {
          case 'trust-trust':
            scoreChangeA = payoutMatrix.trustTrust.scoreA;
            scoreChangeB = payoutMatrix.trustTrust.scoreB;
            yieldShareA = payoutMatrix.trustTrust.yieldShareA;
            yieldShareB = payoutMatrix.trustTrust.yieldShareB;
            break;
          case 'betray-trust':
            scoreChangeA = payoutMatrix.betrayTrust.scoreA;
            scoreChangeB = payoutMatrix.betrayTrust.scoreB;
            yieldShareA = payoutMatrix.betrayTrust.yieldShareA;
            yieldShareB = payoutMatrix.betrayTrust.yieldShareB;
            break;
          case 'trust-betray':
            scoreChangeA = payoutMatrix.trustBetray.scoreA;
            scoreChangeB = payoutMatrix.trustBetray.scoreB;
            yieldShareA = payoutMatrix.trustBetray.yieldShareA;
            yieldShareB = payoutMatrix.trustBetray.yieldShareB;
            break;
          case 'betray-betray':
            scoreChangeA = payoutMatrix.betrayBetray.scoreA;
            scoreChangeB = payoutMatrix.betrayBetray.scoreB;
            yieldShareA = payoutMatrix.betrayBetray.yieldShareA;
            yieldShareB = payoutMatrix.betrayBetray.yieldShareB;
            break;
        }

        // Calculate yield generated for this match
        const matchYield = (state.totalVaultValue * state.config.globalAPY / 100 / 365) * (state.config.matchDurationMinutes / 1440);
        
        // Calculate protocol revenue
        const protocolRevenue = get().calculateProtocolRevenue(matchYield, playerA.currentDeposit, playerB?.currentDeposit || 0);
        
        // Apply protocol fee to player yields
        const adjustedYieldShareA = (protocolRevenue.playerYield * yieldShareA / 100);
        const adjustedYieldShareB = (protocolRevenue.playerYield * yieldShareB / 100);
        
        const newMatch: Match = {
          id: generateId(),
          round: state.currentRound + 1,
          playerA,
          playerB,
          actionA,
          actionB,
          result,
          scoreChangeA,
          scoreChangeB,
          reputationChangeA: scoreChangeA > 0 ? 1 : scoreChangeA < 0 ? -1 : 0,
          reputationChangeB: scoreChangeB > 0 ? 1 : scoreChangeB < 0 ? -1 : 0,
          yieldShareA: adjustedYieldShareA,
          yieldShareB: adjustedYieldShareB,
          totalYieldGenerated: matchYield,
          timestamp: new Date(),
        };

        const updatedPlayers = state.players.map(player => {
          if (player.id === playerAId) {
            return {
              ...player,
              totalMatches: player.totalMatches + 1,
              score: player.score + scoreChangeA,
              reputation: Math.max(0, Math.min(100, player.reputation + newMatch.reputationChangeA)),
              finalYield: player.finalYield + newMatch.yieldShareA,
              faction: getFactionByReputation(Math.max(0, Math.min(100, player.reputation + newMatch.reputationChangeA))),
            };
          }
          if (playerB && player.id === playerBId) {
            return {
              ...player,
              totalMatches: player.totalMatches + 1,
              score: player.score + scoreChangeB,
              reputation: Math.max(0, Math.min(100, player.reputation + newMatch.reputationChangeB)),
              finalYield: player.finalYield + newMatch.yieldShareB,
              faction: getFactionByReputation(Math.max(0, Math.min(100, player.reputation + newMatch.reputationChangeB))),
            };
          }
          return player;
        });

        return {
          ...state,
          players: updatedPlayers,
          matches: [...state.matches, newMatch],
          currentRound: state.currentRound + 1,
        };
      }),

      simulateRound: (roundCount = 1) => {
        const { players } = get();
        for (let i = 0; i < roundCount; i++) {
          const availablePlayers = [...players];
          
          while (availablePlayers.length > 1) {
            const playerA = availablePlayers.splice(Math.floor(Math.random() * availablePlayers.length), 1)[0];
            const playerB = availablePlayers.splice(Math.floor(Math.random() * availablePlayers.length), 1)[0];
            get().simulateMatch(playerA.id, playerB.id);
          }
          
          // If odd number of players, match the remaining one with Arbiter
          if (availablePlayers.length === 1) {
            get().simulateMatch(availablePlayers[0].id);
          }
        }
        get().updateStatistics();
      },

      // Configuration
      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates },
      })),

      updatePayoutMatrix: (matrix) => set((state) => ({
        config: { ...state.config, payoutMatrix: matrix },
      })),

      // Yield Calculations
      calculateYield: (playerId, days) => {
        const { players, config } = get();
        const player = players.find(p => p.id === playerId);
        if (!player) return 0;
        
        return (player.currentDeposit * config.globalAPY / 100 / 365) * days;
      },

      updateAllYields: () => set((state) => {
        const now = new Date();
        const updatedCalculations = state.players.map(player => {
          const existing = state.yieldCalculations.find(yc => yc.playerId === player.id);
          const daysSinceLastCalc = existing 
            ? Math.floor((now.getTime() - existing.lastCalculated.getTime()) / (1000 * 60 * 60 * 24))
            : 1;
          
          const dailyYield = get().calculateYield(player.id, 1);
          const newYield = dailyYield * daysSinceLastCalc;
          
          return {
            playerId: player.id,
            dailyYield,
            totalYieldAccrued: (existing?.totalYieldAccrued || 0) + newYield,
            yieldFromMatches: player.finalYield,
            lastCalculated: now,
          };
        });
        
        return { yieldCalculations: updatedCalculations };
      }),

      // Token Distribution
      calculateMonthlyTokens: () => set((state) => {
        const now = new Date();
        const totalWeightedClaims = state.players.reduce((sum, player) => 
          sum + (player.currentDeposit * Math.max(0, player.score)), 0
        );
        
        if (totalWeightedClaims === 0) return state;
        
        const newDistributions = state.players.map(player => {
          const weightedClaim = player.currentDeposit * Math.max(0, player.score);
          const tokenReward = (weightedClaim / totalWeightedClaims) * state.config.monthlyIncentivePool;
          
          return {
            playerId: player.id,
            weightedClaim,
            tokenReward,
            tokenType: 'HOOPS',
            tokenSymbol: '$HOOPS',
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          };
        });
        
        const updatedPlayers = state.players.map(player => {
          const distribution = newDistributions.find(d => d.playerId === player.id);
          const currentHOOPS = player.tokenRewards['HOOPS'] || 0;
          return {
            ...player,
            tokenRewards: {
              ...player.tokenRewards,
              'HOOPS': currentHOOPS + (distribution?.tokenReward || 0),
            },
          };
        });
        
        return {
          players: updatedPlayers,
          tokenDistributions: [...state.tokenDistributions, ...newDistributions],
        };
      }),

      addExtraTokens: (data) => set((state) => {
        const now = new Date();
        let recipients: string[] = [];

        // Determine recipients based on distribution type
        switch (data.distributionType) {
          case 'specific':
            if (data.targetPlayer) {
              recipients = [data.targetPlayer];
            }
            break;

          case 'all':
            recipients = state.players.map(p => p.id);
            break;

          case 'top_performers':
            const topPlayers = [...state.players]
              .sort((a, b) => b.score - a.score)
              .slice(0, data.topPerformersCount || 5)
              .map(p => p.id);
            recipients = topPlayers;
            break;

          case 'faction':
            if (data.targetFaction) {
              recipients = state.players
                .filter(p => p.faction === data.targetFaction)
                .map(p => p.id);
            }
            break;
        }

        if (recipients.length === 0) return state;

        // Calculate tokens per recipient
        const tokensPerRecipient = data.tokenAmount / recipients.length;

        // Create distribution records
        const newDistributions = recipients.map(playerId => ({
          playerId,
          weightedClaim: 0, // Extra tokens don't use weighted claims
          tokenReward: tokensPerRecipient,
          tokenType: data.tokenType,
          tokenSymbol: data.tokenSymbol,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }));

        // Update players with extra tokens
        const updatedPlayers = state.players.map(player => {
          const distribution = newDistributions.find(d => d.playerId === player.id);
          if (distribution) {
            const currentTokens = player.tokenRewards[data.tokenType] || 0;
            return {
              ...player,
              tokenRewards: {
                ...player.tokenRewards,
                [data.tokenType]: currentTokens + distribution.tokenReward,
              },
            };
          }
          return player;
        });

        return {
          players: updatedPlayers,
          tokenDistributions: [...state.tokenDistributions, ...newDistributions],
        };
      }),

      // Simulation Controls
      pauseSimulation: () => set((state) => ({
        config: { ...state.config, isPaused: true },
      })),

      resumeSimulation: () => set((state) => ({
        config: { ...state.config, isPaused: false },
      })),

      resetSimulation: () => set(() => ({
        players: [],
        matches: [],
        config: getDefaultSimulationConfig(),
        yieldCalculations: [],
        tokenDistributions: [],
        currentRound: 0,
        totalVaultValue: 0,
        statistics: {
          totalMatches: 0,
          trustTrustMatches: 0,
          betrayTrustMatches: 0,
          betrayBetrayMatches: 0,
          totalYieldGenerated: 0,
          totalTokensDistributed: 0,
          totalProtocolRevenue: 0,
          totalBuybacks: 0,
          totalBurns: 0,
        },
      })),

      advanceTime: (days) => set((state) => {
        const newDate = new Date(state.config.currentDate);
        newDate.setDate(newDate.getDate() + days);
        
        return {
          config: { ...state.config, currentDate: newDate },
        };
      }),

      // Bulk time advancement with optimized match simulation
      advanceTimeWithMatches: (days: number) => {
        const state = get();
        const { players, config } = state;
        
        if (players.length === 0) {
          // Just advance time if no players
          get().advanceTime(days);
          return;
        }

        // Calculate total matches for the time period
        const totalMatches = Math.floor(days * config.matchesPerDay);
        
        if (totalMatches === 0) {
          // Just advance time if no matches
          get().advanceTime(days);
          return;
        }

        // Optimize for large numbers of matches
        if (totalMatches > 1000) {
          // For very large time periods, simulate in batches
          const batchSize = 100;
          const batches = Math.ceil(totalMatches / batchSize);
          
          for (let batch = 0; batch < batches; batch++) {
            const matchesInBatch = Math.min(batchSize, totalMatches - (batch * batchSize));
            get().simulateMatchesBulk(matchesInBatch);
          }
        } else {
          // For smaller time periods, simulate normally
          get().simulateMatchesBulk(totalMatches);
        }

        // Advance time
        get().advanceTime(days);
        
        // Update statistics
        get().updateStatistics();
      },

      // Bulk match simulation for performance
      simulateMatchesBulk: (matchCount: number) => {
        const { players } = get();
        if (players.length === 0) return;

        const availablePlayers = [...players];
        const newMatches: Match[] = [];

        for (let i = 0; i < matchCount; i++) {
          if (availablePlayers.length < 2) {
            // Reset available players if we run out
            availablePlayers.push(...players);
          }

          const playerAIndex = Math.floor(Math.random() * availablePlayers.length);
          const playerA = availablePlayers.splice(playerAIndex, 1)[0];
          
          const playerBIndex = Math.floor(Math.random() * availablePlayers.length);
          const playerB = availablePlayers.splice(playerBIndex, 1)[0];

          // Simulate the match directly without calling simulateMatch to avoid performance issues
          const match = get().createMatch(playerA, playerB);
          if (match) {
            newMatches.push(match);
          }
        }

        // Add all matches at once
        set((state) => ({
          matches: [...state.matches, ...newMatches],
          currentRound: state.currentRound + Math.ceil(matchCount / Math.max(1, Math.floor(players.length / 2))),
        }));
      },

      // Helper function to create a match without updating state
      createMatch: (playerA: Player, playerB: Player | null): Match | null => {
        const { config } = get();
        
        // Determine actions based on trust percentages
        const actionA = Math.random() * 100 < playerA.trustPercentage ? 'trust' : 'betray';
        const actionB = playerB ? (Math.random() * 100 < playerB.trustPercentage ? 'trust' : 'betray') : createArbiterAction();
        
        const result = getMatchResult(actionA, actionB);
        const matrix = config.payoutMatrix;
        
        let scoreChangeA, scoreChangeB, reputationChangeA, reputationChangeB, yieldShareA, yieldShareB;
        
        switch (result) {
          case 'trust-trust':
            scoreChangeA = matrix.trustTrust.scoreA;
            scoreChangeB = matrix.trustTrust.scoreB;
            reputationChangeA = 1;
            reputationChangeB = 1;
            yieldShareA = matrix.trustTrust.yieldShareA;
            yieldShareB = matrix.trustTrust.yieldShareB;
            break;
          case 'betray-trust':
            scoreChangeA = matrix.betrayTrust.scoreA;
            scoreChangeB = matrix.betrayTrust.scoreB;
            reputationChangeA = -2;
            reputationChangeB = 1;
            yieldShareA = matrix.betrayTrust.yieldShareA;
            yieldShareB = matrix.betrayTrust.yieldShareB;
            break;
          case 'trust-betray':
            scoreChangeA = matrix.trustBetray.scoreA;
            scoreChangeB = matrix.trustBetray.scoreB;
            reputationChangeA = 1;
            reputationChangeB = -2;
            yieldShareA = matrix.trustBetray.yieldShareA;
            yieldShareB = matrix.trustBetray.yieldShareB;
            break;
          case 'betray-betray':
            scoreChangeA = matrix.betrayBetray.scoreA;
            scoreChangeB = matrix.betrayBetray.scoreB;
            reputationChangeA = -1;
            reputationChangeB = -1;
            yieldShareA = matrix.betrayBetray.yieldShareA;
            yieldShareB = matrix.betrayBetray.yieldShareB;
            break;
        }

        // Calculate yield
        const totalYield = (playerA.currentDeposit + (playerB?.currentDeposit || 0)) * (config.globalAPY / 100 / 365) * (config.matchDurationMinutes / (24 * 60));
        
        // Calculate protocol revenue
        const protocolRevenue = get().calculateProtocolRevenue(totalYield, playerA.currentDeposit, playerB?.currentDeposit || 0);
        
        // Apply protocol fee to player yields
        const adjustedYieldShareA = (protocolRevenue.playerYield * yieldShareA) / 100;
        const adjustedYieldShareB = (protocolRevenue.playerYield * yieldShareB) / 100;

        // Create match object first
        const match: Match = {
          id: generateId(),
          round: get().currentRound + 1,
          playerA: { ...playerA },
          playerB: playerB ? { ...playerB } : null,
          actionA: actionA as 'trust' | 'betray',
          actionB: actionB as 'trust' | 'betray',
          result,
          scoreChangeA,
          scoreChangeB,
          reputationChangeA,
          reputationChangeB,
          yieldShareA: adjustedYieldShareA,
          yieldShareB: adjustedYieldShareB,
          totalYieldGenerated: totalYield,
          timestamp: new Date(),
        };

        // Update players and track reputation changes
        set((state) => {
          const updatedPlayers = state.players.map(p => {
            if (p.id === playerA.id) {
              const oldReputation = p.reputation;
              const newReputation = Math.max(0, Math.min(100, p.reputation + reputationChangeA));
              
              // Add reputation event for player A
              if (oldReputation !== newReputation) {
                get().addReputationEvent(
                  p.id, 
                  oldReputation, 
                  newReputation, 
                  'match_result',
                  match.id,
                  `Match result: ${result}`
                );
              }
              
              return {
                ...p,
                score: Math.max(0, p.score + scoreChangeA),
                reputation: newReputation,
                totalMatches: p.totalMatches + 1,
                finalYield: p.finalYield + adjustedYieldShareA,
              };
            }
            if (playerB && p.id === playerB.id) {
              const oldReputation = p.reputation;
              const newReputation = Math.max(0, Math.min(100, p.reputation + reputationChangeB));
              
              // Add reputation event for player B
              if (oldReputation !== newReputation) {
                get().addReputationEvent(
                  p.id, 
                  oldReputation, 
                  newReputation, 
                  'match_result',
                  match.id,
                  `Match result: ${result}`
                );
              }
              
              return {
                ...p,
                score: Math.max(0, p.score + scoreChangeB),
                reputation: newReputation,
                totalMatches: p.totalMatches + 1,
                finalYield: p.finalYield + adjustedYieldShareB,
              };
            }
            return p;
          });
          
          // Add protocol revenue record
          const revenueRecord = {
            ...protocolRevenue,
            matchId: match.id,
          };
          get().addProtocolRevenue(revenueRecord);
          
          return { players: updatedPlayers };
        });

        return match;
      },

      // Protocol revenue tracking
      calculateProtocolRevenue: (baseYield, playerADeposit, playerBDeposit) => {
        const { config } = get();
        const { protocol } = config;
        
        if (!protocol.enabled) {
          return {
            id: generateId(),
            matchId: '',
            timestamp: new Date(),
            feeType: protocol.feeType,
            feeRate: protocol.feeRate,
            baseYield,
            protocolFee: 0,
            playerYield: baseYield,
            buybackAmount: 0,
            burnAmount: 0,
            netRevenue: 0,
          };
        }

        let protocolFee = 0;
        const totalDeposit = playerADeposit + playerBDeposit;

        switch (protocol.feeType) {
          case 'yield_spread':
            // Take a percentage of the yield
            protocolFee = baseYield * protocol.feeRate;
            break;
          case 'flat_fee':
            // Take a percentage of total deposits
            protocolFee = totalDeposit * protocol.feeRate;
            break;
          case 'incentive_tax':
            // Take a percentage of the yield plus a small deposit fee
            protocolFee = (baseYield * protocol.feeRate) + (totalDeposit * 0.001);
            break;
        }

        const playerYield = baseYield - protocolFee;
        const buybackAmount = protocolFee * protocol.buybackAllocation;
        const burnAmount = protocolFee * protocol.burnRate;
        const netRevenue = protocolFee - buybackAmount - burnAmount;

        return {
          id: generateId(),
          matchId: '',
          timestamp: new Date(),
          feeType: protocol.feeType,
          feeRate: protocol.feeRate,
          baseYield,
          protocolFee,
          playerYield,
          buybackAmount,
          burnAmount,
          netRevenue,
        };
      },

      addProtocolRevenue: (revenue) => set((state) => ({
        protocolRevenue: [...state.protocolRevenue, revenue],
      })),

      updateProtocolConfig: (config) => set((state) => ({
        config: {
          ...state.config,
          protocol: {
            ...state.config.protocol,
            ...config,
          },
        },
      })),

      // New granular simulation controls
      executeSimulation: (mode: SimulationMode, amount: number) => {
        const { players, config } = get();
        
        if (players.length === 0) {
          console.warn('No players available for simulation');
          return;
        }

        const totalMatches = get().calculateMatchesForMode(mode, amount);
        
        if (totalMatches === 0) {
          console.warn('No matches to simulate for the given mode and amount');
          return;
        }

        // Optimize for large numbers of matches
        if (totalMatches > 1000) {
          // For very large time periods, simulate in batches
          const batchSize = 100;
          const batches = Math.ceil(totalMatches / batchSize);
          
          for (let batch = 0; batch < batches; batch++) {
            const matchesInBatch = Math.min(batchSize, totalMatches - (batch * batchSize));
            get().simulateMatchesBulk(matchesInBatch);
          }
        } else {
          // For smaller time periods, simulate normally
          get().simulateMatchesBulk(totalMatches);
        }

        // Update time based on mode
        get().advanceTimeByMode(mode, amount);
        
        // Update statistics
        get().updateStatistics();
      },

      calculateMatchesForMode: (mode: SimulationMode, amount: number): number => {
        const { config, players } = get();
        
        if (players.length === 0) return 0;

        switch (mode) {
          case 'rounds':
            // Each round has matches based on player count (roughly players.length / 2)
            return Math.ceil(amount * Math.max(1, Math.floor(players.length / 2)));
          case 'days':
            return Math.floor(amount * config.matchesPerDay);
          case 'weeks':
            return Math.floor(amount * 7 * config.matchesPerDay);
          case 'months':
            // Assume 30-day month
            return Math.floor(amount * 30 * config.matchesPerDay);
          default:
            return 0;
        }
      },

      updateSimulationMode: (mode: SimulationMode, targetAmount: number) => set((state) => ({
        config: { 
          ...state.config, 
          simulationMode: mode,
          targetAmount: targetAmount
        },
      })),

      advanceTimeByMode: (mode: SimulationMode, amount: number) => {
        const { config } = get();
        
        switch (mode) {
          case 'rounds':
            // For rounds, we don't advance calendar time, just round count
            // Time advancement is based on match duration
            const matchesPerRound = Math.max(1, Math.floor(get().players.length / 2));
            const totalMatches = amount * matchesPerRound;
            const totalMinutes = totalMatches * config.matchDurationMinutes;
            const daysToAdvance = totalMinutes / (24 * 60);
            get().advanceTime(daysToAdvance);
            break;
          case 'days':
            get().advanceTime(amount);
            break;
          case 'weeks':
            get().advanceTime(amount * 7);
            break;
          case 'months':
            // Assume 30-day month
            get().advanceTime(amount * 30);
            break;
        }
      },

             // Reputation tracking
       addReputationEvent: (playerId, oldReputation, newReputation, reason, matchId, details) => set((state) => {
         const event: ReputationEvent = {
           id: generateId(),
           playerId,
           oldReputation,
           newReputation,
           change: newReputation - oldReputation,
           reason,
           matchId,
           details,
           timestamp: new Date(),
         };
         return {
           reputationEvents: [...state.reputationEvents, event],
         };
       }),

      getPlayerReputationHistory: (playerId) => {
        return get().reputationEvents.filter(event => event.playerId === playerId);
      },

      // Export/Import
      exportScenario: (name, description, tags) => {
        const state = get();
        return {
          id: crypto.randomUUID(),
          name,
          description,
          tags,
          version: '1.0',
          exportDate: new Date(),
          players: state.players,
          matches: state.matches,
          config: state.config,
          statistics: state.statistics,
        };
      },

      importScenario: (scenario) => set(() => ({
        players: scenario.players,
        matches: scenario.matches,
        config: scenario.config,
        yieldCalculations: [],
        tokenDistributions: [],
        currentRound: 0,
        totalVaultValue: 0,
        statistics: scenario.statistics,
      })),

      // Statistics
      updateStatistics: () => set((state) => {
        const stats = {
          totalMatches: state.matches.length,
          trustTrustMatches: state.matches.filter(m => m.result === 'trust-trust').length,
          betrayTrustMatches: state.matches.filter(m => m.result === 'betray-trust' || m.result === 'trust-betray').length,
          betrayBetrayMatches: state.matches.filter(m => m.result === 'betray-betray').length,
          totalYieldGenerated: state.matches.reduce((sum, match) => sum + match.totalYieldGenerated, 0),
          totalTokensDistributed: state.tokenDistributions.reduce((sum, dist) => sum + dist.tokenReward, 0),
          totalProtocolRevenue: state.protocolRevenue.reduce((sum, rev) => sum + rev.protocolFee, 0),
          totalBuybacks: state.protocolRevenue.reduce((sum, rev) => sum + rev.buybackAmount, 0),
          totalBurns: state.protocolRevenue.reduce((sum, rev) => sum + rev.burnAmount, 0),
        };
        
        return { statistics: stats };
      }),
    }),
    {
      name: 'trustfall-simulation',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            ...persistedState,
            config: {
              ...persistedState.config,
              simulationStartDate: persistedState.config?.simulationStartDate ? 
                (persistedState.config.simulationStartDate instanceof Date ? 
                  persistedState.config.simulationStartDate : 
                  new Date(persistedState.config.simulationStartDate)) : 
                new Date(),
              currentDate: persistedState.config?.currentDate ? 
                (persistedState.config.currentDate instanceof Date ? 
                  persistedState.config.currentDate : 
                  new Date(persistedState.config.currentDate)) : 
                new Date(),
            },
            players: persistedState.players?.map((player: any) => ({
              ...player,
              createdAt: player.createdAt ? 
                (player.createdAt instanceof Date ? 
                  player.createdAt : 
                  new Date(player.createdAt)) : 
                new Date(),
            })) || [],
            matches: persistedState.matches?.map((match: any) => ({
              ...match,
              timestamp: match.timestamp ? 
                (match.timestamp instanceof Date ? 
                  match.timestamp : 
                  new Date(match.timestamp)) : 
                new Date(),
              playerA: {
                ...match.playerA,
                createdAt: match.playerA?.createdAt ? 
                  (match.playerA.createdAt instanceof Date ? 
                    match.playerA.createdAt : 
                    new Date(match.playerA.createdAt)) : 
                  new Date(),
              },
              playerB: match.playerB ? {
                ...match.playerB,
                createdAt: match.playerB.createdAt ? 
                  (match.playerB.createdAt instanceof Date ? 
                    match.playerB.createdAt : 
                    new Date(match.playerB.createdAt)) : 
                  new Date(),
              } : null,
            })) || [],
          };
        }
        return persistedState;
      },
    }
  )
); 