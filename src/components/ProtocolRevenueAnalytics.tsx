'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Filter,
  Download,
  Settings
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';

const COLORS = {
  revenue: '#8b5cf6',
  buybacks: '#10b981',
  burns: '#ef4444',
  netRevenue: '#3b82f6',
  yieldSpread: '#f59e0b',
  flatFee: '#8b5cf6',
  incentiveTax: '#ec4899',
};

export function ProtocolRevenueAnalytics() {
  const { protocolRevenue, statistics, config } = useSimulationStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  // Calculate daily revenue data
  const dailyRevenueData = useMemo(() => {
    const dailyMap = new Map<string, {
      date: string;
      revenue: number;
      buybacks: number;
      burns: number;
      netRevenue: number;
      matchCount: number;
    }>();

    protocolRevenue.forEach((revenue) => {
      const date = revenue.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || {
        date,
        revenue: 0,
        buybacks: 0,
        burns: 0,
        netRevenue: 0,
        matchCount: 0,
      };

      existing.revenue += revenue.protocolFee;
      existing.buybacks += revenue.buybackAmount;
      existing.burns += revenue.burnAmount;
      existing.netRevenue += revenue.netRevenue;
      existing.matchCount += 1;

      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [protocolRevenue]);

  // Calculate fee type distribution
  const feeTypeData = useMemo(() => {
    const feeTypes = {
      yield_spread: { name: 'Yield Spread', value: 0, color: COLORS.yieldSpread },
      flat_fee: { name: 'Flat Fee', value: 0, color: COLORS.flatFee },
      incentive_tax: { name: 'Incentive Tax', value: 0, color: COLORS.incentiveTax },
    };

    protocolRevenue.forEach((revenue) => {
      feeTypes[revenue.feeType].value += revenue.protocolFee;
    });

    return Object.values(feeTypes).filter(item => item.value > 0);
  }, [protocolRevenue]);

  // Calculate revenue by player size (deposit ranges)
  const revenueByPlayerSize = useMemo(() => {
    const ranges = [
      { name: 'Small (<$1K)', min: 0, max: 1000, revenue: 0, count: 0 },
      { name: 'Medium ($1K-$5K)', min: 1000, max: 5000, revenue: 0, count: 0 },
      { name: 'Large ($5K-$10K)', min: 5000, max: 10000, revenue: 0, count: 0 },
      { name: 'Whale (>$10K)', min: 10000, max: Infinity, revenue: 0, count: 0 },
    ];

    // This would need to be calculated from match data
    // For now, we'll show a placeholder
    return ranges.map(range => ({
      ...range,
      revenue: Math.random() * 1000, // Placeholder
      count: Math.floor(Math.random() * 50), // Placeholder
    }));
  }, []);

  // Calculate yield capture percentage
  const yieldCapturePercentage = useMemo(() => {
    if (statistics.totalYieldGenerated === 0) return 0;
    return (statistics.totalProtocolRevenue / statistics.totalYieldGenerated) * 100;
  }, [statistics]);



  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Protocol Revenue Analytics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track protocol earnings, buybacks, and burn effects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'all' | 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            <option value="all">All Time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${(statistics.totalProtocolRevenue || 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            ${(statistics.totalBuybacks || 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500">Total Buybacks</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            ${(statistics.totalBurns || 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500">Total Burns</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(yieldCapturePercentage || 0).toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500">Yield Capture</p>
        </div>
      </div>

      {/* Revenue Over Time */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Revenue Over Time
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={COLORS.revenue} 
              strokeWidth={2}
              name="Protocol Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="buybacks" 
              stroke={COLORS.buybacks} 
              strokeWidth={2}
              name="Buybacks"
            />
            <Line 
              type="monotone" 
              dataKey="burns" 
              stroke={COLORS.burns} 
              strokeWidth={2}
              name="Burns"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Type Distribution */}
        <div className="card">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <PieChartIcon className="w-4 h-4 mr-2" />
            Fee Type Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={feeTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {feeTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Player Size */}
        <div className="card">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Revenue by Player Size
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPlayerSize}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="revenue" fill={COLORS.revenue} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Protocol Configuration Summary */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Current Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Fee Type</div>
            <div className="font-medium capitalize">
              {(config.protocol?.feeType || 'yield_spread').replace('_', ' ')}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Fee Rate</div>
            <div className="font-medium">
              {((config.protocol?.feeRate || 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Buyback Allocation</div>
            <div className="font-medium">
              {((config.protocol?.buybackAllocation || 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Burn Rate</div>
            <div className="font-medium">
              {((config.protocol?.burnRate || 0) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Net Revenue Rate</div>
            <div className="font-medium">
              {((1 - (config.protocol?.buybackAllocation || 0) - (config.protocol?.burnRate || 0)) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium">
              {config.protocol?.enabled ? 'Active' : 'Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="card">
        <h4 className="text-lg font-semibold mb-4">Recent Revenue Events</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Fee Type</th>
                <th className="text-right py-3 px-4 font-medium">Base Yield</th>
                <th className="text-right py-3 px-4 font-medium">Protocol Fee</th>
                <th className="text-right py-3 px-4 font-medium">Buyback</th>
                <th className="text-right py-3 px-4 font-medium">Burn</th>
                <th className="text-right py-3 px-4 font-medium">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {protocolRevenue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No revenue events recorded yet. Run a simulation with protocol revenue enabled to see data.
                  </td>
                </tr>
              ) : (
                protocolRevenue.slice(-10).reverse().map((revenue) => (
                <tr key={revenue.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm">
                    {revenue.timestamp.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm capitalize">
                    {revenue.feeType.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono">
                    ${revenue.baseYield.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-purple-600">
                    ${revenue.protocolFee.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-green-600">
                    ${revenue.buybackAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-red-600">
                    ${revenue.burnAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-blue-600">
                    ${revenue.netRevenue.toFixed(2)}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 