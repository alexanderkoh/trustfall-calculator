'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, DollarSign, RefreshCw, Calculator } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { Player } from '@/types/simulation';

const yieldConfigSchema = z.object({
  globalAPY: z.number().min(0, 'APY cannot be negative').max(100, 'APY cannot exceed 100%'),
  simulationDays: z.number().min(1, 'Simulation must be at least 1 day').max(365, 'Maximum 365 days'),
  matchDurationMinutes: z.number().min(1, 'Match duration must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
});

type YieldConfigData = z.infer<typeof yieldConfigSchema>;

export function YieldSimulator() {
  const { 
    players, 
    matches,
    config, 
    updateConfig, 
    updateAllYields,
    totalVaultValue 
  } = useSimulationStore();

  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<{
    players: Array<{
      player: Player;
      baseYield: number;
      matchYield: number;
      totalYield: number;
      effectiveAPY: number;
    }>;
    totals: {
      baseYield: number;
      matchYield: number;
      totalYield: number;
      averageEffectiveAPY: number;
    };
  } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<YieldConfigData>({
    resolver: zodResolver(yieldConfigSchema),
    defaultValues: {
      globalAPY: config.globalAPY,
      simulationDays: 30,
      matchDurationMinutes: config.matchDurationMinutes,
    },
  });

  const watchedValues = watch();

  const onSubmit = (data: YieldConfigData) => {
    updateConfig({
      globalAPY: data.globalAPY,
      matchDurationMinutes: data.matchDurationMinutes,
    });
    updateAllYields();
  };

  const generatePreview = useCallback((days: number, apy: number) => {
    if (players.length === 0) return null;

    const preview = players.map(player => {
      const dailyYieldRate = apy / 100 / 365;
      const baseYield = player.currentDeposit * dailyYieldRate * days;
      const matchYieldContribution = player.finalYield;
      const totalProjectedYield = baseYield + matchYieldContribution;
      
      return {
        player,
        baseYield,
        matchYield: matchYieldContribution,
        totalYield: totalProjectedYield,
        effectiveAPY: player.currentDeposit > 0 ? (totalProjectedYield / player.currentDeposit) * (365 / days) * 100 : 0,
      };
    });

    const totalBaseYield = preview.reduce((sum, p) => sum + p.baseYield, 0);
    const totalMatchYield = preview.reduce((sum, p) => sum + p.matchYield, 0);
    const totalProjectedYield = preview.reduce((sum, p) => sum + p.totalYield, 0);
    const averageEffectiveAPY = preview.length > 0 ? preview.reduce((sum, p) => sum + p.effectiveAPY, 0) / preview.length : 0;

    return {
      players: preview,
      totals: {
        baseYield: totalBaseYield,
        matchYield: totalMatchYield,
        totalYield: totalProjectedYield,
        averageEffectiveAPY,
      }
    };
  }, [players]);

  useEffect(() => {
    if (previewMode) {
      const preview = generatePreview(watchedValues.simulationDays, watchedValues.globalAPY);
      setPreviewData(preview);
    }
  }, [watchedValues, previewMode, generatePreview]);

  const currentYieldData = generatePreview(30, config.globalAPY);

  const handleUpdateYields = () => {
    updateAllYields();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Yield Simulator</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleUpdateYields}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Update Yields</span>
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center space-x-2 ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Calculator className="h-4 w-4" />
            <span>{previewMode ? 'Exit Preview' : 'Preview Mode'}</span>
          </button>
        </div>
      </div>

      {/* Current Vault Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            ${totalVaultValue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500">Total Vault Value</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{config.globalAPY}%</div>
          <p className="text-sm text-gray-500">Current APY</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${matches.reduce((sum, match) => sum + match.totalYieldGenerated, 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500">Yield from Matches</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{config.matchDurationMinutes}m</div>
          <p className="text-sm text-gray-500">Match Duration</p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Yield Configuration</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Global APY (%)
              </label>
              <input
                {...register('globalAPY', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input-field"
                placeholder="10.0"
              />
              {errors.globalAPY && (
                <p className="text-red-500 text-sm mt-1">{errors.globalAPY.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Annual percentage yield for base deposits</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Match Duration (minutes)
              </label>
              <input
                {...register('matchDurationMinutes', { valueAsNumber: true })}
                type="number"
                min="1"
                max="1440"
                className="input-field"
                placeholder="10"
              />
              {errors.matchDurationMinutes && (
                <p className="text-red-500 text-sm mt-1">{errors.matchDurationMinutes.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">How long each match lasts</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preview Period (days)
              </label>
              <input
                {...register('simulationDays', { valueAsNumber: true })}
                type="number"
                min="1"
                max="365"
                className="input-field"
                placeholder="30"
              />
              {errors.simulationDays && (
                <p className="text-red-500 text-sm mt-1">{errors.simulationDays.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Days to project yield for</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Update Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Yield Calculations */}
      {players.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Players Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add players to see yield calculations and projections.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Live Preview Mode */}
          {previewMode && previewData && (
            <div className="card border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-600">
                  Yield Preview - {watchedValues.simulationDays} Days @ {watchedValues.globalAPY}% APY
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    ${previewData.totals.baseYield.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Base Yield</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    ${previewData.totals.matchYield.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Match Yield</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    ${previewData.totals.totalYield.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Total Projected</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">
                    {previewData.totals.averageEffectiveAPY.toFixed(2)}%
                  </div>
                  <p className="text-sm text-gray-500">Avg Effective APY</p>
                </div>
              </div>
            </div>
          )}

          {/* Player Yield Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              {previewMode ? 'Projected Yield Breakdown' : 'Current Yield Status'}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Deposit</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Base Yield</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Match Yield</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Total Yield</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Effective APY</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewMode && previewData ? previewData.players : (currentYieldData?.players || [])).map((item: {
                    player: Player;
                    baseYield: number;
                    matchYield: number;
                    totalYield: number;
                    effectiveAPY: number;
                  }) => (
                    <tr key={item.player.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{item.player.name}</div>
                        <div className="text-sm text-gray-500">{item.player.faction}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        ${item.player.currentDeposit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-green-600">
                        ${item.baseYield.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600">
                        ${item.matchYield.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        ${item.totalYield.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono ${item.effectiveAPY >= config.globalAPY ? 'text-green-600' : 'text-red-600'}`}>
                          {item.effectiveAPY.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yield Formula Explanation */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Yield Calculation Formula</h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Base Yield:</strong> (Deposit × APY ÷ 365) × Days</p>
              <p><strong>Match Yield:</strong> Accumulated from match outcomes based on payout matrix</p>
              <p><strong>Total Yield:</strong> Base Yield + Match Yield</p>
              <p><strong>Effective APY:</strong> (Total Yield ÷ Deposit) × (365 ÷ Days) × 100</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 