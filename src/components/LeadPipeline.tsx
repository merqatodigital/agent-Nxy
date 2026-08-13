import React, { useState } from 'react';
import { Users, Plus, Play, Search, Building2, Globe, Mail, Filter, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { ProspectLead } from '../types';

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
      p.website.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmitNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.companyName || !newLeadForm.contactEmail) return;
    onAddLead(newLeadForm);
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
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
              placeholder="Search by company, contact name, or domain..."
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
                <th className="px-4 py-3 font-bold">Company</th>
                <th className="px-4 py-3 font-bold">Contact Person</th>
                <th className="px-4 py-3 font-bold">Industry</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created Date</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lead.companyName}</span>
                    </div>
                    <a
                      href={`https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 mt-0.5"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{lead.website}</span>
                    </a>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-200">{lead.contactName}</div>
                    <div className="text-[10px] text-gray-500">{lead.contactRole}</div>
                    <div className="text-[10px] text-gray-600">{lead.contactEmail}</div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-[#0a0a0a] border grid-line text-gray-300 text-[10px]">
                      {lead.industry}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a0a0a] border grid-line rounded-xl max-w-md w-full p-6 text-gray-300 shadow-2xl space-y-4 font-mono">
            <h3 className="text-sm font-bold text-white uppercase terminal-font">Add New Target Prospect Lead</h3>

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
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Industry</label>
                <input
                  type="text"
                  value={newLeadForm.industry}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value })}
                  className="w-full bg-[#050505] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. SaaS / Software"
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
