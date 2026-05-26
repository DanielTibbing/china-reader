import { useState } from 'react';
import { LayoutGrid, List, Clock, Calendar, Star, BookOpen, ArrowRight } from 'lucide-react';
import type { Article, Newsletter } from '../../types';

interface FeedDashboardProps {
  articles: Article[];
  newsletters: Newsletter[];
  categories: string[];
  selectedNewsletterId: string | null;
  setSelectedNewsletterId: (id: string | null) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  bookmarks: Set<string>;
  onToggleBookmark: (id: string) => void;
  onSelectArticle: (article: Article) => void;
  activeView: 'feed' | 'bookmarks' | 'history';
}

export function FeedDashboard({
  articles,
  newsletters,
  categories,
  selectedNewsletterId,
  setSelectedNewsletterId,
  selectedCategory,
  setSelectedCategory,
  bookmarks,
  onToggleBookmark,
  onSelectArticle,
  activeView
}: FeedDashboardProps) {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-6">
      {/* Dynamic Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/60 dark:from-slate-900/60 dark:to-slate-800/40 border border-indigo-100/50 dark:border-slate-800/60 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-300">
        <div>
          <h2 className="text-lg font-extrabold text-indigo-950 dark:text-indigo-400 capitalize">
            {activeView === 'feed' ? 'Aggregated Newsletter Feed' : activeView === 'bookmarks' ? 'My Bookmarked Briefs' : 'Recently Read Articles'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Displaying <span className="font-bold text-indigo-650 dark:text-indigo-400">{articles.length}</span> curated analytical write-ups
          </p>
        </div>
        
        {/* Layout Switcher Toggle */}
        <div className="flex bg-white dark:bg-slate-850 p-1 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <button
            onClick={() => setLayoutMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === 'grid'
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400'
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350'
            }`}
            title="Grid Cards"
          >
            <LayoutGrid className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setLayoutMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              layoutMode === 'list'
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-650 dark:text-indigo-400'
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350'
            }`}
            title="Compact Rows List"
          >
            <List className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Categories Horizontal Filter Bar */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Filter by Categories
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 ${
                selectedCategory === null
                  ? 'bg-indigo-650 dark:bg-indigo-600 text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-slate-700'
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-indigo-650 dark:bg-indigo-600 text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Publications Horizontal Cards Grid */}
      {newsletters.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Filter by Publication
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            <button
              onClick={() => setSelectedNewsletterId(null)}
              className={`p-3 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900 ${
                selectedNewsletterId === null
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600 dark:ring-indigo-400 shadow-md font-bold'
                  : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-slate-700 hover:text-gray-700'
              }`}
            >
              <span className="text-xl">🌟</span>
              <span className="text-[10px] font-bold tracking-tight truncate w-full">All Feeds</span>
            </button>
            {newsletters.map((pub) => (
              <button
                key={pub.id}
                onClick={() => setSelectedNewsletterId(selectedNewsletterId === pub.id ? null : pub.id)}
                className={`p-3 rounded-xl border text-center transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900 ${
                  selectedNewsletterId === pub.id
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600 dark:ring-indigo-400 shadow-md font-bold'
                    : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-slate-700 hover:text-gray-700'
                }`}
              >
                <span className="text-xl">{pub.icon}</span>
                <span className="text-[10px] font-bold tracking-tight truncate w-full">{pub.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State check */}
      {articles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto transition-colors duration-300">
          <BookOpen className="h-12 w-12 text-indigo-400 dark:text-slate-700 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white mt-4">
            No articles found matching filters
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
            Try adjusting your search terms, changing the publication filter, or selecting another topic filter above.
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedNewsletterId(null);
            }}
            className="mt-6 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        /* GRID VIEW LAYOUT */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((art) => {
            const isBookmarked = bookmarks.has(art.id);
            return (
              <div
                key={art.id}
                className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] hover:border-indigo-200 dark:hover:border-slate-750 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Meta publication line */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-slate-800 border border-indigo-100/30 dark:border-slate-800 px-2 py-1 rounded-lg text-[10px] font-black text-indigo-700 dark:text-indigo-400 transition-colors">
                      {art.newsletterTitle}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(art.id);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isBookmarked
                          ? 'border-amber-200 bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30 hover:bg-amber-100'
                          : 'border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350'
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                    >
                      <Star className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Header Title */}
                  <h3
                    onClick={() => onSelectArticle(art)}
                    className="text-base font-extrabold text-gray-900 dark:text-white leading-snug tracking-tight hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    {art.title}
                  </h3>

                  {/* Description / Content snippet */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {art.content.replace(/<[^>]*>/g, '')}
                  </p>
                </div>

                {/* Bottom line info */}
                <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-800/40 mt-4 pt-3.5 text-[10px] font-bold text-gray-400 dark:text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {art.publishDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {art.readingTime} min read
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectArticle(art)}
                    className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 hover:translate-x-0.5 transition-all text-[11px] font-black uppercase"
                  >
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW LAYOUT */
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-950/60 text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider text-left transition-colors duration-300">
                <tr>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Reading Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 transition-colors">
                {articles.map((art) => {
                  const isBookmarked = bookmarks.has(art.id);
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-850/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center bg-indigo-50 dark:bg-slate-800 border border-indigo-100/30 dark:border-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-indigo-700 dark:text-indigo-400">
                          {art.newsletterTitle}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          onClick={() => onSelectArticle(art)}
                          className="font-extrabold text-gray-900 dark:text-white hover:text-indigo-650 dark:hover:text-indigo-400 cursor-pointer transition-colors max-w-md md:max-w-lg truncate"
                          title={art.title}
                        >
                          {art.title}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 dark:text-slate-500">
                        {art.publishDate}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 dark:text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-[11px]">
                          <Clock className="h-3 w-3" />
                          {art.readingTime} min
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onToggleBookmark(art.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isBookmarked
                                ? 'border-amber-200 bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30'
                                : 'border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350'
                            }`}
                          >
                            <Star className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => onSelectArticle(art)}
                            className="p-1 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase transition-colors"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
