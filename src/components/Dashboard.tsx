'use client';

import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Target, BarChart3, PieChart as PieChartIcon,
  Activity, Award, Eye, EyeOff
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';

const COLORS = {
  shadow: '#ef4444',
  free: '#eab308', 
  lumina: '#3b82f6',
  trust: '#10b981',
  betray: '#ef4444',
  mixed: '#f59e0b',
  yield: '#8b5cf6',
  tokens: '#06b6d4'
};

export function Dashboard() {
  const { 
    players, 
    matches, 
    config, 
    statistics,
    tokenDistributions 
  } = useSimulationStore();

  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'week' | 'month'>('all');
  const [showDetails, setShowDetails] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'rounds' | 'days' | 'weeks' | 'months'>('rounds');



  // Helper function to calculate mode-specific metrics
  const getModeMetrics = () => {
    const mode = selectedMode;
    const totalMatches = matches.length;
    
    switch (mode) {
      case 'rounds':
        const totalRounds = Math.max(1, Math.ceil(totalMatches / Math.max(1, Math.floor(players.length / 2))));
        return {
          matchesPerUnit: totalRounds > 0 ? (totalMatches / totalRounds).toFixed(1) : '0',
          unitLabel: 'Matches per Round',
          totalUnits: totalRounds,
          unitName: 'Rounds'
        };
      case 'days':
        const totalDays = Math.max(1, Math.ceil((Date.now() - (config.simulationStartDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)));
        return {
          matchesPerUnit: totalDays > 0 ? (totalMatches / totalDays).toFixed(1) : '0',
          unitLabel: 'Matches per Day',
          totalUnits: totalDays,
          unitName: 'Days'
        };
      case 'weeks':
        const totalWeeks = Math.max(1, Math.ceil((Date.now() - (config.simulationStartDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24 * 7)));
        return {
          matchesPerUnit: totalWeeks > 0 ? (totalMatches / totalWeeks).toFixed(1) : '0',
          unitLabel: 'Matches per Week',
          totalUnits: totalWeeks,
          unitName: 'Weeks'
        };
      case 'months':
        const totalMonths = Math.max(1, Math.ceil((Date.now() - (config.simulationStartDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24 * 30)));
        return {
          matchesPerUnit: totalMonths > 0 ? (totalMatches / totalMonths).toFixed(1) : '0',
          unitLabel: 'Matches per Month',
          totalUnits: totalMonths,
          unitName: 'Months'
        };
      default:
        return {
          matchesPerUnit: '0',
          unitLabel: 'Matches per Round',
          totalUnits: 0,
          unitName: 'Rounds'
        };
    }
  };

  // Filter data based on timeframe
  const getFilteredData = () => {
    const now = new Date();
    let cutoffDate = new Date(0); // Beginning of time

    if (selectedTimeframe === 'week') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (selectedTimeframe === 'month') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      players: players.filter(p => {
        try {
          if (!p.createdAt) return false;
          const date = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
          return !isNaN(date.getTime()) && date >= cutoffDate;
        } catch {
          return false;
        }
      }),
      matches: matches.filter(m => {
        try {
          if (!m.timestamp) return false;
          const date = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);
          return !isNaN(date.getTime()) && date >= cutoffDate;
        } catch {
          return false;
        }
      }),
      distributions: tokenDistributions.filter(d => {
        try {
          const date = new Date(d.year, d.month - 1);
          return !isNaN(date.getTime()) && date >= cutoffDate;
        } catch {
          return false;
        }
      })
    };
  };

      const { players: filteredPlayers, matches: filteredMatches, distributions: filteredDistributions } = getFilteredData();

    // Safety check for valid dates
    const safeFilteredPlayers = filteredPlayers.filter(p => {
      try {
        if (!p.createdAt) return false;
        const date = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    });
    
    const safeFilteredMatches = filteredMatches.filter(m => {
      try {
        if (!m.timestamp) return false;
        const date = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    });

  // Player Score Heatmap Data
  const playerScoreData = safeFilteredPlayers.map(player => ({
    name: player.name,
    score: player.score,
    reputation: player.reputation,
    faction: player.faction,
    deposit: player.currentDeposit,
    matches: player.totalMatches,
    trustRate: player.trustPercentage
  }));

  // Reputation Progression Data
  const reputationData = safeFilteredPlayers.map(player => ({
    name: player.name,
    reputation: player.reputation,
    faction: player.faction,
    score: player.score
  }));

  // Faction Distribution
  const factionData = [
    { name: 'Shadow Syndicate', value: safeFilteredPlayers.filter(p => p.faction === 'Shadow Syndicate').length, color: COLORS.shadow },
    { name: 'Free Agents', value: safeFilteredPlayers.filter(p => p.faction === 'Free Agents').length, color: COLORS.free },
    { name: 'Lumina Collective', value: safeFilteredPlayers.filter(p => p.faction === 'Lumina Collective').length, color: COLORS.lumina }
  ];

  // Match Result Distribution
  const matchResultData = [
    { name: 'Trust-Trust', value: safeFilteredMatches.filter(m => m.result === 'trust-trust').length, color: COLORS.trust },
    { name: 'Betray-Trust', value: safeFilteredMatches.filter(m => m.result === 'betray-trust').length, color: COLORS.mixed },
    { name: 'Trust-Betray', value: safeFilteredMatches.filter(m => m.result === 'trust-betray').length, color: COLORS.mixed },
    { name: 'Betray-Betray', value: safeFilteredMatches.filter(m => m.result === 'betray-betray').length, color: COLORS.betray }
  ];

  // Yield Distribution by Faction
  const yieldData = factionData.map(faction => {
    const factionPlayers = safeFilteredPlayers.filter(p => p.faction === faction.name);
    const totalYield = factionPlayers.reduce((sum, p) => sum + p.finalYield, 0);
    return {
      name: faction.name,
      yield: totalYield,
      color: faction.color,
      players: factionPlayers.length
    };
  });

  // Token Distribution History
  const tokenHistoryData = filteredDistributions.reduce((acc, dist) => {
    const key = `${dist.year}-${dist.month}`;
    if (!acc[key]) {
      acc[key] = { month: `${dist.month}/${dist.year}`, tokens: 0, recipients: 0 };
    }
    acc[key].tokens += dist.tokenReward;
    acc[key].recipients += 1;
    return acc;
  }, {} as Record<string, { recipients: number; tokens: number; month: string }>);

  const tokenHistory = Object.values(tokenHistoryData).slice(-10);

  // Performance Metrics
  const performanceMetrics = {
    totalPlayers: safeFilteredPlayers.length,
    totalMatches: safeFilteredMatches.length,
    totalYield: safeFilteredPlayers.reduce((sum, p) => sum + p.finalYield, 0),
    totalTokens: filteredDistributions.reduce((sum, d) => sum + d.tokenReward, 0),
    avgScore: safeFilteredPlayers.length > 0 ? safeFilteredPlayers.reduce((sum, p) => sum + p.score, 0) / safeFilteredPlayers.length : 0,
    avgReputation: safeFilteredPlayers.length > 0 ? safeFilteredPlayers.reduce((sum, p) => sum + p.reputation, 0) / safeFilteredPlayers.length : 0,
    trustRate: safeFilteredPlayers.length > 0 ? safeFilteredPlayers.reduce((sum, p) => sum + p.trustPercentage, 0) / safeFilteredPlayers.length : 0
  };

  // Top Performers
  const topPerformers = [...safeFilteredPlayers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((player, index) => ({
      rank: index + 1,
      name: player.name,
      score: player.score,
      faction: player.faction,
      yield: player.finalYield,
      matches: player.totalMatches
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard & Analytics</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as 'rounds' | 'days' | 'weeks' | 'months')}
              className="input-field w-auto"
            >
              <option value="rounds">Rounds</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Timeframe:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'all' | 'week' | 'month')}
              className="input-field w-auto"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary flex items-center space-x-2"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">Active Players</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{performanceMetrics.totalPlayers}</div>
          <p className="text-xs text-gray-500 mt-1">Total participants</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-500">Total Matches</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{performanceMetrics.totalMatches}</div>
          <p className="text-xs text-gray-500 mt-1">Games played</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-500">Total Yield</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">${performanceMetrics.totalYield.toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">Generated yield</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm text-gray-500">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{performanceMetrics.avgScore.toFixed(1)}</div>
          <p className="text-xs text-gray-500 mt-1">Per player</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm text-gray-500">{getModeMetrics().unitLabel}</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{getModeMetrics().matchesPerUnit}</div>
          <p className="text-xs text-gray-500 mt-1">Total {getModeMetrics().totalUnits} {getModeMetrics().unitName}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Score Heatmap */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Player Performance Heatmap
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={playerScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="reputation" 
                name="Reputation"
                type="number"
                domain={[0, 100]}
              />
              <YAxis 
                dataKey="score" 
                name="Score"
                type="number"
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm">Score: {data.score}</p>
                        <p className="text-sm">Reputation: {data.reputation}</p>
                        <p className="text-sm">Faction: {data.faction}</p>
                        <p className="text-sm">Deposit: ${data.deposit.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                dataKey="score" 
                fill={COLORS.yield}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Faction Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2" />
            Faction Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={factionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {factionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Match Result Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Match Outcomes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchResultData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.trust}>
                {matchResultData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Yield Distribution by Faction */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Yield by Faction
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`, 'Yield']}
              />
              <Bar dataKey="yield" fill={COLORS.yield}>
                {yieldData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token Distribution History */}
      {tokenHistory.length > 0 && safeFilteredMatches.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Token Distribution History
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tokenHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [typeof value === 'number' ? value.toFixed(0) : '0', name === 'tokens' ? 'Tokens' : 'Recipients']}
              />
              <Area 
                type="monotone" 
                dataKey="tokens" 
                stackId="1"
                stroke={COLORS.tokens} 
                fill={COLORS.tokens} 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performers Table */}
      {showDetails && topPerformers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Performers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Player</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Score</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Yield</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Matches</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Faction</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((player) => (
                  <tr key={player.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          player.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          player.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          player.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {player.rank}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{player.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${player.score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {player.score > 0 ? '+' : ''}{player.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">${player.yield.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono">{player.matches}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        player.faction === 'Shadow Syndicate' ? 'bg-red-100 text-red-800' :
                        player.faction === 'Free Agents' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
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

      {/* Additional Metrics */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Average Reputation</div>
            <div className="text-3xl font-bold text-blue-600">{performanceMetrics.avgReputation.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Across all players</div>
          </div>
          
          <div className="card text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Average Trust Rate</div>
            <div className="text-3xl font-bold text-green-600">{performanceMetrics.trustRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Strategy preference</div>
          </div>
          
          <div className="card text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Tokens Distributed</div>
            <div className="text-3xl font-bold text-purple-600">{performanceMetrics.totalTokens.toFixed(0)}</div>
            <div className="text-sm text-gray-500">$HOOPS tokens</div>
          </div>
        </div>
      )}
    </div>
  );
} 