import React from 'react';
import { GitFork, ArrowRight, Database, Globe, Mail, CheckCircle2, Shield, Info, Code2, Layers } from 'lucide-react';

export const LangGraphViewer: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <GitFork className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase terminal-font">LangGraph Agentic State Architecture</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                State machine architecture powering Thought -&gt; Tool Action -&gt; Observation loops
              </p>
            </div>
          </div>

          <a
            href="https://github.com/langchain-ai/langgraph.git"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-xs font-mono text-blue-400 border grid-line flex items-center space-x-1.5 transition-colors"
          >
            <span>langchain-ai/langgraph.git</span>
          </a>
        </div>

        {/* Visual LangGraph Pipeline Diagram */}
        <div className="p-6 rounded-lg bg-[#050505] border grid-line space-y-6 font-mono">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Cyclic Graph State Transitions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Node 1: Input State */}
            <div className="p-4 rounded-lg bg-[#0a0a0a] border grid-line space-y-2 relative group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                <Layers className="w-4 h-4" />
                <span>1. State Input</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Accepts Target Company, Contact Person, Website, Email, and ICP Parameters.
              </p>
              <div className="pt-2 font-mono text-[9px] text-emerald-400 bg-[#050505] p-2 rounded border grid-line">
                State: &#123; prospect, icp &#125;
              </div>
            </div>

            {/* Node 2: CRM Lookup Node */}
            <div className="p-4 rounded-lg bg-[#0a0a0a] border grid-line space-y-2 relative group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                <Database className="w-4 h-4" />
                <span>2. CRM Node</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Tool: <code className="text-emerald-300 font-mono">CRM_LOOKUP</code>. Checks historical deals and account sentiment.
              </p>
              <div className="pt-2 font-mono text-[9px] text-emerald-400 bg-[#050505] p-2 rounded border grid-line">
                Update: + crmHistory
              </div>
            </div>

            {/* Node 3: Web Scrape Node */}
            <div className="p-4 rounded-lg bg-[#0a0a0a] border grid-line space-y-2 relative group hover:border-blue-500/50 transition-all">
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase">
                <Globe className="w-4 h-4" />
                <span>3. Scraper Node</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Tool: <code className="text-blue-300 font-mono">WEB_SCRAPE</code>. Extracts domain text, tech stack, and recent news.
              </p>
              <div className="pt-2 font-mono text-[9px] text-blue-400 bg-[#050505] p-2 rounded border grid-line">
                Update: + websiteData
              </div>
            </div>

            {/* Node 4: Email Writer Node */}
            <div className="p-4 rounded-lg bg-[#0a0a0a] border grid-line space-y-2 relative group hover:border-emerald-500/50 transition-all">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                <Mail className="w-4 h-4" />
                <span>4. Draft Node</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Tool: <code className="text-emerald-300 font-mono">DRAFT_EMAIL</code>. Synthesizes hook and saves sales draft to queue.
              </p>
              <div className="pt-2 font-mono text-[9px] text-emerald-400 bg-[#050505] p-2 rounded border grid-line">
                Update: + emailDraft
              </div>
            </div>

            {/* Node 5: Final Output */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/40 space-y-2 relative group hover:border-emerald-400 transition-all glow-emerald">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>5. Execution Done</span>
              </div>
              <p className="text-[10px] text-gray-300 font-sans">
                Returns final JSON payload containing status, hook used, and outreach draft.
              </p>
              <div className="pt-2 font-mono text-[9px] text-emerald-400 bg-[#050505] p-2 rounded border border-emerald-500/30">
                Return: final_output
              </div>
            </div>
          </div>
        </div>

        {/* State Schema Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="bg-[#050505] p-4 rounded-lg border grid-line space-y-3">
            <h4 className="font-bold text-white uppercase terminal-font flex items-center space-x-2 text-xs">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>LangGraph Agent State Schema</span>
            </h4>
            <div className="font-mono text-[10px] text-gray-300 bg-[#0a0a0a] p-3 rounded-lg border grid-line overflow-x-auto">
              <pre>{`interface SDRState {
  prospect: {
    companyName: string;
    website: string;
    contactEmail: string;
  };
  stepHistory: Array<{
    thought: string;
    tool?: 'CRM_LOOKUP' | 'WEB_SCRAPE' | 'DRAFT_EMAIL';
    arguments?: Record<string, any>;
    observation?: any;
  }>;
  finalOutput?: {
    status: 'completed';
    company_processed: string;
    hook_used: string;
    generated_draft: string;
  };
}`}</pre>
            </div>
          </div>

          <div className="bg-[#050505] p-4 rounded-lg border grid-line space-y-3">
            <h4 className="font-bold text-white uppercase terminal-font flex items-center space-x-2 text-xs">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Agentic Loop Principles</span>
            </h4>
            <ul className="space-y-2.5 text-gray-300 text-xs font-sans">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span><strong className="text-white font-mono uppercase text-[11px]">Thought-Action-Observation:</strong> Each step evaluates state before invoking external SDR tools.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong className="text-white font-mono uppercase text-[11px]">No Conversational Prose:</strong> Engine responds exclusively in machine-parseable JSON format.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span><strong className="text-white font-mono uppercase text-[11px]">Strict Open-Source Models:</strong> Supports OpenRouter open-source models (Llama 3.3, DeepSeek, Qwen) for local data privacy.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
