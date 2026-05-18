import { create } from 'zustand';
import { SAMPLE_TEXTS } from '../lib/sample-texts';

const COLS = 10;
const ROWS = 5;
const CHARS_PER_PAGE = COLS * ROWS;

// Utility to process text into 10x5 pages.
// Newlines (\n) should advance to the next multiple of 10.
function processTextIntoPages(text: string): string[][] {
  const pages: string[][] = [];
  let currentPageHolder: string[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '\n') {
      // Pad to the end of the current line (nearest multiple of 10)
      const currentLength = currentPageHolder.length;
      const remainder = currentLength % COLS;
      
      // If we are exactly at the start of a line (remainder === 0), it means 
      // we need a FULL empty line of padding for this `\n`.
      const padding = remainder === 0 ? COLS : (COLS - remainder);
      for (let p = 0; p < padding; p++) {
        currentPageHolder.push('');
      }
    } else {
      currentPageHolder.push(char);
    }

    // Check if page is full
    if (currentPageHolder.length >= CHARS_PER_PAGE) {
      pages.push([...currentPageHolder].slice(0, CHARS_PER_PAGE));
      currentPageHolder = []; // reset for next page
    }
  }

  // Add the last page if there's remainder
  if (currentPageHolder.length > 0) {
    while (currentPageHolder.length < CHARS_PER_PAGE) {
      currentPageHolder.push('');
    }
    pages.push([...currentPageHolder]);
  }

  return pages;
}

interface Stats {
  completion: number;
  accuracy: number;
  errorCount: number;
}

interface AppState {
  currentTextIndex: number;
  pages: string[][];
  currentPage: number;
  opacity: number;
  penColor: string;
  penSize: number;
  isEraser: boolean;
  timer: number;
  isTimerRunning: boolean;
  canUndo: boolean;
  canRedo: boolean;
  stats: Stats;
  cellResults: (boolean | 'filled' | null)[]; // null = unchecked, 'filled' = drawn but unverified, true = correct, false = wrong
  theme: {
    gridColor: string;
    bgmEnabled: boolean;
    textEffect: boolean;
    fontFamily: string;
  };
  isSettingsOpen: boolean;
  
  // Actions
  setTextIndex: (index: number) => void;
  setOpacity: (val: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPenColor: (color: string) => void;
  setPenSize: (size: number) => void;
  toggleEraser: () => void;
  tickTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  setHistoryState: (canUndo: boolean, canRedo: boolean) => void;
  setCellResults: (results: (boolean | 'filled' | null)[]) => void;
  updateStats: (accuracy: number, errors: number) => void;
  clearResults: () => void;
  setTheme: (updates: Partial<AppState['theme']>) => void;
  toggleSettings: () => void;
}

const initialPages = processTextIntoPages(SAMPLE_TEXTS[0].text);

export const useStore = create<AppState>((set) => ({
  currentTextIndex: 0,
  pages: initialPages,
  currentPage: 0,
  opacity: 0.5, // Increased default from 0.35 for better visibility
  penColor: '#1a1a1a',
  penSize: 2,
  isEraser: false,
  timer: 0,
  isTimerRunning: false,
  canUndo: false,
  canRedo: false,
  stats: {
    completion: 0,
    accuracy: 100,
    errorCount: 0,
  },
  cellResults: new Array(CHARS_PER_PAGE).fill(null),
  theme: {
    gridColor: '#d9adad', // Default pink grid
    bgmEnabled: false,
    textEffect: true,
    fontFamily: 'serif',
  },
  isSettingsOpen: false,

  setTextIndex: (index) => set(() => {
    const pages = processTextIntoPages(SAMPLE_TEXTS[index].text);
    return {
      currentTextIndex: index,
      pages,
      currentPage: 0,
      cellResults: new Array(CHARS_PER_PAGE).fill(null),
      timer: 0,
      isTimerRunning: false,
      canUndo: false,
      canRedo: false,
      stats: { completion: 0, accuracy: 100, errorCount: 0 }
    };
  }),

  setOpacity: (val) => set({ opacity: val }),
  
  nextPage: () => set((state) => ({ 
    currentPage: Math.min(state.currentPage + 1, state.pages.length - 1),
    cellResults: new Array(CHARS_PER_PAGE).fill(null), // clear on page change
    canUndo: false,
    canRedo: false
  })),
  
  prevPage: () => set((state) => ({ 
    currentPage: Math.max(state.currentPage - 1, 0),
    cellResults: new Array(CHARS_PER_PAGE).fill(null),
    canUndo: false,
    canRedo: false
  })),

  setPenColor: (color) => set({ penColor: color, isEraser: false }),
  setPenSize: (size) => set({ penSize: size }),
  toggleEraser: () => set((state) => ({ isEraser: !state.isEraser })),
  
  tickTimer: () => set((state) => ({ timer: state.isTimerRunning ? state.timer + 1 : state.timer })),
  startTimer: () => set({ isTimerRunning: true }),
  stopTimer: () => set({ isTimerRunning: false }),
  
  setHistoryState: (canUndo, canRedo) => set({ canUndo, canRedo }),

  setCellResults: (results) => set({ cellResults: results }),
  updateStats: (accuracy, errors) => set((state) => {
    // Simple completion calc for demo based on page progress
    const completion = Math.round(((state.currentPage + 1) / state.pages.length) * 100);
    return {
      stats: { completion, accuracy, errorCount: errors }
    };
  }),
  
  clearResults: () => set({ cellResults: new Array(CHARS_PER_PAGE).fill(null) }),
  
  setTheme: (updates) => set((state) => ({ theme: { ...state.theme, ...updates } })),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
