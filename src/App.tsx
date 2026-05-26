import { useState, useEffect } from 'react';
import { useArticles } from './hooks/useArticles';
import { Header } from './components/layout/Header';
import { FeedDashboard } from './components/feed/FeedDashboard';
import { ReaderCanvas } from './components/reader/ReaderCanvas';
import { BookOpen } from 'lucide-react';

export function AppContent() {
  const {
    newsletters,
    filteredArticles,
    categories,
    loading,
    error,

    // States
    searchQuery,
    setSearchQuery,
    selectedNewsletterId,
    setSelectedNewsletterId,
    selectedCategory,
    setSelectedCategory,
    activeView,
    setActiveView,
    activeArticle,
    setActiveArticle,
    bookmarks,

    // Actions
    toggleBookmark,
    recordReading
  } = useArticles();

  // Dark/Light Mode Theme Sync Engine
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark class to root document html tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Sync theme changes in real-time across other open browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSelectArticle = (art: any) => {
    setActiveArticle(art);
    // Record reading event in history
    recordReading(art.id, 0.5); // mark 50% initial reading status
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    if (activeArticle) {
      // Mark article as read up to 100% on back action
      recordReading(activeArticle.id, 1.0);
    }
    setActiveArticle(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* Conditionally render header based on reading state */}
      {!activeArticle && (
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          activeView={activeView}
          setActiveView={setActiveView}
          bookmarksCount={bookmarks.size}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          /* Loading State skeleton */
          <div className="py-24 text-center space-y-4">
            <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 animate-pulse">
              Aggregating newsletter databases...
            </p>
          </div>
        ) : error ? (
          /* Error State banner */
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center max-w-md mx-auto mt-12 transition-colors">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              Error: {error}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400/80 mt-2">
              Failed to load consolidated feed database. Please verify your scraper setup or build files.
            </p>
          </div>
        ) : activeArticle ? (
          /* Full screen deep long-form reading canvas */
          <ReaderCanvas
            article={activeArticle}
            isBookmarked={bookmarks.has(activeArticle.id)}
            onToggleBookmark={toggleBookmark}
            onBack={handleBackToFeed}
          />
        ) : (
          /* Main Feed Dashboard list */
          <FeedDashboard
            articles={filteredArticles}
            newsletters={newsletters}
            categories={categories}
            selectedNewsletterId={selectedNewsletterId}
            setSelectedNewsletterId={setSelectedNewsletterId}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            onSelectArticle={handleSelectArticle}
            activeView={activeView}
          />
        )}
      </main>

      {/* Bottom Footer block */}
      {!activeArticle && (
        <footer className="border-t border-gray-200 dark:border-slate-900 py-8 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              China-Reader • Curated Suite Catalog
            </span>
            <span>
              Compiled daily at 04:00 UTC
            </span>
          </div>
        </footer>
      )}

    </div>
  );
}

export default function App() {
  return <AppContent />;
}
