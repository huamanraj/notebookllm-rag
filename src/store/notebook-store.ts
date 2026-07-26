import { create } from 'zustand';

interface Notebook {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface NotebookStore {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  setNotebooks: (notebooks: Notebook[]) => void;
  addNotebook: (notebook: Notebook) => void;
  setActiveNotebookId: (id: string | null) => void;
  removeNotebook: (id: string) => void;
}

export const useNotebookStore = create<NotebookStore>((set) => ({
  notebooks: [],
  activeNotebookId: null,
  setNotebooks: (notebooks) => set({ notebooks }),
  addNotebook: (notebook) => set((state) => ({ notebooks: [...state.notebooks, notebook] })),
  setActiveNotebookId: (id) => set({ activeNotebookId: id }),
  removeNotebook: (id) => set((state) => ({
    notebooks: state.notebooks.filter(n => n.id !== id),
    activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId
  })),
}));
