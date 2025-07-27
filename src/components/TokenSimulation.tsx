'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Coins, Calculator, Plus, Users, 
  Gift, Award, TrendingUp, UserCheck 
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { Player } from '@/types/simulation';

const tokenConfigSchema = z.object({
  monthlyIncentivePool: z.number().min(1, 'Must be at least 1 token').max(1000000, 'Pool too large'),
});

// Create dynamic schema based on available players
const createExtraTokensSchema = (playerCount: number) => z.object({
  distributionType: z.enum(['specific', 'all', 'top_performers', 'faction']),
  tokenAmount: z.number().min(1, 'Must add at least 1 token').max(100000, 'Amount too large'),
  tokenType: z.string().min(1, 'Token type is required').max(20, 'Token type too long'),
  tokenSymbol: z.string().min(1, 'Token symbol is required').max(10, 'Token symbol too long'),
  targetPlayer: z.string().optional(),
  targetFaction: z.enum(['Shadow Syndicate', 'Free Agents', 'Lumina Collective']).optional(),
  topPerformersCount: z.number().optional(),
  reason: z.string().max(200, 'Reason too long').optional(),
}).superRefine((data, ctx) => {
  if (data.distributionType === 'top_performers') {
    if (!data.topPerformersCount || data.topPerformersCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Top performers count is required and must be at least 1',
        path: ['topPerformersCount'],
      });
    } else if (data.topPerformersCount > playerCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Top performers count cannot exceed the number of available players (${playerCount})`,
        path: ['topPerformersCount'],
      });
    }
  }
  if (data.distributionType === 'specific') {
    if (!data.targetPlayer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target player is required for specific distribution',
        path: ['targetPlayer'],
      });
    }
  }
  if (data.distributionType === 'faction') {
    if (!data.targetFaction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target faction is required for faction distribution',
        path: ['targetFaction'],
      });
    }
  }
});

type TokenConfigData = z.infer<typeof tokenConfigSchema>;
type ExtraTokensData = z.infer<ReturnType<typeof createExtraTokensSchema>>;

export function TokenSimulation() {
  const { 
    players, 
    config, 
    tokenDistributions,
    updateConfig,
    addExtraTokens 
  } = useSimulationStore();

  const [showExtraTokens, setShowExtraTokens] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const tokenForm = useForm<TokenConfigData>({
    resolver: zodResolver(tokenConfigSchema),
    defaultValues: {
      monthlyIncentivePool: config.monthlyIncentivePool,
    },
  });

  const extraTokensForm = useForm<ExtraTokensData>({
    resolver: zodResolver(createExtraTokensSchema(players.length)),
    defaultValues: {
      distributionType: 'all',
      tokenAmount: 1000,
      tokenType: 'HOOPS',
      tokenSymbol: '$HOOPS',
      topPerformersCount: Math.min(5, players.length),
      reason: '',
    },
  });

  const watchedExtraTokens = extraTokensForm.watch();

  const onSubmit = (data: TokenConfigData) => {
    updateConfig({ monthlyIncentivePool: data.monthlyIncentivePool });
  };

  const onExtraTokensSubmit = (data: ExtraTokensData) => {
    addExtraTokens(data);
    setShowExtraTokens(false);
    extraTokensForm.reset();
  };

  // Calculate current token distribution
  const currentDistribution = players.map(player => {
    const weightedClaim = player.currentDeposit * Math.max(0, player.score);
    const totalClaims = players.reduce((sum, p) => sum + (p.currentDeposit * Math.max(0, p.score)), 0);
    const tokenReward = totalClaims > 0 ? (weightedClaim / totalClaims) * config.monthlyIncentivePool : 0;
    const totalHOOPS = (player.tokenRewards['HOOPS'] || 0) + tokenReward;
    
    return {
      player,
      weightedClaim,
      tokenReward,
      totalTokens: totalHOOPS,
    };
  });

  // Calculate extra tokens preview
  const getExtraTokensPreview = () => {
    const data = extraTokensForm.getValues();
    const recipients: Array<{ player: Player; tokens: number }> = [];

    switch (data.distributionType) {
      case 'specific':
        if (data.targetPlayer) {
          const player = players.find(p => p.id === data.targetPlayer);
          if (player) {
            recipients.push({ player, tokens: data.tokenAmount });
          }
        }
        break;

      case 'all':
        const tokensPerPlayer = data.tokenAmount / players.length;
        players.forEach(player => {
          recipients.push({ player, tokens: tokensPerPlayer });
        });
        break;

      case 'top_performers':
        const topPlayers = [...players]
          .sort((a, b) => b.score - a.score)
          .slice(0, data.topPerformersCount || 5);
        const tokensPerTopPlayer = data.tokenAmount / topPlayers.length;
        topPlayers.forEach(player => {
          recipients.push({ player, tokens: tokensPerTopPlayer });
        });
        break;

      case 'faction':
        if (data.targetFaction) {
          const factionPlayers = players.filter(p => p.faction === data.targetFaction);
          const tokensPerFactionPlayer = data.tokenAmount / factionPlayers.length;
          factionPlayers.forEach(player => {
            recipients.push({ player, tokens: tokensPerFactionPlayer });
          });
        }
        break;
    }

    return recipients;
  };

  const extraTokensPreview = getExtraTokensPreview();

  // Get distribution history
  const recentDistributions = tokenDistributions
    .sort((a, b) => new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime())
    .slice(0, 10);

  const totalTokensDistributed = players.reduce((sum, p) => {
    const playerTotal = Object.values(p.tokenRewards).reduce((tokenSum, amount) => tokenSum + amount, 0);
    return sum + playerTotal;
  }, 0);
  const avgTokensPerPlayer = players.length > 0 ? totalTokensDistributed / players.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Coins className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Token Simulation</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={() => setShowExtraTokens(!showExtraTokens)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Extra Tokens</span>
          </button>
        </div>
      </div>

      {/* Token Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Coins className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">Monthly Pool</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{config.monthlyIncentivePool.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">$HOOPS tokens</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-500">Total Distributed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalTokensDistributed.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-500">Avg Per Player</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{avgTokensPerPlayer.toFixed(0)}</div>
          <p className="text-xs text-gray-500 mt-1">$HOOPS tokens</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm text-gray-500">Active Players</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{players.length}</div>
          <p className="text-xs text-gray-500 mt-1">Eligible for tokens</p>
        </div>
      </div>

      {/* Extra Tokens Form */}
      {showExtraTokens && (
        <div className="card border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-4">
            <Gift className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-600">Add Extra Incentive Tokens</h3>
          </div>
          
          <form onSubmit={extraTokensForm.handleSubmit(onExtraTokensSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Distribution Type
                </label>
                <select
                  {...extraTokensForm.register('distributionType')}
                  className="input-field"
                >
                  <option value="all">All Players (Equal)</option>
                  <option value="specific">Specific Player</option>
                  <option value="top_performers">Top Performers</option>
                  <option value="faction">By Faction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Type
                </label>
                <input
                  {...extraTokensForm.register('tokenType')}
                  type="text"
                  className="input-field"
                  placeholder="HOOPS"
                />
                {extraTokensForm.formState.errors.tokenType && (
                  <p className="text-red-500 text-sm mt-1">{extraTokensForm.formState.errors.tokenType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Symbol
                </label>
                <input
                  {...extraTokensForm.register('tokenSymbol')}
                  type="text"
                  className="input-field"
                  placeholder="$HOOPS"
                />
                {extraTokensForm.formState.errors.tokenSymbol && (
                  <p className="text-red-500 text-sm mt-1">{extraTokensForm.formState.errors.tokenSymbol.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Token Amount
                </label>
                <input
                  {...extraTokensForm.register('tokenAmount', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="1000"
                />
                {extraTokensForm.formState.errors.tokenAmount && (
                  <p className="text-red-500 text-sm mt-1">{extraTokensForm.formState.errors.tokenAmount.message}</p>
                )}
              </div>
            </div>

            {/* Conditional Fields */}
            {watchedExtraTokens.distributionType === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Player
                </label>
                <select
                  {...extraTokensForm.register('targetPlayer')}
                  className="input-field"
                >
                  <option value="">Choose a player...</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.faction})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {watchedExtraTokens.distributionType === 'top_performers' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Top Performers
                </label>
                <input
                  {...extraTokensForm.register('topPerformersCount', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max={players.length}
                  className="input-field"
                  placeholder="5"
                />
              </div>
            )}

            {watchedExtraTokens.distributionType === 'faction' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Faction
                </label>
                <select
                  {...extraTokensForm.register('targetFaction')}
                  className="input-field"
                >
                  <option value="">Choose a faction...</option>
                  <option value="Shadow Syndicate">Shadow Syndicate</option>
                  <option value="Free Agents">Free Agents</option>
                  <option value="Lumina Collective">Lumina Collective</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (Optional)
              </label>
              <input
                {...extraTokensForm.register('reason')}
                type="text"
                className="input-field"
                placeholder="e.g., Special event, bonus rewards, etc."
              />
            </div>

            {/* Preview */}
            {extraTokensPreview.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Distribution Preview</h4>
                <div className="space-y-2">
                  {extraTokensPreview.map(({ player, tokens }) => (
                    <div key={player.id} className="flex justify-between items-center text-sm">
                      <span className="text-blue-800 dark:text-blue-200">{player.name}</span>
                      <span className="font-mono text-blue-800 dark:text-blue-200">+{tokens.toFixed(0)} {watchedExtraTokens.tokenSymbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowExtraTokens(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Distribute Extra Tokens
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Monthly Pool Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Monthly Incentive Pool Configuration</h3>
        <form onSubmit={tokenForm.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Incentive Pool ($HOOPS)
            </label>
            <input
              {...tokenForm.register('monthlyIncentivePool', { valueAsNumber: true })}
              type="number"
              min="1"
              className="input-field"
              placeholder="10000"
            />
            {tokenForm.formState.errors.monthlyIncentivePool && (
              <p className="text-red-500 text-sm mt-1">{tokenForm.formState.errors.monthlyIncentivePool.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Total tokens distributed monthly based on weighted claims (Deposit × Score)
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Update Pool
            </button>
          </div>
        </form>
      </div>

      {/* Token Distribution Preview */}
      {previewMode && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Current Month Token Distribution Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Faction</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Deposit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Weighted Claim</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Token Reward</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Total Tokens</th>
                </tr>
              </thead>
              <tbody>
                {currentDistribution
                  .sort((a, b) => b.tokenReward - a.tokenReward)
                  .map(({ player, weightedClaim, tokenReward }) => (
                    <tr key={player.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium">{player.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          player.faction === 'Shadow Syndicate' ? 'bg-red-100 text-red-800' :
                          player.faction === 'Free Agents' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {player.faction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">${player.currentDeposit.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono ${player.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {player.score > 0 ? '+' : ''}{player.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{weightedClaim.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-green-600">{tokenReward.toFixed(0)}</td>
                                             <td className="py-3 px-4 text-right font-mono font-bold">
                         {Object.entries(player.tokenRewards).map(([tokenType, amount]) => (
                           <div key={tokenType} className="text-xs">
                             {amount.toFixed(0)} {tokenType}
                           </div>
                         ))}
                       </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution History */}
      {recentDistributions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Token Distributions</h3>
          <div className="space-y-3">
            {recentDistributions.map((distribution, index) => {
              const player = players.find(p => p.id === distribution.playerId);
              if (!player) return null;
              
              return (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">{distribution.month}/{distribution.year}</div>
                    </div>
                  </div>
                                     <div className="text-right">
                     <div className="font-mono font-bold text-green-600">+{distribution.tokenReward.toFixed(0)} {distribution.tokenSymbol}</div>
                     <div className="text-xs text-gray-500">Weight: {distribution.weightedClaim.toFixed(0)}</div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 