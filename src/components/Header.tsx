import React from 'react';
import { 
  Bot, 
  Cpu, 
  Key, 
  Play, 
  Users, 
  Database, 
  Globe, 
  Mail, 
  GitFork, 
  Sliders, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { OpenRouterModel } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  openRouterModels: OpenRouterModel[];
  hasApiKey: boolean;
  onOpenKeyModal: () => void;
  isAgentRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  openRouterModels,
  hasApiKey,
  onOpenKeyModal,
  isAgentRunning
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-[#050505] border-b grid-line text-gray-300 sticky top-0 z-40">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* App Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase terminal-font">
                GTM-ENGINE-ALPHA // SDR AGENT
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LangGraph Cycle
              </span>
            </div>
            <p className="text-[10px] text-emerald-500/80 font-mono uppercase tracking-[0.2em]">
              Autonomous SDR Node // Thought-Action-Observation
            </p>
          </div>
        </div>

        {/* Model Selector & OpenRouter Key Status */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Active Green Light Status Indicator */}
          {(() => {
            const currentModelObj = openRouterModels.find(m => m.id === selectedModel);
            const isFree = currentModelObj ? currentModelObj.isFree : selectedModel.includes('free');
            return (
              <div className="flex items-center space-x-2 bg-[#0a0a0a] border border-emerald-500/40 rounded-lg px-3 py-1.5 text-xs font-mono glow-emerald">
                {/* Green Lite Indicator Dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  ONLINE
                </span>

                <span className="text-gray-600">|</span>

                <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  id="model-selector"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-gray-200 text-xs font-mono focus:outline-none cursor-pointer max-w-[220px] sm:max-w-[300px] truncate"
                >
                  <optgroup label="⚡ FREE MODELS (ZERO COST)" className="bg-[#0a0a0a] text-emerald-400 font-bold">
                    {openRouterModels
                      .filter(m => m.isFree)
                      .map((model) => (
                        <option key={model.id} value={model.id} className="bg-[#0a0a0a] text-gray-200">
                          ⚡ {model.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="💎 PAID / ENTERPRISE MODELS" className="bg-[#0a0a0a] text-blue-400 font-bold">
                    {openRouterModels
                      .filter(m => !m.isFree)
                      .map((model) => (
                        <option key={model.id} value={model.id} className="bg-[#0a0a0a] text-gray-200">
                          💎 {model.name}
                        </option>
                      ))}
                  </optgroup>
                </select>

                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isFree 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}>
                  {isFree ? 'FREE' : 'PRO'}
                </span>
              </div>
            );
          })()}

          {/* OpenRouter Key Trigger Button */}

          {/* OpenRouter Key Trigger Button */}
          <button
            id="openrouter-key-btn"
            onClick={onOpenKeyModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              hasApiKey
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 glow-emerald'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'OpenRouter Active' : 'Configure Key'}</span>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* Light / Dark Mode Global Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 shadow-sm'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 glow-blue'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="uppercase text-[11px] tracking-wider">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="uppercase text-[11px] tracking-wider">Dark Mode</span>
              </>
            )}
          </button>

          {/* Engine Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border grid-line text-xs font-mono text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>OpenSource LLM Engine</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t grid-line">
        <nav className="flex space-x-1.5 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          <button
            id="nav-tab-chat"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'chat'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 glow-emerald font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>💬 Chat with Nyx</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </button>

          <button
            id="nav-tab-playground"
            onClick={() => setActiveTab('playground')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'playground'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Agent Execution</span>
            {isAgentRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>

          <button
            id="nav-tab-leads"
            onClick={() => setActiveTab('leads')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'leads'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Prospect Pipeline</span>
          </button>

          <button
            id="nav-tab-crm"
            onClick={() => setActiveTab('crm')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'crm'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>CRM Database</span>
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400">CRM_LOOKUP</span>
          </button>

          <button
            id="nav-tab-scrape"
            onClick={() => setActiveTab('scrape')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'scrape'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Scraper</span>
            <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-400">WEB_SCRAPE</span>
          </button>

          <button
            id="nav-tab-outbox"
            onClick={() => setActiveTab('outbox')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'outbox'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Outbox Drafts</span>
            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-amber-400">DRAFT_EMAIL</span>
          </button>

          <button
            id="nav-tab-langgraph"
            onClick={() => setActiveTab('langgraph')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'langgraph'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>LangGraph Visualizer</span>
          </button>

          <button
            id="nav-tab-icp"
            onClick={() => setActiveTab('icp')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              activeTab === 'icp'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ICP & Offer Setup</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
