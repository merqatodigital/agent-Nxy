import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, User, Sparkles, Copy, Check, RefreshCw, Terminal, Zap, Shield, 
  HelpCircle, Database, Target, Mail, BarChart3, Building2, DollarSign, 
  CheckCircle2, ArrowRight, Tag, Layers, ShieldCheck, ChevronRight, UserCheck,
  TrendingUp, ExternalLink, Play
} from 'lucide-react';
import { ChatMessage } from '../types';

interface NyxChatProps {
  openRouterApiKey?: string;
  selectedModel?: string;
  onNavigateTab?: (tab: string) => void;
}

/**
 * Executive B2B UI Component Renderer for Nyx Responses.
 * Parses Nyx responses into compact, high-converting visual cards & widgets.
 */
const NyxMessageFormatter: React.FC<{ 
  text: string; 
  onNavigateTab?: (tab: string) => void;
  onSendAction?: (actionText: string) => void;
}> = ({ text, onNavigateTab, onSendAction }) => {
  // Helper to remove unicode emojis
  const stripEmojis = (str: string) => {
    return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|🟢|⚡|✉️|📊|🎯|🔍|💡|✍️|🧠|💎/gu, '').trim();
  };

  // Helper to strip markdown asterisks and hash symbols
  const cleanStr = (str: string) => {
    return stripEmojis(str)
      .replace(/^#{1,6}\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim();
  };

  // Detect Email Drafts
  const isEmailDraft = text.toLowerCase().includes('subject:') && (text.toLowerCase().includes('hi ') || text.toLowerCase().includes('dear ') || text.toLowerCase().includes('best,'));

  if (isEmailDraft) {
    const subjectMatch = text.match(/subject:\s*(.*)/i);
    const subject = subjectMatch ? cleanStr(subjectMatch[1]) : 'Outbound Sales Inquiry';
    
    // Extract body text after Subject line
    const bodyText = text.replace(/.*subject:\s*.*(\r\n|\r|\n)?/i, '').replace(/Strategic Action Plan.*/i, '').trim();
    const cleanBody = cleanStr(bodyText);

    return (
      <div className="space-y-3 font-mono">
        <div className="p-4 rounded-xl bg-[#050505] border border-emerald-500/40 shadow-xl relative glow-emerald">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b grid-line mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
                <Mail className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">Synthesized Cold Email Draft</span>
                <span className="text-[10px] text-gray-400 font-sans">ICP Persona Aligned • Optimized for Conversion</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
              READY FOR OUTBOX
            </span>
          </div>

          {/* Subject Line */}
          <div className="p-2.5 rounded-lg bg-[#0a0a0a] border grid-line mb-3 flex items-center space-x-2 text-xs">
            <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-gray-400 font-bold shrink-0">Subject:</span>
            <span className="text-gray-100 font-medium truncate">{subject}</span>
          </div>

          {/* Body */}
          <div className="text-xs text-gray-200 font-sans leading-relaxed whitespace-pre-wrap p-3.5 rounded-lg bg-[#0a0a0a]/60 border grid-line">
            {cleanBody}
          </div>

          {/* Direct Trigger Buttons */}
          {onNavigateTab && (
            <div className="mt-3 pt-3 border-t grid-line flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Automated Pipeline Queue</span>
              <button
                onClick={() => onNavigateTab('outbox')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer glow-emerald"
              >
                <span>View in Outbox Drafts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parse response into structured sections: Executive Summary, Pipeline Data, Strategic Action Plan
  const rawSections = text.split(/\n(?=[A-Z][a-z]+ (?:Summary|Data|Plan|Breakdown|Directives|Report))/);

  return (
    <div className="space-y-3 font-sans">
      {rawSections.map((sec, secIdx) => {
        const lines = sec.trim().split('\n').filter(Boolean);
        if (lines.length === 0) return null;

        const titleLine = lines[0].trim();
        const contentLines = lines.slice(1);

        const isExecSummary = titleLine.toLowerCase().includes('executive summary') || titleLine.toLowerCase().includes('report') || titleLine.toLowerCase().includes('directives');
        const isPipelineData = titleLine.toLowerCase().includes('data') || titleLine.toLowerCase().includes('breakdown') || titleLine.toLowerCase().includes('roster') || titleLine.toLowerCase().includes('audit');
        const isActionPlan = titleLine.toLowerCase().includes('plan') || titleLine.toLowerCase().includes('recommendation') || titleLine.toLowerCase().includes('action');

        // Render Executive Summary Card
        if (isExecSummary) {
          const bodyText = contentLines.map(cleanStr).join(' ');
          return (
            <div key={secIdx} className="p-3.5 rounded-xl bg-[#0a0a0a] border border-emerald-500/30 text-xs shadow-md">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b grid-line">
                <div className="p-1 rounded bg-emerald-500/20 border border-emerald-500/40">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Executive Briefing
                </h4>
              </div>
              <p className="text-gray-300 leading-relaxed text-xs">
                {bodyText || cleanStr(sec)}
              </p>
            </div>
          );
        }

        // Render Pipeline Data as Executive Cards Grid
        if (isPipelineData) {
          const items = contentLines.filter(l => l.trim().startsWith('•') || l.trim().startsWith('*') || l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
          
          return (
            <div key={secIdx} className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-200 uppercase tracking-wider font-mono px-1">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Pipeline & CRM Intelligence</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {items.length > 0 ? (
                  items.map((item, i) => {
                    const cleanItem = cleanStr(item.replace(/^[\*\-\•\d+\.]+\s*/, ''));
                    const parts = cleanItem.split(/[:|]/);
                    const title = parts[0]?.trim() || 'Record';
                    const details = parts.slice(1).join(' | ').trim();

                    return (
                      <div 
                        key={i}
                        className="p-3 rounded-xl bg-[#050505] border grid-line hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white font-mono text-xs block">
                              {title}
                            </span>
                            {details && (
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                                {details}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick Direct Action Button */}
                        {onSendAction && (
                          <button
                            onClick={() => onSendAction(`Draft personalized cold email for ${title}`)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono transition-colors flex items-center space-x-1 shrink-0 self-start sm:self-center cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Draft Email</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-lg bg-[#050505] border grid-line text-xs text-gray-300">
                    {cleanStr(sec)}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Render Strategic Action Plan Card
        if (isActionPlan) {
          const actionText = contentLines.map(cleanStr).join(' ') || cleanStr(sec);
          return (
            <div key={secIdx} className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#0a0a0a] border border-emerald-500/40 text-xs shadow-md">
              <div className="flex items-center space-x-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider font-mono text-xs">
                  Strategic Action Directive
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed text-xs pl-6">
                {actionText}
              </p>

              {onNavigateTab && (
                <div className="mt-3 pl-6 flex items-center space-x-2">
                  <button
                    onClick={() => onNavigateTab('playground')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer glow-emerald"
                  >
                    <Play className="w-3 h-3 fill-emerald-400" />
                    <span>Run Agent Loop in Playground</span>
                  </button>
                </div>
              )}
            </div>
          );
        }

        // Fallback Paragraph Block
        return (
          <div key={secIdx} className="p-3 rounded-xl bg-[#0a0a0a] border grid-line text-xs text-gray-300">
            {cleanStr(sec)}
          </div>
        );
      })}
    </div>
  );
};

export const NyxChat: React.FC<NyxChatProps> = ({
  openRouterApiKey,
  selectedModel,
  onNavigateTab
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'nyx',
      text: `Executive Summary\nNyx Autonomous AI SDR Agent is initialized and online. Pipeline vectors, CRM deal accounts, and ICP parameters are active.\n\nCapabilities Available\n• Prospect Lead Intelligence: Autonomous domain scraping and lead vector enrichment.\n• Cold Email Copy Synthesis: Personalized B2B email generation matching ICP parameters.\n• CRM Account Audit: Revenue LTV cross-referencing and deal sentiment analysis.\n\nStrategic Action Plan\nSelect a direct action below or prompt a pipeline directive to execute agentic workflows.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Pipeline Summary', action: 'Summarize active prospect leads and pipeline status' },
        { label: 'Draft Cold Email', action: 'Write a personalized cold email for our top prospect lead' },
        { label: 'CRM LTV Audit', action: 'Audit CRM deal histories and client account sentiment' },
        { label: 'ICP Optimization', action: 'Optimize our ICP value proposition for higher reply conversion' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/nyx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            sender: m.sender,
            content: m.text
          })),
          openRouterApiKey,
          selectedModel
        })
      });

      if (res.ok) {
        const data = await res.json();
        const nyxReply: ChatMessage = {
          id: `nyx-${Date.now()}`,
          sender: 'nyx',
          text: data.reply || "Executive briefing compiled.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, nyxReply]);
      } else {
        throw new Error('Failed to fetch response');
      }
    } catch (err) {
      const fallbackReply: ChatMessage = {
        id: `nyx-err-${Date.now()}`,
        sender: 'nyx',
        text: `Executive Summary\nEvaluated pipeline directive: "${query}".\n\nCapabilities Available\n• Prospect Lead Intelligence: Domain scraping & lead vector enrichment.\n• Cold Email Copy Synthesis: Personalized B2B email generation.\n\nStrategic Action Plan\nExecute the Thought-Action-Observation loop in the Agent Playground tab.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'nyx',
        text: `Executive Summary\nNyx SDR Agent session reset complete.\n\nStrategic Action Plan\nOnline and ready for your next SDR pipeline directive.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-mono space-y-4">
      {/* Executive Pipeline Telemetry HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0a0a0a] border grid-line flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Target Prospects</span>
            <span className="text-sm font-bold text-white font-mono">3 Verified Leads</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0a0a] border grid-line flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">CRM Portfolio Revenue</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">$18,000 LTV</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0a0a] border grid-line flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Outbound Persona</span>
            <span className="text-sm font-bold text-gray-200 font-mono truncate max-w-[120px] block">Sarah Jenkins</span>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0a0a0a] border grid-line flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Agent Framework</span>
            <span className="text-sm font-bold text-amber-400 font-mono">LangGraph Cyclic</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="bg-[#0a0a0a] border grid-line rounded-xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
        {/* Header Bar */}
        <div className="p-4 bg-[#050505] border-b grid-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/50 rounded-xl flex items-center justify-center glow-emerald">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-[#050505]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase terminal-font">Nyx AI SDR Command Console</h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Autonomous B2B Pipeline Executive • Decision-Grade SDR Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('playground')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono uppercase transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Agent Playground</span>
              </button>
            )}

            <button
              onClick={handleClearChat}
              className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] hover:bg-white/5 text-gray-400 hover:text-white border grid-line text-xs transition-colors flex items-center space-x-1 cursor-pointer"
              title="Clear Chat History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#050505]/50">
          {messages.map((msg, idx) => {
            const isNyx = msg.sender === 'nyx';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isNyx ? 'justify-start' : 'justify-end'}`}
              >
                {isNyx && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 glow-emerald">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                )}

                <div className={`max-w-[88%] space-y-2 ${isNyx ? 'items-start' : 'items-end flex flex-col'}`}>
                  <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                    <span className="font-bold text-gray-400">{isNyx ? 'NYX AGENT' : 'YOU'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-xl text-xs space-y-2 relative ${
                      isNyx
                        ? 'bg-[#0a0a0a] border grid-line text-gray-200 border-emerald-500/20 shadow-lg'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 font-sans'
                    }`}
                  >
                    {/* Render Executive Formatted Cards */}
                    {isNyx ? (
                      <NyxMessageFormatter 
                        text={msg.text} 
                        onNavigateTab={onNavigateTab}
                        onSendAction={(actText) => handleSend(actText)}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    )}

                    {/* Copy Button for Nyx Responses */}
                    {isNyx && (
                      <div className="pt-2 flex items-center justify-between border-t grid-line text-[10px] text-gray-500 mt-2">
                        <span className="flex items-center space-x-1 text-emerald-400/80 font-mono">
                          <Terminal className="w-3 h-3" />
                          <span>Nyx Decision-Grade SDR Engine</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.text, idx)}
                          className="px-2 py-0.5 rounded bg-[#050505] hover:bg-white/10 text-gray-400 hover:text-white border grid-line flex items-center space-x-1 transition-colors cursor-pointer font-mono"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Output</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(act.action)}
                          className="px-2.5 py-1 rounded-lg bg-[#0a0a0a] hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono transition-all hover:scale-105 cursor-pointer flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isNyx && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-center space-x-3 text-xs text-emerald-400 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="p-3 bg-[#0a0a0a] border grid-line rounded-xl flex items-center space-x-2 text-gray-400">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="font-mono text-[11px]">Nyx is evaluating sales vectors and compiling executive briefing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Action Directives Bar */}
        <div className="p-2 bg-[#050505] border-t grid-line flex items-center space-x-2 overflow-x-auto text-[10px] scrollbar-none">
          <span className="text-gray-500 font-bold shrink-0 uppercase px-2 flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-emerald-400" />
            <span>Directives:</span>
          </span>
          <button
            onClick={() => handleSend("Summarize active prospect leads and pipeline status")}
            className="px-2.5 py-1 rounded bg-[#0a0a0a] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border grid-line hover:border-emerald-500/40 shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer font-mono"
          >
            <BarChart3 className="w-3 h-3 text-emerald-400" />
            <span>Pipeline Summary</span>
          </button>
          <button
            onClick={() => handleSend("Write a personalized cold email for our top prospect lead")}
            className="px-2.5 py-1 rounded bg-[#0a0a0a] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border grid-line hover:border-emerald-500/40 shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer font-mono"
          >
            <Mail className="w-3 h-3 text-blue-400" />
            <span>Draft Email for Lead</span>
          </button>
          <button
            onClick={() => handleSend("Audit CRM deal histories and client account sentiment")}
            className="px-2.5 py-1 rounded bg-[#0a0a0a] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border grid-line hover:border-emerald-500/40 shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer font-mono"
          >
            <Database className="w-3 h-3 text-amber-400" />
            <span>CRM Audit</span>
          </button>
          <button
            onClick={() => handleSend("Optimize our ICP value proposition for higher reply conversion")}
            className="px-2.5 py-1 rounded bg-[#0a0a0a] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border grid-line hover:border-emerald-500/40 shrink-0 transition-colors flex items-center space-x-1.5 cursor-pointer font-mono"
          >
            <Target className="w-3 h-3 text-purple-400" />
            <span>ICP Strategy</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#0a0a0a] border-t grid-line">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nyx anything (e.g. 'Analyze prospect lead Acme Corp', 'Write a cold email')..."
                disabled={loading}
                className="w-full bg-[#050505] border grid-line rounded-lg px-4 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-emerald cursor-pointer shrink-0"
            >
              <span>Send Directive</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
