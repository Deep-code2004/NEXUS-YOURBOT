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
  ChevronUp,
  ChevronDown,
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
  const [showMobileTelemetry, setShowMobileTelemetry] = useState(false);

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

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-6 text-foreground font-mono text-xs sm:text-sm uppercase tracking-wider select-none">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
          {/* Brand & User Clearance */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 pointer-events-auto">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-bold text-white tracking-wider text-xs sm:text-sm">
                  NEXUS OS
                </span>
                <span className="text-[10px] text-white/40 hidden sm:inline">
                  v1.0 | {qualityTier}
                </span>
              </div>

              {/* User Identity Pill */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg">
                  {user.role === 'super_admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                  <div className="flex flex-col text-[9px] sm:text-[10px] leading-tight">
                    <span className="text-white font-bold truncate max-w-[90px] sm:max-w-[120px]">
                      {user.name}
                    </span>
                    <span
                      className={
                        user.role === 'super_admin'
                          ? 'text-amber-400 text-[8px] font-bold'
                          : 'text-cyan-400 text-[8px]'
                      }
                    >
                      {user.role === 'super_admin' ? 'SUPER ADMIN' : 'PILOT'}
                    </span>
                  </div>

                  {user.role === 'super_admin' && (
                    <button
                      onClick={() => setAdminDeckOpen(true)}
                      className="ml-1 px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[8px] sm:text-[9px] cursor-pointer transition-colors"
                    >
                      Admin
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="ml-1 p-1 text-white/40 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(0,200,255,0.15)]"
                >
                  <LogIn className="w-3 h-3" />
                  <span>SIGN IN</span>
                </button>
              )}
            </div>

            {/* Mobile Clock & Telemetry Trigger */}
            <div className="flex sm:hidden items-center gap-2 text-right">
              <div className="text-sm font-bold tracking-wider text-white">
                {mounted && time
                  ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </div>
              <button
                onClick={() => setShowMobileTelemetry(!showMobileTelemetry)}
                className="p-1 bg-white/5 border border-white/10 rounded text-white/60"
              >
                {showMobileTelemetry ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Central AI Console & Command Center */}
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto w-full max-w-md mx-auto order-3 sm:order-2">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
              <BrainCircuit
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isThinking
                    ? 'text-yellow-400 animate-pulse'
                    : isSpeaking
                    ? 'text-blue-400 animate-bounce'
                    : 'text-cyan-400'
                }`}
              />
              <span className="text-[10px] sm:text-xs text-white/70">
                {isThinking
                  ? 'PROCESSING...'
                  : isSpeaking
                  ? 'SPEAKING...'
                  : 'NEXUS NEURAL AI'}
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

            {/* Voice Error Notice */}
            {voiceError && (
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2.5 py-1 rounded-lg max-w-full text-center shadow">
                <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                <span className="truncate">{voiceError}</span>
                <button
                  onClick={startListening}
                  className="underline hover:text-white shrink-0 ml-1 cursor-pointer font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Audio Transcript */}
            {transcript && (
              <div className="text-[10px] sm:text-xs text-cyan-300 bg-black/80 border border-cyan-500/30 px-3 py-1 rounded max-w-full text-center shadow truncate">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            {/* Command Input Bar */}
            <form
              onSubmit={handleInputSubmit}
              className="flex items-center gap-1.5 w-full mt-0.5"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Command NEXUS (e.g. 'make TODO card')"
                className="w-full bg-black/60 border border-white/20 focus:border-cyan-400/80 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-1.5 sm:p-2 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-30 text-cyan-300 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Horizontally Scrollable Command Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full max-w-full pb-0.5 text-[9px] sm:text-[10px] text-white/50 select-none scrollbar-none">
              <span className="text-white/30 shrink-0">TRY:</span>
              <button
                onClick={() => handlePromptChipClick('make a TODO card and add buy milk, gym session')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-full cursor-pointer text-white/60 hover:text-cyan-300 transition-colors shrink-0"
              >
                &ldquo;make TODO card...&rdquo;
              </button>
              <button
                onClick={() => handlePromptChipClick('add call Alex to my WORK card')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 rounded-full cursor-pointer text-white/60 hover:text-cyan-300 transition-colors shrink-0"
              >
                &ldquo;add item to card&rdquo;
              </button>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => handlePromptChipClick('show me recent user details')}
                  className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full cursor-pointer text-amber-300 transition-colors shrink-0"
                >
                  &ldquo;show user details&rdquo;
                </button>
              )}
            </div>
          </div>

          {/* Desktop Time & Date */}
          <div className="hidden sm:block text-right min-w-[110px] order-2 sm:order-3">
            <div className="text-xs text-white/40">
              {mounted && time
                ? time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : '---'}
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-wider text-white">
              {mounted && time
                ? time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </div>
          </div>
        </div>

        {/* Bottom Bar / Telemetry */}
        <div
          className={`flex flex-col sm:flex-row justify-between items-end gap-2 transition-all ${
            showMobileTelemetry ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* System Telemetry Log */}
          <div className="bg-black/60 sm:bg-transparent border sm:border-0 border-white/10 rounded-xl p-2.5 sm:p-0 max-w-xs w-full sm:w-auto pointer-events-auto">
            <div className="flex items-center gap-2 mb-1 text-white/50 text-[10px] sm:text-xs">
              <Box className="w-3.5 h-3.5" />
              <span>SYS_TELEMETRY</span>
            </div>
            <div className="text-[9px] sm:text-xs text-white/40 border-l border-white/10 pl-2 leading-relaxed">
              <div>&gt; 3d neural ring: [ONLINE]</div>
              <div>
                &gt; focused card: {activeCard ? activeCard.title : 'NONE'}
              </div>
            </div>
          </div>

          {/* Gesture Tracking Telemetry */}
          <div className="flex flex-col items-end gap-1.5 text-right bg-white/5 backdrop-blur-md border border-white/10 p-2.5 sm:p-3 rounded-xl pointer-events-auto w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/70">
              <Camera className="w-3.5 h-3.5" />
              <span>Gesture Engine</span>
            </div>

            {webcamError ? (
              <div className="text-red-400 text-[9px] sm:text-xs max-w-[200px] flex flex-col items-end gap-1">
                <span>{webcamError} (Touch / Mouse active)</span>
                {retryCamera && (
                  <button
                    onClick={() => retryCamera()}
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded cursor-pointer text-[9px]"
                  >
                    Retry Camera
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full sm:min-w-[140px]">
                <div className="flex justify-between text-[9px] sm:text-xs text-white/50">
                  <span>Intent</span>
                  <span className={currentIntent !== 'none' ? 'text-emerald-400 font-bold' : ''}>
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
