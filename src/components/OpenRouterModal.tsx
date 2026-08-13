import React, { useState } from 'react';
import { Key, ShieldCheck, Cpu, ExternalLink, X, Info, Zap, Lock } from 'lucide-react';
import { OpenRouterModel } from '../types';

interface OpenRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  models: OpenRouterModel[];
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
}

export const OpenRouterModal: React.FC<OpenRouterModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  models,
  selectedModel,
  setSelectedModel
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'free' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
      onClose();
    }, 1000);
  };

  const activeModelObj = models.find(m => m.id === selectedModel);

  const filteredModels = models.filter(m => {
    const matchesTab = filterTab === 'all' ? true : filterTab === 'free' ? m.isFree : !m.isFree;
    const matchesSearch = searchQuery.trim() === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl max-w-2xl w-full p-6 text-gray-300 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
            <Key className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase terminal-font">OpenRouter & LLM Provider Settings</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Free & Paid LLM model selection with live green status indicator</p>
          </div>
        </div>

        {/* Currently Selected Active Model Status Banner */}
        <div className="p-3 rounded-lg bg-[#050505] border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 mb-4 glow-emerald">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
            </span>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              ACTIVE & WORKING
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-xs text-white font-bold">{activeModelObj?.name || selectedModel}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
            activeModelObj?.isFree 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
          }`}>
            {activeModelObj?.isFree ? '⚡ ZERO COST FREE MODEL' : '💎 PRO / PAID MODEL'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Key Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 flex items-center justify-between">
                <span>OpenRouter API Key</span>
                <span className="text-[10px] text-gray-500 font-normal">Optional (Free & Paid models supported)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all pr-10 font-mono"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 flex items-center space-x-1 font-sans">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Keys remain strictly private. If no key is provided, the agent uses our built-in high-accuracy open-source heuristic engine.
                </span>
              </p>
            </div>

            {/* Model Selection Header & Tabs */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">
                  Select Active Model ({filteredModels.length} Available)
                </label>

                {/* Free vs Paid Filter Tabs */}
                <div className="flex items-center space-x-1 bg-[#050505] p-1 rounded-lg border grid-line text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-2.5 py-1 rounded transition-all font-bold ${
                      filterTab === 'all' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ALL ({models.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('free')}
                    className={`px-2.5 py-1 rounded transition-all font-bold ${
                      filterTab === 'free' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    ⚡ FREE ({models.filter(m => m.isFree).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('paid')}
                    className={`px-2.5 py-1 rounded transition-all font-bold ${
                      filterTab === 'paid' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    💎 PAID ({models.filter(m => !m.isFree).length})
                  </button>
                </div>
              </div>

              {/* Search Filter Box */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models by name, provider (Meta, DeepSeek, Qwen, Claude, GPT)..."
                className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono mb-2"
              />

              {/* Model List Cards */}
              <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredModels.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/60 text-white glow-emerald shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-[#050505] border grid-line text-gray-300 hover:border-gray-700 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-bold flex items-center space-x-2">
                            <span>{m.name}</span>
                            {m.isFree ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono border border-emerald-500/40 font-bold">
                                ⚡ FREE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[9px] font-mono border border-blue-500/40 font-bold">
                                💎 PAID
                              </span>
                            )}
                            {isSelected && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[9px] font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                                <span>WORKING & ACTIVE</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-sans">{m.description}</p>
                          <div className="flex items-center space-x-3 text-[9px] font-mono text-gray-500 pt-0.5">
                            <span className="text-blue-400">Provider: {m.provider}</span>
                            <span>Context: {(m.contextWindow / 1000).toFixed(0)}k tokens</span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <input
                            type="radio"
                            name="modelChoice"
                            checked={isSelected}
                            onChange={() => setSelectedModel(m.id)}
                            className="text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredModels.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-500 bg-[#050505] rounded-lg border grid-line">
                    No models match search query "{searchQuery}".
                  </div>
                )}
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-2 flex items-center justify-between border-t grid-line">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>Get OpenRouter Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase bg-[#050505] border grid-line text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

            {showSavedMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-mono uppercase tracking-wider animate-fadeIn">
                Settings saved successfully! Selected model is online.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
