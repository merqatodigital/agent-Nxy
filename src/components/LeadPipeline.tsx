import React, { useState, useRef } from 'react';
import { Users, Plus, Play, Search, Building2, Globe, Mail, MapPin, Star, ExternalLink, Sparkles, Check, AlertCircle, Phone, Clock, Download, Upload, FileText, Bot, Target, Compass, ArrowRight, Zap } from 'lucide-react';
import { ProspectLead } from '../types';
import { parseGoogleBusinessUrl } from '../utils/googleBusiness';
import { downloadProspectCsvTemplate, parseProspectsFromCsv } from '../utils/csvHelper';

interface LeadPipelineProps {
  prospects: ProspectLead[];
  onSelectLeadForAgent: (lead: ProspectLead) => void;
  onAddLead: (lead: Partial<ProspectLead>) => void;
}

export const LeadPipeline: React.FC<LeadPipelineProps> = ({
  prospects,
  onSelectLeadForAgent,
  onAddLead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Quick Google Business Bar state
  const [quickGmbUrl, setQuickGmbUrl] = useState('');
  const [isExtractingQuick, setIsExtractingQuick] = useState(false);
  const [quickExtractMsg, setQuickExtractMsg] = useState<string | null>(null);

  // Bulk File Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Proactive Agent Focus Directive state
  const [activeFocusTopic, setActiveFocusTopic] = useState<string>('B2B SaaS & Technology');
  const [customFocusInput, setCustomFocusInput] = useState<string>('');
  const [focusStatusMsg, setFocusStatusMsg] = useState<string | null>(null);

  // Form state
  const [gmbUrlInput, setGmbUrlInput] = useState('');
  const [isExtractingModal, setIsExtractingModal] = useState(false);
  const [extractedGmbInfo, setExtractedGmbInfo] = useState<any>(null);

  const [newLeadForm, setNewLeadForm] = useState({
    companyName: '',
    website: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    industry: '',
    employeeCount: '10-50',
    location: 'Remote',
    notes: ''
  });

  const filtered = prospects.filter(p => {
    const matchesSearch =
      p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.googleBusinessUrl && p.googleBusinessUrl.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Extract Google Business data from URL input
  const handleExtractFromGmb = (urlToExtract: string, isQuickBar = false) => {
    if (!urlToExtract.trim()) return;

    if (isQuickBar) {
      setIsExtractingQuick(true);
      setQuickExtractMsg(null);
    } else {
      setIsExtractingModal(true);
    }

    setTimeout(() => {
      const gmbData = parseGoogleBusinessUrl(urlToExtract);

      if (isQuickBar) {
        // Automatically add as new prospect
        const newLead: Partial<ProspectLead> = {
          companyName: gmbData.companyName,
          website: gmbData.website,
          contactName: gmbData.contactName,
          contactRole: gmbData.contactRole,
          contactEmail: gmbData.contactEmail,
          industry: gmbData.industry,
          employeeCount: gmbData.employeeCount,
          location: gmbData.location,
          notes: gmbData.notes,
          status: 'New',
          googleBusinessUrl: gmbData.googleBusinessUrl,
          googleBusinessData: {
            placeName: gmbData.placeName,
            rating: gmbData.rating,
            reviewCount: gmbData.reviewCount,
            phone: gmbData.phone,
            address: gmbData.location,
            googleCategory: gmbData.googleCategory,
            businessHours: gmbData.businessHours,
            googleBusinessUrl: gmbData.googleBusinessUrl,
            googleMapsUrl: gmbData.googleMapsUrl
          }
        };

        onAddLead(newLead);
        setIsExtractingQuick(false);
        setQuickExtractMsg(`Successfully imported '${gmbData.companyName}' (${gmbData.rating}★, ${gmbData.reviewCount} reviews) from Google Business Profile!`);
        setQuickGmbUrl('');
        setTimeout(() => setQuickExtractMsg(null), 5000);
      } else {
        // Pre-fill form fields
        setNewLeadForm({
          companyName: gmbData.companyName,
          website: gmbData.website,
          contactName: gmbData.contactName,
          contactRole: gmbData.contactRole,
          contactEmail: gmbData.contactEmail,
          industry: gmbData.industry,
          employeeCount: gmbData.employeeCount,
          location: gmbData.location,
          notes: gmbData.notes
        });

        setExtractedGmbInfo({
          placeName: gmbData.placeName,
          rating: gmbData.rating,
          reviewCount: gmbData.reviewCount,
          phone: gmbData.phone,
          address: gmbData.location,
          googleCategory: gmbData.googleCategory,
          businessHours: gmbData.businessHours,
          googleBusinessUrl: gmbData.googleBusinessUrl,
          googleMapsUrl: gmbData.googleMapsUrl
        });

        setIsExtractingModal(false);
      }
    }, 600);
  };

  const handleSubmitNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.companyName || !newLeadForm.contactEmail) return;

    onAddLead({
      ...newLeadForm,
      status: 'New',
      googleBusinessUrl: gmbUrlInput || undefined,
      googleBusinessData: extractedGmbInfo || (gmbUrlInput ? parseGoogleBusinessUrl(gmbUrlInput) : undefined)
    });

    setNewLeadForm({
      companyName: '',
      website: '',
      contactName: '',
      contactRole: '',
      contactEmail: '',
      industry: '',
      employeeCount: '10-50',
      location: 'Remote',
      notes: ''
    });
    setGmbUrlInput('');
    setExtractedGmbInfo(null);
    setIsModalOpen(false);
  };

  // Handle Bulk Contact File Upload (CSV / JSON)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      try {
        let parsedLeads: Partial<ProspectLead>[] = [];

        if (file.name.endsWith('.json')) {
          const jsonArr = JSON.parse(content);
          if (Array.isArray(jsonArr)) {
            parsedLeads = jsonArr.map((item: any) => ({
              companyName: item.companyName || item.company || item.name || 'Target Business',
              website: item.website || item.domain || 'domain.com',
              contactName: item.contactName || item.contact || 'Business Owner',
              contactRole: item.contactRole || item.role || 'Decision Maker',
              contactEmail: item.contactEmail || item.email || 'contact@domain.com',
              industry: item.industry || item.category || 'B2B Professional Services',
              employeeCount: item.employeeCount || '10-50',
              location: item.location || 'United States',
              notes: item.notes || 'Bulk uploaded JSON record',
              status: 'New'
            }));
          }
        } else {
          // Parse CSV
          parsedLeads = parseProspectsFromCsv(content);
        }

        if (parsedLeads.length > 0) {
          parsedLeads.forEach(lead => onAddLead(lead));
          setUploadStatus(`Successfully uploaded ${parsedLeads.length} target prospects into pipeline!`);
          setTimeout(() => setUploadStatus(null), 5000);
        } else {
          setUploadStatus('Could not parse valid contact rows from file. Please use the CSV download template format.');
        }
      } catch (err) {
        setUploadStatus('Error reading file. Please ensure valid CSV or JSON formatting.');
      }

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleSelectFocusTopic = (topic: string) => {
    setActiveFocusTopic(topic);
    setFocusStatusMsg(`Nyx SDR Agent direction locked to: '${topic}'. Active prospecting loops aligned.`);
    setTimeout(() => setFocusStatusMsg(null), 4000);
  };

  const handleSetCustomFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFocusInput.trim()) return;
    setActiveFocusTopic(customFocusInput.trim());
    setFocusStatusMsg(`Nyx SDR Agent custom directive locked: '${customFocusInput.trim()}'. Ready for automated execution.`);
    setCustomFocusInput('');
    setTimeout(() => setFocusStatusMsg(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* PROACTIVE AGENT ALIVE FOCUS DIRECTIVE BANNER */}
      <div className="bg-[#0a0a0a] border border-emerald-500/40 rounded-xl p-5 text-gray-300 shadow-xl space-y-4 glow-emerald font-mono">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 glow-emerald">
              <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🤖 Nyx Proactive Agentic Direction</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  SDR LOOP ALIVE
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                "What target businesses or market verticals are we focusing on today?"
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] bg-[#050505] px-3 py-1.5 rounded-lg border grid-line text-emerald-400 font-bold">
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Active Focus: {activeFocusTopic}</span>
          </div>
        </div>

        {/* Quick Focus Topic Selector Chips */}
        <div className="space-y-2">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
            Select Focus Topic for Nyx SDR Loops:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '⚡ B2B SaaS & Technology', value: 'B2B SaaS & Technology' },
              { label: '🔥 Healthcare & Dental Practices', value: 'Healthcare & Dental Practices' },
              { label: '📦 Logistics & Supply Chain', value: 'Logistics & Supply Chain' },
              { label: '🏢 Commercial Real Estate', value: 'Commercial Real Estate' },
              { label: '⚖️ Corporate Legal & Advisory', value: 'Corporate Legal & Advisory' },
              { label: '🛠️ Local Commercial Services', value: 'Local Commercial Services' }
            ].map((chip) => (
              <button
                key={chip.value}
                onClick={() => handleSelectFocusTopic(chip.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center space-x-1 ${
                  activeFocusTopic === chip.value
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold glow-emerald'
                    : 'bg-[#050505] text-gray-400 hover:text-white border grid-line hover:border-emerald-500/30'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Focus Prompt Input */}
        <form onSubmit={handleSetCustomFocus} className="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-1">
          <div className="relative flex-1 min-w-[280px]">
            <Target className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customFocusInput}
              onChange={(e) => setCustomFocusInput(e.target.value)}
              placeholder="Or enter custom focus (e.g. 'High-end dental clinics in California with >4.8 Google rating')..."
              className="w-full bg-[#050505] border grid-line rounded-lg pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={!customFocusInput.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 shrink-0 glow-emerald"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Set Directive</span>
          </button>
        </form>

        {focusStatusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{focusStatusMsg}</span>
          </div>
        )}
      </div>

      {/* BULK DOWNLOAD TEMPLATE & UPLOAD CONTACT DATA BAR */}
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-4 text-gray-300 shadow-lg space-y-3 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <span>Bulk Data Import & Download Templates</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                  CSV / JSON SUPPORT
                </span>
              </h3>
              <p className="text-[10px] text-gray-400">
                Download formatted CSV template or upload your contact & prospect lead lists to populate the agent pipeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download CSV Template Button */}
            <button
              onClick={downloadProspectCsvTemplate}
              className="px-3.5 py-2 rounded-lg bg-[#050505] hover:bg-white/5 text-gray-200 border grid-line hover:border-amber-500/50 text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center space-x-1.5 cursor-pointer"
              title="Download CSV Bulk Template"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download CSV Template</span>
            </button>

            {/* Hidden File Input for Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.json"
              className="hidden"
            />

            {/* Upload Contacts Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center space-x-1.5 cursor-pointer glow-emerald"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Contacts File (CSV/JSON)</span>
            </button>
          </div>
        </div>

        {uploadStatus && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>
      {/* Google Business Instant Importer Bar */}
      <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-xl p-4 text-gray-300 shadow-lg space-y-3 glow-blue">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
                <span>📍 Import Target Prospect via Google Business URL</span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold">
                  ADMIN & AGENT FEATURE
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Paste any Google Business or Google Maps URL to instantly populate business details, rating, category, address & contact email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[280px]">
            <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={quickGmbUrl}
              onChange={(e) => setQuickGmbUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtractFromGmb(quickGmbUrl, true);
                }
              }}
              placeholder="Paste Google Business URL (e.g. https://www.google.com/maps/place/Merqato+Digital...)"
              className="w-full bg-[#050505] border grid-line rounded-lg pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <button
            onClick={() => handleExtractFromGmb(quickGmbUrl, true)}
            disabled={isExtractingQuick || !quickGmbUrl.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono uppercase text-xs font-bold hover:bg-blue-500/30 glow-blue transition-all inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isExtractingQuick ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                <span>Extracting Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Auto-Populate Prospect</span>
              </>
            )}
          </button>
        </div>

        {quickExtractMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{quickExtractMsg}</span>
          </div>
        )}
      </div>

      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase terminal-font">Prospect Lead Pipeline</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Target accounts ready for SDR agent execution</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono uppercase text-xs font-bold hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Target Prospect</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company, contact name, domain, or Google Business URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050505] border grid-line rounded-lg pl-9 pr-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500 text-[10px] uppercase">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Draft Ready">Draft Ready</option>
              <option value="Sent">Sent</option>
            </select>
          </div>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto rounded-lg border grid-line bg-[#050505]">
          <table className="w-full text-left text-xs text-gray-300 font-mono">
            <thead className="bg-[#0a0a0a] text-gray-500 uppercase tracking-widest text-[10px] border-b grid-line">
              <tr>
                <th className="px-4 py-3 font-bold">Company & Google Profile</th>
                <th className="px-4 py-3 font-bold">Contact Person</th>
                <th className="px-4 py-3 font-bold">Industry & Rating</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created Date</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((lead) => {
                const gmbData = lead.googleBusinessData || (lead.googleBusinessUrl ? parseGoogleBusinessUrl(lead.googleBusinessUrl) : undefined);

                return (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{lead.companyName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                        <a
                          href={`https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>{lead.website}</span>
                        </a>

                        {gmbData && (
                          <a
                            href={gmbData.googleMapsUrl || lead.googleBusinessUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[9px] hover:bg-blue-500/20 font-bold"
                            title="View Google Business Listing"
                          >
                            <MapPin className="w-2.5 h-2.5 text-blue-400" />
                            <span>Google Business</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-200">{lead.contactName}</div>
                      <div className="text-[10px] text-gray-500">{lead.contactRole}</div>
                      <div className="text-[10px] text-gray-600">{lead.contactEmail}</div>
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-[#0a0a0a] border grid-line text-gray-300 text-[10px]">
                          {lead.industry}
                        </span>
                      </div>

                      {gmbData && (
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <span className="flex items-center text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            {gmbData.rating || 4.8}
                          </span>
                          <span className="text-gray-500">({gmbData.reviewCount || 100} reviews)</span>
                          {gmbData.phone && (
                            <span className="text-gray-400 flex items-center">
                              <Phone className="w-2.5 h-2.5 ml-1 mr-0.5" />
                              {gmbData.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                          lead.status === 'Draft Ready'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : lead.status === 'Sent'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span>{lead.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-[10px]">
                      {lead.createdAt}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectLeadForAgent(lead)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/30 glow-emerald transition-all inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-emerald-400" />
                        <span>Run Agent</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a0a0a] border grid-line rounded-xl max-w-lg w-full p-6 text-gray-300 shadow-2xl space-y-4 font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b grid-line">
              <h3 className="text-sm font-bold text-white uppercase terminal-font flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Add Target Prospect Lead</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Google Business URL Auto-Fill Box inside Modal */}
            <div className="p-3 bg-[#050505] border border-blue-500/30 rounded-lg space-y-2">
              <label className="block text-blue-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>Auto-Populate via Google Business URL</span>
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gmbUrlInput}
                  onChange={(e) => setGmbUrlInput(e.target.value)}
                  placeholder="https://maps.google.com/place/..."
                  className="flex-1 bg-[#0a0a0a] border grid-line rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleExtractFromGmb(gmbUrlInput, false)}
                  disabled={isExtractingModal || !gmbUrlInput.trim()}
                  className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[11px] font-bold uppercase hover:bg-blue-500/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isExtractingModal ? 'Extracting...' : '⚡ Extract & Fill'}
                </button>
              </div>

              {extractedGmbInfo && (
                <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Populated: <strong>{extractedGmbInfo.placeName}</strong> ({extractedGmbInfo.rating}★, {extractedGmbInfo.reviewCount} reviews)</span>
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitNewLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.companyName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Website Domain *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.website}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, website: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="acme.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 text-[10px] uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                    className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] uppercase mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.contactEmail}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactEmail: e.target.value })}
                    className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="john@acme.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Industry / Category</label>
                <input
                  type="text"
                  value={newLeadForm.industry}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. SaaS / B2B Services"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Location / Address</label>
                <input
                  type="text"
                  value={newLeadForm.location}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. Austin, TX"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#050505] text-gray-400 font-mono hover:text-white border grid-line uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/30 glow-emerald cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
