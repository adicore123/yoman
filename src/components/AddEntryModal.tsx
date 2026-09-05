import { useState } from 'react';
import { storage } from '../services/storage';
import type { JournalEntry } from '../services/storage';
import { X, Check, Loader2, Brain, Wind, AlertCircle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface AddEntryModalProps {
  onClose: () => void;
  onSave: () => void;
}

const MOOD_OPTIONS: { id: JournalEntry['mood']; label: string; icon: any; color: string }[] = [
  { id: 'calm', label: 'רגוע / שליו', icon: Wind, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  { id: 'reflective', label: 'מתבונן / לומד', icon: Brain, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
  { id: 'hopeful', label: 'מלא תקווה', icon: Sparkles, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'overwhelmed', label: 'מוצף / עמוס', icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  { id: 'anxious', label: 'דרוך / חרד', icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
];

export function AddEntryModal({ onClose, onSave }: AddEntryModalProps) {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('calm');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const displayTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    await storage.save({
      content: content.trim(),
      mood: selectedMood,
      displayDate,
      displayTime,
      timestamp: now.toISOString()
    });

    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">מה יושב עליך? תובנה או רשומה חדשה</h2>
          <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full hover:bg-border/50 text-foreground/50 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          
          {/* Mood selector pills */}
          <div>
            <label className="block text-xs font-semibold text-foreground/60 mb-2">
              איך אתה מרגיש ברגע זה?
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MOOD_OPTIONS.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 active:scale-95",
                      isSelected 
                        ? `${m.color} ring-2 ring-accent/30 font-semibold shadow-sm` 
                        : "border-border text-foreground/70 hover:bg-border/40"
                    )}
                  >
                    <Icon size={14} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            autoFocus
            placeholder="זה המקום לפרוק הכל, לתעד תובנה, הרגשה או שיעור חשוב..."
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={isSaving}
            className="w-full min-h-[180px] sm:min-h-[240px] text-base sm:text-lg bg-transparent border-none focus:outline-none focus:ring-0 text-foreground/90 placeholder:text-foreground/30 resize-none disabled:opacity-50"
          />
        </div>

        <div className="p-4 sm:p-6 border-t border-border bg-background/50 flex justify-end gap-2.5 sm:gap-3 mt-auto">
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm text-foreground hover:bg-border/50 transition-colors disabled:opacity-50"
          >
            ביטול
          </button>
          <button 
            onClick={handleSave} 
            disabled={!content.trim() || isSaving}
            className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            <span>{isSaving ? 'שומר בענן...' : 'שמור רשומה ותובנה'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
