import React, { useState } from 'react';
import { Mail, Copy, Send, Check, Download, Edit3, Bot, AlertCircle } from 'lucide-react';
import { OutboundDraft } from '../types';

interface OutboxDraftsProps {
  drafts: OutboundDraft[];
  onUpdateDraft: (id: string, updated: Partial<OutboundDraft>) => void;
  onOpenAgent?: () => void;
}

export const OutboxDrafts: React.FC<OutboxDraftsProps> = ({ drafts, onUpdateDraft, onOpenAgent }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const copyDraft = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const persistDraft = async (id: string, patch: Partial<OutboundDraft>) => {
    const res = await fetch(`/api/drafts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Draft update failed');
    onUpdateDraft(id, data.draft || patch);
    return data.draft as OutboundDraft | undefined;
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setActionError(null);
      await persistDraft(id, { body: editBody, status: 'Draft' });
      setEditingId(null);
    } catch (error: any) {
      setActionError(error?.message || 'Draft save failed');
    }
  };

  const toggleApproval = async (draft: OutboundDraft) => {
    try {
      setActionError(null);
      const nextStatus: OutboundDraft['status'] = draft.status === 'Approved' ? 'Draft' : 'Approved';
      await persistDraft(draft.id, { status: nextStatus });
    } catch (error: any) {
      setActionError(error?.message || 'Approval update failed');
    }
  };

  const sendDraft = async (draft: OutboundDraft) => {
    if (draft.status !== 'Approved' || sendingId) return;
    try {
      setActionError(null);
      setSendingId(draft.id);
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Email delivery failed');
      onUpdateDraft(draft.id, { status: 'Sent', ...(data.draft || {}) });
    } catch (error: any) {
      setActionError(error?.message || 'Email delivery failed');
    } finally {
      setSendingId(null);
    }
  };

  const exportCsv = () => {
    const headers = ['Company', 'Recipient Email', 'Subject', 'Hook Used', 'Status', 'Body'];
    const rows = drafts.map(d => [
      `"${d.companyName.replace(/"/g, '""')}"`,
      `"${d.recipientEmail.replace(/"/g, '""')}"`,
      `"${d.subject.replace(/"/g, '""')}"`,
      `"${d.hookUsed.replace(/"/g, '""')}"`,
      `"${d.status}"`,
      `"${d.body.replace(/"/g, '""')}"`
    ]);
    const blob = new Blob([[headers.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdr_outreach_drafts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase terminal-font">Outbound Email Outbox Queue</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Draft → approve → real provider delivery</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenAgent && (
              <button onClick={onOpenAgent} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5 cursor-pointer">
                <Bot className="w-4 h-4" />
                <span>Create Draft</span>
              </button>
            )}
            <button onClick={exportCsv} disabled={drafts.length === 0} className="px-4 py-2 rounded-lg bg-[#050505] text-gray-300 font-mono text-xs border grid-line hover:text-white uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {actionError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>{actionError}</span>
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-[#050505] border grid-line space-y-3 font-mono">
            <Mail className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Outbox Queue Empty</h3>
            <p className="text-[11px] text-gray-500">Run Nyx on a sourced prospect to create an outreach draft.</p>
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            {drafts.map(draft => (
              <div key={draft.id} className="p-5 rounded-lg bg-[#050505] border grid-line space-y-4 text-xs hover:border-emerald-500/30 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b grid-line">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white uppercase terminal-font">{draft.companyName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/30 uppercase">{draft.status}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Recipient: {draft.recipientEmail || 'No public email available'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => copyDraft(`${draft.subject}\n\n${draft.body}`, draft.id)} className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] hover:bg-white/5 text-gray-300 border grid-line flex items-center space-x-1 cursor-pointer">
                      {copiedId === draft.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === draft.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    {draft.status !== 'Sent' && (
                      <button onClick={() => void toggleApproval(draft)} className={`px-3 py-1.5 rounded-lg font-bold border cursor-pointer ${draft.status === 'Approved' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
                        {draft.status === 'Approved' ? 'Unapprove' : 'Approve'}
                      </button>
                    )}

                    {draft.status === 'Approved' && (
                      <button onClick={() => void sendDraft(draft)} disabled={sendingId === draft.id} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingId === draft.id ? 'Sending…' : 'Send'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#0a0a0a] p-2.5 rounded-lg border grid-line font-bold text-gray-200">Subject: {draft.subject}</div>
                <div className="text-[10px] text-blue-400 bg-blue-950/20 p-2 rounded border border-blue-500/30">Hook: {draft.hookUsed}</div>

                {editingId === draft.id ? (
                  <div className="space-y-2">
                    <textarea rows={6} value={editBody} onChange={e => setEditBody(e.target.value)} className="w-full bg-[#0a0a0a] border grid-line rounded-lg p-3 text-xs text-gray-100 font-sans focus:outline-none focus:border-emerald-500" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] text-gray-400 border grid-line">Cancel</button>
                      <button onClick={() => void handleSaveEdit(draft.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="whitespace-pre-wrap font-sans text-xs text-gray-200 leading-relaxed bg-[#0a0a0a] p-3.5 rounded-lg border grid-line">{draft.body}</div>
                    {draft.status !== 'Sent' && (
                      <button onClick={() => { setEditingId(draft.id); setEditBody(draft.body); }} className="absolute top-2 right-2 p-1.5 rounded bg-[#050505] border grid-line text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Edit Body">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
