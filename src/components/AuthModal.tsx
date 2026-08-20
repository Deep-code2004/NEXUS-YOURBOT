'use client';

import { useState } from 'react';
import { useAIStore, AuthUser } from '@/store/useAIStore';
import { useSceneStore } from '@/store/useSceneStore';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Sparkles,
  X,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

export default function AuthModal() {
  const { user, authModalOpen, setAuthModalOpen, setUser, authChecked } = useAIStore();
  const { setCards } = useSceneStore();

  // If user is not logged in, default to register (create account first)
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'super_admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If auth has been checked and no user is authenticated, modal must remain open as an entry gate
  const isMandatoryGate = authChecked && !user;
  const isVisible = authModalOpen || isMandatoryGate;

  if (!isVisible) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl font-mono pointer-events-auto select-none transition-all duration-300">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent bg-[#0a0a0f]/95 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_80px_rgba(0,200,255,0.2)] text-white">
        {/* Close Button: Only available if user is already authenticated */}
        {!isMandatoryGate && (
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-3.5 right-3.5 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-cyan-400">
                NEXUS Identity Hub
              </h2>
              {isMandatoryGate && (
                <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  GATE REQUIRED
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-white/50">
              {isMandatoryGate
                ? 'Create an account or login to access your Spatial OS workspace'
                : 'Spatial OS Neural Authentication'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border border-white/10 rounded-lg p-1 mb-4 bg-black/40">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Sign Up (New)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Login
          </button>
        </div>

        {error && (
          <div className="mb-3 text-[11px] sm:text-xs text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">
          {mode === 'register' && (
            <div>
              <label className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                Display Name
              </label>
              <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-2.5 py-1.5 sm:py-2">
                <User className="w-4 h-4 text-white/40 shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Neo or Deep Khatri"
                  className="bg-transparent flex-1 min-w-0 text-xs text-white placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest block mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-2.5 py-1.5 sm:py-2">
              <Mail className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@nexus.os"
                className="bg-transparent flex-1 min-w-0 text-xs text-white placeholder:text-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest block mb-1">
              Security Key / Password
            </label>
            <div className="flex items-center justify-between gap-2 bg-black/50 border border-white/15 focus-within:border-cyan-400/60 rounded-lg px-2.5 py-1.5 sm:py-2">
              <Lock className="w-4 h-4 text-white/40 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent flex-1 min-w-0 text-xs text-white placeholder:text-white/20 focus:outline-none"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                className="flex items-center justify-center p-1 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer shrink-0"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Eye className="w-4 h-4 text-white/60 hover:text-cyan-300" />
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest block mb-1">
                Account Role Clearance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-1.5 px-2 sm:py-2 sm:px-3 text-xs rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'user'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>USER</span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-white/40 mt-0.5">Personal Workspace</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('super_admin')}
                  className={`py-1.5 px-2 sm:py-2 sm:px-3 text-xs rounded-lg border text-left cursor-pointer transition-colors ${
                    role === 'super_admin'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>SUPER ADMIN</span>
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-white/40 mt-0.5">Platform Monitoring</div>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 sm:mt-2 w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold uppercase tracking-wider rounded-lg text-xs transition-all shadow-[0_0_25px_rgba(0,200,255,0.35)] disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? 'AUTHENTICATING...'
              : mode === 'register'
              ? 'CREATE ACCOUNT & ENTER NEXUS'
              : 'INITIALIZE SESSION & ENTER'}
          </button>
        </form>

        {/* Quick Demo Presets */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/10">
          <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest mb-1.5 text-center">
            Instant Test Clearances (1-Click)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@nexus.os', 'admin123')}
              disabled={loading}
              className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </button>
            <button
              onClick={() => handleQuickLogin('demo@nexus.os', 'demo123')}
              disabled={loading}
              className="py-1.5 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] sm:text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3" /> Demo User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
