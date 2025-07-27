'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Trash2, RotateCcw, Users, UserPlus, Settings, Brain } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { Player, STRATEGIES, StrategyType } from '@/types/simulation';


const playerSchema = z.object({
  name: z.string().min(1, 'Player name is required').max(50, 'Name too long'),
  initialDeposit: z.number().min(1, 'Deposit must be at least $1').max(1000000, 'Deposit too large'),
  reputation: z.number().min(0, 'Reputation cannot be negative').max(100, 'Reputation cannot exceed 100'),
  strategyType: z.enum(['percentage', 'tit_for_tat', 'always_cooperate', 'always_defect', 'random', 'tit_for_two_tats', 'grim_trigger', 'pavlov', 'generous_tit_for_tat', 'firm_but_fair', 'suspicious_tit_for_tat', 'soft_majority', 'hard_majority', 'prober', 'random_tit_for_tat', 'contrite_tit_for_tat', 'adaptive'] as const),
  trustPercentage: z.number().min(0, 'Trust percentage cannot be negative').max(100, 'Trust percentage cannot exceed 100').optional(),
});

const bulkPlayerSchema = z.object({
  count: z.number().min(1, 'Must create at least 1 player').max(100, 'Cannot create more than 100 players at once'),
  namePrefix: z.string().min(1, 'Name prefix is required').max(20, 'Prefix too long'),
  depositMin: z.number().min(1, 'Minimum deposit must be at least $1').max(1000000, 'Deposit too large'),
  depositMax: z.number().min(1, 'Maximum deposit must be at least $1').max(1000000, 'Deposit too large'),
  depositVariance: z.number().min(0, 'Variance cannot be negative').max(100, 'Variance cannot exceed 100%'),
  reputationMin: z.number().min(0, 'Minimum reputation cannot be negative').max(100, 'Reputation cannot exceed 100'),
  reputationMax: z.number().min(0, 'Maximum reputation cannot be negative').max(100, 'Reputation cannot exceed 100'),
  strategyAssignment: z.enum(['percentage', 'random', 'specific'] as const),
  specificStrategy: z.enum(['tit_for_tat', 'always_cooperate', 'always_defect', 'random', 'tit_for_two_tats', 'grim_trigger', 'pavlov', 'generous_tit_for_tat', 'firm_but_fair', 'suspicious_tit_for_tat', 'soft_majority', 'hard_majority', 'prober', 'random_tit_for_tat', 'contrite_tit_for_tat', 'adaptive'] as const).optional(),
  trustMin: z.number().min(0, 'Minimum trust cannot be negative').max(100, 'Trust cannot exceed 100').optional(),
  trustMax: z.number().min(0, 'Maximum trust cannot be negative').max(100, 'Trust cannot exceed 100').optional(),
  trustVariance: z.number().min(0, 'Variance cannot be negative').max(100, 'Variance cannot exceed 100%').optional(),
});

type PlayerFormData = z.infer<typeof playerSchema>;
type BulkPlayerFormData = z.infer<typeof bulkPlayerSchema>;

