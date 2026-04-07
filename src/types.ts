export type ReadAction = { type: 'read'; target: string; label?: string };
export type TestAction = { type: 'test'; label: string; pass: string; fail: string };
export type ChapterAction = { type: 'chapter'; label: string; targetChapter?: string };

export type Action = ReadAction | TestAction | ChapterAction;

export type Entry = {
  id: string;
  title: string;
  text: string;
  information?: string[];
  actions: Action[];
};

export type Chapter = {
  id: string;
  title: string;
  startId?: string;
  entries: Entry[];
};

export type Story = {
  startChapter?: string;
  chapters: Chapter[];
};
