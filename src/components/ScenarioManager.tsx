'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Download, Upload, Save, FileText, Trash2, 
  Copy, Check, AlertCircle, Calendar, Users, Settings 
} from 'lucide-react';
import { useSimulationStore } from '@/store/simulation';
import { ScenarioExport } from '@/types/simulation';

const scenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long'),
  tags: z.string().max(100, 'Tags too long'),
});

type ScenarioFormData = z.infer<typeof scenarioSchema>;

export function ScenarioManager() {
  const { 
    players, 
    matches, 
    config, 
    statistics,
    exportScenario, 
    importScenario 
  } = useSimulationStore();

  const [savedScenarios, setSavedScenarios] = useState<ScenarioExport[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      name: '',
      description: '',
      tags: '',
    },
  });

  const onSaveScenario = (data: ScenarioFormData) => {
    const scenario = exportScenario(data.name, data.description, data.tags);
    setSavedScenarios(prev => [scenario, ...prev]);
    setShowSaveForm(false);
    reset();
  };

  const onImportScenario = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const scenario = JSON.parse(content);
        
        if (scenario.version && scenario.players && scenario.config) {
          importScenario(scenario);
          setImportError(null);
        } else {
          setImportError('Invalid scenario file format');
        }
      } catch {
        setImportError('Failed to parse scenario file');
      }
    };
    reader.readAsText(file);
  };

  const copyScenarioId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy scenario ID');
    }
  };

  const deleteScenario = (id: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== id));
  };

  const exportToCSV = () => {
    if (players.length === 0) return;

    const headers = ['Name', 'Faction', 'Deposit', 'Reputation', 'Trust %', 'Score', 'Matches', 'Yield', 'Tokens'];
    const csvContent = [
      headers.join(','),
      ...players.map(player => [
        player.name,
        player.faction,
        player.currentDeposit,
        player.reputation,
        player.strategy.type === 'percentage' ? (player.strategy.trustPercentage || 50) : 50,
        player.score,
        player.totalMatches,
        player.finalYield,
                 Object.values(player.tokenRewards).reduce((sum, amount) => sum + amount, 0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustfall-players-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      players,
      matches,
      config,
      statistics,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustfall-simulation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getScenarioStats = (scenario: ScenarioExport) => ({
    players: scenario.players.length,
    matches: scenario.matches.length,
    totalYield: scenario.players.reduce((sum, p) => sum + p.finalYield, 0),
    totalTokens: scenario.players.reduce((sum, p) => {
      const playerTotal = Object.values(p.tokenRewards).reduce((tokenSum, amount) => tokenSum + amount, 0);
      return sum + playerTotal;
    }, 0),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scenario Manager</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{showSaveForm ? 'Cancel' : 'Save Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Quick Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">Players</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{players.length}</div>
          <p className="text-xs text-gray-500 mt-1">Active participants</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Settings className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-gray-500">Matches</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{matches.length}</div>
          <p className="text-xs text-gray-500 mt-1">Games completed</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <FileText className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm text-gray-500">Saved</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{savedScenarios.length}</div>
          <p className="text-xs text-gray-500 mt-1">Scenarios saved</p>
        </div>
      </div>

      {/* Save Scenario Form */}
      {showSaveForm && (
        <div className="card border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-4">
            <Save className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">Save Current Scenario</h3>
          </div>
          
          <form onSubmit={handleSubmit(onSaveScenario)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scenario Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="input-field"
                  placeholder="e.g., High Trust Strategy Test"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  className="input-field"
                  placeholder="e.g., high-trust, testing, v1"
                />
                {errors.tags && (
                  <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field"
                placeholder="Describe this scenario and its purpose..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Scenario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={exportToJSON}
            disabled={players.length === 0}
            className="btn-secondary flex items-center space-x-2 w-full"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={players.length === 0}
            className="btn-secondary flex items-center space-x-2 w-full"
          >
            <FileText className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImportScenario}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary flex items-center space-x-2 w-full"
            >
              <Upload className="h-4 w-4" />
              <span>Import Scenario</span>
            </button>
          </div>
        </div>

        {importError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 dark:text-red-200 text-sm">{importError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 ? (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Saved Scenarios</h3>
          <div className="space-y-4">
            {savedScenarios.map((scenario) => {
              const stats = getScenarioStats(scenario);
              return (
                <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{scenario.name}</h4>
                        <span className="text-xs text-gray-500">v{scenario.version}</span>
                      </div>
                      
                      {scenario.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{scenario.description}</p>
                      )}
                      
                      {scenario.tags && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {scenario.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Players:</span>
                          <div className="font-medium">{stats.players}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Matches:</span>
                          <div className="font-medium">{stats.matches}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Yield:</span>
                          <div className="font-medium">${stats.totalYield.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Tokens:</span>
                          <div className="font-medium">{stats.totalTokens.toFixed(0)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(scenario.exportDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => copyScenarioId(scenario.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Copy Scenario ID"
                      >
                        {copiedId === scenario.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => importScenario(scenario)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Load Scenario"
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Scenario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Saved Scenarios
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Save your first scenario to preserve your simulation state.
          </p>
          <button
            onClick={() => setShowSaveForm(true)}
            className="btn-primary"
          >
            Save Current Scenario
          </button>
        </div>
      )}

      {/* Export Format Information */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Export Formats</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h5 className="font-medium mb-2">JSON Export:</h5>
            <ul className="space-y-1">
              <li>• Complete simulation state</li>
              <li>• All players, matches, and config</li>
              <li>• Can be imported back into simulator</li>
              <li>• Includes metadata and timestamps</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">CSV Export:</h5>
            <ul className="space-y-1">
              <li>• Player data only</li>
              <li>• Compatible with Excel/Google Sheets</li>
              <li>• Good for external analysis</li>
              <li>• Includes all player metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 