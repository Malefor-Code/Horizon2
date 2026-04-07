import { useState, useEffect, useMemo, useRef } from 'react';
import type { Story, Chapter, Entry, Action, TestAction } from '../types';

type ActManifest = { id: string; title?: string; file: string };
type StoryManifest = { startChapter?: string; acts: ActManifest[] };

/**
 * Hook that manages story state, navigation, and test actions.
 * Supports lazy-loading acts from a manifest (`/stories/index.json`).
 */
export default function useStory(initial?: Story, manifestUrl = '/stories/index.json') {
  const [story, setStory] = useState<Story | null>(initial ?? null);
  const [manifest, setManifest] = useState<StoryManifest | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(
    initial?.startChapter ?? initial?.chapters?.[0]?.id ?? null
  );
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [pendingTest, setPendingTest] = useState<TestAction | null>(null);

  const actsCache = useRef<Record<string, Chapter | undefined>>({});
  const loadPromises = useRef<Record<string, Promise<Chapter | null> | undefined>>({});

  const getChapter = (id?: string) => {
    if (!id) return null;
    const fromStory = story?.chapters.find((c) => c.id === id);
    if (fromStory) return fromStory;
    return actsCache.current[id] ?? null;
  };

  const findEntryById = (id?: string) => {
    if (!id) return null;
    // Prefer entry from the currently selected chapter if available
    const preferred = getChapter(currentChapterId ?? undefined);
    if (preferred) {
      const e = preferred.entries.find((x) => x.id === id);
      if (e) return e;
    }

    if (story) {
      for (const chap of story.chapters) {
        const e = chap.entries.find((x) => x.id === id);
        if (e) return e;
      }
    }
    for (const k of Object.keys(actsCache.current)) {
      const chap = actsCache.current[k];
      if (!chap) continue;
      const e = chap.entries.find((x) => x.id === id);
      if (e) return e;
    }
    return null;
  };

  // On mount (when no initial story), load the manifest and first act.
  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error('Manifest not found');
        const m: StoryManifest = await res.json();
        if (cancelled) return;
        setManifest(m);
        const startActId = m.startChapter ?? m.acts?.[0]?.id;
        if (startActId) {
          await loadAct(startActId, m);
          setCurrentChapterId((prev) => prev ?? startActId);
        }
      } catch (err) {
        console.warn('Failed to load manifest', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial, manifestUrl]);

  // Initialize current entry when story or chapter changes
  useEffect(() => {
    if (!story) return;
    const chapter = getChapter(currentChapterId ?? story.startChapter ?? story.chapters[0]?.id);
    if (!chapter) return;
    const start = chapter.startId ?? chapter.entries[0]?.id;
    setCurrentEntryId((prev) => prev ?? start ?? null);
  }, [story, currentChapterId]);

  const currentChapter = useMemo(() => (story ? getChapter(currentChapterId ?? story.startChapter) : null), [story, currentChapterId]);
  const currentEntry = useMemo(() => (story && currentEntryId ? findEntryById(currentEntryId) : null), [story, currentEntryId, currentChapterId]);

  const loadStory = (s: Story) => {
    actsCache.current = {};
    loadPromises.current = {};
    setManifest(null);
    setStory(s);
    const start = s.startChapter ?? s.chapters?.[0]?.id;
    setCurrentChapterId(start ?? null);
    const chapter = s.chapters?.find((c) => c.id === start) ?? s.chapters?.[0];
    const entry = chapter?.startId ?? chapter?.entries?.[0]?.id ?? null;
    setCurrentEntryId(entry);
    setPendingTest(null);
  };

  const loadAct = async (actId: string, providedManifest?: StoryManifest): Promise<Chapter | null> => {
    const existing = story?.chapters.find((c) => c.id === actId);
    if (existing) return existing;
    if (actsCache.current[actId]) {
      const cached = actsCache.current[actId]!;
      setStory((prev) => {
        if (!prev) return { startChapter: providedManifest?.startChapter ?? actId, chapters: [cached] };
        if (prev.chapters.find((c) => c.id === actId)) return prev;
        return { ...prev, chapters: [...prev.chapters, cached] };
      });
      return cached;
    }
    if (loadPromises.current[actId]) return loadPromises.current[actId];

    const manifestToUse = providedManifest ?? manifest;
    const actMeta = manifestToUse?.acts.find((a) => a.id === actId);
    if (!actMeta) {
      console.warn('Act not found in manifest:', actId);
      return null;
    }
    const path = `/stories/${actMeta.file}`;
    const p = fetch(path)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${path}`);
        const chapter: Chapter = await res.json();
        actsCache.current[actId] = chapter;
        // debug
        // eslint-disable-next-line no-console
        console.debug('[useStory] loaded act', actId, 'from', path, chapter);
        setStory((prev) => {
          if (!prev) return { startChapter: manifestToUse?.startChapter ?? actId, chapters: [chapter] };
          if (prev.chapters.find((c) => c.id === actId)) return prev;
          return { ...prev, chapters: [...prev.chapters, chapter] };
        });
        return chapter;
      })
      .catch((err) => {
        console.warn('Failed to load act', actId, err);
        return null;
      })
      .finally(() => {
        delete loadPromises.current[actId];
      });

    loadPromises.current[actId] = p;
    return p;
  };

  const goToChapter = async (id: string) => {
    // eslint-disable-next-line no-console
    console.debug('[useStory] goToChapter request', id);
    const chapter = getChapter(id);
    if (!chapter) {
      await loadAct(id);
    }
    setCurrentChapterId(id);
    const ch = getChapter(id);
    const entry = ch?.startId ?? ch?.entries?.[0]?.id ?? null;
    // eslint-disable-next-line no-console
    console.debug('[useStory] goToChapter resolved', id, 'chapter:', ch, 'selectedEntry:', entry);
    setCurrentEntryId(entry);
    setPendingTest(null);

    // prefetch next act if manifest known
    if (manifest) {
      const idx = manifest.acts.findIndex((a) => a.id === id);
      const next = manifest.acts[idx + 1];
      if (next && !actsCache.current[next.id]) {
        loadAct(next.id);
      }
    }
  };

  const goToNextChapter = () => {
    if (manifest) {
      const idx = manifest.acts.findIndex((a) => a.id === currentChapterId);
      const next = manifest.acts[idx + 1];
      if (next) {
        void goToChapter(next.id);
        return;
      }
    }
    if (!story) return;
    const idx = story.chapters.findIndex((c) => c.id === currentChapterId);
    const next = story.chapters[idx + 1];
    if (next) void goToChapter(next.id);
  };

  const goToEntry = (id: string) => {
    const e = findEntryById(id);
    if (!e) {
      console.warn('Entry not found:', id);
      return;
    }
    const parent = story?.chapters.find((c) => c.entries.some((ent) => ent.id === id)) ??
      (Object.values(actsCache.current).find((c) => !!c && c.entries.some((ent) => ent.id === id)) as Chapter | undefined);
    if (parent) setCurrentChapterId(parent.id);
    setCurrentEntryId(id);
    setPendingTest(null);
  };

  const performAction = (action: Action) => {
    if (!action) return;
    if (action.type === 'read') {
      goToEntry(action.target);
    } else if (action.type === 'test') {
      setPendingTest(action);
    } else if (action.type === 'chapter') {
      const target = action.targetChapter;
      if (target) void goToChapter(target);
      else goToNextChapter();
    }
  };

  const handleTestResult = (success: boolean) => {
    if (!pendingTest) return;
    const target = success ? pendingTest.pass : pendingTest.fail;
    setPendingTest(null);
    goToEntry(target);
  };

  const loadManifest = async (url?: string) => {
    const u = url ?? manifestUrl;
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error('Manifest not found');
      const m: StoryManifest = await res.json();
      setManifest(m);
      return m;
    } catch (err) {
      console.warn('Failed to load manifest', err);
      return null;
    }
  };

  return {
    story,
    manifest,
    currentChapter,
    currentEntry,
    pendingTest,
    loadStory,
    loadManifest,
    loadAct,
    goToChapter,
    goToEntry,
    performAction,
    handleTestResult,
  };
}
