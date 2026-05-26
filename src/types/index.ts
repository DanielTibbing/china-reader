export interface Article {
  id: string;
  title: string;
  link: string;
  publishDate: string;
  content: string;
  wordCount: number;
  readingTime: number;
  newsletterId: string;
  newsletterTitle: string;
}

export interface Newsletter {
  id: string;
  title: string;
  author: string;
  description: string;
  accentColor: string;
  rssUrl: string;
  categories: string[];
  icon: string;
  articles: Article[];
}

export interface HistoryItem {
  articleId: string;
  readAt: string;
  progress: number; // 0 to 1 decimal percentage
}

export interface DictionaryEntry {
  simplified: string;
  traditional?: string;
  pinyin: string;
  definitions: string[];
}
