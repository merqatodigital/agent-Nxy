import React, { useState } from 'react';
import { Mail, Copy, Send, Check, Download, Edit3, Trash2, CheckCircle2, Sparkles, Bot } from 'lucide-react';
import { OutboundDraft } from '../types';

interface OutboxDraftsProps {
  drafts: OutboundDraft[];
  onUpdateDraft: (id: string, updated: Partial<OutboundDraft>) => void;
  onOpenAgent?: () => void;
}

export const OutboxDrafts: React.FC<OutboxDraftsProps> = ({
  drafts,
  onUpdateDraft,
  onOpenAgent
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  const copyDraft = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartEdit = (draft: OutboundDraft) => {
    setEditingId(draft.id);
    setEditBody(draft.body);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateDraft(id, { body: editBody });
    setEditingId(null);
  };

  const exportCsv = () => {
    const headers = ['Company', 'Recipient Email', 'Subject', 'Hook Used', 'Status', 'Body'];
    const rows = drafts.map(d => [
      `"${d.companyName}"`,
      `"${d.recipientEmail}"`,
      `"${d.subject}"`,
      `"${d.hookUsed}"`,
      `"${d.status}"`,
      `"${d.body.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdr_outreach_drafts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white uppercase terminal-font">Outbound Email Outbox Queue</h2>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-emerald-400 font-mono">
                  DRAFT_EMAIL Target
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Personalized sales outreach drafts written by the SDR Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenAgent && (
              <button
                onClick={onOpenAgent}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Synthesize Draft with Nyx</span>
              </button>
            )}

            <button
              onClick={exportCsv}
              disabled={drafts.length === 0}
              className="px-4 py-2 rounded-lg bg-[#050505] text-gray-300 font-mono text-xs border grid-line hover:text-white uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export Outbox CSV</span>
            </button>
          </div>
        </div>

        {/* Draft List */}
        {drafts.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-[#050505] border grid-line space-y-3 font-mono">
            <Mail className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Outbox Queue Empty</h3>
            <p className="text-[11px] text-gray-500 max-w-md mx-auto">
              Run the Autonomous SDR Agent loop on target prospects to auto-generate low-friction personalized outreach drafts.
            </p>
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-5 rounded-lg bg-[#050505] border grid-line space-y-4 text-xs hover:border-emerald-500/30 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b grid-line">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white uppercase terminal-font">{draft.companyName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 uppercase">
                        {draft.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono">Recipient: {draft.recipientEmail}</p>
                  </div>

                  <div className="flex items-center space-x-2 font-mono">
                    <button
                      onClick={() => copyDraft(`${draft.subject}\n\n${draft.body}`, draft.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] hover:bg-white/5 text-gray-300 text-xs border grid-line flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      {copiedId === draft.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === draft.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => onUpdateDraft(draft.id, { status: draft.status === 'Approved' ? 'Draft' : 'Approved' })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider font-bold border transition-all cursor-pointer ${
                        draft.status === 'Approved'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald'
                      }`}
                    >
                      {draft.status === 'Approved' ? 'Approved' : 'Approve Draft'}
                    </button>
                  </div>
                </div>

                {/* Subject & Hook */}
                <div className="space-y-2">
                  <div className="bg-[#0a0a0a] p-2.5 rounded-lg border grid-line font-bold text-gray-200 text-xs">
                    Subject: {draft.subject}
                  </div>

                  <div className="text-[10px] text-blue-400 bg-blue-950/20 p-2 rounded border border-blue-500/30 font-mono">
                    💡 Personalized Hook Angle: {draft.hookUsed}
                  </div>
                </div>

                {/* Email Body Editor */}
                {editingId === draft.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={6}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full bg-[#0a0a0a] border grid-line rounded-lg p-3 text-xs text-gray-100 font-sans focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end space-x-2 font-mono">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] text-gray-400 border grid-line hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(draft.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold hover:bg-emerald-500/30 glow-emerald"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="whitespace-pre-wrap font-sans text-xs text-gray-200 leading-relaxed bg-[#0a0a0a] p-3.5 rounded-lg border grid-line">
                      {draft.body}
                    </div>
                    <button
                      onClick={() => handleStartEdit(draft)}
                      className="absolute top-2 right-2 p-1.5 rounded bg-[#050505] border grid-line text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit Body Copy"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
