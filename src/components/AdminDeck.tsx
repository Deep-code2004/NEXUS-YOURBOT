'use client';

import { useEffect, useState } from 'react';
import { useSceneStore } from '@/store/useSceneStore';
import {
  ShieldAlert,
  Users,
  Layers,
  Database,
  Activity,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';

export default function AdminDeck() {
  const { adminDeckOpen, setAdminDeckOpen, adminUsers, setAdminUsers, adminStats, setAdminStats } =
    useSceneStore();
  const [loading, setLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'users' | 'logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setAdminUsers(data.users);
          // Initialize notes state
          const notesMap: Record<string, string> = {};
          data.users.forEach((u: any) => {
            notesMap[u.id] = u.adminNotes || '';
          });
          setUserNotes(notesMap);
        }
        if (data.stats) setAdminStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminDeckOpen && (!adminUsers || adminUsers.length === 0)) {
      fetchAdminData();
    }
  }, [adminDeckOpen]);

  const handleSaveNote = async (userId: string) => {
    setSavingNoteId(userId);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          notes: userNotes[userId] || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users) setAdminUsers(data.users);
        if (data.stats) setAdminStats(data.stats);
        setSaveSuccessId(userId);
        setTimeout(() => setSaveSuccessId(null), 2500);
      }
    } catch (e) {
      console.error('Failed to save admin note:', e);
    } finally {
      setSavingNoteId(null);
    }
  };

  if (!adminDeckOpen) return null;

  const filteredUsers = (adminUsers || []).filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-lg pointer-events-auto font-mono text-white select-none">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[85vh] bg-[#07070b]/95 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_80px_rgba(255,180,0,0.15)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold tracking-wider sm:tracking-widest uppercase text-amber-400">
                  Super Admin Command Deck
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase hidden sm:inline">
                  LIVE TELEMETRY & RECORDS
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/50 truncate max-w-[200px] sm:max-w-none">
                Inspect registered users, manage cards, store admin notes & audit trails
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setAdminDeckOpen(false)}
              className="p-1.5 sm:p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Platform Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-3 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-white/40 uppercase">Total Users</div>
              <div className="text-base sm:text-xl font-bold text-cyan-300">
                {adminStats?.totalUsers ?? adminUsers.length}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-white/40 uppercase">Custom 3D Cards</div>
              <div className="text-base sm:text-xl font-bold text-emerald-300">
                {adminStats?.totalCards ?? 0}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-white/40 uppercase">Stored Items</div>
              <div className="text-base sm:text-xl font-bold text-purple-300">
                {adminStats?.totalItems ?? 0}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] text-white/40 uppercase">Super Admins</div>
              <div className="text-base sm:text-xl font-bold text-amber-300">
                {adminStats?.superAdmins ?? 1}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden border border-white/10 rounded-lg p-1 mb-2 bg-black/40 shrink-0">
          <button
            onClick={() => setMobileTab('users')}
            className={`flex-1 py-1 text-xs rounded-md uppercase font-bold transition-all ${
              mobileTab === 'users' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/40'
            }`}
          >
            Users & Cards ({adminUsers.length})
          </button>
          <button
            onClick={() => setMobileTab('logs')}
            className={`flex-1 py-1 text-xs rounded-md uppercase font-bold transition-all ${
              mobileTab === 'logs' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/40'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pb-1">
          {/* Registered Users & Category Cards */}
          <div
            className={`sm:col-span-2 bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col min-h-0 ${
              mobileTab === 'users' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {/* Search and Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 shrink-0">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/70 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> User Database & Notes
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter users..."
                  className="bg-black/60 border border-white/15 focus:border-amber-400/70 rounded-lg pl-8 pr-2.5 py-1 text-[11px] text-white placeholder:text-white/30 focus:outline-none w-full sm:w-48"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-xs text-white/30">
                  {loading ? 'Retrieving user telemetry...' : 'No matching users found.'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isExpanded = expandedUserId === u.id;
                  return (
                    <div
                      key={u.id}
                      className="border border-white/10 rounded-xl bg-white/[0.03] overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        className="w-full p-2.5 sm:p-3 flex items-center justify-between text-left hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              <span
                                className={`text-[8px] px-1.5 py-0.2 rounded uppercase ${
                                  u.role === 'super_admin'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40 truncate max-w-[140px] sm:max-w-none">
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-[10px] sm:text-[11px]">
                          <span className="text-emerald-400 font-bold">
                            {u.cardCount ?? u.cards?.length ?? 0}
                          </span>
                          <span className="text-white/40"> cards</span>
                        </div>
                      </button>

                      {/* Expanded User Details & Admin Notes */}
                      {isExpanded && (
                        <div className="p-2.5 sm:p-3.5 bg-black/60 border-t border-white/10 space-y-3">
                          {/* User Metadata Timestamps */}
                          <div className="flex flex-wrap items-center gap-3 text-[9px] sm:text-[10px] text-white/40 pb-2 border-b border-white/5">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-cyan-400" />
                              <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Last active: {new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {/* Created Spatial Cards */}
                          <div>
                            <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                              Created Spatial 3D Cards & Items:
                            </div>
                            {!u.cards || u.cards.length === 0 ? (
                              <div className="text-xs text-white/30 italic">No cards created yet.</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {u.cards.map((card: any) => (
                                  <div
                                    key={card.id}
                                    className="p-2 rounded-lg border bg-white/5"
                                    style={{ borderColor: `${card.color}40` }}
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: card.color }}
                                      />
                                      <span
                                        className="text-[11px] font-bold uppercase truncate"
                                        style={{ color: card.color }}
                                      >
                                        {card.title}
                                      </span>
                                      <span className="text-[8px] text-white/40 ml-auto shrink-0">
                                        {card.items?.length || 0} items
                                      </span>
                                    </div>
                                    <ul className="text-[9px] sm:text-[10px] text-white/70 space-y-0.5 list-disc pl-3">
                                      {card.items?.slice(0, 4).map((item: any) => (
                                        <li key={item.id} className="truncate">
                                          {item.text}
                                        </li>
                                      ))}
                                      {card.items?.length > 4 && (
                                        <li className="text-white/30 list-none">
                                          +{card.items.length - 4} more...
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Admin Private Note / Record Editor */}
                          <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Admin Private Notes & Records
                              </span>
                              {saveSuccessId === u.id && (
                                <span className="text-[9px] text-emerald-400 flex items-center gap-1 animate-pulse">
                                  <CheckCircle2 className="w-3 h-3" /> Saved!
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <textarea
                                value={userNotes[u.id] || ''}
                                onChange={(e) =>
                                  setUserNotes((prev) => ({ ...prev, [u.id]: e.target.value }))
                                }
                                placeholder={`Write administrative note or record for ${u.name}...`}
                                rows={2}
                                className="flex-1 bg-black/70 border border-white/15 focus:border-amber-400/60 rounded-lg p-2 text-xs text-white placeholder:text-white/30 focus:outline-none resize-none"
                              />
                              <button
                                onClick={() => handleSaveNote(u.id)}
                                disabled={savingNoteId === u.id}
                                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0"
                              >
                                <Save className={`w-3.5 h-3.5 ${savingNoteId === u.id ? 'animate-spin' : ''}`} />
                                <span className="text-[9px]">Save</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-time System Activity Log */}
          <div
            className={`bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 flex flex-col min-h-0 ${
              mobileTab === 'logs' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/70 font-bold mb-2 flex items-center gap-1.5 shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Platform Audit Trail
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {!adminStats?.recentLogs || adminStats.recentLogs.length === 0 ? (
                <div className="text-white/30 text-center py-8">No recent logs.</div>
              ) : (
                adminStats.recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-white/5 border border-white/5 text-[10px]"
                  >
                    <div className="flex items-center justify-between text-white/50 text-[8px] mb-0.5">
                      <span className="text-amber-400 font-bold uppercase truncate">{log.action}</span>
                      <span className="shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-white/80 line-clamp-2">{log.details}</div>
                    <div className="text-[8px] text-white/30 mt-0.5 truncate">{log.userEmail}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
