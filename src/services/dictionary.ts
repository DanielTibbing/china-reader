import type { DictionaryEntry } from "../types";

export interface DictionaryManifest {
  chunkSize: number;
  totalEntries: number;
}

// Dynamically target the sibling app directory
const DICT_BASE = import.meta.env.DEV
  ? 'https://danieltibbing.github.io/chinese-practice'
  : '../chinese-practice';

let dictionaryManifest: DictionaryManifest | null = null;
let dictionaryManifestPromise: Promise<DictionaryManifest> | null = null;
const dictionaryBucketCache = new Map<string, Promise<number[]>>();
const dictionaryChunkCache = new Map<number, Promise<DictionaryEntry[]>>();

export function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function normalizeLatinSearchValue(value: string): string {
  return normalizeSearchValue(value).replace(/[1-5]/g, "").replace(/\s+/g, "");
}

export function isHanziQuery(query: string): boolean {
  return /\p{Script=Han}/u.test(query);
}

export function bucketKeyToFilename(bucketKey: string): string {
  return Array.from(bucketKey, (character) =>
    character.codePointAt(0)!.toString(16).padStart(4, "0")
  ).join("-");
}

export function getDictionaryBucketKey(query: string): string | null {
  if (isHanziQuery(query)) {
    const normalized = query.trim();
    if (!normalized) return null;
    const firstCharacter = Array.from(normalized)[0];
    const firstCodePoint = firstCharacter.codePointAt(0)!.toString(16).padStart(4, "0");
    return `hanzi:u${firstCodePoint.slice(0, 2)}`;
  }

  const normalized = normalizeLatinSearchValue(query);
  if (!normalized) return null;
  if (normalized.length < 2) return "latin:";
  return `latin:${normalized.slice(0, 2)}`;
}

export function matchesDictionaryEntry(entry: DictionaryEntry, query: string): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  const normalizedLatinQuery = normalizeLatinSearchValue(query);
  const definitions = (entry.definitions ?? []).join(" ");

  if (isHanziQuery(query)) {
    const trimmed = query.trim();
    return [entry.simplified, entry.traditional]
      .filter(Boolean)
      .some((value) => value!.includes(trimmed) || trimmed.includes(value!));
  }

  const entryPinyin = entry.pinyin || "";
  return [
    normalizeLatinSearchValue(entryPinyin),
    normalizeSearchValue(definitions)
  ].some((value) => value.includes(normalizedLatinQuery) || value.includes(normalizedQuery));
}

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

async function loadJsonIfExists<T>(path: string): Promise<T | null> {
  const response = await fetch(path);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function ensureDictionaryManifestLoaded(): Promise<DictionaryManifest> {
  if (dictionaryManifest) return dictionaryManifest;

  if (!dictionaryManifestPromise) {
    dictionaryManifestPromise = loadJson<DictionaryManifest>(`${DICT_BASE}/data/dictionary/manifest.json`)
      .then((manifest) => {
        dictionaryManifest = manifest;
        return manifest;
      })
      .finally(() => {
        dictionaryManifestPromise = null;
      });
  }

  return dictionaryManifestPromise;
}

export async function loadDictionaryBucket(bucketKey: string): Promise<number[]> {
  if (dictionaryBucketCache.has(bucketKey)) {
    return dictionaryBucketCache.get(bucketKey)!;
  }

  const bucketPromise = loadJsonIfExists<number[]>(
    `${DICT_BASE}/data/dictionary/buckets/${bucketKeyToFilename(bucketKey)}.json`
  ).then((ids) => ids ?? []);

  dictionaryBucketCache.set(bucketKey, bucketPromise);
  return bucketPromise;
}

export async function loadDictionaryChunk(chunkIndex: number): Promise<DictionaryEntry[]> {
  if (dictionaryChunkCache.has(chunkIndex)) {
    return dictionaryChunkCache.get(chunkIndex)!;
  }

  const chunkPromise = loadJson<DictionaryEntry[]>(
    `${DICT_BASE}/data/dictionary/entries/${chunkIndex}.json`
  );
  dictionaryChunkCache.set(chunkIndex, chunkPromise);
  return chunkPromise;
}

export async function searchDictionary(query: string): Promise<DictionaryEntry[]> {
  try {
    const manifest = await ensureDictionaryManifestLoaded();
    const bucketKey = getDictionaryBucketKey(query);
    if (!bucketKey || bucketKey === "latin:") return [];

    const candidateIds = await loadDictionaryBucket(bucketKey);
    if (!candidateIds.length) return [];

    const chunkIndexes = [
      ...new Set(
        candidateIds.map((id) => Math.floor(id / manifest.chunkSize))
      )
    ];

    const chunkEntries = await Promise.all(
      chunkIndexes.map((chunkIndex) => loadDictionaryChunk(chunkIndex))
    );

    const entryMap = new Map<number, DictionaryEntry>(
      chunkEntries.flat().map((entry: any) => [entry.id, entry])
    );

    return candidateIds
      .map((id) => entryMap.get(id)!)
      .filter(Boolean)
      .filter((entry) => matchesDictionaryEntry(entry, query))
      .slice(0, 30);
  } catch (e) {
    console.error("Dictionary lookup error:", e);
    return [];
  }
}
