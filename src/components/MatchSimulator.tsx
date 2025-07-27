'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Swords, Play, Users, Dice1, Shield, Zap, History } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { Match } from '@/types/simulation';

const matchFormSchema = z.object({
  playerAId: z.string().min(1, 'Player A is required'),
  playerBId: z.string().optional(),
  actionA: z.enum(['trust', 'betray']),
  actionB: z.enum(['trust', 'betray']),
  roundCount: z.number().min(1, 'Round count must be at least 1').max(100, 'Maximum 100 rounds at once'),
});

type MatchFormData = z.infer<typeof matchFormSchema>;

export function MatchSimulator() {
  const { 
    players, 
    matches, 
    currentRound,
    simulateMatch, 
    simulateRound,
    updateStatistics 
  } = useSimulationStore();
  
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      roundCount: 1,
      actionA: 'trust',
      actionB: 'trust',
    },
  });

  const selectedPlayerAId = watch('playerAId');

  const availablePlayersForB = players.filter(p => p.id !== selectedPlayerAId);

  const onManualMatch = (data: MatchFormData) => {
    if (!data.playerAId) return;
    
    simulateMatch(
      data.playerAId,
      data.playerBId || undefined,
      {
        actionA: data.actionA,
        actionB: data.actionB,
      }
    );
    updateStatistics();
    reset();
    setShowManualMatch(false);
  };

  const runAutoRounds = async (rounds: number) => {
    if (players.length === 0) return;
    
    setIsSimulating(true);
    
    // Run simulation in batches to avoid blocking UI
    const batchSize = 5;
    for (let i = 0; i < rounds; i += batchSize) {
      const currentBatch = Math.min(batchSize, rounds - i);
      simulateRound(currentBatch);
      
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsSimulating(false);
  };

  const getActionIcon = (action: 'trust' | 'betray') => {
    return action === 'trust' ? 
      <Shield className="h-4 w-4 text-green-500" /> : 
      <Zap className="h-4 w-4 text-red-500" />;
  };

  const getActionColor = (action: 'trust' | 'betray') => {
    return action === 'trust' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getResultColor = (result: Match['result']) => {
    switch (result) {
      case 'trust-trust': return 'text-green-600 bg-green-100';
      case 'betray-trust': 
      case 'trust-betray': return 'text-yellow-600 bg-yellow-100';
      case 'betray-betray': return 'text-red-600 bg-red-100';
    }
  };

  const recentMatches = matches.slice(-10).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Swords className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Match Simulator</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowManualMatch(true)}
            className="btn-secondary flex items-center space-x-2"
            disabled={players.length === 0}
          >
            <Users className="h-4 w-4" />
            <span>Manual Match</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{currentRound}</div>
          <p className="text-sm text-gray-500">Current Round</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{matches.length}</div>
          <p className="text-sm text-gray-500">Total Matches</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{players.length}</div>
          <p className="text-sm text-gray-500">Active Players</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {matches.length > 0 ? Math.round((matches.filter(m => m.result === 'trust-trust').length / matches.length) * 100) : 0}%
          </div>
          <p className="text-sm text-gray-500">Trust Rate</p>
        </div>
      </div>

      {/* Manual Match Form */}
      {showManualMatch && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Manual Match Setup</h3>
          <form onSubmit={handleSubmit(onManualMatch)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player A
                </label>
                <select {...register('playerAId')} className="input-field">
                  <option value="">Select Player A</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} (Rep: {player.reputation})
                    </option>
                  ))}
                </select>
                {errors.playerAId && (
                  <p className="text-red-500 text-sm mt-1">{errors.playerAId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player B (Leave empty for Arbiter)
                </label>
                <select {...register('playerBId')} className="input-field">
                  <option value="">Arbiter (AI)</option>
                  {availablePlayersForB.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} (Rep: {player.reputation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player A Action
                </label>
                <select {...register('actionA')} className="input-field">
                  <option value="trust">Trust</option>
                  <option value="betray">Betray</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player B Action
                </label>
                <select {...register('actionB')} className="input-field">
                  <option value="trust">Trust</option>
                  <option value="betray">Betray</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowManualMatch(false);
                  reset();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!selectedPlayerAId}
              >
                Run Match
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auto Simulation Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Automatic Simulation</h3>
        
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Add players first to run simulations!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Run multiple rounds where players are automatically matched based on reputation tiers. 
              Each player uses their configured trust percentage for decision making.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => runAutoRounds(1)}
                className="btn-primary flex items-center space-x-2"
                disabled={isSimulating}
              >
                <Play className="h-4 w-4" />
                <span>1 Round</span>
              </button>
              <button
                onClick={() => runAutoRounds(5)}
                className="btn-primary flex items-center space-x-2"
                disabled={isSimulating}
              >
                <Play className="h-4 w-4" />
                <span>5 Rounds</span>
              </button>
              <button
                onClick={() => runAutoRounds(10)}
                className="btn-primary flex items-center space-x-2"
                disabled={isSimulating}
              >
                <Play className="h-4 w-4" />
                <span>10 Rounds</span>
              </button>
              <button
                onClick={() => runAutoRounds(25)}
                className="btn-primary flex items-center space-x-2"
                disabled={isSimulating}
              >
                <Dice1 className="h-4 w-4" />
                <span>25 Rounds</span>
              </button>
            </div>
            
            {isSimulating && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Running simulation...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <History className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Recent Matches (Last 10)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Round</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Player A</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Player B</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Result</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Score Changes</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">Yield Split</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((match) => (
                  <tr key={match.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3 text-sm font-mono">#{match.round}</td>
                    <td className="py-2 px-3 text-sm">
                      <div className="font-medium">{match.playerA.name}</div>
                      <div className="text-xs text-gray-500">Rep: {match.playerA.reputation}</div>
                    </td>
                    <td className="py-2 px-3 text-sm">
                      {match.playerB ? (
                        <div>
                          <div className="font-medium">{match.playerB.name}</div>
                          <div className="text-xs text-gray-500">Rep: {match.playerB.reputation}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">Arbiter (AI)</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(match.actionA)}`}>
                          {getActionIcon(match.actionA)}
                        </span>
                        <span className="text-gray-400">vs</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(match.actionB)}`}>
                          {getActionIcon(match.actionB)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(match.result)}`}>
                        {match.result.replace('-', ' vs ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-sm font-mono">
                      <div className="space-y-1">
                        <div className={match.scoreChangeA >= 0 ? 'text-green-600' : 'text-red-600'}>
                          A: {match.scoreChangeA > 0 ? '+' : ''}{match.scoreChangeA}
                        </div>
                        <div className={match.scoreChangeB >= 0 ? 'text-green-600' : 'text-red-600'}>
                          B: {match.scoreChangeB > 0 ? '+' : ''}{match.scoreChangeB}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-sm font-mono">
                      <div className="space-y-1">
                        <div>${match.yieldShareA.toFixed(2)}</div>
                        <div>${match.yieldShareB.toFixed(2)}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {matches.length > 10 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Showing last 10 of {matches.length} total matches
            </div>
          )}
        </div>
      )}

      {/* Match Result Statistics */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-lg font-bold text-green-600">
              {matches.filter(m => m.result === 'trust-trust').length}
            </div>
            <p className="text-sm text-gray-500">Trust-Trust</p>
            <p className="text-xs text-gray-400">
              {matches.length > 0 ? Math.round((matches.filter(m => m.result === 'trust-trust').length / matches.length) * 100) : 0}%
            </p>
          </div>
          <div className="card text-center">
            <div className="text-lg font-bold text-yellow-600">
              {matches.filter(m => m.result === 'betray-trust' || m.result === 'trust-betray').length}
            </div>
            <p className="text-sm text-gray-500">Mixed</p>
            <p className="text-xs text-gray-400">
              {matches.length > 0 ? Math.round((matches.filter(m => m.result === 'betray-trust' || m.result === 'trust-betray').length / matches.length) * 100) : 0}%
            </p>
          </div>
          <div className="card text-center">
            <div className="text-lg font-bold text-red-600">
              {matches.filter(m => m.result === 'betray-betray').length}
            </div>
            <p className="text-sm text-gray-500">Betray-Betray</p>
            <p className="text-xs text-gray-400">
              {matches.length > 0 ? Math.round((matches.filter(m => m.result === 'betray-betray').length / matches.length) * 100) : 0}%
            </p>
          </div>
          <div className="card text-center">
            <div className="text-lg font-bold text-blue-600">
              ${matches.reduce((sum, match) => sum + match.totalYieldGenerated, 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total Yield</p>
            <p className="text-xs text-gray-400">Generated</p>
          </div>
        </div>
      )}
    </div>
  );
} 