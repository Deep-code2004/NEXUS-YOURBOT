'use client';

import { useEffect, useState } from 'react';
import { useSceneStore } from '@/store/useSceneStore';
import { useAIStore } from '@/store/useAIStore';
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
  Sparkles,
} from 'lucide-react';

export default function AdminDeck() {
  const { adminDeckOpen, setAdminDeckOpen, adminUsers, setAdminUsers, adminStats, setAdminStats } =
    useSceneStore();
  const { user } = useAIStore();
  const [loading, setLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        if (data.users) setAdminUsers(data.users);
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

  if (!adminDeckOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg pointer-events-auto font-mono text-white">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#07070b]/95 border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_80px_rgba(255,180,0,0.15)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-widest uppercase text-amber-400">
                  NEXUS Super Admin Telemetry Deck
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  CLASSIFIED CLEARANCE
                </span>
              </div>
              <p className="text-xs text-white/50">
                Live monitoring, user introspection, and spatial card storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setAdminDeckOpen(false)}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Platform Stat Metric Cards */}
        <div className="grid grid-cols-4 gap-3 py-4 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-white/40 uppercase">Total Users</div>
              <div className="text-xl font-bold text-cyan-300">
                {adminStats?.totalUsers ?? adminUsers.length}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-white/40 uppercase">Custom 3D Cards</div>
              <div className="text-xl font-bold text-emerald-300">
                {adminStats?.totalCards ?? 0}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
            <Database className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-white/40 uppercase">Stored Data Items</div>
              <div className="text-xl font-bold text-purple-300">
                {adminStats?.totalItems ?? 0}
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-white/40 uppercase">Admin Clearances</div>
              <div className="text-xl font-bold text-amber-300">
                {adminStats?.superAdmins ?? 1}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-4 pb-2">
          {/* Registered Users & Category Cards (2 cols) */}
          <div className="col-span-2 bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs uppercase tracking-wider text-white/70 font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Registered Users & Cards
              </span>
              <span className="text-[10px] text-white/40">Click user to inspect custom cards</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {adminUsers.length === 0 ? (
                <div className="text-center py-12 text-xs text-white/30">
                  {loading ? 'Retrieving user telemetry...' : 'No users found.'}
                </div>
              ) : (
                adminUsers.map((u) => {
                  const isExpanded = expandedUserId === u.id;
                  return (
                    <div
                      key={u.id}
                      className="border border-white/10 rounded-xl bg-white/[0.03] overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${
                                  u.role === 'super_admin'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40">{u.email}</div>
                          </div>
                        </div>

                        <div className="text-right text-[11px]">
                          <span className="text-emerald-400 font-bold">{u.cardCount ?? u.cards?.length ?? 0}</span>
                          <span className="text-white/40"> cards (</span>
                          <span className="text-purple-300">{u.itemCount ?? 0}</span>
                          <span className="text-white/40"> items)</span>
                        </div>
                      </button>

                      {/* Expanded User Cards Detail */}
                      {isExpanded && (
                        <div className="p-3 bg-black/60 border-t border-white/10 space-y-2">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest">
                            User 3D Spatial Cards & Stored Data:
                          </div>
                          {!u.cards || u.cards.length === 0 ? (
                            <div className="text-xs text-white/30 italic">No cards created yet.</div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {u.cards.map((card: any) => (
                                <div
                                  key={card.id}
                                  className="p-2.5 rounded-lg border bg-white/5"
                                  style={{ borderColor: `${card.color}40` }}
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: card.color }}
                                    />
                                    <span
                                      className="text-xs font-bold uppercase"
                                      style={{ color: card.color }}
                                    >
                                      {card.title}
                                    </span>
                                    <span className="text-[9px] text-white/40 ml-auto">
                                      {card.items?.length || 0} items
                                    </span>
                                  </div>
                                  <ul className="text-[10px] text-white/70 space-y-1 list-disc pl-3">
                                    {card.items?.slice(0, 3).map((item: any) => (
                                      <li key={item.id} className="truncate">
                                        {item.text}
                                      </li>
                                    ))}
                                    {card.items?.length > 3 && (
                                      <li className="text-white/30 list-none">
                                        +{card.items.length - 3} more items...
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-time System Activity Log (1 col) */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col min-h-0">
            <span className="text-xs uppercase tracking-wider text-white/70 font-bold mb-3 flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4 text-emerald-400" /> Platform Audit Trail
            </span>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {(!adminStats?.recentLogs || adminStats.recentLogs.length === 0) ? (
                <div className="text-white/30 text-center py-10">No recent logs recorded.</div>
              ) : (
                adminStats.recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2 rounded bg-white/5 border border-white/5 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-white/50 text-[9px] mb-1">
                      <span className="text-amber-400 font-bold uppercase">{log.action}</span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-white/80">{log.details}</div>
                    <div className="text-[9px] text-white/30 mt-0.5 truncate">{log.userEmail}</div>
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
