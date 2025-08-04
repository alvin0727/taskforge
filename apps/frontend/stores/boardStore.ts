import { create } from 'zustand';
import { Board } from '@/lib/types/board';

interface BoardState {
  board: Board | null;
  setBoard: (board: Board) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  setBoard: (board) => set({ board }),
  clearBoard: () => set({ board: null }),
}));