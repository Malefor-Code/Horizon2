import { useState, useEffect, useMemo } from 'react';
import type { Story, Chapter, Entry, Action, TestAction } from '../types';

/**
 * Hook that manages story state, navigation, and test actions.
 */
export default function useStory(initial?: Story) {
  const [story, setStory] = useState<Story | null>(initial ?? null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(
    initial?.startChapter ?? (initial?.chapters?.[0]?.id ?? null)
  );
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [pendingTest, setPendingTest] = useState<TestAction | null>(null);

  // Helper to find chapter/entry
  const getChapter = (id?: string) => story?.chapters.find((c) => c.id === id) ?? null;
  const findEntryById = (id?: string) => {
    if (!story) return null;
    for (const chap of story.chapters) {
      const e = chap.entries.find((x) => x.id === id);
      if (e) return e;
    }
    return null;
  };

  // Initialize current entry when story or chapter changes
  useEffect(() => {
    if (!story) return;
    const chapter = getChapter(currentChapterId ?? story.startChapter ?? story.chapters[0]?.id);
    if (!chapter) return;
    const start = chapter.startId ?? chapter.entries[0]?.id;
    setCurrentEntryId((prev) => prev ?? start ?? null);
  }, [story, currentChapterId]);

  const currentChapter = useMemo(
    () => (story ? getChapter(currentChapterId ?? story.startChapter) : null),
    [story, currentChapterId]
  );
  const currentEntry = useMemo(
    () => (story && currentEntryId ? findEntryById(currentEntryId) : null),
    [story, currentEntryId]
  );

  const loadStory = (s: Story) => {
    setStory(s);
    const start = s.startChapter ?? s.chapters?.[0]?.id;
    setCurrentChapterId(start ?? null);
    const chapter = s.chapters?.find((c) => c.id === start) ?? s.chapters?.[0];
    const entry = chapter?.startId ?? chapter?.entries?.[0]?.id ?? null;
    setCurrentEntryId(entry);
    setPendingTest(null);
  };

  const goToChapter = (id: string) => {
    if (!story) return;
    const chapter = getChapter(id);
    if (!chapter) return;
    setCurrentChapterId(id);
    const entry = chapter.startId ?? chapter.entries[0]?.id ?? null;
    setCurrentEntryId(entry);
    setPendingTest(null);
  };

  const goToNextChapter = () => {
    if (!story) return;
    const idx = story.chapters.findIndex((c) => c.id === currentChapterId);
    const next = story.chapters[idx + 1];
    if (next) goToChapter(next.id);
  };

  const goToEntry = (id: string) => {
    const e = findEntryById(id);
    if (!e) {
      console.warn('Entry not found:', id);
      return;
    }
    // When navigating to an entry in a different chapter, update chapter id
    const parent = story?.chapters.find((c) => c.entries.some((ent) => ent.id === id));
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
      if (target) goToChapter(target);
      else goToNextChapter();
    }
  };

  const handleTestResult = (success: boolean) => {
    if (!pendingTest) return;
    const target = success ? pendingTest.pass : pendingTest.fail;
    setPendingTest(null);
    goToEntry(target);
  };

  return {
    story,
    currentChapter,
    currentEntry,
    pendingTest,
    loadStory,
    goToChapter,
    goToEntry,
    performAction,
    handleTestResult,
  };
}
