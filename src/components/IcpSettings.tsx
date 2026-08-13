import React, { useState } from 'react';
import { Sliders, ShieldCheck, Save, Sparkles, Building2, User, Target, Zap } from 'lucide-react';
import { ICPConfig } from '../types';

interface IcpSettingsProps {
  icp: ICPConfig;
  onSaveIcp: (icp: ICPConfig) => void;
}

export const IcpSettings: React.FC<IcpSettingsProps> = ({ icp, onSaveIcp }) => {
  const [form, setForm] = useState<ICPConfig>({ ...icp });
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIcp(form);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#0a0a0a] border grid-line rounded-xl p-6 text-gray-300 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b grid-line">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/40 rounded-lg flex items-center justify-center glow-emerald">
              <Sliders className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase terminal-font">Ideal Customer Profile & GTM Offer</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Configure sender persona, value proposition, and call to action</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-mono">
          {/* Sender Profile */}
          <div className="p-5 rounded-lg bg-[#050505] border grid-line space-y-4">
            <h3 className="font-bold text-xs text-white uppercase tracking-widest flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Sender Identity & Company Profile</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Sender Name</label>
                <input
                  type="text"
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                  className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Sender Role</label>
                <input
                  type="text"
                  value={form.senderRole}
                  onChange={(e) => setForm({ ...form, senderRole: e.target.value })}
                  className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-[10px] uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={form.senderCompany}
                  onChange={(e) => setForm({ ...form, senderCompany: e.target.value })}
                  className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] uppercase mb-1">Company One-Liner Bio</label>
              <textarea
                rows={2}
                value={form.companyBio}
                onChange={(e) => setForm({ ...form, companyBio: e.target.value })}
                className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Value Proposition & Offer */}
          <div className="p-5 rounded-lg bg-[#050505] border grid-line space-y-4">
            <h3 className="font-bold text-xs text-white uppercase tracking-widest flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Target Audience & Value Proposition</span>
            </h3>

            <div>
              <label className="block text-gray-500 text-[10px] uppercase mb-1">Target Industry / Segment</label>
              <input
                type="text"
                value={form.targetIndustry}
                onChange={(e) => setForm({ ...form, targetIndustry: e.target.value })}
                className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] uppercase mb-1">Core Value Proposition</label>
              <textarea
                rows={2}
                value={form.valueProposition}
                onChange={(e) => setForm({ ...form, valueProposition: e.target.value })}
                className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-[10px] uppercase mb-1">Low-Friction Call To Action (CTA)</label>
              <input
                type="text"
                value={form.callToAction}
                onChange={(e) => setForm({ ...form, callToAction: e.target.value })}
                className="w-full bg-[#0a0a0a] border grid-line rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="15-minute quick workflow review"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 font-mono">
            {savedMsg ? (
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ICP Configuration Saved!</span>
              </span>
            ) : (
              <span className="text-gray-500 text-[11px] uppercase">
                Changes apply instantly to cold email hook generation.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider font-bold hover:bg-emerald-500/30 glow-emerald transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save ICP Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
