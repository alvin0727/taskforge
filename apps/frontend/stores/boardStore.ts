import { create } from 'zustand';
import { Board, ProjectBoardGroup } from '@/lib/types/board';

interface BoardState {
  board: Board | null;
  setBoard: (board: Board) => void;
  clearBoard: () => void;
  boardList: ProjectBoardGroup[];
  archivedBoardList: ProjectBoardGroup[];
  setBoardList: (boards: ProjectBoardGroup[]) => void;
  setArchivedBoardList: (boards: ProjectBoardGroup[]) => void;
  clearBoards: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  setBoard: (board) => set({ board }),
  clearBoard: () => set({ board: null }),
  boardList: [],
  archivedBoardList: [],
  setBoardList: (boards) => set({ boardList: boards }),
  setArchivedBoardList: (boards) => set({ archivedBoardList: boards }),
  clearBoards: () => set({ boardList: [], archivedBoardList: [] }),
}));