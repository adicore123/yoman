import { useState } from 'react';
import { storage } from '../services/storage';
import { X, Check, Loader2 } from 'lucide-react';

interface AddEntryModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function AddEntryModal({ onClose, onSave }: AddEntryModalProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    await storage.save({
      content,
      timestamp: new Date().toISOString()
    });

    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">מה יושב עליך?</h2>
          <button onClick={onClose} disabled={isSaving} className="p-2 rounded-full hover:bg-border/50 text-foreground/50 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <textarea
            autoFocus
            placeholder="זה המקום לפרוק הכל, תרגיש חופשי..."
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={isSaving}
            className="w-full min-h-[200px] sm:min-h-[280px] text-base sm:text-lg bg-transparent border-none focus:outline-none focus:ring-0 text-foreground/90 placeholder:text-foreground/30 resize-none disabled:opacity-50"
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
            <span>{isSaving ? 'שומר בענן...' : 'שמור רשומה'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
