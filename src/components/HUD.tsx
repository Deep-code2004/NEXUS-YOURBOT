'use client';

import { useGestureStore } from '@/store/useGestureStore';
import { useSceneStore } from '@/store/useSceneStore';
import {
  Activity,
  Camera,
  Layers,
  Box,
  Mic,
  MicOff,
  BrainCircuit,
  Send,
  AlertCircle,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  Sparkles,
  Command,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAIStore, AuthUser } from '@/store/useAIStore';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';
import AuthModal from './AuthModal';
import CardInspector from './CardInspector';
import AdminDeck from './AdminDeck';

export default function HUD() {
  const { currentIntent, confidence, webcamError, retryCamera } = useGestureStore();
  const { activeCardId, qualityTier, setAdminDeckOpen, cards } = useSceneStore();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [inputText, setInputText] = useState('');

  const {
    user,
    setUser,
    setAuthModalOpen,
    isListening,
    isThinking,
    isSpeaking,
    transcript,
    voiceError,
    isSupported,
  } = useAIStore();

  const { startListening, stopListening, sendCommand } = useVoiceInteraction();

  // Check existing session on mount
  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);

    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user as AuthUser);
          }
        }
      } catch (err) {}
    };
    checkSession();

    return () => clearInterval(interval);
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.reload();
    } catch (e) {}
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendCommand(inputText.trim());
      setInputText('');
    }
  };

  const handlePromptChipClick = (prompt: string) => {
    sendCommand(prompt);
  };

  const activeCard = cards.find((c) => c.id === activeCardId);

  return (
    <>
      <AuthModal />
      <CardInspector />
      <AdminDeck />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 text-foreground font-mono text-sm uppercase tracking-widest">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          {/* System & Identity Telemetry */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-white tracking-wider">NEXUS SPATIAL OS</span>
            </div>

            {/* User Clearance Badge / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                {user.role === 'super_admin' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                ) : (
                  <UserIcon className="w-4 h-4 text-cyan-400" />
                )}
                <div className="flex flex-col text-[10px] leading-tight">
                  <span className="text-white font-bold">{user.name}</span>
                  <span
                    className={
                      user.role === 'super_admin'
                        ? 'text-amber-400 text-[8px] font-bold'
                        : 'text-cyan-400 text-[8px]'
                    }
                  >
                    {user.role === 'super_admin' ? 'SUPER ADMIN' : 'PILOT USER'}
                  </span>
                </div>

                {user.role === 'super_admin' && (
                  <button
                    onClick={() => setAdminDeckOpen(true)}
                    className="ml-2 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[9px] cursor-pointer transition-colors"
                  >
                    Admin Deck
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-1 p-1 text-white/40 hover:text-red-400 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(0,200,255,0.2)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN / REGISTER</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Layers className="w-3.5 h-3.5" />
              <span>CARDS: {cards.length} | Q-Tier: {qualityTier}</span>
            </div>
          </div>

          {/* Central AI Status & Command Console */}
          <div className="flex flex-col items-center gap-2 pointer-events-auto max-w-xl w-full px-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-lg">
              <BrainCircuit
                className={`w-5 h-5 ${
                  isThinking
                    ? 'text-yellow-400 animate-pulse'
                    : isSpeaking
                    ? 'text-blue-400 animate-bounce'
                    : 'text-cyan-400'
                }`}
              />
              <span className="text-xs text-white/70">
                {isThinking ? 'PROCESSING ACTION...' : isSpeaking ? 'SPEAKING...' : 'NEXUS NEURAL AI'}
              </span>
              {isSupported ? (
                <button
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Mute AI Voice' : 'Enable AI Voice Listening'}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isListening
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : null}
            </div>

            {/* Voice Error Notice with quick retry */}
            {voiceError && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-lg max-w-md text-center shadow-md">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{voiceError}</span>
                <button
                  onClick={startListening}
                  className="underline hover:text-white shrink-0 ml-1 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Audio Transcript */}
            {transcript && (
              <div className="text-xs text-cyan-300 bg-black/70 border border-cyan-500/30 px-3 py-1 rounded max-w-md text-center shadow">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            {/* Command Input Bar */}
            <form
              onSubmit={handleInputSubmit}
              className="flex items-center gap-1.5 w-full max-w-sm mt-0.5"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Command NEXUS (e.g. 'make TODO card and add buy milk')"
                  className="w-full bg-black/60 border border-white/20 focus:border-cyan-400/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-30 text-cyan-300 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* AI Command Suggestions Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 max-w-md text-[10px] text-white/50">
              <span className="text-white/30">TRY:</span>
              <button
                onClick={() => handlePromptChipClick('make a TODO card and add buy milk, workout')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-full cursor-pointer text-white/60 hover:text-cyan-300 transition-colors"
              >
                &ldquo;make a TODO card...&rdquo;
              </button>
              <button
                onClick={() => handlePromptChipClick('add call Alex to my WORK card')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-full cursor-pointer text-white/60 hover:text-cyan-300 transition-colors"
              >
                &ldquo;add item to card&rdquo;
              </button>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => handlePromptChipClick('show me recent user details')}
                  className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full cursor-pointer text-amber-300 transition-colors"
                >
                  &ldquo;show recent user details&rdquo;
                </button>
              )}
            </div>
          </div>

          {/* Time & Date */}
          <div className="text-right min-w-[120px]">
            <div>
              {mounted && time
                ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : '---'}
            </div>
            <div className="text-2xl font-bold tracking-wider">
              {mounted && time
                ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          {/* System Telemetry Log */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-2 text-white/50">
              <Box className="w-4 h-4" />
              <span>SYS_TELEMETRY</span>
            </div>
            <div className="text-xs text-white/30 border-l border-white/10 pl-2">
              <div>&gt; neural spatial engine [ONLINE]</div>
              <div>&gt; storage layer [SYNCHRONIZED]</div>
              <div>
                &gt; focused card: {activeCard ? activeCard.title : 'NONE'}
              </div>
            </div>
          </div>

          {/* Gesture Tracking Telemetry */}
          <div className="flex flex-col items-end gap-2 text-right bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>Gesture Tracking</span>
            </div>

            {webcamError ? (
              <div className="text-red-400 text-xs mt-2 max-w-[200px] flex flex-col items-end gap-2">
                <span>{webcamError} (Using mouse fallback)</span>
                {retryCamera && (
                  <button
                    onClick={() => retryCamera()}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer pointer-events-auto"
                  >
                    Retry Camera
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full mt-2 min-w-[150px]">
                <div className="flex justify-between text-xs text-white/50">
                  <span>Intent</span>
                  <span className={currentIntent !== 'none' ? 'text-emerald-400' : ''}>
                    {currentIntent}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-100"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
