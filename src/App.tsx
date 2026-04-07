import React from 'react';
import exampleStory from './data/example-story.json';
import type { Story } from './types';
import useStory from './hooks/useStory';
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
    currentChapter,
    currentEntry,
    performAction,
    pendingTest,
    handleTestResult,
    loadStory,
    goToChapter,
  } = useStory(exampleStory as Story);

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
          <label className="file-label">
            Load story
            <input type="file" accept="application/json" onChange={onFileChange} />
          </label>
          {story && currentChapter && (
            <ChapterSelector
              chapters={story.chapters}
              current={currentChapter.id}
              onSelect={(id) => goToChapter(id)}
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
          />
        ) : (
          <div className="empty">No entry loaded</div>
        )}
      </main>

      <footer className="app-footer">Offline ready • Designed for group reading</footer>
    </div>
  );
}
