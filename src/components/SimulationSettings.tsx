'use client';

import { useState } from 'react';
import { 
  Users, Target, Coins, Clock, Settings, CheckCircle, 
  ArrowRight, ArrowLeft, Play, BarChart3, DollarSign
} from 'lucide-react';
import { PlayerManagement } from './PlayerManagement';
import { PayoutMatrix } from './PayoutMatrix';
import { YieldSimulator } from './YieldSimulator';
import { TokenSimulation } from './TokenSimulation';
import { ProtocolRevenueConfig } from './ProtocolRevenueConfig';
import { TimeControls } from './TimeControls';
import { useSimulationStore } from '@/store/simulation';

export function SimulationSettings() {
  const { players, config } = useSimulationStore();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'players',
      title: 'Player Setup',
      description: 'Configure players, factions, and initial parameters',
      icon: <Users className="w-6 h-6" />,
      component: <PlayerManagement />,
      isComplete: players.length > 0,
      required: true
    },
    {
      id: 'payout',
      title: 'Payout Matrix',
      description: 'Define scoring and yield split rules for match outcomes',
      icon: <Target className="w-6 h-6" />,
      component: <PayoutMatrix />,
      isComplete: true, // Always complete as it has defaults
      required: true
    },
    {
      id: 'yield',
      title: 'Yield Configuration',
      description: 'Set global APY and match duration parameters',
      icon: <Coins className="w-6 h-6" />,
      component: <YieldSimulator />,
      isComplete: config.globalAPY > 0,
      required: true
    },
    {
      id: 'protocol',
      title: 'Protocol Revenue',
      description: 'Configure protocol fees, buybacks, and burns',
      icon: <DollarSign className="w-6 h-6" />,
      component: <ProtocolRevenueConfig />,
      isComplete: true, // Always complete as it has defaults
      required: false
    },
    {
      id: 'tokens',
      title: 'Token Economics',
      description: 'Configure incentive token pools and distribution rules',
      icon: <BarChart3 className="w-6 h-6" />,
      component: <TokenSimulation />,
      isComplete: config.monthlyIncentivePool > 0,
      required: false
    },
    {
      id: 'time',
      title: 'Time Controls',
      description: 'Set simulation timeline and advancement controls',
      icon: <Clock className="w-6 h-6" />,
      component: <TimeControls />,
      isComplete: true, // Always complete as it has defaults
      required: false
    }
  ];

  const canProceedToSimulation = steps.every(step => !step.required || step.isComplete);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="w-6 h-6 mr-3 text-blue-500" />
              Simulation Settings
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your simulation parameters step by step
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {steps.filter(s => s.isComplete).length}/{steps.length}
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(index)}
                className={`flex flex-col items-center group transition-all duration-200 hover:scale-105 ${
                  (!step.isComplete && index > currentStep) 
                    ? 'cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
                disabled={!step.isComplete && index > currentStep}
                title={(!step.isComplete && index > currentStep) ? 'Complete previous steps first' : `Go to ${step.title}`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    step.isComplete 
                      ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600 shadow-lg' 
                      : index === currentStep
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                        : index < currentStep
                          ? 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {step.isComplete ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium transition-colors ${
                    step.isComplete 
                      ? 'text-green-600 group-hover:text-green-700' 
                      : index === currentStep
                        ? 'text-blue-600'
                        : index < currentStep
                          ? 'text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                          : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {step.required && (
                    <div className={`text-xs transition-colors ${
                      step.isComplete 
                        ? 'text-green-500' 
                        : index === currentStep
                          ? 'text-red-500'
                          : 'text-red-400 dark:text-red-500'
                    }`}>
                      Required
                    </div>
                  )}
                  {!step.isComplete && index > currentStep && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Locked
                    </div>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 transition-colors ${
                  step.isComplete ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                {steps[currentStep].icon}
                <span className="ml-3">{steps[currentStep].title}</span>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {steps[currentStep].isComplete && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {steps[currentStep].component}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <div className="flex items-center space-x-4">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '#simulation-running'}
                disabled={!canProceedToSimulation}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Simulation</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Quick Navigation
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              disabled={!step.isComplete && index > currentStep}
              className={`p-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                index === currentStep
                  ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                  : step.isComplete
                    ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : index < currentStep
                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {step.isComplete && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span>{step.title}</span>
              </div>
              {step.required && (
                <div className="text-xs mt-1 text-red-500">Required</div>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center">
          Click any completed step to navigate directly • Locked steps require previous steps to be completed
        </div>
      </div>
    </div>
  );
} 