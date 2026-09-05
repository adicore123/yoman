import { useState } from 'react';
import { taskStorage } from '../services/storage';
import type { TaskItem, TaskCategory, TaskPriority } from '../services/storage';
import { X, Check, Loader2, Brain, Stethoscope, User, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface AddTaskModalProps {
  onClose: () => void;
  onSave: () => void;
  taskToEdit?: TaskItem | null;
}

export function AddTaskModal({ onClose, onSave, taskToEdit }: AddTaskModalProps) {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [category, setCategory] = useState<TaskCategory>(taskToEdit?.category || 'therapy');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'medium');
  const [notes, setNotes] = useState(taskToEdit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!taskToEdit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const now = new Date();
    const displayDate = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const displayTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    if (isEditing && taskToEdit) {
      await taskStorage.update(taskToEdit.id, {
        title: title.trim(),
        category,
        priority,
        notes: notes.trim()
      });
    } else {
      await taskStorage.create({
        title: title.trim(),
        category,
        completed: false,
        completedAt: null,
        priority,
        notes: notes.trim(),
        displayDate,
        displayTime,
        timestamp: now.toISOString()
      });
    }
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'עריכת משימה' : 'משימה חדשה'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-1.5">
              מה המשימה? <span className="text-accent">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="למשל: תרגול נשימות יומי, בדיקת דם, לקחת מרשם..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm placeholder:text-foreground/40 disabled:opacity-50"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-2">
              סוג המשימה
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setCategory('therapy')}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-sm font-medium",
                  category === 'therapy'
                    ? "border-accent bg-accent/15 text-accent shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Brain size={22} className={category === 'therapy' ? "text-accent" : "opacity-60"} />
                <span>טיפול ופסיכולוג</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('medical')}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-sm font-medium",
                  category === 'medical'
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <Stethoscope size={22} className={category === 'medical' ? "text-emerald-600 dark:text-emerald-400" : "opacity-60"} />
                <span>רפואי ובריאות</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('personal')}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-sm font-medium",
                  category === 'personal'
                    ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "border-border hover:bg-border/30 text-foreground/70"
                )}
              >
                <User size={22} className={category === 'personal' ? "text-amber-600 dark:text-amber-400" : "opacity-60"} />
                <span>אישי וכללי</span>
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-foreground/60" />
              <span>רמת עדיפות</span>
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              disabled={isSaving}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent text-sm"
            >
              <option value="low">רגילה</option>
              <option value="medium">בינונית</option>
              <option value="high">חשובה / דחופה</option>
            </select>
          </div>

          {/* Notes / Documentation */}
          <div>
            <label className="block text-sm font-semibold text-foreground/80 mb-1.5">
              תיעוד והערות לביצוע (אופציונלי)
            </label>
            <textarea
              rows={3}
              placeholder="הנחיות לביצוע, דגשים שקיבלת, או תיעוד קצר..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isSaving}
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm placeholder:text-foreground/40 resize-none disabled:opacity-50"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full font-medium text-foreground hover:bg-border/50 transition-colors text-sm disabled:opacity-50"
            >
              ביטול
            </button>
            <button 
              type="submit"
              disabled={!title.trim() || isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20 text-sm"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{isSaving ? 'שומר...' : (isEditing ? 'עדכן משימה' : 'שמור משימה')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
