'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, Cog, Activity, TrendingUp 
} from 'lucide-react';
import { WelcomeGuide } from '@/components/WelcomeGuide';
import { SimulationSettings } from '@/components/SimulationSettings';
import { SimulationRunning } from '@/components/SimulationRunning';
import { Analysis } from '@/components/Analysis';
import { useSimulationStore } from '@/store/simulation';

export default function HomePage() {
  const { players, matches, currentRound, totalVaultValue } = useSimulationStore();
  const [activeTab, setActiveTab] = useState('welcome');

  const getStepNumber = (tab: string) => {
    switch (tab) {
      case 'welcome': return 1;
      case 'simulation-settings': return 2;
      case 'simulation-running': return 3;
      case 'analysis': return 4;
      default: return 1;
    }
  };

  const currentStep = getStepNumber(activeTab);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground font-pokemon">
                Trustfall Protocol Simulator
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive simulation dashboard for economic and behavioral scenarios
              </p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{players.length}</div>
                <div className="text-muted-foreground">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{currentRound}</div>
                <div className="text-muted-foreground">Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-2">{matches.length}</div>
                <div className="text-muted-foreground">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-3">
                  ${totalVaultValue.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Vault Value</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= 1 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium transition-colors ${
                currentStep >= 1 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}>
                Welcome
              </span>
            </div>
            <div className={`w-12 h-1 rounded transition-all duration-300 ${
              currentStep >= 2 
                ? 'bg-primary' 
                : 'bg-muted'
            }`}></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= 2 
                  ? 'bg-accent text-accent-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium transition-colors ${
                currentStep >= 2 
                  ? 'text-accent' 
                  : 'text-muted-foreground'
              }`}>
                Settings
              </span>
            </div>
            <div className={`w-12 h-1 rounded transition-all duration-300 ${
              currentStep >= 3 
                ? 'bg-accent' 
                : 'bg-muted'
            }`}></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= 3 
                  ? 'bg-chart-2 text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className={`text-sm font-medium transition-colors ${
                currentStep >= 3 
                  ? 'text-chart-2' 
                  : 'text-muted-foreground'
              }`}>
                Simulation
              </span>
            </div>
            <div className={`w-12 h-1 rounded transition-all duration-300 ${
              currentStep >= 4 
                ? 'bg-chart-2' 
                : 'bg-muted'
            }`}></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                currentStep >= 4 
                  ? 'bg-chart-3 text-primary-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                4
              </div>
              <span className={`text-sm font-medium transition-colors ${
                currentStep >= 4 
                  ? 'text-chart-3' 
                  : 'text-muted-foreground'
              }`}>
                Analysis
              </span>
            </div>
          </div>
        </div>

        <Tabs 
          defaultValue="welcome" 
          className="space-y-6"
          onValueChange={(value: string) => setActiveTab(value)}
        >
          <div className="bg-card rounded-xl border border-border shadow-lg p-2">
            <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 gap-2">
              <TabsTrigger 
                value="welcome" 
                className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-muted"
              >
                <Lightbulb className="w-5 h-5" />
                <span className="text-sm font-medium">Welcome</span>
                <span className="text-xs opacity-75">Get Started</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="simulation-settings" 
                className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-muted"
              >
                <Cog className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
                <span className="text-xs opacity-75">Configure</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="simulation-running" 
                className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200 data-[state=active]:bg-chart-2 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-muted"
              >
                <Activity className="w-5 h-5" />
                <span className="text-sm font-medium">Simulation</span>
                <span className="text-xs opacity-75">Run & Monitor</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="analysis" 
                className="flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200 data-[state=active]:bg-chart-3 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-muted"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Analysis</span>
                <span className="text-xs opacity-75">Insights</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="welcome" className="space-y-6">
            <WelcomeGuide />
          </TabsContent>

          <TabsContent value="simulation-settings" className="space-y-6">
            <SimulationSettings />
          </TabsContent>

          <TabsContent value="simulation-running" className="space-y-6">
            <SimulationRunning />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Analysis />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 