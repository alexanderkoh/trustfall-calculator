'use client';

import { useState } from 'react';
import { 
  Play, Pause, RotateCcw, BarChart3, Users, Target, 
  Clock, TrendingUp, Activity, Settings, Eye, FastForward 
} from 'lucide-react';
import { MatchSimulator } from './MatchSimulator';
import { Dashboard } from './Dashboard';
import { useSimulationStore } from '@/store/simulation';

export function SimulationRunning() {
  const { 
    players, 
    matches, 
    currentRound, 
    statistics, 
    config,
    executeSimulation,
    updateSimulationMode
  } = useSimulationStore();
  const [activeView, setActiveView] = useState<'matches' | 'dashboard'>('matches');
  const [isExecuting, setIsExecuting] = useState(false);

  const views = [
    {
      id: 'matches',
      title: 'Match Controls',
      description: 'Run matches and monitor player interactions',
      icon: <Target className="w-5 h-5" />,
      component: <MatchSimulator />
    },
    {
      id: 'dashboard',
      title: 'Live Analytics',
      description: 'Real-time simulation metrics and visualizations',
      icon: <BarChart3 className="w-5 h-5" />,
      component: <Dashboard />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Status Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-6 h-6 mr-3 text-green-500" />
              Simulation Running
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and control your active simulation
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-500">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentRound}</div>
              <div className="text-sm text-gray-500">Current Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{matches.length}</div>
              <div className="text-sm text-gray-500">Total Matches</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Score</div>
                <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {players.reduce((sum, p) => sum + p.score, 0).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm text-green-600 font-medium">Avg Score</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-200">
                  {players.length > 0 ? (players.reduce((sum, p) => sum + p.score, 0) / players.length).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-purple-600 mr-2" />
              <div>
                <div className="text-sm text-purple-600 font-medium">Trust Rate</div>
                <div className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {statistics.totalMatches > 0 ? ((statistics.trustTrustMatches / statistics.totalMatches) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <div className="text-sm text-orange-600 font-medium">Avg Rep</div>
                <div className="text-xl font-bold text-orange-800 dark:text-orange-200">
                  {players.length > 0 ? (players.reduce((sum, p) => sum + p.reputation, 0) / players.length).toFixed(0) : '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as 'matches' | 'dashboard')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {view.icon}
                <span className="ml-2">{view.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {views.find(v => v.id === activeView)?.component}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Quick Actions
        </h4>
        
        {/* Simulation Execution Controls */}
        <div className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <FastForward className="w-4 h-4 mr-2 text-blue-500" />
            Execute Simulation
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Run simulation based on your configured mode and target amount.
          </p>
          
          {/* Current Configuration Display */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Mode:</span>
                <span className="ml-2 font-medium capitalize">{config.simulationMode}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Target:</span>
                <span className="ml-2 font-medium">{config.targetAmount} {config.simulationMode}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Speed:</span>
                <span className="ml-2 font-medium">{config.simulationSpeed}x</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Players:</span>
                <span className="ml-2 font-medium">{players.length}</span>
              </div>
            </div>
          </div>

          {/* Execution Button */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                if (players.length === 0) return;
                setIsExecuting(true);
                try {
                  await executeSimulation(config.simulationMode, config.targetAmount);
                } finally {
                  setIsExecuting(false);
                }
              }}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center"
              disabled={players.length === 0 || isExecuting}
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                <>
                  <FastForward className="w-4 h-4 mr-2" />
                  Execute Simulation
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                // Quick execution options
                const quickOptions = [
                  { mode: 'rounds' as const, amount: 10, label: '10 Rounds' },
                  { mode: 'days' as const, amount: 1, label: '1 Day' },
                  { mode: 'weeks' as const, amount: 1, label: '1 Week' },
                  { mode: 'months' as const, amount: 1, label: '1 Month' },
                ];
                
                const option = quickOptions[Math.floor(Math.random() * quickOptions.length)];
                updateSimulationMode(option.mode, option.amount);
                executeSimulation(option.mode, option.amount);
              }}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center"
              disabled={players.length === 0 || isExecuting}
            >
              <Play className="w-4 h-4 mr-2" />
              Quick Run
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => window.location.href = '#simulation-settings'}
            className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="flex items-center">
              <Settings className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Adjust Settings</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Modify simulation parameters</p>
          </button>
          
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="flex items-center">
              <Eye className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">See detailed metrics</p>
          </button>
          
          <button
            onClick={() => window.location.href = '#analysis'}
            className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Deep Analysis</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Advanced insights</p>
          </button>
          
          <button
            onClick={() => window.location.href = '#scenarios'}
            className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
          >
            <div className="flex items-center">
              <RotateCcw className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Save Scenario</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Export current state</p>
          </button>
        </div>
      </div>
    </div>
  );
} 