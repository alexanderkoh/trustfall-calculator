'use client';

import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Users, Target, Coins, 
  PieChart, Activity, Filter, Download, Eye, UserCheck, DollarSign, Brain
} from 'lucide-react';
import { Dashboard } from './Dashboard';
import { ScenarioManager } from './ScenarioManager';
import { PlayerDetails } from './PlayerDetails';
import { ProtocolRevenueAnalytics } from './ProtocolRevenueAnalytics';
import { useSimulationStore } from '@/store/simulation';
import { Player } from '@/types/simulation';


interface PlayerPerformanceViewProps {
  onPlayerSelect: (player: Player) => void;
}

function PlayerPerformanceView({ onPlayerSelect }: PlayerPerformanceViewProps) {
  const { players, matches, statistics } = useSimulationStore();

  // Calculate performance metrics
  const playerStats = players.map(player => {
    const playerMatches = matches.filter(m => 
      m.playerA.id === player.id || (m.playerB && m.playerB.id === player.id)
    );
    
    const wins = playerMatches.filter(m => {
      const isPlayerA = m.playerA.id === player.id;
      const scoreChange = isPlayerA ? m.scoreChangeA : m.scoreChangeB;
      return scoreChange > 0;
    }).length;
    
    const trustActions = playerMatches.filter(m => {
      const isPlayerA = m.playerA.id === player.id;
      const action = isPlayerA ? m.actionA : m.actionB;
      return action === 'trust';
    }).length;
    
    const avgScorePerMatch = playerMatches.length > 0 ? 
      playerMatches.reduce((sum, m) => {
        const isPlayerA = m.playerA.id === player.id;
        return sum + (isPlayerA ? m.scoreChangeA : m.scoreChangeB);
      }, 0) / playerMatches.length : 0;
    
    const reputationChange = player.reputation - (player.reputationHistory?.[0]?.oldReputation || player.reputation);
    
    return {
      ...player,
      matchesPlayed: playerMatches.length,
      wins,
      winRate: playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0,
      trustActions,
      trustRate: playerMatches.length > 0 ? (trustActions / playerMatches.length) * 100 : 0,
      avgScorePerMatch,
      reputationChange,
      totalYield: player.finalYield,
      strategyName: player.strategy?.name || 'Percentage Trust',
      strategyDescription: player.strategy?.description || 'Default strategy',
    };
  });

  // Sort by different criteria
  const topScorers = [...playerStats].sort((a, b) => b.score - a.score);
  const topWinners = [...playerStats].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{players.length}</div>
          <p className="text-sm text-gray-500">Total Players</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{statistics.totalMatches}</div>
          <p className="text-sm text-gray-500">Total Matches</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {players.length > 0 ? (playerStats.reduce((sum, p) => sum + p.avgScorePerMatch, 0) / players.length).toFixed(1) : '0'}
          </div>
          <p className="text-sm text-gray-500">Avg Score/Match</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {players.length > 0 ? (playerStats.reduce((sum, p) => sum + p.winRate, 0) / players.length).toFixed(1) : '0'}%
          </div>
          <p className="text-sm text-gray-500">Avg Win Rate</p>
        </div>
      </div>

      {/* Player Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {topScorers.slice(0, 5).map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => onPlayerSelect(player)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{player.faction}</p>
                      <span className="text-xs text-purple-500">•</span>
                      <p className="text-sm text-purple-500">{player.strategyName}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{player.score}</p>
                  <p className="text-sm text-gray-500">{player.matchesPlayed} matches</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Win Rates */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Best Win Rates
          </h3>
          <div className="space-y-3">
            {topWinners.slice(0, 5).map((player, index) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => onPlayerSelect(player)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{player.faction}</p>
                      <span className="text-xs text-purple-500">•</span>
                      <p className="text-sm text-purple-500">{player.strategyName}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{player.winRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{player.wins}/{player.matchesPlayed}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Performance Analysis */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Strategy Performance Analysis
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Distribution */}
          <div>
            <h4 className="font-medium mb-3">Strategy Distribution</h4>
            <div className="space-y-2">
              {Object.entries(
                playerStats.reduce((acc, player) => {
                  acc[player.strategyName] = (acc[player.strategyName] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([,a], [,b]) => b - a)
                .map(([strategy, count]) => (
                  <div key={strategy} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="font-medium">{strategy}</span>
                    <span className="text-sm text-gray-500">{count} players</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Performing Strategies */}
          <div>
            <h4 className="font-medium mb-3">Top Performing Strategies</h4>
            <div className="space-y-2">
              {Object.entries(
                playerStats.reduce((acc, player) => {
                  if (!acc[player.strategyName]) {
                    acc[player.strategyName] = { totalScore: 0, count: 0, avgWinRate: 0 };
                  }
                  acc[player.strategyName].totalScore += player.score;
                  acc[player.strategyName].count += 1;
                  acc[player.strategyName].avgWinRate += player.winRate;
                  return acc;
                }, {} as Record<string, { totalScore: number; count: number; avgWinRate: number }>)
              )
                .map(([strategy, stats]) => ({
                  strategy,
                  avgScore: stats.totalScore / stats.count,
                  avgWinRate: stats.avgWinRate / stats.count,
                  count: stats.count
                }))
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 5)
                .map((strategy, index) => (
                  <div key={strategy.strategy} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium">{strategy.strategy}</span>
                        <div className="text-xs text-gray-500">{strategy.count} players</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{strategy.avgScore.toFixed(1)} avg score</div>
                      <div className="text-xs text-gray-500">{strategy.avgWinRate.toFixed(1)}% win rate</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* All Players Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Players Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click on any player to view detailed analysis</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Strategy</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Reputation</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Win Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Trust Rate</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Matches</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Yield</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((player) => (
                <tr 
                  key={player.id} 
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => onPlayerSelect(player)}
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                      <div className="text-sm text-gray-500">{player.faction}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{player.strategyName}</div>
                        <div className="text-xs text-gray-500 max-w-xs truncate" title={player.strategyDescription}>
                          {player.strategyDescription}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono ${player.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {player.score > 0 ? '+' : ''}{player.score}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="font-mono">{player.reputation}</span>
                      <span className={`text-xs ${player.reputationChange > 0 ? 'text-green-600' : player.reputationChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {player.reputationChange > 0 ? '+' : ''}{player.reputationChange}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono">{player.winRate.toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono">{player.trustRate.toFixed(1)}%</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono">{player.matchesPlayed}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono">${player.totalYield.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Analysis() {
  const { players, statistics } = useSimulationStore();
  const [activeView, setActiveView] = useState<'analytics' | 'scenarios' | 'players' | 'protocol'>('analytics');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const views = [
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      description: 'Deep insights and comprehensive visualizations',
      icon: <BarChart3 className="w-5 h-5" />,
      component: <Dashboard />
    },
    {
      id: 'players',
      title: 'Player Performance',
      description: 'Detailed player analysis and reputation tracking',
      icon: <UserCheck className="w-5 h-5" />,
      component: <PlayerPerformanceView onPlayerSelect={setSelectedPlayer} />
    },
    {
      id: 'protocol',
      title: 'Protocol Revenue',
      description: 'Track protocol earnings, buybacks, and burn effects',
      icon: <DollarSign className="w-5 h-5" />,
      component: <ProtocolRevenueAnalytics />
    },
    {
      id: 'scenarios',
      title: 'Scenario Management',
      description: 'Save, load, and compare simulation scenarios',
      icon: <Target className="w-5 h-5" />,
      component: <ScenarioManager />
    }
  ];

  // Calculate advanced metrics
  const factionStats = {
    'Shadow Syndicate': players.filter(p => p.faction === 'Shadow Syndicate'),
    'Free Agents': players.filter(p => p.faction === 'Free Agents'),
    'Lumina Collective': players.filter(p => p.faction === 'Lumina Collective')
  };

  const topPerformers = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
  const bottomPerformers = [...players].sort((a, b) => a.score - b.score).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-purple-500" />
              Deep Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Advanced insights and comprehensive simulation analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Faction Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(factionStats).map(([faction, factionPlayers]) => (
                <div key={faction} className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">{faction}</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {factionPlayers.length} ({players.length > 0 ? ((factionPlayers.length / players.length) * 100).toFixed(0) : '0'}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Match Outcomes
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Trust-Trust</span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {statistics.trustTrustMatches} ({statistics.totalMatches > 0 ? ((statistics.trustTrustMatches / statistics.totalMatches) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Betray-Trust</span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {statistics.betrayTrustMatches} ({statistics.totalMatches > 0 ? ((statistics.betrayTrustMatches / statistics.totalMatches) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Betray-Betray</span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {statistics.betrayBetrayMatches} ({statistics.totalMatches > 0 ? ((statistics.betrayBetrayMatches / statistics.totalMatches) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
              <Coins className="w-4 h-4 mr-2" />
              Economic Metrics
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300">Total Yield</span>
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  ${statistics.totalYieldGenerated.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300">Tokens Distributed</span>
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  {statistics.totalTokensDistributed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300">Avg Yield/Player</span>
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  ${players.length > 0 ? (statistics.totalYieldGenerated / players.length).toFixed(0) : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {topPerformers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                    <div className="text-sm text-gray-500">{player.faction}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{player.score}</div>
                  <div className="text-sm text-gray-500">Rep: {player.reputation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-red-500" />
            Bottom Performers
          </h3>
          <div className="space-y-3">
            {bottomPerformers.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {players.length - index}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                    <div className="text-sm text-gray-500">{player.faction}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{player.score}</div>
                  <div className="text-sm text-gray-500">Rep: {player.reputation}</div>
                </div>
              </div>
            ))}
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
                onClick={() => setActiveView(view.id as 'analytics' | 'scenarios' | 'players' | 'protocol')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeView === view.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
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
          <Filter className="w-4 h-4 mr-2" />
          Analysis Tools
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left">
            <div className="flex items-center">
              <Eye className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Player Analysis</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Individual player insights</p>
          </button>
          
          <button className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left">
            <div className="flex items-center">
              <PieChart className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Faction Analysis</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Faction performance comparison</p>
          </button>
          
          <button className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-purple-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Trend Analysis</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Performance over time</p>
          </button>
          
          <button className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left">
            <div className="flex items-center">
              <Download className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Export Report</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Generate detailed report</p>
          </button>
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <PlayerDetails 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)} 
        />
      )}
    </div>
  );
} 