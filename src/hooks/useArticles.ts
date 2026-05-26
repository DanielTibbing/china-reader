import { useState, useEffect, useMemo } from 'react';
import type { Article, Newsletter } from '../types';

export function useArticles() {
  const [newsletters, setNewsletters] = useState<Record<string, Newsletter>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNewsletterId, setSelectedNewsletterId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'feed' | 'bookmarks' | 'history'>('feed');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // LocalStorage persistence for bookmarks and history
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('china-reader-bookmarks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [history, setHistory] = useState<Record<string, { readAt: string; progress: number }>>(() => {
    const saved = localStorage.getItem('china-reader-history');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch articles.json
  useEffect(() => {
    setLoading(true);
    fetch('./articles.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load articles database.');
        return res.json();
      })
      .then((data: Record<string, Newsletter>) => {
        setNewsletters(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load articles:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem('china-reader-bookmarks', JSON.stringify(Array.from(bookmarks)));
  }, [bookmarks]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('china-reader-history', JSON.stringify(history));
  }, [history]);

  // Flattened articles list from all newsletters
  const allArticles = useMemo(() => {
    const list: Article[] = [];
    Object.values(newsletters).forEach((news) => {
      if (news.articles) {
        list.push(...news.articles);
      }
    });
    // Sort by publication date descending
    return list.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }, [newsletters]);

  // Extract unique categories from newsletters
  const categories = useMemo(() => {
    const set = new Set<string>();
    Object.values(newsletters).forEach((news) => {
      if (news.categories) {
        news.categories.forEach((cat) => set.add(cat));
      }
    });
    return Array.from(set);
  }, [newsletters]);

  // Starred / Bookmarked articles
  const bookmarkedArticles = useMemo(() => {
    return allArticles.filter((art) => bookmarks.has(art.id));
  }, [allArticles, bookmarks]);

  // Recently read articles based on history log
  const historyArticles = useMemo(() => {
    return allArticles
      .filter((art) => !!history[art.id])
      .sort((a, b) => {
        const dateA = new Date(history[a.id].readAt).getTime();
        const dateB = new Date(history[b.id].readAt).getTime();
        return dateB - dateA;
      });
  }, [allArticles, history]);

  // Filtered articles list based on dashboard parameters
  const filteredArticles = useMemo(() => {
    let list = allArticles;

    if (activeView === 'bookmarks') {
      list = bookmarkedArticles;
    } else if (activeView === 'history') {
      list = historyArticles;
    }

    // Apply search query (title or content)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (art) =>
          art.title.toLowerCase().includes(q) ||
          art.content.toLowerCase().includes(q)
      );
    }

    // Apply newsletter publication filter
    if (selectedNewsletterId) {
      list = list.filter((art) => art.newsletterId === selectedNewsletterId);
    }

    // Apply category filter
    if (selectedCategory) {
      list = list.filter((art) => {
        const parentNewsletter = newsletters[art.newsletterId];
        return parentNewsletter?.categories?.includes(selectedCategory);
      });
    }

    return list;
  }, [allArticles, activeView, bookmarkedArticles, historyArticles, searchQuery, selectedNewsletterId, selectedCategory, newsletters]);

  // --- ACTIONS ---
  const toggleBookmark = (articleId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  };

  const recordReading = (articleId: string, progress = 0) => {
    setHistory((prev) => ({
      ...prev,
      [articleId]: {
        readAt: new Date().toISOString(),
        progress: Math.max(progress, prev[articleId]?.progress || 0)
      }
    }));
  };

  const clearHistory = () => {
    setHistory({});
  };

  const clearAllData = () => {
    setBookmarks(new Set());
    setHistory({});
    localStorage.removeItem('china-reader-bookmarks');
    localStorage.removeItem('china-reader-history');
  };

  return {
    newsletters: Object.values(newsletters),
    articles: allArticles,
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
    history,

    // Actions
    toggleBookmark,
    recordReading,
    clearHistory,
    clearAllData
  };
}
