'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DollarSign, 
  TrendingUp, 
  Flame, 
  Settings, 
  Info,
  Calculator,
  PieChart
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { ProtocolFeeType } from '@/types/simulation';

const protocolConfigSchema = z.object({
  enabled: z.boolean(),
  feeType: z.enum(['yield_spread', 'flat_fee', 'incentive_tax']),
  feeRate: z.number().min(0).max(1),
  buybackAllocation: z.number().min(0).max(1),
  burnRate: z.number().min(0).max(1),
});

type ProtocolConfigData = z.infer<typeof protocolConfigSchema>;

export function ProtocolRevenueConfig() {
  const { config, updateProtocolConfig, calculateProtocolRevenue } = useSimulationStore();
  const [previewData, setPreviewData] = useState<{
    baseYield: number;
    playerADeposit: number;
    playerBDeposit: number;
    revenue: any;
  } | null>(null);

  const form = useForm<ProtocolConfigData>({
    resolver: zodResolver(protocolConfigSchema),
    defaultValues: {
      enabled: config.protocol.enabled,
      feeType: config.protocol.feeType,
      feeRate: config.protocol.feeRate,
      buybackAllocation: config.protocol.buybackAllocation,
      burnRate: config.protocol.burnRate,
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedValues = watch();

  const onSubmit = (data: ProtocolConfigData) => {
    updateProtocolConfig(data);
  };

  const generatePreview = () => {
    const baseYield = 100; // $100 base yield
    const playerADeposit = 1000; // $1000 deposit
    const playerBDeposit = 1500; // $1500 deposit
    
    const revenue = calculateProtocolRevenue(baseYield, playerADeposit, playerBDeposit);
    
    setPreviewData({
      baseYield,
      playerADeposit,
      playerBDeposit,
      revenue,
    });
  };

  const getFeeTypeDescription = (feeType: ProtocolFeeType) => {
    switch (feeType) {
      case 'yield_spread':
        return 'Takes a percentage of the generated yield';
      case 'flat_fee':
        return 'Takes a percentage of total player deposits';
      case 'incentive_tax':
        return 'Combines yield percentage plus small deposit fee';
      default:
        return '';
    }
  };

  const getFeeTypeIcon = (feeType: ProtocolFeeType) => {
    switch (feeType) {
      case 'yield_spread':
        return <TrendingUp className="w-4 h-4" />;
      case 'flat_fee':
        return <DollarSign className="w-4 h-4" />;
      case 'incentive_tax':
        return <Calculator className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Protocol Revenue Configuration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure how the protocol generates revenue from match activity
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable/Disable Protocol Revenue */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="protocolEnabled"
                checked={watchedValues.enabled}
                onChange={(e) => {
                  setValue('enabled', e.target.checked);
                  handleSubmit(onSubmit)();
                }}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="protocolEnabled" className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Protocol Revenue
              </label>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {watchedValues.enabled ? 'Active' : 'Disabled'}
            </div>
          </div>
        </div>

        {watchedValues.enabled && (
          <>
            {/* Fee Type Selection */}
            <div className="card">
              <h4 className="text-md font-semibold mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Fee Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['yield_spread', 'flat_fee', 'incentive_tax'] as const).map((feeType) => (
                  <div
                    key={feeType}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      watchedValues.feeType === feeType
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setValue('feeType', feeType);
                      handleSubmit(onSubmit)();
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getFeeTypeIcon(feeType)}
                      <span className="font-medium capitalize">
                        {feeType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getFeeTypeDescription(feeType)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee Rate Configuration */}
            <div className="card">
              <h4 className="text-md font-semibold mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Fee Rate Configuration
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fee Rate ({(watchedValues.feeRate * 100).toFixed(1)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={watchedValues.feeRate}
                    onChange={(e) => {
                      setValue('feeRate', parseFloat(e.target.value));
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Distribution */}
            <div className="card">
              <h4 className="text-md font-semibold mb-4 flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                Revenue Distribution
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buyback Allocation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buyback Allocation ({(watchedValues.buybackAllocation * 100).toFixed(1)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={watchedValues.buybackAllocation}
                    onChange={(e) => {
                      setValue('buybackAllocation', parseFloat(e.target.value));
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of protocol revenue used for token buybacks
                  </p>
                </div>

                {/* Burn Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Burn Rate ({(watchedValues.burnRate * 100).toFixed(1)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={watchedValues.burnRate}
                    onChange={(e) => {
                      setValue('burnRate', parseFloat(e.target.value));
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of protocol revenue permanently burned
                  </p>
                </div>
              </div>

              {/* Distribution Warning */}
              {(watchedValues.buybackAllocation + watchedValues.burnRate) > 1 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      Warning: Total distribution exceeds 100%. This may result in negative net revenue.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Revenue Preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Revenue Preview
                </h4>
                <button
                  type="button"
                  onClick={generatePreview}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Generate Preview
                </button>
              </div>

              {previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Match Parameters</h5>
                      <div className="space-y-1 text-sm">
                        <div>Base Yield: ${previewData.baseYield}</div>
                        <div>Player A Deposit: ${previewData.playerADeposit}</div>
                        <div>Player B Deposit: ${previewData.playerBDeposit}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Revenue Breakdown</h5>
                      <div className="space-y-1 text-sm">
                        <div>Protocol Fee: ${previewData.revenue.protocolFee.toFixed(2)}</div>
                        <div>Player Yield: ${previewData.revenue.playerYield.toFixed(2)}</div>
                        <div>Buyback: ${previewData.revenue.buybackAmount.toFixed(2)}</div>
                        <div>Burn: ${previewData.revenue.burnAmount.toFixed(2)}</div>
                        <div className="font-medium">Net Revenue: ${previewData.revenue.netRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
} 