import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface PasskeyModalProps {
  isOpen: boolean;
  onAuthenticate: () => void;
}

export const PasskeyModal: React.FC<PasskeyModalProps> = ({ isOpen, onAuthenticate }) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim() === '5309') {
      setError(false);
      setIsSuccess(true);
      setTimeout(() => {
        onAuthenticate();
      }, 500);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border grid-line rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Top Header Accent */}
        <div className="bg-gradient-to-r from-red-600 via-emerald-600 to-red-600 h-1.5 w-full animate-pulse" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 mb-2 glow-emerald">
              <Lock className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase font-futura">
              merqato<span className="text-[#B90000] font-semibold">.digital</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Protected B2B SDR Platform // Access Control
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                Enter Platform Passkey
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    setError(false);
                  }}
                  placeholder="Passkey (e.g. 5309)"
                  autoFocus
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#050505] border font-mono text-sm tracking-widest text-white focus:outline-none transition-all ${
                    error 
                      ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30' 
                      : 'border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {error && (
                <p className="text-xs font-mono text-red-400 flex items-center space-x-1 mt-1">
                  <span>Invalid passkey. Please enter key code 5309.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Passkey Verified! Unlocking...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Unlock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Hidden OpenRouter Key Proxy Info */}
          <div className="p-3.5 rounded-xl bg-[#050505] border grid-line space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">API Key Protection Enabled</span>
            </div>
            <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
              OpenRouter API keys are securely proxies on the backend. Raw API keys remain hidden from client sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
