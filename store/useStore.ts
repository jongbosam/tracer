import { create } from 'zustand';

// Sample text for the application
const SAMPLE_TEXT = "죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를,\n잎새에 이는 바람에도 나는 괴로워했다.\n별을 노래하는 마음으로 모든 죽어가는 것을 사랑해야지.\n그리고 나한테 주어진 길을 걸어가야겠다.\n오늘 밤에도 별이 바람에 스치운다.";

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
      if (remainder !== 0 || currentLength === 0) {
        const padding = COLS - remainder;
        for (let p = 0; p < padding; p++) {
          currentPageHolder.push('');
        }
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
  pages: string[][];
  currentPage: number;
  opacity: number;
  penColor: string;
  penSize: number;
  isEraser: boolean;
  timer: number;
  isTimerRunning: boolean;
  stats: Stats;
  cellResults: (boolean | null)[]; // null = unchecked, true = correct, false = wrong
  theme: {
    gridColor: string;
    bgmEnabled: boolean;
    textEffect: boolean;
    fontFamily: string;
  };
  isSettingsOpen: boolean;
  
  // Actions
  setOpacity: (val: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPenColor: (color: string) => void;
  setPenSize: (size: number) => void;
  toggleEraser: () => void;
  tickTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  setCellResults: (results: (boolean | null)[]) => void;
  updateStats: (accuracy: number, errors: number) => void;
  clearResults: () => void;
  setTheme: (updates: Partial<AppState['theme']>) => void;
  toggleSettings: () => void;
}

const initialPages = processTextIntoPages(SAMPLE_TEXT);

export const useStore = create<AppState>((set) => ({
  pages: initialPages,
  currentPage: 0,
  opacity: 0.5, // Increased default from 0.35 for better visibility
  penColor: '#1a1a1a',
  penSize: 2,
  isEraser: false,
  timer: 0,
  isTimerRunning: false,
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

  setOpacity: (val) => set({ opacity: val }),
  
  nextPage: () => set((state) => ({ 
    currentPage: Math.min(state.currentPage + 1, state.pages.length - 1),
    cellResults: new Array(CHARS_PER_PAGE).fill(null) // clear on page change
  })),
  
  prevPage: () => set((state) => ({ 
    currentPage: Math.max(state.currentPage - 1, 0),
    cellResults: new Array(CHARS_PER_PAGE).fill(null)
  })),

  setPenColor: (color) => set({ penColor: color, isEraser: false }),
  setPenSize: (size) => set({ penSize: size }),
  toggleEraser: () => set((state) => ({ isEraser: !state.isEraser })),
  
  tickTimer: () => set((state) => ({ timer: state.isTimerRunning ? state.timer + 1 : state.timer })),
  startTimer: () => set({ isTimerRunning: true }),
  stopTimer: () => set({ isTimerRunning: false }),
  
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
