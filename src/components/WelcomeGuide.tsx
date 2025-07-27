'use client';

import { useState } from 'react';
import { 
  Play, Settings, BarChart3, Users, Target, 
  FileText, ArrowRight, CheckCircle, Lightbulb 
} from 'lucide-react';

export function WelcomeGuide() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Trustfall Protocol Simulator",
      description: "A comprehensive tool for modeling economic and behavioral scenarios in zero-loss games built on Hoops Finance.",
      icon: <Lightbulb className="w-8 h-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This simulator helps protocol designers, testers, and strategists model realistic scenarios 
            before implementation. You can simulate everything from single players to complex multi-player 
            dynamics with custom economic parameters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 Key Features</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Player management with factions</li>
                <li>• Match simulation with trust/betray mechanics</li>
                <li>• Yield calculation and distribution</li>
                <li>• Custom token economics</li>
                <li>• Time-based simulation controls</li>
                <li>• Comprehensive analytics</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🚀 Quick Start</h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>1. Configure simulation settings</li>
                <li>2. Add players and set parameters</li>
                <li>3. Run matches and observe outcomes</li>
                <li>4. Analyze results and iterate</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Simulation Workflow",
      description: "Follow this step-by-step process to set up and run your simulation effectively.",
      icon: <Settings className="w-8 h-8 text-green-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">1. Setup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure players, factions, and initial parameters
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">2. Configure</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Set payout matrix, yield rates, and token economics
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">3. Simulate</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Run matches and observe player interactions
              </p>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">4. Analyze</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review results and adjust parameters
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Core Concepts",
      description: "Understand the fundamental mechanics of the Trustfall Protocol simulation.",
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Player Factions
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Shadow Syndicate (0-40 rep)</span>
                  <span className="text-red-600">Betrayal-focused</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Agents (41-59 rep)</span>
                  <span className="text-yellow-600">Balanced strategy</span>
                </div>
                <div className="flex justify-between">
                  <span>Lumina Collective (60-100 rep)</span>
                  <span className="text-green-600">Trust-focused</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                Match Outcomes
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Trust + Trust</span>
                  <span className="text-green-600">+2 each, 50/50 yield</span>
                </div>
                <div className="flex justify-between">
                  <span>Betray + Trust</span>
                  <span className="text-red-600">+3/-3, 100/0 yield</span>
                </div>
                <div className="flex justify-between">
                  <span>Betray + Betray</span>
                  <span className="text-orange-600">-1 each, 25/25 yield</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Start with a small number of players to understand the dynamics</li>
              <li>• Use the bulk player creation feature for larger simulations</li>
              <li>• Experiment with different payout matrices to find optimal strategies</li>
              <li>• Save scenarios to compare different parameter sets</li>
              <li>• Use the dashboard to identify patterns in player behavior</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {steps[currentStep].icon}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep 
                      ? 'bg-blue-500' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
                onClick={() => window.location.href = '#simulation-settings'}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 