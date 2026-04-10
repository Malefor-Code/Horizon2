import React from 'react';
import useStory from './hooks/useStory';
import type { Chapter, Story } from './types';
import StoryViewer from './components/StoryViewer';
import ChapterSelector from './components/ChapterSelector';

/**
 * Top-level app component.
 * - Loads initial story (example)
 * - Allows uploading a JSON story file
 * - Renders current entry via StoryViewer
 */
export default function App() {
  const {
    story,
    manifest: storyManifest,
    currentChapter,
    currentEntry,
    performAction,
    pendingTest,
    visitedEntries,
    handleTestResult,
    loadStory,
    goToChapter,
  } = useStory();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        loadStory(json as Story);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(f);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="brand">Narrative Companion</h1>
        <div className="controls">
          {(storyManifest || story) && currentChapter && (
            <ChapterSelector
              chapters={
                storyManifest
                  ? (storyManifest.acts.map((a: { id: string; title?: string }) => ({ id: a.id, title: a.title ?? a.id, entries: [] })) as Chapter[])
                  : story!.chapters
              }
              current={currentChapter.id}
              onSelect={(id) => void goToChapter(id)}
            />
          )}
        </div>
      </header>

      <main className="app-main">
        {currentEntry ? (
          <StoryViewer
            entry={currentEntry}
            onAction={performAction}
            pendingTest={pendingTest}
            onTestResult={handleTestResult}
            visitedEntries={visitedEntries}
          />
        ) : (
          <div className="empty">No entry loaded</div>
        )}
      </main>
    </div>
  );
}
