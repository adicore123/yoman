import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { EntriesTable } from './EntriesTable';
import { Settings } from './Settings';
import { AddEntryModal } from './AddEntryModal';
import { TasksView } from './TasksView';
import { MediaView } from './MediaView';
import { AddMediaModal } from './AddMediaModal';
import { useApp } from '../context/AppContext';

export function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Incoming Android Share State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [sharedMediaData, setSharedMediaData] = useState<{ url: string; title: string } | null>(null);

  const { activePage, setActivePage } = useApp();

  const handleEntryAdded = () => {
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // Listen for incoming Android PWA shares via Web Share Target query params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isShare = params.get('share') === 'true' || params.has('url') || params.has('text');
      
      if (isShare) {
        const rawUrl = params.get('url') || '';
        const rawText = params.get('text') || '';
        const rawTitle = params.get('title') || '';

        // Extract URL if Facebook/Android embedded it inside text
        let finalUrl = rawUrl;
        if (!finalUrl && rawText) {
          const match = rawText.match(/https?:\/\/[^\s]+/);
          if (match) {
            finalUrl = match[0];
          }
        }

        const finalTitle = rawTitle || (rawText && rawText !== finalUrl ? rawText.replace(finalUrl, '').trim() : '');

        if (finalUrl) {
          setSharedMediaData({ url: finalUrl, title: finalTitle });
          setActivePage('media');
          setIsMediaModalOpen(true);
        }

        // Clean up URL in address bar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Failed to parse share parameters', e);
    }
  }, [setActivePage]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar with Mobile slide-over support */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <Header 
          onAddEntry={() => setIsModalOpen(true)} 
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8">
          {activePage === 'journal' && <EntriesTable key={refreshKey} />}
          {activePage === 'tasks' && <TasksView />}
          {activePage === 'media' && <MediaView />}
          {activePage === 'settings' && <Settings />}
          {activePage === 'insights' && (
            <div className="flex flex-col items-center justify-center h-full text-foreground/50 py-12">
              <h3 className="text-xl font-medium mb-2">תובנות ומעקב</h3>
              <p>העמוד בבנייה...</p>
            </div>
          )}
        </div>
      </main>

      {/* Add Journal Entry Modal */}
      {isModalOpen && (
        <AddEntryModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleEntryAdded} 
        />
      )}

      {/* Add / Shared Media Modal */}
      {isMediaModalOpen && (
        <AddMediaModal
          initialData={sharedMediaData}
          onClose={() => {
            setIsMediaModalOpen(false);
            setSharedMediaData(null);
          }}
          onSave={() => {
            setIsMediaModalOpen(false);
            setSharedMediaData(null);
          }}
        />
      )}
    </div>
  );
}
