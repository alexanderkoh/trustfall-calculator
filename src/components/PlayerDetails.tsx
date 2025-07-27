'use client';

import { useState } from 'react';
import { 
  X, TrendingUp, Users, Target, ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useSimulationStore } from '@/store/simulation';
import { Player } from '@/types/simulation';

interface PlayerDetailsProps {
  player: Player;
  onClose: () => void;
}

const COLORS = {
  shadow: '#ef4444',
  free: '#eab308', 
  lumina: '#3b82f6',
  trust: '#10b981',
  betray: '#ef4444',
  mixed: '#f59e0b',
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280'
};

export function PlayerDetails({ player, onClose }: PlayerDetailsProps) {
  const { matches, getPlayerReputationHistory } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'reputation' | 'matches'>('overview');

  const reputationHistory = getPlayerReputationHistory(player.id);
  const playerMatches = matches.filter(m => 
    m.playerA.id === player.id || (m.playerB && m.playerB.id === player.id)
  );

  // Calculate reputation progression data
  const reputationData = reputationHistory.map((event, index) => ({
    index,
    reputation: event.newReputation,
    change: event.change,
    timestamp: event.timestamp,
    reason: event.reason,
    details: event.details,
    isPositive: event.change > 0,
    isNegative: event.change < 0,
  }));

  // Calculate match performance data
  const matchPerformance = playerMatches.map(match => {
    const isPlayerA = match.playerA.id === player.id;
    const action = isPlayerA ? match.actionA : match.actionB;
    const scoreChange = isPlayerA ? match.scoreChangeA : match.scoreChangeB;
    const reputationChange = isPlayerA ? match.reputationChangeA : match.reputationChangeB;
    const yieldShare = isPlayerA ? match.yieldShareA : match.yieldShareB;

    return {
      id: match.id,
      round: match.round,
      timestamp: match.timestamp,
      action,
      result: match.result,
      scoreChange,
      reputationChange,
      yieldShare,
      isPositive: scoreChange > 0,
    };
  });

  // Calculate statistics
  const stats = {
    totalMatches: playerMatches.length,
    wins: playerMatches.filter(m => {
      const isPlayerA = m.playerA.id === player.id;
      const scoreChange = isPlayerA ? m.scoreChangeA : m.scoreChangeB;
      return scoreChange > 0;
    }).length,
    trustActions: playerMatches.filter(m => {
      const isPlayerA = m.playerA.id === player.id;
      const action = isPlayerA ? m.actionA : m.actionB;
      return action === 'trust';
    }).length,
    reputationGain: reputationHistory.reduce((sum, event) => sum + Math.max(0, event.change), 0),
    reputationLoss: reputationHistory.reduce((sum, event) => sum + Math.min(0, event.change), 0),
    avgScorePerMatch: playerMatches.length > 0 ? 
      playerMatches.reduce((sum, m) => {
        const isPlayerA = m.playerA.id === player.id;
        return sum + (isPlayerA ? m.scoreChangeA : m.scoreChangeB);
      }, 0) / playerMatches.length : 0,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'reputation', label: 'Reputation History', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'matches', label: 'Match History', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              player.faction === 'Shadow Syndicate' ? 'bg-red-500' :
              player.faction === 'Free Agents' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}>
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{player.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{player.faction}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'reputation' | 'matches')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-600">{player.reputation}</div>
                  <p className="text-sm text-gray-500">Current Reputation</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">{player.score}</div>
                  <p className="text-sm text-gray-500">Total Score</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalMatches}</div>
                  <p className="text-sm text-gray-500">Matches Played</p>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-orange-600">${player.finalYield.toFixed(2)}</div>
                  <p className="text-sm text-gray-500">Total Yield</p>
                </div>
              </div>

              {/* Reputation Summary */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Reputation Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">+{stats.reputationGain}</div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Gained</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.reputationLoss}</div>
                    <p className="text-sm text-red-700 dark:text-red-300">Total Lost</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reputationHistory.length}</div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Reputation Events</p>
                  </div>
                </div>
              </div>

              {/* Match Performance */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Match Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                    <p className="text-sm text-gray-500">Winning Matches</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.trustActions}</div>
                    <p className="text-sm text-gray-500">Trust Actions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.avgScorePerMatch.toFixed(1)}</div>
                    <p className="text-sm text-gray-500">Avg Score/Match</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reputation' && (
            <div className="space-y-6">
              {/* Reputation Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Reputation Progression</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reputationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="index" 
                      name="Event"
                      tickFormatter={(value) => `#${value + 1}`}
                    />
                    <YAxis 
                      dataKey="reputation" 
                      name="Reputation"
                      domain={[0, 100]}
                    />
                                         <Tooltip 
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload as {
                             index: number;
                             reputation: number;
                             change: number;
                             reason: string;
                             details?: string;
                           };
                           return (
                             <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                               <p className="font-medium">Event #{data.index + 1}</p>
                               <p className="text-sm text-gray-600">Reputation: {data.reputation}</p>
                               <p className="text-sm text-gray-600">Change: {data.change > 0 ? '+' : ''}{data.change}</p>
                               <p className="text-sm text-gray-600">Reason: {data.reason}</p>
                               {data.details && (
                                 <p className="text-sm text-gray-600">Details: {data.details}</p>
                               )}
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                    <Line 
                      type="monotone" 
                      dataKey="reputation" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Reputation Events List */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Reputation Events</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reputationHistory.map((event, index) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.change > 0 ? 'bg-green-100 text-green-600' :
                          event.change < 0 ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {event.change > 0 ? <ArrowUp className="w-4 h-4" /> :
                           event.change < 0 ? <ArrowDown className="w-4 h-4" /> :
                           <span className="text-xs">-</span>}
                        </div>
                        <div>
                          <p className="font-medium">Event #{index + 1}</p>
                          <p className="text-sm text-gray-600">{event.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{event.newReputation}</p>
                        <p className={`text-sm ${
                          event.change > 0 ? 'text-green-600' :
                          event.change < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {event.change > 0 ? '+' : ''}{event.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-6">
              {/* Match Performance Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Match Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={matchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="round" name="Round" />
                    <YAxis dataKey="scoreChange" name="Score Change" />
                                         <Tooltip 
                       content={({ active, payload }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload as {
                             round: number;
                             action: string;
                             result: string;
                             scoreChange: number;
                           };
                           return (
                             <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                               <p className="font-medium">Round {data.round}</p>
                               <p className="text-sm text-gray-600">Action: {data.action}</p>
                               <p className="text-sm text-gray-600">Result: {data.result}</p>
                               <p className="text-sm text-gray-600">Score: {data.scoreChange > 0 ? '+' : ''}{data.scoreChange}</p>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                    <Bar 
                      dataKey="scoreChange" 
                      fill={COLORS.positive}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Match History List */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Match History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {playerMatches.map((match) => {
                    const isPlayerA = match.playerA.id === player.id;
                    const action = isPlayerA ? match.actionA : match.actionB;
                    const scoreChange = isPlayerA ? match.scoreChangeA : match.scoreChangeB;
                    // const reputationChange = isPlayerA ? match.reputationChangeA : match.reputationChangeB;
                    // const yieldShare = isPlayerA ? match.yieldShareA : match.yieldShareB;
                    const opponent = isPlayerA ? match.playerB : match.playerA;

                    return (
                      <div 
                        key={match.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            scoreChange > 0 ? 'bg-green-100 text-green-600' :
                            scoreChange < 0 ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {scoreChange > 0 ? <ArrowUp className="w-4 h-4" /> :
                             scoreChange < 0 ? <ArrowDown className="w-4 h-4" /> :
                             <span className="text-xs">-</span>}
                          </div>
                          <div>
                            <p className="font-medium">Round {match.round}</p>
                            <p className="text-sm text-gray-600">vs {opponent?.name || 'Arbiter'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{action}</p>
                          <p className={`text-sm ${
                            scoreChange > 0 ? 'text-green-600' :
                            scoreChange < 0 ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {scoreChange > 0 ? '+' : ''}{scoreChange} pts
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 