'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grid, Settings, Eye, RotateCcw } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { PayoutMatrix as PayoutMatrixType, getDefaultPayoutMatrix } from '@/types/simulation';

const payoutSchema = z.object({
  // Trust-Trust outcome
  trustTrustScoreA: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  trustTrustScoreB: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  trustTrustYieldA: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  trustTrustYieldB: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  
  // Betray-Trust outcome
  betrayTrustScoreA: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  betrayTrustScoreB: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  betrayTrustYieldA: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  betrayTrustYieldB: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  
  // Trust-Betray outcome
  trustBetrayScoreA: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  trustBetrayScoreB: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  trustBetrayYieldA: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  trustBetrayYieldB: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  
  // Betray-Betray outcome
  betrayBetrayScoreA: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  betrayBetrayScoreB: z.number().int().min(-10, 'Score too low').max(10, 'Score too high'),
  betrayBetrayYieldA: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  betrayBetrayYieldB: z.number().min(0, 'Yield share cannot be negative').max(100, 'Cannot exceed 100%'),
  betrayBetrayBurn: z.number().min(0, 'Burn percentage cannot be negative').max(100, 'Cannot exceed 100%'),
});

type PayoutFormData = z.infer<typeof payoutSchema>;

export function PayoutMatrix() {
  const { config, updatePayoutMatrix } = useSimulationStore();
  const [previewMode, setPreviewMode] = useState(false);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      trustTrustScoreA: config.payoutMatrix.trustTrust.scoreA,
      trustTrustScoreB: config.payoutMatrix.trustTrust.scoreB,
      trustTrustYieldA: config.payoutMatrix.trustTrust.yieldShareA,
      trustTrustYieldB: config.payoutMatrix.trustTrust.yieldShareB,
      
      betrayTrustScoreA: config.payoutMatrix.betrayTrust.scoreA,
      betrayTrustScoreB: config.payoutMatrix.betrayTrust.scoreB,
      betrayTrustYieldA: config.payoutMatrix.betrayTrust.yieldShareA,
      betrayTrustYieldB: config.payoutMatrix.betrayTrust.yieldShareB,
      
      trustBetrayScoreA: config.payoutMatrix.trustBetray.scoreA,
      trustBetrayScoreB: config.payoutMatrix.trustBetray.scoreB,
      trustBetrayYieldA: config.payoutMatrix.trustBetray.yieldShareA,
      trustBetrayYieldB: config.payoutMatrix.trustBetray.yieldShareB,
      
      betrayBetrayScoreA: config.payoutMatrix.betrayBetray.scoreA,
      betrayBetrayScoreB: config.payoutMatrix.betrayBetray.scoreB,
      betrayBetrayYieldA: config.payoutMatrix.betrayBetray.yieldShareA,
      betrayBetrayYieldB: config.payoutMatrix.betrayBetray.yieldShareB,
      betrayBetrayBurn: config.payoutMatrix.betrayBetray.burnPercentage,
    },
  });

  const watchedValues = watch();

  const onSubmit = (data: PayoutFormData) => {
    const newMatrix: PayoutMatrixType = {
      trustTrust: {
        scoreA: data.trustTrustScoreA,
        scoreB: data.trustTrustScoreB,
        yieldShareA: data.trustTrustYieldA,
        yieldShareB: data.trustTrustYieldB,
      },
      betrayTrust: {
        scoreA: data.betrayTrustScoreA,
        scoreB: data.betrayTrustScoreB,
        yieldShareA: data.betrayTrustYieldA,
        yieldShareB: data.betrayTrustYieldB,
      },
      trustBetray: {
        scoreA: data.trustBetrayScoreA,
        scoreB: data.trustBetrayScoreB,
        yieldShareA: data.trustBetrayYieldA,
        yieldShareB: data.trustBetrayYieldB,
      },
      betrayBetray: {
        scoreA: data.betrayBetrayScoreA,
        scoreB: data.betrayBetrayScoreB,
        yieldShareA: data.betrayBetrayYieldA,
        yieldShareB: data.betrayBetrayYieldB,
        burnPercentage: data.betrayBetrayBurn,
      },
    };
    
    updatePayoutMatrix(newMatrix);
  };

  const resetToDefaults = () => {
    const defaults = getDefaultPayoutMatrix();
    reset({
      trustTrustScoreA: defaults.trustTrust.scoreA,
      trustTrustScoreB: defaults.trustTrust.scoreB,
      trustTrustYieldA: defaults.trustTrust.yieldShareA,
      trustTrustYieldB: defaults.trustTrust.yieldShareB,
      
      betrayTrustScoreA: defaults.betrayTrust.scoreA,
      betrayTrustScoreB: defaults.betrayTrust.scoreB,
      betrayTrustYieldA: defaults.betrayTrust.yieldShareA,
      betrayTrustYieldB: defaults.betrayTrust.yieldShareB,
      
      trustBetrayScoreA: defaults.trustBetray.scoreA,
      trustBetrayScoreB: defaults.trustBetray.scoreB,
      trustBetrayYieldA: defaults.trustBetray.yieldShareA,
      trustBetrayYieldB: defaults.trustBetray.yieldShareB,
      
      betrayBetrayScoreA: defaults.betrayBetray.scoreA,
      betrayBetrayScoreB: defaults.betrayBetray.scoreB,
      betrayBetrayYieldA: defaults.betrayBetray.yieldShareA,
      betrayBetrayYieldB: defaults.betrayBetray.yieldShareB,
      betrayBetrayBurn: defaults.betrayBetray.burnPercentage,
    });
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Trust-Trust': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Betray-Trust': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'Trust-Betray': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'Betray-Betray': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return 'text-green-600 font-bold';
    if (score < 0) return 'text-red-600 font-bold';
    return 'text-gray-600 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Grid className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payout Matrix Configuration</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefaults}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center space-x-2 ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* Game Rules Overview */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Game Mechanics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-2">Score Changes:</h4>
            <ul className="space-y-1">
              <li>• Positive scores increase reputation</li>
              <li>• Negative scores decrease reputation</li>
              <li>• Reputation affects faction membership</li>
              <li>• Scores determine token reward weights</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Yield Distribution:</h4>
            <ul className="space-y-1">
              <li>• Percentages determine yield share split</li>
              <li>• Must add up to ≤100% per outcome</li>
              <li>• Burn percentage removes yield from pool</li>
              <li>• Higher yields incentivize strategies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Matrix Preview */}
      {previewMode && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Live Preview - Current Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Trust-Trust', data: { scoreA: watchedValues.trustTrustScoreA, scoreB: watchedValues.trustTrustScoreB, yieldA: watchedValues.trustTrustYieldA, yieldB: watchedValues.trustTrustYieldB, burn: 0 }},
              { name: 'Betray-Trust', data: { scoreA: watchedValues.betrayTrustScoreA, scoreB: watchedValues.betrayTrustScoreB, yieldA: watchedValues.betrayTrustYieldA, yieldB: watchedValues.betrayTrustYieldB, burn: 0 }},
              { name: 'Trust-Betray', data: { scoreA: watchedValues.trustBetrayScoreA, scoreB: watchedValues.trustBetrayScoreB, yieldA: watchedValues.trustBetrayYieldA, yieldB: watchedValues.trustBetrayYieldB, burn: 0 }},
              { name: 'Betray-Betray', data: { scoreA: watchedValues.betrayBetrayScoreA, scoreB: watchedValues.betrayBetrayScoreB, yieldA: watchedValues.betrayBetrayYieldA, yieldB: watchedValues.betrayBetrayYieldB, burn: watchedValues.betrayBetrayBurn }},
            ].map((outcome) => (
              <div key={outcome.name} className={`card ${getOutcomeColor(outcome.name)}`}>
                <h4 className="font-semibold mb-3">{outcome.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Player A Score:</span>
                    <span className={getScoreColor(outcome.data.scoreA)}>
                      {outcome.data.scoreA > 0 ? '+' : ''}{outcome.data.scoreA}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player B Score:</span>
                    <span className={getScoreColor(outcome.data.scoreB)}>
                      {outcome.data.scoreB > 0 ? '+' : ''}{outcome.data.scoreB}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player A Yield:</span>
                    <span className="font-mono">{outcome.data.yieldA}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player B Yield:</span>
                    <span className="font-mono">{outcome.data.yieldB}%</span>
                  </div>
                  {outcome.data.burn > 0 && (
                    <div className="flex justify-between">
                      <span>Burned:</span>
                      <span className="font-mono text-red-600">{outcome.data.burn}%</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-current/20">
                    <div className="flex justify-between font-medium">
                      <span>Total Distributed:</span>
                      <span className="font-mono">{outcome.data.yieldA + outcome.data.yieldB}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Trust-Trust Configuration */}
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
            Trust-Trust Outcome (Cooperation)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player A Score
              </label>
              <input
                {...register('trustTrustScoreA', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.trustTrustScoreA && (
                <p className="text-red-500 text-xs mt-1">{errors.trustTrustScoreA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player B Score
              </label>
              <input
                {...register('trustTrustScoreB', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.trustTrustScoreB && (
                <p className="text-red-500 text-xs mt-1">{errors.trustTrustScoreB.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player A Yield (%)
              </label>
              <input
                {...register('trustTrustYieldA', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.trustTrustYieldA && (
                <p className="text-red-500 text-xs mt-1">{errors.trustTrustYieldA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player B Yield (%)
              </label>
              <input
                {...register('trustTrustYieldB', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.trustTrustYieldB && (
                <p className="text-red-500 text-xs mt-1">{errors.trustTrustYieldB.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Betray-Trust Configuration */}
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
            Betray-Trust Outcome (Exploitation)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Betrayer Score
              </label>
              <input
                {...register('betrayTrustScoreA', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.betrayTrustScoreA && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayTrustScoreA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trusting Score
              </label>
              <input
                {...register('betrayTrustScoreB', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.betrayTrustScoreB && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayTrustScoreB.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Betrayer Yield (%)
              </label>
              <input
                {...register('betrayTrustYieldA', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.betrayTrustYieldA && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayTrustYieldA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trusting Yield (%)
              </label>
              <input
                {...register('betrayTrustYieldB', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.betrayTrustYieldB && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayTrustYieldB.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Trust-Betray Configuration */}
        <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4">
            Trust-Betray Outcome (Punishment)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trusting Score
              </label>
              <input
                {...register('trustBetrayScoreA', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.trustBetrayScoreA && (
                <p className="text-red-500 text-xs mt-1">{errors.trustBetrayScoreA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Betrayer Score
              </label>
              <input
                {...register('trustBetrayScoreB', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.trustBetrayScoreB && (
                <p className="text-red-500 text-xs mt-1">{errors.trustBetrayScoreB.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trusting Yield (%)
              </label>
              <input
                {...register('trustBetrayYieldA', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.trustBetrayYieldA && (
                <p className="text-red-500 text-xs mt-1">{errors.trustBetrayYieldA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Betrayer Yield (%)
              </label>
              <input
                {...register('trustBetrayYieldB', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.trustBetrayYieldB && (
                <p className="text-red-500 text-xs mt-1">{errors.trustBetrayYieldB.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Betray-Betray Configuration */}
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">
            Betray-Betray Outcome (Mutual Destruction)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player A Score
              </label>
              <input
                {...register('betrayBetrayScoreA', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.betrayBetrayScoreA && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayBetrayScoreA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player B Score
              </label>
              <input
                {...register('betrayBetrayScoreB', { valueAsNumber: true })}
                type="number"
                min="-10"
                max="10"
                className="input-field"
              />
              {errors.betrayBetrayScoreB && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayBetrayScoreB.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player A Yield (%)
              </label>
              <input
                {...register('betrayBetrayYieldA', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.betrayBetrayYieldA && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayBetrayYieldA.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player B Yield (%)
              </label>
              <input
                {...register('betrayBetrayYieldB', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.betrayBetrayYieldB && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayBetrayYieldB.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Burn Percentage (%)
              </label>
              <input
                {...register('betrayBetrayBurn', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input-field"
              />
              {errors.betrayBetrayBurn && (
                <p className="text-red-500 text-xs mt-1">{errors.betrayBetrayBurn.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetToDefaults}
            className="btn-secondary"
          >
            Reset to Defaults
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Apply Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
} 