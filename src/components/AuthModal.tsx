'use client';

import { useState } from 'react';
import { useAIStore, AuthUser } from '@/store/useAIStore';
import { useSceneStore } from '@/store/useSceneStore';
import { ShieldCheck, User, Lock, Mail, Sparkles, X, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, setUser } = useAIStore();
  const { setCards } = useSceneStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'super_admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        if (data.cards) {
          setCards(data.cards);
        }
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setUser(data.user as AuthUser);
      await fetchCards();
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Quick login failed');

      setUser(data.user as AuthUser);
      await fetchCards();
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-mono pointer-events-auto">
      <div className="relative w-full max-w-md bg-[#0a0a0f]/90 border border-white/15 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,200,255,0.15)] text-white">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wider uppercase text-cyan-400">
              NEXUS Identity Hub
            </h2>
            <p className="text-xs text-white/50">Spatial OS Neural Authentication</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border border-white/10 rounded-lg p-1 mb-5 bg-black/40">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'login' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-white/40 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'register' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-white/40 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                Display Name
              </label>
              <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Neo or Alex"
                  className="bg-transparent w-full text-xs text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@nexus.os"
                className="bg-transparent w-full text-xs text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
              Security Key / Password
            </label>
            <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent w-full text-xs text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                Account Role Clearance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 text-xs rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'user'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>USER</span>
                  </div>
                  <div className="text-[9px] text-white/40 mt-0.5">Personal Workspace</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('super_admin')}
                  className={`py-2 px-3 text-xs rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'super_admin'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>SUPER ADMIN</span>
                  </div>
                  <div className="text-[9px] text-white/40 mt-0.5">Platform Monitoring</div>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(0,200,255,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'INITIALIZE SESSION' : 'REGISTER CLEARANCE'}
          </button>
        </form>

        {/* Quick Demo Presets */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 text-center">
            Instant Test Clearances
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@nexus.os', 'admin123')}
              disabled={loading}
              className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </button>
            <button
              onClick={() => handleQuickLogin('demo@nexus.os', 'demo123')}
              disabled={loading}
              className="py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <User className="w-3 h-3" /> Demo User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
