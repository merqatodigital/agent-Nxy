import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  StepForward, 
  Bot, 
  CheckCircle2, 
  Terminal, 
  Code2, 
  Database, 
  Globe, 
  Mail, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Send, 
  Zap,
  Info,
  ShieldCheck,
  Building2,
  Search
} from 'lucide-react';
import { ProspectLead, ExecutionStep, ToolType, AgentStepResponse, AgentFinalOutput } from '../types';

interface AgentPlaygroundProps {
  prospects: ProspectLead[];
  selectedProspect: ProspectLead;
  onSelectProspect: (prospect: ProspectLead) => void;
  selectedModel: string;
  hasApiKey: boolean;
  onSaveOutboundDraft: (draft: any) => void;
}

export const AgentPlayground: React.FC<AgentPlaygroundProps> = ({
  prospects,
  selectedProspect,
  onSelectProspect,
  selectedModel,
  hasApiKey,
  onSaveOutboundDraft
}) => {
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'parsed' | 'raw_json'>('parsed');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [draftSavedMsg, setDraftSavedMsg] = useState(false);
  const [customForm, setCustomForm] = useState({
    companyName: selectedProspect.companyName,
    website: selectedProspect.website,
    contactName: selectedProspect.contactName,
    contactEmail: selectedProspect.contactEmail,
    industry: selectedProspect.industry,
    notes: selectedProspect.notes || ''
  });

  const handleProspectChange = (lead: ProspectLead) => {
    onSelectProspect(lead);
    setCustomForm({
      companyName: lead.companyName,
      website: lead.website,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      industry: lead.industry,
      notes: lead.notes || ''
    });
    setExecutionSteps([]);
  };

  const handleReset = () => {
    setExecutionSteps([]);
    setIsRunning(false);
  };

  // Helper to call backend tool based on agent tool decision
  const executeBackendTool = async (tool: ToolType, args: Record<string, any>) => {
    if (tool === 'CRM_LOOKUP') {
      const res = await fetch('/api/tools/crm-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    } else if (tool === 'WEB_SCRAPE') {
      const res = await fetch('/api/tools/web-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    } else if (tool === 'DRAFT_EMAIL') {
      const res = await fetch('/api/tools/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    }
    return null;
  };

  // Run a single step in the SDR Agent Loop
  const runSingleStep = async (): Promise<ExecutionStep | null> => {
    const currentProspect = {
      ...selectedProspect,
      companyName: customForm.companyName,
      website: customForm.website,
      contactName: customForm.contactName,
      contactEmail: customForm.contactEmail,
      industry: customForm.industry,
      notes: customForm.notes
    };

    const historyForBackend = executionSteps.map(s => ({
      stepNumber: s.stepNumber,
      thought: s.thought,
      tool: s.tool,
      arguments: s.arguments,
      observation: s.observation,
      final_output: s.finalOutput
    }));

    try {
      const res = await fetch('/api/agent/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect: currentProspect,
          stepHistory: historyForBackend,
          selectedModel: selectedModel
        })
      });

      if (!res.ok) throw new Error('Failed to execute agent step');

      const data = await res.json();
      const parsed: AgentStepResponse = data.parsedResponse || {};

      let observationData: any = null;
      let isFinal = Boolean(parsed.final_output);

      // Execute tool if step called one
      if (parsed.tool && parsed.arguments) {
        observationData = await executeBackendTool(parsed.tool, parsed.arguments);
      }

      const newStep: ExecutionStep = {
        id: `step-${Date.now()}`,
        stepNumber: executionSteps.length + 1,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        thought: parsed.thought || 'Processing SDR reasoning loop...',
        tool: parsed.tool,
        arguments: parsed.arguments,
        observation: observationData,
        isFinal: isFinal,
        finalOutput: parsed.final_output,
        rawResponseJson: data.rawResponse || JSON.stringify(parsed, null, 2)
      };

      setExecutionSteps(prev => [...prev, newStep]);
      return newStep;
    } catch (err) {
      console.error('Agent execution error:', err);
      return null;
    }
  };

  // Auto-run loop until final_output is reached
  const runFullAgentLoop = async () => {
    if (isRunning) return;
    setIsRunning(true);

    let stepsCount = executionSteps.length;
    let completed = false;

    while (!completed && stepsCount < 6) {
      const step = await runSingleStep();
      if (!step || step.isFinal) {
        completed = true;
      } else {
        stepsCount++;
        // Short pause between steps for realistic agent reasoning feel
        await new Promise(r => setTimeout(r, 700));
      }
    }

    setIsRunning(false);
  };

  const copyStepJson = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const finalStep = executionSteps.find(s => s.isFinal);

  // Check state node progression for LangGraph top bar
  const hasCrm = executionSteps.some(s => s.tool === 'CRM_LOOKUP');
  const hasScrape = executionSteps.some(s => s.tool === 'WEB_SCRAPE');
  const hasDraft = executionSteps.some(s => s.tool === 'DRAFT_EMAIL');
  const isFinished = Boolean(finalStep);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls & Prospect Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prospect Selector & Input Details */}
        <div className="bg-[#0a0a0a] border grid-line rounded-xl p-5 text-gray-300 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b grid-line">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-xs uppercase tracking-widest text-white terminal-font">Target Prospect Data</h2>
            </div>
            <span className="text-[10px] text-emerald-500/80 font-mono uppercase">Agent Input Payload</span>
          </div>

          {/* Quick Select Preset Leads */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-500 mb-1.5">
              Select Preset Lead or Customize
            </label>
            <select
              id="prospect-picker"
              value={selectedProspect.id}
              onChange={(e) => {
                const found = prospects.find(p => p.id === e.target.value);
                if (found) handleProspectChange(found);
              }}
              className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {prospects.map(p => (
                <option key={p.id} value={p.id} className="bg-[#0a0a0a]">
                  {p.companyName} — {p.contactName} ({p.website})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Form Fields */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-gray-500 mb-1">Company Name</label>
              <input
                type="text"
                value={customForm.companyName}
                onChange={(e) => setCustomForm({ ...customForm, companyName: e.target.value })}
                className="w-full bg-[#050505] border grid-line rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-gray-500 mb-1">Website Domain</label>
              <input
                type="text"
                value={customForm.website}
                onChange={(e) => setCustomForm({ ...customForm, website: e.target.value })}
                className="w-full bg-[#050505] border grid-line rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-gray-500 mb-1">Contact Person</label>
              <input
                type="text"
                value={customForm.contactName}
                onChange={(e) => setCustomForm({ ...customForm, contactName: e.target.value })}
                className="w-full bg-[#050505] border grid-line rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-gray-500 mb-1">Contact Email</label>
              <input
                type="email"
                value={customForm.contactEmail}
                onChange={(e) => setCustomForm({ ...customForm, contactEmail: e.target.value })}
                className="w-full bg-[#050505] border grid-line rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 mb-1">Industry / Sector</label>
            <input
              type="text"
              value={customForm.industry}
              onChange={(e) => setCustomForm({ ...customForm, industry: e.target.value })}
              className="w-full bg-[#050505] border grid-line rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Execution Control Center */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border grid-line rounded-xl p-5 text-gray-300 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b grid-line">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-xs uppercase tracking-widest text-white terminal-font">Agent Execution Controller</h2>
              </div>
              <div className="flex items-center space-x-2">
                {/* Active Model Green Light Indicator */}
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="font-bold truncate max-w-[140px]">{selectedModel.split('/')[1] || selectedModel}</span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                  isFinished
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 glow-emerald'
                    : isRunning
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse glow-blue'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  {isFinished ? 'Execution Complete' : isRunning ? 'Running Iterative Loop...' : 'System Nominal / Ready'}
                </span>
              </div>
            </div>

            {/* LangGraph Live Flow Node Indicators */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#050505] border grid-line">
              <p className="text-[10px] font-mono uppercase text-gray-500 mb-2.5 tracking-widest">
                LangGraph State Node Progress
              </p>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono uppercase">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                  1. Input
                </div>
                <div className={`p-2 rounded-lg border font-medium transition-all ${
                  hasCrm
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 glow-emerald'
                    : 'bg-[#0a0a0a] border-white/10 text-gray-600'
                }`}>
                  2. CRM Node
                </div>
                <div className={`p-2 rounded-lg border font-medium transition-all ${
                  hasScrape
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 glow-blue'
                    : 'bg-[#0a0a0a] border-white/10 text-gray-600'
                }`}>
                  3. Scraper
                </div>
                <div className={`p-2 rounded-lg border font-medium transition-all ${
                  hasDraft
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-[#0a0a0a] border-white/10 text-gray-600'
                }`}>
                  4. Draft
                </div>
                <div className={`p-2 rounded-lg border font-medium transition-all ${
                  isFinished
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 glow-emerald'
                    : 'bg-[#0a0a0a] border-white/10 text-gray-600'
                }`}>
                  5. Action Done
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t grid-line">
            <div className="flex items-center space-x-2">
              <button
                id="run-auto-agent-btn"
                onClick={runFullAgentLoop}
                disabled={isRunning || isFinished}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald font-mono uppercase tracking-wider text-xs font-bold disabled:opacity-40 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Auto-Run Agent Loop</span>
              </button>

              <button
                id="run-single-step-btn"
                onClick={() => runSingleStep()}
                disabled={isRunning || isFinished}
                className="px-3.5 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 font-mono uppercase text-xs disabled:opacity-40 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <StepForward className="w-3.5 h-3.5 text-blue-400" />
                <span>Execute Step</span>
              </button>
            </div>

            <button
              id="reset-agent-btn"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg bg-[#050505] text-gray-400 hover:text-white border grid-line font-mono uppercase text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thought -> Action -> Observation Stream */}
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b grid-line">
          <div className="flex items-center space-x-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-white terminal-font">Current Reasoning Execution Stream</h3>
              <p className="text-[10px] text-gray-500 font-mono">Thought - Action - Observation cycle adhere to raw JSON schema</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-[#050505] p-1 rounded-lg border grid-line text-[11px] font-mono">
            <button
              onClick={() => setActiveViewMode('parsed')}
              className={`px-3 py-1 rounded-md transition-all font-medium ${
                activeViewMode === 'parsed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Parsed Mode
            </button>
            <button
              onClick={() => setActiveViewMode('raw_json')}
              className={`px-3 py-1 rounded-md transition-all font-medium ${
                activeViewMode === 'raw_json' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Raw JSON Inspector
            </button>
          </div>
        </div>

        {/* Step Stream */}
        {executionSteps.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#050505] border grid-line space-y-3">
            <Bot className="w-10 h-10 text-gray-600 mx-auto" />
            <div>
              <h4 className="text-xs font-mono uppercase text-gray-400 tracking-wider">Engine Idle // Awaiting Execution Trigger</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 font-mono">
                Click "Auto-Run Agent Loop" or "Execute Step" to start querying CRM records, scraping target website vectors, and generating cold email outreach drafts.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {executionSteps.map((step, idx) => (
              <div
                key={step.id}
                className="p-5 rounded-xl border grid-line bg-[#050505] text-xs font-mono space-y-3"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between pb-2 border-b grid-line">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold text-xs uppercase">
                      STEP_0{step.stepNumber}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      // {step.isFinal ? 'FINAL_OUTPUT_EMITTED' : `ACTION_TOOL: ${step.tool || 'REASONING'}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gray-600">{step.timestamp}</span>
                    <button
                      onClick={() => copyStepJson(step.rawResponseJson || '', idx)}
                      className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
                      title="Copy Step Raw JSON"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {activeViewMode === 'parsed' ? (
                  <div className="space-y-3">
                    {/* Thought */}
                    <div className="bg-[#0a0a0a] p-3 rounded-lg border grid-line terminal-font">
                      <span className="text-[10px] uppercase text-emerald-500/80 font-bold block mb-1">
                        "thought":
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        "{step.thought}"
                      </p>
                    </div>

                    {/* Tool Call & Arguments */}
                    {step.tool && step.arguments && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#0a0a0a] p-3 rounded-lg border grid-line terminal-font">
                          <span className="text-[10px] uppercase text-amber-400 font-bold block mb-1">
                            "tool": "{step.tool}"
                          </span>
                          <div className="text-[11px] text-blue-400 overflow-x-auto">
                            <pre>{JSON.stringify(step.arguments, null, 2)}</pre>
                          </div>
                        </div>

                        {/* Tool Observation Output */}
                        <div className="bg-[#0a0a0a] p-3 rounded-lg border grid-line terminal-font">
                          <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1">
                            Observation Data:
                          </span>
                          <div className="text-[11px] text-emerald-400 max-h-36 overflow-y-auto">
                            <pre>{JSON.stringify(step.observation, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Final Output View */}
                    {step.isFinal && step.finalOutput && (
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 terminal-font space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Outbound Action Processed: {step.finalOutput.company_processed}</span>
                        </div>
                        <p className="text-xs text-gray-300">
                          <span className="text-blue-400 font-bold">Hook Strategy:</span> {step.finalOutput.hook_used}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Raw JSON Mode */
                  <div className="bg-[#0a0a0a] p-3.5 rounded-lg border grid-line terminal-font text-xs text-gray-300 overflow-x-auto">
                    <pre>{step.rawResponseJson}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Action & Cold Outreach Preview Card */}
      {finalStep && finalStep.finalOutput && (
        <div className="bg-[#0a0a0a] border border-emerald-500/40 rounded-xl p-6 text-gray-300 glow-emerald space-y-4">
          <div className="flex items-center justify-between pb-3 border-b grid-line">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-white terminal-font">Personalized Sales Outreach Draft</h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Low-Friction Hook Committed
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#050505] p-3 rounded-lg border grid-line">
                <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Target Company</span>
                <span className="font-bold text-white">{finalStep.finalOutput.company_processed}</span>
              </div>
              <div className="bg-[#050505] p-3 rounded-lg border grid-line">
                <span className="text-[10px] text-gray-500 uppercase block mb-0.5">Hook Strategy</span>
                <span className="font-bold text-amber-400">{finalStep.finalOutput.hook_used}</span>
              </div>
            </div>

            <div className="bg-[#050505] p-4 rounded-lg border grid-line space-y-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                Generated Outreach Copy
              </span>
              <div className="whitespace-pre-wrap font-sans text-xs text-gray-200 leading-relaxed bg-[#0a0a0a] p-3.5 rounded-lg border grid-line">
                {finalStep.finalOutput.generated_draft}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500 font-mono flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Outbound payload validated for sequence queue</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  copyStepJson(finalStep.finalOutput?.generated_draft || '', 999);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#050505] text-gray-300 text-xs font-mono border grid-line hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Copy</span>
              </button>

              <button
                onClick={() => {
                  onSaveOutboundDraft({
                    companyName: finalStep.finalOutput?.company_processed,
                    hookUsed: finalStep.finalOutput?.hook_used,
                    body: finalStep.finalOutput?.generated_draft,
                    recipientEmail: selectedProspect.contactEmail
                  });
                  setDraftSavedMsg(true);
                  setTimeout(() => setDraftSavedMsg(false), 2000);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{draftSavedMsg ? 'Saved to Outbox Queue!' : 'Save to Pipeline Outbox'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
