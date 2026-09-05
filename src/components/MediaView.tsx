import { useState, useEffect, useMemo } from 'react';
import { mediaStorage } from '../services/storage';
import type { MediaItem, MediaCategory } from '../services/storage';
import { AddMediaModal } from './AddMediaModal';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Star, 
  Sparkles, 
  Compass, 
  Zap, 
  Heart, 
  Globe, 
  Search, 
  Loader2, 
  Play, 
  Calendar,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';

type FilterCategory = 'all' | 'favorites' | MediaCategory;

export function MediaView() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaToEdit, setMediaToEdit] = useState<MediaItem | null>(null);

  // Active playing YouTube video ID
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    const data = await mediaStorage.getAll();
    setMediaList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Filtered & Searched items
  const filteredList = useMemo(() => {
    return mediaList.filter(item => {
      if (activeFilter === 'favorites' && !item.isFavorite) return false;
      if (activeFilter !== 'all' && activeFilter !== 'favorites' && item.category !== activeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesPlatform = item.platform.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesPlatform) return false;
      }

      return true;
    });
  }, [mediaList, activeFilter, searchQuery]);

  const handleToggleFavorite = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !item.isFavorite;
    setMediaList(prev => prev.map(m => m.id === item.id ? { ...m, isFavorite: newStatus } : m));
    await mediaStorage.toggleFavorite(item.id, newStatus);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('האם למחוק פריט מדיה זה?')) return;
    setMediaList(prev => prev.filter(m => m.id !== id));
    await mediaStorage.delete(id);
  };

  const handleEdit = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaToEdit(item);
    setIsModalOpen(true);
  };

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Format date helper
  const formatRecordedDate = (item: MediaItem) => {
    if (item.displayDate) return item.displayDate;
    const raw = item.timestamp || item.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Top Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <span>סרטוני מדיה מחזקים</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-semibold">
              {mediaList.length} סרטונים
            </span>
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            סרטונים מעצימים מפייסבוק, יוטיוב ורשתות שמשמחים, מרגיעים ומחזקים אותך
          </p>
        </div>

        <button
          onClick={() => {
            setMediaToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium hover:bg-accent/90 transition-all active:scale-95 shadow-lg shadow-accent/20 self-start md:self-auto text-sm"
        >
          <Plus size={18} />
          <span>הוסף סרטון חדש</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2 rounded-2xl border border-border">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'all'
                ? "bg-accent text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            הכל ({mediaList.length})
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={clsx(
              "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'favorites'
                ? "bg-amber-500 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Star size={13} className="fill-current" />
            <span>מועדפים ({mediaList.filter(m => m.isFavorite).length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('inspiration')}
            className={clsx(
              "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'inspiration'
                ? "bg-accent text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Sparkles size={13} />
            <span>השראה</span>
          </button>

          <button
            onClick={() => setActiveFilter('calm')}
            className={clsx(
              "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'calm'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Compass size={13} />
            <span>רוגע</span>
          </button>

          <button
            onClick={() => setActiveFilter('motivation')}
            className={clsx(
              "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'motivation'
                ? "bg-amber-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Zap size={13} />
            <span>מוטיבציה</span>
          </button>

          <button
            onClick={() => setActiveFilter('healing')}
            className={clsx(
              "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
              activeFilter === 'healing'
                ? "bg-rose-600 text-white shadow-sm"
                : "text-foreground/70 hover:bg-border/50"
            )}
          >
            <Heart size={13} />
            <span>חיזוק הנפש</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-foreground/40" size={15} />
          <input
            type="text"
            placeholder="חיפוש סרטון, פלטפורמה או הערה..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-xs text-foreground placeholder:text-foreground/40"
          />
        </div>

      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
          <Loader2 size={36} className="animate-spin text-accent mb-3 opacity-60" />
          <p className="text-sm">טוען סרטונים מחזקים...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {activeFilter === 'favorites' ? 'אין עדיין סרטונים שסומנו כמועדפים' : 'אין סרטונים בקטגוריה זו'}
          </h3>
          <p className="text-sm text-foreground/50 max-w-md mb-6">
            ראית סרטון מחזק בפייסבוק, יוטיוב או טיקטוק? שתף אותו ישירות לכאן דרך תפריט השיתוף בטלפון, או לחץ על הכפתור למטה כדי להדביק קישור!
          </p>
          <button
            onClick={() => {
              setMediaToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full font-medium text-xs hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
          >
            <Plus size={16} />
            <span>הוסף סרטון ראשון</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map(item => {
            const ytId = item.platform === 'youtube' ? getYouTubeId(item.url) : null;
            const isPlaying = playingVideoId === item.id;
            const recordedDate = formatRecordedDate(item);

            return (
              <div 
                key={item.id}
                className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:border-accent/40 transition-all flex flex-col"
              >
                
                {/* Embedded Player or Media Preview Header */}
                {ytId ? (
                  <div className="relative aspect-video w-full bg-black">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-none"
                      />
                    ) : (
                      <div 
                        onClick={() => setPlayingVideoId(item.id)}
                        className="relative w-full h-full cursor-pointer group flex items-center justify-center"
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                        <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play size={24} className="fill-current ms-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-gradient-to-br from-accent/10 to-card border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm",
                        item.platform === 'facebook' ? "bg-blue-600" :
                        item.platform === 'instagram' ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600" :
                        item.platform === 'tiktok' ? "bg-black" : "bg-accent"
                      )}>
                        {item.platform === 'facebook' ? 'fb' : item.platform === 'instagram' ? 'IG' : item.platform === 'tiktok' ? 'TT' : 'Link'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground capitalize block">
                          {item.platform === 'facebook' ? 'סרטון פייסבוק' : item.platform === 'instagram' ? 'אינסטגרם' : item.platform === 'tiktok' ? 'טיקטוק' : 'קישור רשת'}
                        </span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] text-accent hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>פתח לצפייה ישירה</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-accent text-white text-xs font-medium flex items-center gap-1.5 hover:bg-accent/90 transition-transform active:scale-95 shadow-sm"
                    >
                      <Play size={12} className="fill-current" />
                      <span>צפה עכשיו</span>
                    </a>
                  </div>
                )}

                {/* Card Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  
                  <div>
                    {/* Tags and Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.category === 'inspiration' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent flex items-center gap-1">
                            <Sparkles size={11} />
                            <span>השראה</span>
                          </span>
                        )}
                        {item.category === 'calm' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Compass size={11} />
                            <span>רוגע</span>
                          </span>
                        )}
                        {item.category === 'motivation' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Zap size={11} />
                            <span>מוטיבציה</span>
                          </span>
                        )}
                        {item.category === 'healing' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <Heart size={11} />
                            <span>חיזוק הנפש</span>
                          </span>
                        )}
                        {item.category === 'general' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Globe size={11} />
                            <span>כללי</span>
                          </span>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={e => handleToggleFavorite(item, e)}
                        className={clsx(
                          "p-1.5 rounded-full transition-colors",
                          item.isFavorite 
                            ? "text-amber-500 hover:text-amber-600 bg-amber-500/10" 
                            : "text-foreground/30 hover:text-amber-500 hover:bg-border/50"
                        )}
                        title={item.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                      >
                        <Star size={17} className={item.isFavorite ? "fill-current" : ""} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>

                    {/* Notes / Uplifting thought */}
                    {item.notes && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-background/70 border border-border/60 text-xs text-foreground/80 leading-relaxed flex items-start gap-2">
                        <MessageSquare size={13} className="text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-accent block text-[11px]">למה זה מחזק אותי:</span>
                          <span className="whitespace-pre-wrap">{item.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Date & Actions */}
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-foreground/50">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{recordedDate}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="פתח קישור מקורי"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={e => handleEdit(item, e)}
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="ערוך"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Media Modal */}
      {isModalOpen && (
        <AddMediaModal
          mediaToEdit={mediaToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setMediaToEdit(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setMediaToEdit(null);
            fetchMedia();
          }}
        />
      )}

    </div>
  );
}
