import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OpenRouterModal } from './components/OpenRouterModal';
import { AgentPlayground } from './components/AgentPlayground';
import { LeadPipeline } from './components/LeadPipeline';
import { CrmIntelligence } from './components/CrmIntelligence';
import { WebScrapeSandbox } from './components/WebScrapeSandbox';
import { OutboxDrafts } from './components/OutboxDrafts';
import { LangGraphViewer } from './components/LangGraphViewer';
import { IcpSettings } from './components/IcpSettings';
import { NyxChat } from './components/NyxChat';
import { AgentDrawer } from './components/AgentDrawer';
import { PasskeyModal } from './components/PasskeyModal';
import { Bot, MessageSquare } from 'lucide-react';

import { ProspectLead, CRMRecord, OutboundDraft, ICPConfig, OpenRouterModel } from './types';
import { INITIAL_PROSPECTS, INITIAL_CRM_RECORDS, DEFAULT_ICP_CONFIG, DEFAULT_OPENROUTER_MODELS } from './data/mockData';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('merqato_authed_5309') === 'true';
  });
  const [activeTab, setActiveTab] = useState<string>('leads');
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(DEFAULT_OPENROUTER_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>('meta-llama/llama-3.3-70b-instruct:free');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => {
    return localStorage.getItem('sdr_openrouter_api_key') || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Core Data Collections
  const [prospects, setProspects] = useState<ProspectLead[]>(INITIAL_PROSPECTS);
  const [selectedProspect, setSelectedProspect] = useState<ProspectLead>(INITIAL_PROSPECTS[0]);
  const [crmRecords, setCrmRecords] = useState<CRMRecord[]>(INITIAL_CRM_RECORDS);
  const [outboundDrafts, setOutboundDrafts] = useState<OutboundDraft[]>([]);
  const [icpConfig, setIcpConfig] = useState<ICPConfig>(DEFAULT_ICP_CONFIG);

  // Fetch initial data from Express backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelsRes, leadsRes, crmRes, draftsRes, icpRes] = await Promise.all([
          fetch('/api/openrouter/models'),
          fetch('/api/leads'),
          fetch('/api/crm/records'),
          fetch('/api/drafts'),
          fetch('/api/icp')
        ]);

        if (modelsRes.ok) {
          const data = await modelsRes.json();
          if (data.models && data.models.length > 0) {
            setOpenRouterModels(data.models);
          }
        }
        if (leadsRes.ok) {
          const data = await leadsRes.json();
          if (data.leads && data.leads.length > 0) {
            setProspects(data.leads);
            setSelectedProspect(data.leads[0]);
          }
        }
        if (crmRes.ok) {
          const data = await crmRes.json();
          if (data.records) setCrmRecords(data.records);
        }
        if (draftsRes.ok) {
          const data = await draftsRes.json();
          if (data.drafts) setOutboundDrafts(data.drafts);
        }
        if (icpRes.ok) {
          const data = await icpRes.json();
          if (data.icp) setIcpConfig(data.icp);
        }
      } catch (err) {
        console.warn('Backend fetch fallback to local defaults:', err);
      }
    };

    fetchData();
  }, []);

  const handleSaveKey = (key: string) => {
    setOpenRouterApiKey(key);
    localStorage.setItem('sdr_openrouter_api_key', key);
  };

  const handleAddLead = async (leadData: Partial<ProspectLead>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(prev => [data.lead, ...prev]);
        setSelectedProspect(data.lead);
      }
    } catch (e) {
      const newLead: ProspectLead = {
        id: `lead-${Date.now()}`,
        companyName: leadData.companyName || 'New Target',
        website: leadData.website || 'example.com',
        contactName: leadData.contactName || 'Lead Contact',
        contactRole: leadData.contactRole || 'Decision Maker',
        contactEmail: leadData.contactEmail || 'lead@example.com',
        industry: leadData.industry || 'B2B Software',
        status: 'New',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProspects(prev => [newLead, ...prev]);
      setSelectedProspect(newLead);
    }
  };

  const handleAddCrmRecord = async (recordData: Partial<CRMRecord>) => {
    try {
      const res = await fetch('/api/crm/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      if (res.ok) {
        const data = await res.json();
        setCrmRecords(prev => [data.record, ...prev]);
      }
    } catch (e) {
      console.warn('Offline CRM add fallback');
    }
  };

  const handleSaveOutboundDraft = (draft: any) => {
    const newDraftItem: OutboundDraft = {
      id: `draft-${Date.now()}`,
      prospectId: selectedProspect.id,
      companyName: draft.companyName || selectedProspect.companyName,
      recipientEmail: draft.recipientEmail || selectedProspect.contactEmail,
      recipientName: selectedProspect.contactName,
      subject: `Introduction: ${draft.companyName} + ${icpConfig.senderCompany}`,
      body: draft.body,
      hookUsed: draft.hookUsed,
      createdAt: new Date().toISOString(),
      status: 'Draft',
      tone: 'Value-First'
    };
    setOutboundDrafts(prev => [newDraftItem, ...prev]);
  };

  const handleUpdateDraft = (id: string, updated: Partial<OutboundDraft>) => {
    setOutboundDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...updated } : d)));
  };

  const handleSaveIcp = async (updatedIcp: ICPConfig) => {
    setIcpConfig(updatedIcp);
    try {
      await fetch('/api/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIcp)
      });
    } catch (e) {
      console.warn('Offline ICP save');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        openRouterModels={openRouterModels}
        hasApiKey={Boolean(openRouterApiKey)}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        isAgentRunning={false}
      />

      {/* Main Content Area */}
      <main className="pb-12">
        {activeTab === 'leads' && (
          <LeadPipeline
            prospects={prospects}
            onSelectLeadForAgent={(lead) => {
              setSelectedProspect(lead);
              setIsAgentDrawerOpen(true);
            }}
            onAddLead={handleAddLead}
          />
        )}

        {activeTab === 'crm' && (
          <CrmIntelligence
            records={crmRecords}
            onAddCrmRecord={handleAddCrmRecord}
            onOpenAgent={() => setIsAgentDrawerOpen(true)}
          />
        )}

        {activeTab === 'scrape' && (
          <WebScrapeSandbox 
            onNavigateTab={setActiveTab}
            onOpenAgent={() => setIsAgentDrawerOpen(true)}
          />
        )}

        {activeTab === 'outbox' && (
          <OutboxDrafts
            drafts={outboundDrafts}
            onUpdateDraft={handleUpdateDraft}
            onOpenAgent={() => setIsAgentDrawerOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <NyxChat
            openRouterApiKey={openRouterApiKey}
            selectedModel={selectedModel}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'playground' && (
          <AgentPlayground
            prospects={prospects}
            selectedProspect={selectedProspect}
            onSelectProspect={setSelectedProspect}
            selectedModel={selectedModel}
            hasApiKey={Boolean(openRouterApiKey)}
            onSaveOutboundDraft={handleSaveOutboundDraft}
          />
        )}

        {activeTab === 'langgraph' && (
          <LangGraphViewer />
        )}

        {activeTab === 'icp' && (
          <IcpSettings
            icp={icpConfig}
            onSaveIcp={handleSaveIcp}
          />
        )}
      </main>

      {/* Persistent Floating Nyx Agent Drawer Launcher Button */}
      <button
        onClick={() => setIsAgentDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#0a0a0a] border border-emerald-500/50 text-emerald-400 p-3.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 hover:bg-emerald-500/20 transition-all group flex items-center space-x-2 cursor-pointer font-mono glow-emerald"
        title="Open Interactive Nyx Agent Panel"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider pr-1 hidden sm:inline">
          Agent Panel
        </span>
      </button>

      {/* Interactive On-Page Agent Drawer Panel */}
      <AgentDrawer
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
        prospects={prospects}
        selectedProspect={selectedProspect}
        onSelectProspect={setSelectedProspect}
        openRouterApiKey={openRouterApiKey}
        selectedModel={selectedModel}
        hasApiKey={Boolean(openRouterApiKey)}
        onSaveOutboundDraft={handleSaveOutboundDraft}
        onNavigateTab={setActiveTab}
      />

      {/* OpenRouter Key & Provider Modal */}
      <OpenRouterModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={openRouterApiKey}
        onSaveKey={handleSaveKey}
        models={openRouterModels}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {/* Passkey Access Gate (Code 5309) */}
      <PasskeyModal
        isOpen={!isAuthenticated}
        onAuthenticate={() => {
          localStorage.setItem('merqato_authed_5309', 'true');
          setIsAuthenticated(true);
        }}
      />
    </div>
  );
}
