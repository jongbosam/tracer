'use client';

import { useStore } from '../store/useStore';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';

export default function TranscriptionBoard({ canvasRef, onStrokeEnd }: { canvasRef: React.RefObject<DrawingCanvasRef | null>, onStrokeEnd?: () => void }) {
  const pages = useStore((state) => state.pages);
  const currentPage = useStore((state) => state.currentPage);
  const opacity = useStore((state) => state.opacity);
  const cellResults = useStore((state) => state.cellResults);
  const theme = useStore((state) => state.theme);
  const setHistoryState = useStore((state) => state.setHistoryState);
  
  const currentChars = pages[currentPage] || [];

  return (
    <div className="w-full max-w-5xl mx-auto shadow-2xl rounded-sm overflow-hidden bg-white border border-[#e3dfd6] p-2 md:p-4">
      {/* Container for Grid and Canvas to ensure perfect alignment */}
      <div className="relative">
        {/* Background CSS Grid (10 columns) */}
        <div 
          className="grid grid-cols-10 border-t border-l"
          style={{ 
            borderColor: theme.gridColor,
            containerType: 'inline-size'
          }}
        >
          {currentChars.map((char, index) => {
            // Determine styling based on OCR validation result
            const result = cellResults[index];
            let bgColorClass = 'bg-[#fffdfa]'; 
            if (result === 'filled') bgColorClass = 'bg-[#f0ece1] transition-colors duration-300';
            if (result === false) bgColorClass = 'bg-rose-100 transition-colors duration-500'; 
            if (result === true) bgColorClass = 'bg-emerald-50 transition-colors duration-500'; 

            return (
              <div 
                key={index}
                className={`aspect-square border-b border-r flex items-center justify-center relative ${bgColorClass}`}
                style={{ borderColor: theme.gridColor }}
              >
                {/* Notebook internal crosshair lines per cell */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.07] md:opacity-15">
                   <div className="absolute w-full h-px bg-[#d9adad] top-1/2 -translate-y-1/2 border-dashed" />
                   <div className="absolute h-full w-px bg-[#d9adad] left-1/2 -translate-x-1/2 border-dashed" />
                </div>
                
                {/* Text Layer (Original Reference Text) */}
                {char && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 font-bold">
                    <span 
                       className="text-[#1a1a1a] select-none"
                       style={{ 
                         opacity, 
                         fontFamily: theme.fontFamily,
                         fontSize: '7cqw',
                         lineHeight: 1
                       }}
                    >
                      {char}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* The drawing layer overlayed perfectly on top of the grid */}
        <DrawingCanvas ref={canvasRef} onStrokeEnd={onStrokeEnd} onHistoryChange={setHistoryState} />
      </div>
    </div>
  );
}
