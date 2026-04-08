import React from 'react';
import type { Entry, Action, TestAction } from '../types';
import ActionButton from './ActionButton';

interface Props {
  entry: Entry;
  onAction: (action: Action) => void;
  pendingTest: TestAction | null;
  onTestResult: (success: boolean) => void;
}

/**
 * Renders a single story entry: title, narrative text, information and actions.
 */
export default function StoryViewer({ entry, onAction, pendingTest, onTestResult }: Props) {
  return (
    <article className="entry" key={entry.id}>
      <h2 className="entry-title">{entry.title}</h2>

      <div className="entry-text">{entry.text.split('\n').map((p, i) => <p key={i}>{p}</p>)}</div>

      {entry.information && entry.information.length > 0 && (
        <aside className="entry-info">
          {entry.information.map((info, i) => (
            <div key={i} className="info-item">
              {info}
            </div>
          ))}
        </aside>
      )}

      <div className="actions">
        {entry.actions.map((a, i) => {
          const typeClass = `action-${a.type}`;
          const label = a.type === 'read' ? (a.label ?? 'Read') : a.label ?? (a.type === 'test' ? 'Test' : 'Continue');
          return (
            <ActionButton
              key={i}
              label={label}
              className={typeClass}
              onClick={() => onAction(a)}
            />
          );
        })}
      </div>

      {pendingTest && (
        <div className="test-overlay" role="dialog" aria-modal>
          <div className="test-panel">
            <div className="test-label">{pendingTest.label}</div>
            <div className="test-buttons">
              <ActionButton label="Success" className="action-test" onClick={() => onTestResult(true)} />
              <ActionButton label="Fail" className="action-test" onClick={() => onTestResult(false)} />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
