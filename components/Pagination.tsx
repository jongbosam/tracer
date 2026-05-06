'use client';

import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ onPageChange }: { onPageChange?: () => void }) {
  const { pages, currentPage, nextPage, prevPage } = useStore();

  const handlePrev = () => {
    prevPage();
    if (onPageChange) onPageChange();
  };

  const handleNext = () => {
    nextPage();
    if (onPageChange) onPageChange();
  };

  return (
    <footer className="mt-16 flex items-center gap-8 font-sans">
      <button 
        onClick={handlePrev} 
        disabled={currentPage === 0}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-[#e3dfd6] text-[#8c887d] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex gap-3 text-sm">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (useStore.getState().currentPage !== i) {
                 useStore.setState({ currentPage: i, cellResults: new Array(useStore.getState().pages[0]?.length).fill(null) });
                 if (onPageChange) onPageChange();
              }
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${currentPage === i ? 'bg-[#5a5a40] text-white' : 'text-[#8c887d] hover:bg-white'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button 
        onClick={handleNext}
        disabled={currentPage === pages.length - 1}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-[#e3dfd6] text-[#8c887d] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </footer>
  );
}
