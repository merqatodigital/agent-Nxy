import React, { useState } from 'react';
import { Database, Search, Plus, Building2, Calendar, DollarSign, Tag, MessageSquare, ShieldCheck, UserCheck, Bot, Sparkles } from 'lucide-react';
import { CRMRecord } from '../types';

interface CrmIntelligenceProps {
  records: CRMRecord[];
  onAddCrmRecord: (record: Partial<CRMRecord>) => void;
  onOpenAgent?: () => void;
}

export const CrmIntelligence: React.FC<CrmIntelligenceProps> = ({
  records,
  onAddCrmRecord,
  onOpenAgent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCrmForm, setNewCrmForm] = useState({
    companyName: '',
    domain: '',
    lifecycleStage: 'Prospect' as const,
    sentiment: 'New Account' as const,
    keyNotes: '',
    accountOwner: 'Alex Rivera'
  });

  const filtered = records.filter(r =>
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.keyNotes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrmForm.companyName || !newCrmForm.domain) return;
    onAddCrmRecord(newCrmForm);
    setNewCrmForm({
      companyName: '',
      domain: '',
      lifecycleStage: 'Prospect',
      sentiment: 'New Account',
      keyNotes: '',
      accountOwner: 'Alex Rivera'
    });
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white uppercase terminal-font">Internal CRM Intelligence</h2>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400 font-mono">
                  CRM_LOOKUP Target
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Historical deal records and account sentiment database</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono uppercase text-xs font-bold hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add CRM Record</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md font-mono">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Query CRM records by company, domain, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050505] border grid-line rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="p-5 rounded-lg bg-[#050505] border grid-line space-y-3 hover:border-emerald-500/30 transition-all text-xs font-mono"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-widest text-white flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{record.companyName}</span>
                  </h3>
                  <p className="text-[10px] text-blue-400 font-mono mt-0.5">{record.domain}</p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                    record.sentiment === 'Positive'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : record.sentiment === 'Hesitant'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {record.sentiment}
                </span>
              </div>

              {/* Account Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-[#0a0a0a] p-2.5 rounded-lg border grid-line text-[10px]">
                <div>
                  <span className="text-gray-500 block uppercase">Lifecycle Stage</span>
                  <span className="font-bold text-gray-200">{record.lifecycleStage}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase">Total Revenue</span>
                  <span className="font-bold text-emerald-400">${record.totalSpend.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase">Account Owner</span>
                  <span className="font-bold text-gray-200">{record.accountOwner}</span>
                </div>
              </div>

              {/* Key Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  Account Notes
                </span>
                <p className="text-gray-300 leading-relaxed bg-[#0a0a0a] p-2.5 rounded-lg border grid-line font-sans text-xs">
                  {record.keyNotes}
                </p>
              </div>

              {/* Past Deals List */}
              {record.pastDeals && record.pastDeals.length > 0 && (
                <div className="pt-2 border-t grid-line space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    Past Deal History
                  </span>
                  {record.pastDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between text-[10px] bg-[#0a0a0a] p-2 rounded border grid-line font-mono">
                      <div>
                        <span className="font-bold text-gray-200">{deal.title}</span>
                        <span className="text-[9px] text-gray-500 block">{deal.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-bold">${deal.amount}</span>
                        <span className={`block text-[9px] ${deal.status === 'Won' ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Agent Trigger Button */}
              {onOpenAgent && (
                <div className="pt-2 border-t grid-line flex items-center justify-end">
                  <button
                    onClick={onOpenAgent}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/20 glow-emerald transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run Nyx Agent on Account</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add CRM Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a0a0a] border grid-line rounded-xl max-w-md w-full p-6 text-gray-300 shadow-2xl space-y-4 font-mono">
            <h3 className="text-xs font-bold text-white uppercase terminal-font">Add Internal CRM Record</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCrmForm.companyName}
                  onChange={(e) => setNewCrmForm({ ...newCrmForm, companyName: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Apex Cloud Solutions"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Domain *</label>
                <input
                  type="text"
                  required
                  value={newCrmForm.domain}
                  onChange={(e) => setNewCrmForm({ ...newCrmForm, domain: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="apexcloud.io"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 text-[10px] uppercase mb-1">Lifecycle Stage</label>
                  <select
                    value={newCrmForm.lifecycleStage}
                    onChange={(e) => setNewCrmForm({ ...newCrmForm, lifecycleStage: e.target.value as any })}
                    className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none font-mono"
                  >
                    <option value="Lead" className="bg-[#0a0a0a]">Lead</option>
                    <option value="Prospect" className="bg-[#0a0a0a]">Prospect</option>
                    <option value="Opportunity" className="bg-[#0a0a0a]">Opportunity</option>
                    <option value="Customer" className="bg-[#0a0a0a]">Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 text-[10px] uppercase mb-1">Account Sentiment</label>
                  <select
                    value={newCrmForm.sentiment}
                    onChange={(e) => setNewCrmForm({ ...newCrmForm, sentiment: e.target.value as any })}
                    className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none font-mono"
                  >
                    <option value="New Account" className="bg-[#0a0a0a]">New Account</option>
                    <option value="Positive" className="bg-[#0a0a0a]">Positive</option>
                    <option value="Hesitant" className="bg-[#0a0a0a]">Hesitant</option>
                    <option value="Negative" className="bg-[#0a0a0a]">Negative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Key Account Notes</label>
                <textarea
                  rows={3}
                  value={newCrmForm.keyNotes}
                  onChange={(e) => setNewCrmForm({ ...newCrmForm, keyNotes: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="Important historical communications or obstacles..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#050505] text-gray-400 font-mono hover:text-white border grid-line uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/30 glow-emerald"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
