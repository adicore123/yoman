import { useState, useEffect } from 'react';
import { mediaStorage, detectMediaPlatform } from '../services/storage';
import type { MediaItem, MediaCategory, MediaPlatform } from '../services/storage';
import { X, Check, Loader2, Link2, Sparkles, Heart, Zap, Compass, Globe } from 'lucide-react';
import clsx from 'clsx';

interface AddMediaModalProps {
  onClose: () => void;
  onSave: (savedItem?: MediaItem) => void;
  mediaToEdit?: MediaItem | null;
  initialData?: { url?: string; title?: string } | null;
}

export function AddMediaModal({ onClose, onSave, mediaToEdit, initialData }: AddMediaModalProps) {
  const [url, setUrl] = useState(mediaToEdit?.url || initialData?.url || '');
  const [title, setTitle] = useState(mediaToEdit?.title || initialData?.title || '');
  const [category, setCategory] = useState<MediaCategory>(mediaToEdit?.category || 'inspiration');
  const [notes, setNotes] = useState(mediaToEdit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!mediaToEdit;
  const platform: MediaPlatform = detectMediaPlatform(url);

  // If initialData comes from an Android share or paste
  useEffect(() => {
    if (initialData?.url && !url) {
      setUrl(initialData.url);
    }
    if (initialData?.title && !title) {
      setTitle(initialData.title);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSaving(true);
    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const displayTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // Fallback title if empty
    const finalTitle = title.trim() || (platform === 'youtube' ? 'סרטון יוטיוב' : platform === 'facebook' ? 'סרטון פייסבוק' : 'קישור מחזק');

    let resultItem: MediaItem | null = null;

    if (isEditing && mediaToEdit) {
      resultItem = await mediaStorage.update(mediaToEdit.id, {
        title: finalTitle,
        url: url.trim(),
        platform,
        category,
        notes: notes.trim()
      });
    } else {
      resultItem = await mediaStorage.create({
        title: finalTitle,
        url: url.trim(),
        platform,
        category,
        notes: notes.trim(),
        isFavorite: false,
        displayDate,
        displayTime,
        timestamp: now.toISOString()
      });
    }

    setIsSaving(false);
    onSave(resultItem || undefined);
  };

  const getPlatformLabel = (p: MediaPlatform) => {
    switch (p) {
      case 'youtube': return 'YouTube';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      default: return 'אינטרנט';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            {isEditing ? 'עריכת פריט מדיה' : 'הוספת סרטון או תוכן מחזק'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="p-2 rounded-full hover:bg-border/50 text-foreground/50 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          
          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-semibold text-foreground/80">
                קישור לסרטון / פוסט <span className="text-accent">*</span>
              </label>
              {url.trim() && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-accent/15 text-accent">
                  זוהה: {getPlatformLabel(platform)}
                </span>
              )}
            </div>
            <div className="relative">
              <Link2 className="absolute start-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" size={16} />
              <input
                autoFocus={!url}
                type="url"
                required
                placeholder="הדבק קישור מפייסבוק, יוטיוב, טיקטוק, אינסטגרם..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isSaving}
                className="w-full ps-9 pe-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent text-xs sm:text-sm placeholder:text-foreground/40"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5">
              כותרת / על מה הסרטון?
            </label>
            <input
              type="text"
              placeholder="למשל: שיחה מעצימה על שחרור מדאגות, נשימות להרגעה..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent text-xs sm:text-sm placeholder:text-foreground/40"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-2">
              איזה סוג תוכן זה?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              
              <button
                type="button"
                onClick={() => setCategory('inspiration')}
                className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium",
                  category === 'inspiration'
                    ? "border-accent bg-accent/15 text-accent shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Sparkles size={16} className={category === 'inspiration' ? "text-accent" : "opacity-60"} />
                <span>השראה ומשמעות</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('calm')}
                className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium",
                  category === 'calm'
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Compass size={16} className={category === 'calm' ? "text-emerald-600 dark:text-emerald-400" : "opacity-60"} />
                <span>רוגע ומדיטציה</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('motivation')}
                className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium",
                  category === 'motivation'
                    ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Zap size={16} className={category === 'motivation' ? "text-amber-600 dark:text-amber-400" : "opacity-60"} />
                <span>מוטיבציה וכוח</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('healing')}
                className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium",
                  category === 'healing'
                    ? "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Heart size={16} className={category === 'healing' ? "text-rose-600 dark:text-rose-400" : "opacity-60"} />
                <span>חיזוק וריפוי נפש</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('general')}
                className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium col-span-2 sm:col-span-1",
                  category === 'general'
                    ? "border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Globe size={16} className={category === 'general' ? "text-blue-600 dark:text-blue-400" : "opacity-60"} />
                <span>כללי</span>
              </button>

            </div>
          </div>

          {/* Notes / Reflection */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground/80 mb-1.5">
              למה זה מחזק אותי? / מתי כדאי לצפות בזה? (אופציונלי)
            </label>
            <textarea
              rows={3}
              placeholder="רשום משפט שמחזק אותך מהסרטון, או תזכורת לעצמך..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isSaving}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent text-xs sm:text-sm placeholder:text-foreground/40 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex justify-end gap-2.5 sm:gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full font-medium text-foreground hover:bg-border/50 transition-colors text-xs sm:text-sm"
            >
              ביטול
            </button>
            <button 
              type="submit"
              disabled={!url.trim() || isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-accent/20 text-xs sm:text-sm"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{isSaving ? 'שומר...' : (isEditing ? 'עדכן סרטון' : 'שמור סרטון מחזק')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
