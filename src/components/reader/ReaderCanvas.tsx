import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Volume2, VolumeX, HelpCircle, Check, Copy } from 'lucide-react';
import type { Article, DictionaryEntry } from '../../types';
import { searchDictionary } from '../../services/dictionary';

interface ReaderCanvasProps {
  article: Article;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onBack: () => void;
}

export function ReaderCanvas({
  article,
  isBookmarked,
  onToggleBookmark,
  onBack
}: ReaderCanvasProps) {
  // Reading theme preferences
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<number>(18); // default 18px
  const [marginSize, setMarginSize] = useState<'narrow' | 'normal' | 'wide'>('normal');

  // Text-To-Speech (TTS) state
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Interactive Dictionary Popover state
  const [selectedText, setSelectedText] = useState('');
  const [dictEntries, setDictEntries] = useState<DictionaryEntry[]>([]);
  const [popoverCoords, setPopoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Handle Text-to-Speech playback
  const toggleTts = () => {
    if (!synthRef.current) return;

    if (isPlayingTts) {
      synthRef.current.cancel();
      setIsPlayingTts(false);
    } else {
      // Strip HTML tags for clean spoken audio text
      const cleanText = article.content.replace(/<[^>]*>/g, '');
      const cleanParagraphs = cleanText.split('\n').filter(p => p.trim().length > 0).slice(0, 5).join('. '); // speak first few sentences
      
      const utterance = new SpeechSynthesisUtterance(cleanParagraphs);
      // Auto-detect Chinese vs English voices
      const hasChinese = /[\u4e00-\u9fa5]/.test(cleanParagraphs);
      utterance.lang = hasChinese ? 'zh-CN' : 'en-US';
      
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);

      utteranceRef.current = utterance;
      setIsPlayingTts(true);
      synthRef.current.speak(utterance);
    }
  };

  // Listen for user text selection to trigger HSK CC-CEDICT lookups
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text || text.length > 15) {
      // Close popover if selection is empty or too long
      setPopoverCoords(null);
      setSelectedText('');
      return;
    }

    // Ensure it contains Chinese characters or latin search values
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    const isWord = /^[a-zA-Z\s]+$/.test(text) && text.length > 2;

    if (!hasChinese && !isWord) {
      setPopoverCoords(null);
      setSelectedText('');
      return;
    }

    // Get exact selection coordinate boundaries to float the popover above selection
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate coordinates relative to window
      const x = rect.left + rect.width / 2 + window.scrollX;
      const y = rect.top - 10 + window.scrollY; // 10px spacing above selection

      setPopoverCoords({ x, y });
      setSelectedText(text);
      setDictLoading(true);

      // Perform chunked dictionary lookup
      const results = await searchDictionary(text);
      setDictEntries(results);
    } catch (e) {
      console.warn("Failed to retrieve selection coordinates:", e);
    } finally {
      setDictLoading(false);
    }
  };

  // Close dictionary popover if clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverCoords && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverCoords(null);
        setSelectedText('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popoverCoords]);

  // Copy card definition to clipboard for HSK flashcards integration
  const copyToClipboard = (entry: DictionaryEntry) => {
    const definitions = (entry.definitions ?? []).join('; ');
    const textToCopy = `[HSK Card] Hanzi: ${entry.simplified} | Pinyin: ${entry.pinyin} | Meaning: ${definitions}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedWord(entry.simplified);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  // Map preferences to Tailwind styles
  const themeClasses = {
    light: 'bg-white text-gray-900',
    sepia: 'bg-[#FAF6F0] text-[#433422]',
    dark: 'bg-slate-950 text-slate-200'
  };

  const marginClasses = {
    narrow: 'max-w-xl',
    normal: 'max-w-3xl',
    wide: 'max-w-5xl'
  };

  return (
    <div ref={containerRef} className={`min-h-screen transition-all duration-300 pb-16 ${themeClasses[theme]}`}>
      
      {/* Sticky Reader Toolbar */}
      <div className="sticky top-[89px] z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-slate-800/60 py-3 transition-colors">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Back button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-500 dark:text-slate-400 hover:text-indigo-650"
              title="Back to Feed"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-[10px] font-black tracking-widest text-gray-400 dark:text-slate-500 uppercase truncate max-w-[200px]">
              {article.newsletterTitle}
            </span>
          </div>

          {/* Reading Preferences & Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Read-Aloud Voice Synthesis */}
            <button
              onClick={toggleTts}
              className={`p-2 rounded-xl border transition-all ${
                isPlayingTts
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/30'
                  : 'border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500 hover:text-indigo-650'
              }`}
              title={isPlayingTts ? "Stop Reading" : "Read Summary Aloud"}
            >
              {isPlayingTts ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(article.id)}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked
                  ? 'border-amber-200 bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30 hover:bg-amber-100'
                  : 'border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500 hover:text-amber-500'
              }`}
              title="Bookmark Article"
            >
              <Star className={`h-4.5 w-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <span className="h-4 w-px bg-gray-200 dark:bg-slate-800"></span>

            {/* Theme switcher */}
            <div className="flex bg-gray-50 dark:bg-slate-950/80 p-0.5 rounded-xl border border-gray-100 dark:border-slate-850">
              {(['light', 'sepia', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black capitalize transition-all ${
                    theme === t
                      ? 'bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Margin width switcher */}
            <div className="flex bg-gray-50 dark:bg-slate-950/80 p-0.5 rounded-xl border border-gray-100 dark:border-slate-850">
              {(['narrow', 'normal', 'wide'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setMarginSize(w)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black capitalize transition-all ${
                    marginSize === w
                      ? 'bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-400'
                  }`}
                  title={`Canvas width: ${w}`}
                >
                  {w[0]}
                </button>
              ))}
            </div>

            {/* Font Size controls */}
            <div className="flex items-center bg-gray-50 dark:bg-slate-950/80 p-0.5 rounded-xl border border-gray-100 dark:border-slate-850">
              <button
                onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 font-bold"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="text-[9px] font-black text-gray-400 px-1 select-none">{fontSize}px</span>
              <button
                onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                className="px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 font-bold"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Reader Layout Container */}
      <article
        onMouseUp={handleTextSelection}
        className={`mx-auto px-4 mt-12 transition-all duration-300 ${marginClasses[marginSize]}`}
      >
        {/* Article title */}
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4 text-center md:text-left">
          {article.title}
        </h1>

        {/* Author & metadata block */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 dark:text-slate-500 mb-8 border-b border-gray-100 dark:border-slate-850 pb-4">
          <span className="bg-indigo-50 dark:bg-slate-850 px-2 py-1 rounded text-indigo-650 dark:text-indigo-400 uppercase tracking-widest text-[9px] font-black">
            {article.newsletterTitle}
          </span>
          <span>•</span>
          <span>Published on {article.publishDate}</span>
          <span>•</span>
          <span>{article.readingTime} min read ({article.wordCount} words)</span>
        </div>

        {/* Tip Banner */}
        <div className="bg-indigo-50/20 dark:bg-slate-900/30 border border-indigo-150/10 rounded-xl p-3.5 mb-8 text-[11px] font-semibold text-indigo-700/80 dark:text-indigo-400/80 flex items-start gap-2">
          <HelpCircle className="h-4.5 w-4.5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <span>
            <strong>Language Learner Tip:</strong> Highlight or click any Chinese character sequences or words in the text to lazy-load their CEDICT dictionary pinyin and translations instantly!
          </span>
        </div>

        {/* Main Content Body */}
        <div
          style={{ fontSize: `${fontSize}px` }}
          className="prose prose-indigo dark:prose-invert max-w-none leading-relaxed font-serif tracking-normal"
          dangerouslySetInnerHTML={{ __html: article.content || '<p>No content preview available. Please open the link to read the article.</p>' }}
        />
        
        {/* Link to source article */}
        <div className="text-center mt-12 border-t border-gray-100 dark:border-slate-850 pt-8">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 hover:shadow-lg"
          >
            Open Original Publication
          </a>
        </div>
      </article>

      {/* FLOATING DICTIONARY POPOVER OVERLAY */}
      {popoverCoords && selectedText && (
        <div
          className="absolute z-40 -translate-x-1/2 -translate-y-full pb-2 animate-fade-in pointer-events-auto"
          style={{ left: `${popoverCoords.x}px`, top: `${popoverCoords.y}px` }}
        >
          <div className="glass-panel border border-white/20 dark:border-slate-800/80 rounded-xl p-4 shadow-2xl max-w-xs md:max-w-sm w-[280px] md:w-[320px] transition-colors">
            
            {/* Popover Header */}
            <div className="flex justify-between items-center border-b border-gray-150/40 dark:border-slate-800 pb-2 mb-2">
              <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                CEDICT Lookup: "{selectedText}"
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            {/* Content states */}
            {dictLoading ? (
              <div className="py-4 text-center text-xs font-bold text-gray-400 dark:text-slate-500">
                Searching CC-CEDICT chunks...
              </div>
            ) : dictEntries.length === 0 ? (
              <div className="py-4 text-center text-xs font-bold text-gray-400 dark:text-slate-500">
                No exact word definitions found.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {dictEntries.map((entry, idx) => {
                  const hasCopySucceeded = copiedWord === entry.simplified;
                  return (
                    <div key={idx} className="space-y-1 text-left border-b border-gray-100/50 dark:border-slate-850 pb-2.5 last:border-0 last:pb-0">
                      
                      {/* Hanzi display line */}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {entry.simplified}
                          {entry.traditional && entry.traditional !== entry.simplified && (
                            <span className="text-xs font-semibold text-gray-400 ml-1.5 select-all">
                              ({entry.traditional})
                            </span>
                          )}
                        </span>

                        {/* Star / Copy Action */}
                        <button
                          onClick={() => copyToClipboard(entry)}
                          className={`p-1 rounded-lg border transition-all ${
                            hasCopySucceeded
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 hover:text-indigo-650 hover:border-indigo-200'
                          }`}
                          title="Copy Card to Clipboard (Save to HSK)"
                        >
                          {hasCopySucceeded ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Pinyin with tone display */}
                      <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 select-all">
                        [{entry.pinyin}]
                      </div>

                      {/* Definitions list */}
                      <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-slate-400 leading-normal pl-1 select-all">
                        {entry.definitions.slice(0, 3).map((def, dIdx) => (
                          <li key={dIdx} className="list-none md:list-item truncate">
                            {def}
                          </li>
                        ))}
                      </ul>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