export function PlayerManagement() {
  const { players, addPlayer, removePlayer, updatePlayer, resetPlayerData, clearAllPlayers } = useSimulationStore();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [previewBulk, setPreviewBulk] = useState<Array<{
    name: string;
    initialDeposit: number;
    reputation: number;
    strategy: string;
    faction: string;
  }>>([]);

  // Function to find the next available player number for a given prefix
  const getNextPlayerNumber = (prefix: string): number => {
    const existingPlayers = players.filter(player => 
      player.name.startsWith(prefix + ' ') && 
      /^\d+$/.test(player.name.substring(prefix.length + 1))
    );
    
    if (existingPlayers.length === 0) {
      return 1;
    }
    
    const numbers = existingPlayers.map(player => {
      const numberStr = player.name.substring(prefix.length + 1);
      return parseInt(numberStr, 10);
    });
    
    return Math.max(...numbers) + 1;
  };


  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: '',
      initialDeposit: 1000,
      reputation: 50,
      strategyType: 'percentage',
      trustPercentage: 50,
    },
  });

  const bulkForm = useForm<BulkPlayerFormData>({
    resolver: zodResolver(bulkPlayerSchema),
    defaultValues: {
      count: 10,
      namePrefix: 'Player',
      depositMin: 100,
      depositMax: 10000,
      depositVariance: 20,
      reputationMin: 20,
      reputationMax: 80,
      strategyAssignment: 'random',
      trustMin: 20,
      trustMax: 80,
      trustVariance: 15,
    },
  });

  const onSubmit = (data: PlayerFormData) => {
    // Check if player name already exists (only for new players, not when editing)
    if (!editingPlayer && players.some(player => player.name === data.name)) {
      alert(`A player with the name "${data.name}" already exists. Please choose a different name.`);
      return;
    }

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, data);
      setEditingPlayer(null);
      playerForm.reset();
    } else {
      addPlayer(data);
      playerForm.reset();
    }
  };

  const onBulkSubmit = (data: BulkPlayerFormData) => {
    const createdPlayers = [];
    const startNumber = getNextPlayerNumber(data.namePrefix);
    
    for (let i = 0; i < data.count; i++) {
      // Generate random deposit with variance
      const depositRange = data.depositMax - data.depositMin;
      const depositVarianceAmount = (depositRange * data.depositVariance) / 100;
      const depositRandom = Math.random() * depositVarianceAmount * 2 - depositVarianceAmount;
      const deposit = Math.max(1, Math.round(data.depositMin + (depositRange * Math.random()) + depositRandom));

      // Generate random reputation
      const reputation = Math.round(data.reputationMin + Math.random() * (data.reputationMax - data.reputationMin));

      // Determine strategy
      let strategy: StrategyType;
      if (data.strategyAssignment === 'percentage') {
        strategy = 'percentage';
      } else if (data.strategyAssignment === 'specific' && data.specificStrategy) {
        strategy = data.specificStrategy;
      } else {
        // Random strategy
        const strategyTypes = Object.keys(STRATEGIES).filter(type => type !== 'percentage') as StrategyType[];
        strategy = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
      }

      const playerData = {
        name: `${data.namePrefix} ${startNumber + i}`,
        initialDeposit: deposit,
        reputation: reputation,
        strategy: strategy,
        ...(strategy === 'percentage' && data.trustMin && data.trustMax && {
          trustPercentage: Math.max(0, Math.min(100, Math.round(data.trustMin + (data.trustMax - data.trustMin) * Math.random())))
        })
      };

      addPlayer(playerData);
      createdPlayers.push(playerData);
    }

    setShowBulkCreate(false);
    bulkForm.reset();
    setPreviewBulk([]);
  };

  const generatePreview = () => {
    const data = bulkForm.getValues();
    const preview = [];
    const startNumber = getNextPlayerNumber(data.namePrefix);
    
    for (let i = 0; i < Math.min(data.count, 5); i++) {
      // Generate random deposit with variance
      const depositRange = data.depositMax - data.depositMin;
      const depositVarianceAmount = (depositRange * data.depositVariance) / 100;
      const depositRandom = Math.random() * depositVarianceAmount * 2 - depositVarianceAmount;
      const deposit = Math.max(1, Math.round(data.depositMin + (depositRange * Math.random()) + depositRandom));

      // Generate random reputation
      const reputation = Math.round(data.reputationMin + Math.random() * (data.reputationMax - data.reputationMin));

      // Determine strategy for preview
      let strategyName = 'Random';
      if (data.strategyAssignment === 'percentage') {
        strategyName = 'Percentage Trust';
      } else if (data.strategyAssignment === 'specific' && data.specificStrategy) {
        strategyName = STRATEGIES[data.specificStrategy].name;
      }

      preview.push({
        name: `${data.namePrefix} ${startNumber + i}`,
        initialDeposit: deposit,
        reputation: reputation,
        strategy: strategyName,
        faction: reputation >= 0 && reputation <= 40 ? 'Shadow Syndicate' : 
                reputation >= 41 && reputation <= 59 ? 'Free Agents' : 'Lumina Collective',
      });
    }
    
    setPreviewBulk(preview);
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'Shadow Syndicate': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'Free Agents': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Lumina Collective': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const factionStats = {
    'Shadow Syndicate': players.filter(p => p.faction === 'Shadow Syndicate').length,
    'Free Agents': players.filter(p => p.faction === 'Free Agents').length,
    'Lumina Collective': players.filter(p => p.faction === 'Lumina Collective').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Player Management</h2>
        </div>
        <div className="flex items-center space-x-3">
          {players.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all players? This will also reset all matches and simulation data.')) {
                  clearAllPlayers();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              title="Clear all players and reset simulation data"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
          <button
            onClick={() => setShowBulkCreate(!showBulkCreate)}
            className="btn-secondary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{showBulkCreate ? 'Cancel Bulk' : 'Bulk Create'}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{players.length}</div>
          <p className="text-sm text-gray-500">Total Players</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{factionStats['Shadow Syndicate']}</div>
          <p className="text-sm text-gray-500">Shadow Syndicate</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{factionStats['Free Agents']}</div>
          <p className="text-sm text-gray-500">Free Agents</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{factionStats['Lumina Collective']}</div>
          <p className="text-sm text-gray-500">Lumina Collective</p>
        </div>
      </div>

      {/* Bulk Player Creation */}
      {showBulkCreate && (
        <div className="card border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">Bulk Player Creation</h3>
          </div>
          
          <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of Players
                </label>
                <input
                  {...bulkForm.register('count', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="100"
                  className="input-field"
                />
                {bulkForm.formState.errors.count && (
                  <p className="text-red-500 text-sm mt-1">{bulkForm.formState.errors.count.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name Prefix
                </label>
                <input
                  {...bulkForm.register('namePrefix')}
                  type="text"
                  className="input-field"
                  placeholder="Player"
                />
                {bulkForm.formState.errors.namePrefix && (
                  <p className="text-red-500 text-sm mt-1">{bulkForm.formState.errors.namePrefix.message}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-3">Deposit Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Deposit ($)
                  </label>
                  <input
                    {...bulkForm.register('depositMin', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Deposit ($)
                  </label>
                  <input
                    {...bulkForm.register('depositMax', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Variance (%)
                  </label>
                  <input
                    {...bulkForm.register('depositVariance', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">Randomness within range</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Strategy Assignment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignment Type
                  </label>
                  <select
                    {...bulkForm.register('strategyAssignment')}
                    className="input-field"
                  >
                    <option value="percentage">Percentage Trust (Random %)</option>
                    <option value="random">Random Strategies</option>
                    <option value="specific">Specific Strategy</option>
                  </select>
                </div>
                
                {bulkForm.watch('strategyAssignment') === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Strategy
                    </label>
                    <select
                      {...bulkForm.register('specificStrategy')}
                      className="input-field"
                    >
                      {Object.entries(STRATEGIES).filter(([key]) => key !== 'percentage').map(([key, strategy]) => (
                        <option key={key} value={key}>
                          {strategy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {bulkForm.watch('strategyAssignment') === 'percentage' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Trust (%)
                      </label>
                      <input
                        {...bulkForm.register('trustMin', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Trust (%)
                      </label>
                      <input
                        {...bulkForm.register('trustMax', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Variance (%)
                      </label>
                      <input
                        {...bulkForm.register('trustVariance', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="input-field"
                      />
                      <p className="text-xs text-gray-500 mt-1">Randomness within range</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-3">Reputation Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Reputation
                  </label>
                  <input
                    {...bulkForm.register('reputationMin', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Reputation
                  </label>
                  <input
                    {...bulkForm.register('reputationMax', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={generatePreview}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Preview Sample</span>
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Players will be named: {bulkForm.watch('namePrefix')} {getNextPlayerNumber(bulkForm.watch('namePrefix'))} to {bulkForm.watch('namePrefix')} {getNextPlayerNumber(bulkForm.watch('namePrefix')) + bulkForm.watch('count') - 1}
                </div>
              </div>
              <button type="submit" className="btn-primary">
                Create {bulkForm.watch('count')} Players
              </button>
            </div>
          </form>

          {/* Preview Results */}
          {previewBulk.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium mb-3">Preview (First 5 Players)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-right py-2 px-3">Deposit</th>
                      <th className="text-right py-2 px-3">Strategy</th>
                      <th className="text-right py-2 px-3">Reputation</th>
                      <th className="text-right py-2 px-3">Faction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewBulk.map((player, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3 font-medium">{player.name}</td>
                        <td className="py-2 px-3 text-right font-mono">${player.initialDeposit.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{player.strategy}</td>
                        <td className="py-2 px-3 text-right">{player.reputation}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFactionColor(player.faction)}`}>
                            {player.faction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Player Creation */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Add Single Player</h3>
        <form onSubmit={playerForm.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Player Name
              </label>
              <input
                {...playerForm.register('name')}
                type="text"
                className="input-field"
                placeholder="Enter player name"
              />
              {playerForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{playerForm.formState.errors.name.message}</p>
              )}
              {!editingPlayer && (
                <p className="text-xs text-gray-500 mt-1">
                  Next available: Player {getNextPlayerNumber('Player')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Deposit ($)
              </label>
              <input
                {...playerForm.register('initialDeposit', { valueAsNumber: true })}
                type="number"
                min="1"
                className="input-field"
                placeholder="1000"
              />
              {playerForm.formState.errors.initialDeposit && (
                <p className="text-red-500 text-sm mt-1">{playerForm.formState.errors.initialDeposit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reputation (0-100)
              </label>
              <input
                {...playerForm.register('reputation', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                className="input-field"
                placeholder="50"
              />
              {playerForm.formState.errors.reputation && (
                <p className="text-red-500 text-sm mt-1">{playerForm.formState.errors.reputation.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strategy Type
              </label>
              <select
                {...playerForm.register('strategyType')}
                className="input-field"
              >
                {Object.entries(STRATEGIES).map(([key, strategy]) => (
                  <option key={key} value={key}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              {playerForm.formState.errors.strategyType && (
                <p className="text-red-500 text-sm mt-1">{playerForm.formState.errors.strategyType.message}</p>
              )}
            </div>

            {playerForm.watch('strategyType') === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trust Percentage (%)
                </label>
                <input
                  {...playerForm.register('trustPercentage', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  placeholder="50"
                />
                {playerForm.formState.errors.trustPercentage && (
                  <p className="text-red-500 text-sm mt-1">{playerForm.formState.errors.trustPercentage.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              {editingPlayer ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>

      {/* Players Table */}
      {players.length > 0 ? (
        <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Active Players ({players.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Deposit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Reputation</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Strategy</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Matches</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr 
                    key={player.id} 
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                        <div className="text-sm text-gray-500">{player.faction}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ${player.currentDeposit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${player.reputation}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-8">{player.reputation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm">{player.strategy?.name || 'Percentage Trust'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${player.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {player.score > 0 ? '+' : ''}{player.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono">{player.totalMatches}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingPlayer(player);
                            playerForm.reset({
                              name: player.name,
                              initialDeposit: player.initialDeposit,
                              reputation: player.reputation,
                              strategyType: player.strategy?.type || 'percentage',
                              trustPercentage: player.strategy?.type === 'percentage' ? player.strategy.trustPercentage : 50,
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resetPlayerData(player.id)}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Clear All Players Section */}
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Players
                </h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  This will remove all players and reset the entire simulation data including matches, scores, and tokens.
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('⚠️ WARNING: This will permanently delete all players and reset the entire simulation!\n\nThis action cannot be undone. Are you sure you want to continue?')) {
                    clearAllPlayers();
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Players</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Players Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add players to start simulating the Trustfall Protocol.
          </p>
        </div>
      )}


    </div>
  );
} 