import React, { useState, useEffect } from 'react';
import { 
  Globe, Search, Sparkles, CheckCircle2, ShieldAlert, Cpu, ArrowRight, ExternalLink, Zap, 
  Building2, Mail, Play, RefreshCw, HelpCircle, Info, ChevronRight, Layers, Sparkle
} from 'lucide-react';
import { ScrapedWebsiteData } from '../types';

interface WebScrapeSandboxProps {
  onNavigateTab?: (tab: string) => void;
  onOpenAgent?: () => void;
}

const TARGET_PROSPECTS = [
  { 
    domain: 'apexcloud.io', 
    name: 'Apex Cloud Solutions', 
    industry: 'Cloud Infrastructure',
    contact: 'Alex Rivers (VP Eng)',
    desc: 'B2B Enterprise Cloud & Serverless Infrastructure'
  },
  { 
    domain: 'nexgenhealth.co', 
    name: 'NexGen Health Tech', 
    industry: 'Digital Health AI',
    contact: 'Dr. Elena Rostova (CMO)',
    desc: 'Patient Care Analytics & Diagnostic AI Models'
  },
  { 
    domain: 'logiflow.com', 
    name: 'LogiFlow Supply Chain', 
    industry: 'Logistics SaaS',
    contact: 'Marcus Vance (COO)',
    desc: 'Automated Freight Tracking & Route Optimization'
  }
];

