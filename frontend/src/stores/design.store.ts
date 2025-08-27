import { create } from 'zustand';

export type DesignElement = {
  id: string;
  type: 'rect' | 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  // text-specific (optional)
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  // image-specific (optional)
  src?: string;
};

export type DesignDocument = {
  id?: string;
  name: string;
  width: number;
  height: number;
  background: string;
  elements: DesignElement[];
  updatedAt?: string;
};

type HistoryState = {
  past: DesignDocument[];
  present: DesignDocument;
  future: DesignDocument[];
};

type DesignStore = HistoryState & {
  selectionIds: string[];
  isSaving: boolean;
  lastSavedAt?: number;
  setDocument: (doc: Partial<DesignDocument>) => void;
  addElement: (el: DesignElement) => void;
  updateElement: (id: string, patch: Partial<DesignElement>) => void;
  setSelection: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
};

const initialDoc: DesignDocument = {
  name: 'Yeni Tasarım',
  width: 800,
  height: 500,
  background: '#ffffff',
  elements: [
    { id: 'rect-1', type: 'rect', x: 80, y: 60, width: 160, height: 100 },
  ],
};

export const useDesignStore = create<DesignStore>((set, get) => ({
  past: [],
  present: initialDoc,
  future: [],
  selectionIds: ['rect-1'],
  isSaving: false,
  setDocument: (doc) => {
    const { present, past } = get();
    const next = { ...present, ...doc, updatedAt: new Date().toISOString() };
    set({ past: [...past, present], present: next, future: [] });
  },
  addElement: (el) => {
    const { present, past } = get();
    const next: DesignDocument = {
      ...present,
      elements: [...present.elements, el],
      updatedAt: new Date().toISOString(),
    };
    set({ past: [...past, present], present: next, future: [] });
  },
  updateElement: (id, patch) => {
    const { present, past } = get();
    const nextEls = present.elements.map((e) => (e.id === id ? { ...e, ...patch } : e));
    const next: DesignDocument = { ...present, elements: nextEls, updatedAt: new Date().toISOString() };
    set({ past: [...past, present], present: next, future: [] });
  },
  setSelection: (ids) => set({ selectionIds: ids }),
  undo: () => {
    const { past, present, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ past: past.slice(0, -1), present: prev, future: [present, ...future] });
  },
  redo: () => {
    const { past, present, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({ past: [...past, present], present: next, future: future.slice(1) });
  },
  markSaved: () => set({ isSaving: false, lastSavedAt: Date.now() }),
}));


