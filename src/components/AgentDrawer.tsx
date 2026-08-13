import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Zap, 
  MessageSquare, 
  Play, 
  Building2, 
  Globe, 
  Users, 
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { NyxChat } from './NyxChat';
import { AgentPlayground } from './AgentPlayground';
import { ProspectLead } from '../types';

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: ProspectLead[];
  selectedProspect: ProspectLead;
  onSelectProspect: (lead: ProspectLead) => void;
  openRouterApiKey?: string;
  selectedModel: string;
  hasApiKey: boolean;
  onSaveOutboundDraft: (draft: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  isOpen,
  onClose,
  prospects,
  selectedProspect,
  onSelectProspect,
  openRouterApiKey,
  selectedModel,
  hasApiKey,
  onSaveOutboundDraft,
  onNavigateTab
}) => {
  const [drawerMode, setDrawerMode] = useState<'chat' | 'playground'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono animate-fadeIn">
      {/* Dark Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen transform transition-all duration-300 ease-in-out bg-[#0a0a0a] border-l grid-line shadow-2xl flex flex-col ${
            isExpanded ? 'max-w-5xl' : 'max-w-2xl lg:max-w-3xl'
          }`}
        >
          {/* Drawer Top Header */}
          <div className="p-4 bg-[#050505] border-b grid-line flex items-center justify-between gap-3 shrink-0">
            {/* Left: Agent Info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center shrink-0 glow-emerald">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-medium tracking-wider text-white uppercase font-futura flex items-center gap-0.5">
                    <span>merqato</span>
                    <span className="text-[#B90000] font-semibold">.digital</span>
                    <span className="text-emerald-400 font-normal font-mono text-xs ml-1">// NYX AGENT</span>
                  </h2>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  Interactive On-Page Assistant & Execution Loop
                </p>
              </div>
            </div>

            {/* Right: Controls & Close */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-[#0a0a0a] border grid-line text-gray-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? "Standard width" : "Expand drawer"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#0a0a0a] border grid-line text-gray-400 hover:text-white hover:border-emerald-500/40 transition-colors cursor-pointer"
                title="Close Agent Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Target Prospect Selector & Mode Toggle Bar */}
          <div className="px-4 py-2.5 bg-[#080808] border-b grid-line flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            {/* Active Prospect Picker */}
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase font-bold shrink-0">Active Target:</span>
              <select
                value={selectedProspect?.id || ''}
                onChange={(e) => {
                  const found = prospects.find(p => p.id === e.target.value);
                  if (found) onSelectProspect(found);
                }}
                className="bg-[#050505] border grid-line rounded-lg px-2.5 py-1 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 text-xs w-full cursor-pointer truncate"
              >
                {prospects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0a0a0a] text-gray-200 font-normal">
                    {p.companyName} ({p.contactName} - {p.industry})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-[#050505] p-1 rounded-lg border grid-line">
              <button
                onClick={() => setDrawerMode('chat')}
                className={`px-3 py-1 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
                  drawerMode === 'chat'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interactive Chat</span>
              </button>

              <button
                onClick={() => setDrawerMode('playground')}
                className={`px-3 py-1 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1.5 cursor-pointer ${
                  drawerMode === 'playground'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-emerald'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Agent Execution</span>
              </button>
            </div>
          </div>

          {/* Drawer Body Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {drawerMode === 'chat' ? (
              <NyxChat
                openRouterApiKey={openRouterApiKey}
                selectedModel={selectedModel}
                onNavigateTab={(tab) => {
                  onNavigateTab(tab);
                  onClose();
                }}
              />
            ) : (
              <AgentPlayground
                prospects={prospects}
                selectedProspect={selectedProspect}
                onSelectProspect={onSelectProspect}
                selectedModel={selectedModel}
                hasApiKey={hasApiKey}
                onSaveOutboundDraft={onSaveOutboundDraft}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
