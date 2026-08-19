'use client';

import { useState } from 'react';
import { useSceneStore } from '@/store/useSceneStore';
import { useAIStore } from '@/store/useAIStore';
import { CheckCircle2, Circle, Trash2, Plus, X, Layers } from 'lucide-react';

export default function CardInspector() {
  const { cards, setCards, activeCardId, setActiveCardId } = useSceneStore();
  const { isThinking } = useAIStore();
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(false);

  const activeCard = cards.find((c) => c.id === activeCardId);

  if (!activeCard) return null;

  const handleToggleItem = async (itemId: string) => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_item',
          cardId: activeCard.id,
          itemId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cards) setCards(data.cards);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_item',
          cardId: activeCard.id,
          itemId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cards) setCards(data.cards);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_items',
          cardTitle: activeCard.title,
          items: [newItemText.trim()],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cards) setCards(data.cards);
        setNewItemText('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm(`Delete card "${activeCard.title}" and all its stored items?`)) return;
    try {
      const res = await fetch(`/api/cards?id=${activeCard.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cards) setCards(data.cards);
        setActiveCardId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto font-mono">
      <div
        className="relative w-full max-w-lg bg-[#08080c]/95 border rounded-2xl p-6 shadow-2xl text-white transition-all duration-300"
        style={{
          borderColor: `${activeCard.color}40`,
          boxShadow: `0 0 50px ${activeCard.color}20`,
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: activeCard.color }}
            />
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> SPATIAL CARD INSPECTOR
              </div>
              <h2
                className="text-xl font-bold tracking-wider uppercase mt-0.5"
                style={{ color: activeCard.color }}
              >
                {activeCard.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteCard}
              title="Delete this card"
              className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveCardId(null)}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Items List */}
        <div className="py-4 max-h-[350px] overflow-y-auto space-y-2 pr-1">
          {activeCard.items.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/30">
              No items stored in this card yet.
              <div className="mt-1 text-[11px] text-white/20">
                Say: &ldquo;Nexus, add items to {activeCard.title}&rdquo; or type below.
              </div>
            </div>
          ) : (
            activeCard.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  item.done
                    ? 'bg-white/5 border-white/5 text-white/40 line-through'
                    : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => handleToggleItem(item.id)}
                  className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/30 shrink-0 hover:text-white/60" />
                  )}
                  <span className="text-xs">{item.text}</span>
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-white/20 hover:text-red-400 p-1 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="pt-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={`Add data/item to ${activeCard.title}...`}
            className="flex-1 bg-black/50 border border-white/15 focus:border-cyan-400/60 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newItemText.trim() || loading || isThinking}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