export const WebScrapeSandbox: React.FC<WebScrapeSandboxProps> = ({ onNavigateTab, onOpenAgent }) => {
  const [targetUrl, setTargetUrl] = useState('apexcloud.io');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedResult, setScrapedResult] = useState<ScrapedWebsiteData | null>(null);

  // Auto-run initial scrape for apexcloud.io
  useEffect(() => {
    runScrape('apexcloud.io');
  }, []);

  const runScrape = async (domainToScrape: string) => {
    if (!domainToScrape) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/tools/web-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domainToScrape })
      });
      const data = await res.json();
      setScrapedResult(data.scrape_result);
    } catch (err) {
      console.error('Web Scrape Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUrl.trim()) {
      runScrape(targetUrl.trim());
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-mono">
      {/* 3-Step Guided Workflow Header */}
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b grid-line">
          <div>
            <h1 className="text-base font-bold text-white uppercase terminal-font flex items-center space-x-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Company Website Scraper</span>
            </h1>
            <p className="text-xs text-gray-400 font-sans mt-0.5">
              Extract company info, tech stack, and pain points from any website URL to draft highly targeted sales emails.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Free Built-In Scraper</span>
            </span>
          </div>
        </div>

        {/* 3 Steps Visual Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#050505] border grid-line flex items-center space-x-3 text-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <span className="font-bold text-white block">Select or Enter URL</span>
              <span className="text-[10px] text-gray-500 font-sans">Choose a lead or enter custom domain</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#050505] border grid-line flex items-center space-x-3 text-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <span className="font-bold text-white block">Scrape Insights</span>
              <span className="text-[10px] text-gray-500 font-sans">Extract tech stack, value props & hooks</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#050505] border grid-line flex items-center space-x-3 text-xs">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <span className="font-bold text-white block">Draft Cold Email</span>
              <span className="text-[10px] text-gray-500 font-sans">Generate personalized cold outreach</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Choose a Target Company Card */}
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Step 1: Choose a Prospect Company to Scrape</span>
          </h2>
          <span className="text-[10px] text-gray-500 font-sans">Click any company below to scrape immediately</span>
        </div>

        {/* Prospect Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TARGET_PROSPECTS.map((p) => {
            const isSelected = targetUrl.toLowerCase().includes(p.domain);
            return (
              <div
                key={p.domain}
                onClick={() => {
                  setTargetUrl(p.domain);
                  runScrape(p.domain);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-[#050505] border-gray-800 hover:border-gray-600 hover:bg-[#080808]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white font-mono">{p.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                      {p.industry}
                    </span>
                  </div>
                  <span className="text-xs text-blue-400 font-mono block mb-1">{p.domain}</span>
                  <p className="text-[11px] text-gray-400 font-sans leading-snug">{p.desc}</p>
                </div>

                <div className="pt-2 border-t grid-line flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-sans">{p.contact}</span>
                  <span className={`text-xs font-bold font-mono flex items-center space-x-1 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`}>
                    <span>{isSelected ? 'Scraped' : 'Scrape'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom URL Input Bar */}
        <div className="pt-2 border-t grid-line space-y-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            Or Scrape Any Custom Website URL:
          </span>
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 font-mono">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter company website URL (e.g. stripe.com or datacamp.com)..."
                disabled={isLoading}
                className="w-full bg-[#050505] border grid-line rounded-lg pl-10 pr-4 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !targetUrl.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 glow-emerald shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scrape Custom URL</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* STEP 2 & 3: Scraped Company Insights & One-Click Draft Action */}
      {isLoading && (
        <div className="p-8 rounded-xl bg-[#0a0a0a] border grid-line space-y-3 text-center animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <p className="text-xs text-emerald-400 font-mono font-bold">Scraping company website vectors & tech stack from {targetUrl}...</p>
          <p className="text-[11px] text-gray-500 font-sans">Extracting meta tags, value propositions, and sales pain points.</p>
        </div>
      )}

      {!isLoading && scrapedResult && (
        <div className="bg-[#0a0a0a] border grid-line rounded-xl p-5 space-y-5 shadow-2xl animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b grid-line">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase terminal-font font-mono">{scrapedResult.title}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase">
                  SCRAPE COMPLETE
                </span>
              </div>
              <p className="text-xs text-gray-300 font-sans mt-1 max-w-2xl">{scrapedResult.description}</p>
            </div>

            <a
              href={scrapedResult.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#050505] hover:bg-white/5 text-blue-400 text-xs font-mono border grid-line flex items-center space-x-1.5 transition-colors"
            >
              <span>{scrapedResult.url}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* STEP 3 Call To Action Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0a0a0a] to-[#0a0a0a] border border-emerald-500/50 flex flex-wrap items-center justify-between gap-4 glow-emerald">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs uppercase font-mono">Step 3: Ready to Outreach?</span>
              </div>
              <p className="text-xs text-gray-300 font-sans">
                Use this company's scraped tech stack and pain points to synthesize a high-converting cold email.
              </p>
            </div>

            {(onOpenAgent || onNavigateTab) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAgent ? onOpenAgent() : onNavigateTab && onNavigateTab('chat')}
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer glow-emerald"
                >
                  <Mail className="w-4 h-4" />
                  <span>Draft Email with Nyx AI Agent</span>
                </button>
                <button
                  onClick={() => onOpenAgent ? onOpenAgent() : onNavigateTab && onNavigateTab('playground')}
                  className="px-3 py-2 rounded-lg bg-[#050505] hover:bg-white/5 text-gray-300 border grid-line text-xs font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run Agent Panel</span>
                </button>
              </div>
            )}
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Tech Stack */}
            <div className="p-4 rounded-xl bg-[#050505] border grid-line space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase">
                <Cpu className="w-4 h-4" />
                <span>Detected Tech Stack & Tools</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {scrapedResult.techStack.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-[#0a0a0a] border grid-line text-blue-300 font-mono text-[11px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Pain Points */}
            <div className="p-4 rounded-xl bg-[#050505] border grid-line space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase">
                <ShieldAlert className="w-4 h-4" />
                <span>Detected Prospect Pain Points</span>
              </div>
              <ul className="space-y-1.5 font-sans text-gray-300">
                {scrapedResult.detectedPainPoints.map((p, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business Vectors */}
            <div className="p-4 rounded-xl bg-[#050505] border grid-line space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase">
                <Zap className="w-4 h-4" />
                <span>Core Business Vectors</span>
              </div>
              <ul className="space-y-1.5 font-sans text-gray-300">
                {scrapedResult.coreBusinessVectors.map((v, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Value Propositions */}
            <div className="p-4 rounded-xl bg-[#050505] border grid-line space-y-2">
              <div className="flex items-center space-x-2 text-purple-400 font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Company Value Propositions</span>
              </div>
              <ul className="space-y-1.5 font-sans text-gray-300">
                {scrapedResult.valueProps.map((vp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>{vp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Free & Open Source FAQ Accordion Footer */}
      <div className="p-4 rounded-xl bg-[#050505] border grid-line text-xs space-y-2">
        <div className="flex items-center space-x-2 text-gray-300 font-bold">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Is this Web Scraper free to use?</span>
        </div>
        <p className="text-gray-400 font-sans leading-relaxed text-[11px] pl-6">
          <strong>Yes, 100% free!</strong> The Web Scraper runs natively on your Express backend using standard Node HTTP fetching and vector extraction. It does not require any paid scraping subscriptions, credits, or third-party paid APIs.
        </p>
      </div>
    </div>
  );
};
