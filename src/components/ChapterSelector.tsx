import React from 'react';
import type { Chapter } from '../types';

interface Props {
  chapters: Chapter[];
  current?: string | null;
  onSelect: (id: string) => void;
}

export default function ChapterSelector({ chapters, current, onSelect }: Props) {
  return (
    <select className="chapter-select" value={current ?? ''} onChange={(e) => onSelect(e.target.value)}>
      {chapters.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  );
}
