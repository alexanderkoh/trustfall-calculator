'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Play, Pause, RotateCcw, Timer, Settings } from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { SimulationMode } from '@/types/simulation';

const timeConfigSchema = z.object({
  matchesPerDay: z.number().min(1, 'Must have at least 1 match per day').max(1440, 'Cannot exceed 1440 matches per day'),
  matchDurationMinutes: z.number().min(1, 'Match duration must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
  simulationMode: z.enum(['rounds', 'days', 'weeks', 'months']),
  targetAmount: z.number().min(1, 'Target amount must be at least 1'),
  simulationSpeed: z.number().min(1, 'Speed must be at least 1x').max(100, 'Speed cannot exceed 100x'),
});

type TimeConfigData = z.infer<typeof timeConfigSchema>;

export function TimeControls() {
  const { 
    config, 
    players,
    matches,
    currentRound,
    updateConfig, 
    updateSimulationMode,
    pauseSimulation,
    resumeSimulation,
    resetSimulation 
  } = useSimulationStore();



  const { register, handleSubmit, watch, formState: { errors } } = useForm<TimeConfigData>({
    resolver: zodResolver(timeConfigSchema),
    defaultValues: {
      matchesPerDay: config.matchesPerDay,
      matchDurationMinutes: config.matchDurationMinutes,
      simulationMode: config.simulationMode,
      targetAmount: config.targetAmount,
      simulationSpeed: config.simulationSpeed,
    },
  });

  const watchedValues = watch();

  // Calculate derived values
  const minutesBetweenMatches = 1440 / watchedValues.matchesPerDay; // 1440 minutes in a day
  const matchesPerHour = watchedValues.matchesPerDay / 24;
  const simulationInterval = 1000 / watchedValues.simulationSpeed; // milliseconds

  const onSubmit = (data: TimeConfigData) => {
    updateConfig({
      matchesPerDay: data.matchesPerDay,
      matchDurationMinutes: data.matchDurationMinutes,
      simulationSpeed: data.simulationSpeed,
    });
    updateSimulationMode(data.simulationMode, data.targetAmount);
  };





  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toFixed(0)}m`;
  };

  const formatDate = (date: Date | string | unknown) => {
    // Convert to Date object if it's not already
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date && typeof date === 'object' && 'getTime' in date && typeof (date as { getTime: () => number }).getTime === 'function') {
      dateObj = new Date((date as { getTime: () => number }).getTime());
    } else {
      return 'Invalid Date';
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Time-Based Simulation Controls</h2>
        </div>
        <div className="flex items-center space-x-3">
          {config.isPaused ? (
            <button
              onClick={resumeSimulation}
              className="btn-secondary flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="btn-secondary flex items-center space-x-2"
            >
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </button>
          )}
          <button
            onClick={resetSimulation}
            className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(() => {
              try {
                if (!config.currentDate) return 'Not Set';
                return formatDate(config.currentDate);
              } catch {
                return 'Invalid Date';
              }
            })()}
          </div>
          <p className="text-sm text-gray-500">Current Simulation Time</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {config.matchesPerDay}
          </div>
          <p className="text-sm text-gray-500">Matches Per Day</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(config.matchDurationMinutes)}
          </div>
          <p className="text-sm text-gray-500">Match Duration</p>
        </div>
        <div className="card text-center">
          <div className={`text-2xl font-bold ${config.isPaused ? 'text-red-600' : 'text-green-600'}`}>
            {config.isPaused ? 'PAUSED' : 'ACTIVE'}
          </div>
          <p className="text-sm text-gray-500">Simulation Status</p>
        </div>
      </div>

      {/* Time Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Time & Match Configuration</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Matches Per Day
              </label>
              <input
                {...register('matchesPerDay', { valueAsNumber: true })}
                type="number"
                min="1"
                max="1440"
                className="input-field"
                placeholder="144"
              />
              {errors.matchesPerDay && (
                <p className="text-red-500 text-sm mt-1">{errors.matchesPerDay.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Every {formatTime(minutesBetweenMatches)} ({matchesPerHour.toFixed(1)}/hour)
              </p>
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
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Update Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Simulation Mode Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Simulation Execution Mode
        </h3>
        
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Add players first to configure simulation execution!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Simulation Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Execution Mode
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['rounds', 'days', 'weeks', 'months'] as SimulationMode[]).map((mode) => (
                  <label
                    key={mode}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      watchedValues.simulationMode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('simulationMode')}
                      value={mode}
                      className="sr-only"
                    />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <p className={`font-medium capitalize ${
                            watchedValues.simulationMode === mode
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {mode}
                          </p>
                          <p className={`text-xs ${
                            watchedValues.simulationMode === mode
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {mode === 'rounds' && 'Discrete rounds'}
                            {mode === 'days' && 'Calendar days'}
                            {mode === 'weeks' && '7-day periods'}
                            {mode === 'months' && '30-day periods'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Amount Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Amount
              </label>
              <input
                {...register('targetAmount', { valueAsNumber: true })}
                type="number"
                min="1"
                className="input-field"
                placeholder={
                  watchedValues.simulationMode === 'rounds' ? '100' :
                  watchedValues.simulationMode === 'days' ? '7' :
                  watchedValues.simulationMode === 'weeks' ? '4' : '12'
                }
              />
              {errors.targetAmount && (
                <p className="text-red-500 text-sm mt-1">{errors.targetAmount.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Number of {watchedValues.simulationMode} to simulate
              </p>
            </div>

            {/* Simulation Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Simulation Speed (multiplier)
              </label>
              <input
                {...register('simulationSpeed', { valueAsNumber: true })}
                type="range"
                min="1"
                max="100"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1x (Realtime)</span>
                <span className="font-medium">{watchedValues.simulationSpeed}x</span>
                <span>100x (Fast)</span>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Simulation Preview</h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium capitalize">{watchedValues.simulationMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{watchedValues.targetAmount} {watchedValues.simulationMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Matches:</span>
                  <span className="font-medium">
                    {(() => {
                      const mode = watchedValues.simulationMode;
                      const amount = watchedValues.targetAmount;
                      const matchesPerDay = watchedValues.matchesPerDay;
                      
                      switch (mode) {
                        case 'rounds':
                          return Math.ceil(amount * Math.max(1, Math.floor(players.length / 2)));
                        case 'days':
                          return Math.floor(amount * matchesPerDay);
                        case 'weeks':
                          return Math.floor(amount * 7 * matchesPerDay);
                        case 'months':
                          return Math.floor(amount * 30 * matchesPerDay);
                        default:
                          return 0;
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-medium">{watchedValues.simulationSpeed}x</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Simulation Schedule Info */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Simulation Schedule</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p><strong>Match Frequency:</strong> Every {formatTime(minutesBetweenMatches)}</p>
            <p><strong>Matches Per Hour:</strong> {matchesPerHour.toFixed(1)}</p>
            <p><strong>Daily Match Volume:</strong> {watchedValues.matchesPerDay}</p>
            <p><strong>Weekly Volume:</strong> {(watchedValues.matchesPerDay * 7).toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Match Duration:</strong> {formatTime(watchedValues.matchDurationMinutes)}</p>
            <p><strong>Total Players:</strong> {players.length}</p>
            <p><strong>Current Round:</strong> {currentRound}</p>
            <p><strong>Total Matches:</strong> {matches.length}</p>
          </div>
        </div>
      </div>

      {/* Time-based Statistics */}
      {matches.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Time-Based Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {(() => {
                  try {
                    if (!config.simulationStartDate) return '0.0';
                    const startDate = config.simulationStartDate instanceof Date ? config.simulationStartDate : new Date(config.simulationStartDate);
                    if (isNaN(startDate.getTime())) return '0.0';
                    return (matches.length / Math.max(1, (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1);
                  } catch {
                    return '0.0';
                  }
                })()}
              </div>
              <p className="text-sm text-gray-500">Avg Matches/Day</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatTime(matches.reduce((sum, match) => sum + config.matchDurationMinutes, 0))}
              </div>
              <p className="text-sm text-gray-500">Total Match Time</p>
            </div>
            <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">
              {(() => {
                try {
                  if (!config.simulationStartDate) return 0;
                  const startDate = config.simulationStartDate instanceof Date ? config.simulationStartDate : new Date(config.simulationStartDate);
                  if (isNaN(startDate.getTime())) return 0;
                  return Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                } catch {
                  return 0;
                }
              })()}
            </div>
              <p className="text-sm text-gray-500">Days Since Start</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {matches.length > 0 ? (matches.length / currentRound).toFixed(1) : '0'}
              </div>
              <p className="text-sm text-gray-500">Avg Matches/Round</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 