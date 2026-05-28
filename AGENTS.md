# 📖 Newsletter Reader (china-reader) - `AGENTS.md`

This directory houses the Curated Newsletter Feed Dashboard and Reading application of the **China Suite** ecosystem—an ultra-premium front-end catalog collecting major China-focused newsletters, analytical sheets, and expert digests under a single client-side reader canvas.

---

## 🎯 Purpose & Capabilities
- **Newsletter Consolidated Feed**: Aggregates structured article databases from leading China analyst desks and industry newsletters.
- **Deep-Reading Canvas (`ReaderCanvas.tsx`)**: Replaces cluttered browser viewports with an immersive, distraction-free typography layout containing progressive completion indicators and rapid bookmark buttons.
- **Analytics & History Logs**: Tracks user reading progression dynamically (e.g. marking an article as 50% read on entry, updating to 100% full-completion state upon closing or backing out of the view).
- **Search & Filter Panel**: Permits rapid filtering across channels (e.g. specific newsletters) and article themes (e.g. *Geopolitics*, *Macro Finance*, *Tech Policy*).

---

## 🛠️ Technology Stack
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4.0.0 (integrated via `@tailwindcss/vite` and standard `postcss`)
- **Key Packages:** `axios`, `cheerio`, `xml2js`, and `china-common`
- **Deployment Endpoint:** GitHub Pages subdirectory `/china-reader/`

---

## 📂 Key Directory Structures
```text
china-reader/
├── src/
│   ├── components/
│   │   ├── feed/              # Newsletter channel grids and article selectors
│   │   ├── layout/            # SuiteSwitcher header/footers & navigation bars
│   │   └── reader/
│   │       └── ReaderCanvas.tsx # Immersive distraction-free reading canvas with progression trackers
│   ├── hooks/
│   │   └── useArticles.ts     # Core newsletter feeds fetch provider & history logging context
│   ├── services/
│   │   └── mockData.ts        # Seed articles, authors, newsletters & channel contents
│   ├── types/
│   │   └── index.ts           # Types representing Newsletter, Article, ReadingProgress
│   ├── App.tsx                # Context aggregator and theme synchronize hooks
│   └── main.tsx               # DOM entry point
```

---

## 🔑 Shared Design & Implementation Patterns

### 1. Reading Completion & Progress Logic
- The reader tracks article engagement levels inside the context hook `useArticles.ts`.
- Selecting an article invokes `recordReading(article.id, 0.5)` to flag the content as in-progress.
- Exiting or backing out triggers `recordReading(article.id, 1.0)`, confirming a 100% completed read-count. Use this structure to maintain reading stats seamlessly.

### 2. Immersive Reader Typography Grid
- The typography inside `ReaderCanvas.tsx` leverages fine-tuned custom margins, curated line heights (`leading-relaxed`), and specific serif/sans mix typography arrays to emulate premium print journals.

### 3. Integrated Shared Theme Sync (`china-common`)
- Links to standard `localStorage` tab listening hooks to match background styling changes triggered in other China Suite sub-apps instantly.

---

## 💻 Operations Reference
- **Local Dev Server:**
  ```bash
  npm install
  npm run dev
  ```
- **Compiling Production Build:**
  ```bash
  npm run build
  ```
  *(Tests TypeScript trees `tsc -b` and compiles static assets inside local `dist/` directory)*
