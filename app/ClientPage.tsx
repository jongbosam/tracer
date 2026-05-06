'use client';

import { useRef, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TranscriptionBoard from '../components/TranscriptionBoard';
import Pagination from '../components/Pagination';
import { useStore } from '../store/useStore';
import { DrawingCanvasRef } from '../components/DrawingCanvas';
import { processOCR } from '../lib/ocr';
import { Loader2 } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import BGMPlayer from '../components/BGMPlayer';
import { sayings } from '../lib/sayings';

export default function ClientPage() {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const { pages, currentPage, updateStats, setCellResults, stopTimer } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Random Idiom state
  const [currentSaying, setCurrentSaying] = useState(sayings[0]);
  const [isFading, setIsFading] = useState(false);

  const fetchNewSaying = async () => {
    try {
      const res = await fetch('/api/sayings');
      if (res.ok) {
        const data = await res.json();
        setCurrentSaying(data);
      } else {
        // Fallback to local
        const randomIdx = Math.floor(Math.random() * sayings.length);
        setCurrentSaying(sayings[randomIdx]);
      }
    } catch {
      // Fallback to local
      const randomIdx = Math.floor(Math.random() * sayings.length);
      setCurrentSaying(sayings[randomIdx]);
    }
  };

  useEffect(() => {
    // 최초 1회 즉시 호출 시도
    const initFetch = async () => {
      try {
        await fetchNewSaying();
      } catch (err) {
        console.error("Initial fetch failed:", err);
      }
    };
    initFetch();

    // Change idiom every 1 minute (60,000 ms)
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(async () => {
        await fetchNewSaying();
        setIsFading(false);
      }, 1000); // smooth fade out delay
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  const handleClearCanvas = () => {
      canvasRef.current?.clear();
  };

  const handleCheck = async () => {
      if (!canvasRef.current || isProcessing) return;
      
      setIsProcessing(true);
      // Stop timer for evaluation
      stopTimer();

      try {
          // 1. Capture the stroke layer image without background text
          const capturedDrawing = canvasRef.current.getDataUrl();
          
          // 2. Extract current page's target text mapping
          const targetText = pages[currentPage];

          // 3. Send to simulated Vision API OCR
          const validation = await processOCR(capturedDrawing, targetText);

          // 4. Record Results into Store to trigger visual updates
          setCellResults(validation.results);
          updateStats(validation.accuracy, validation.errorCount);

      } catch(err) {
          console.error("OCR validation failed", err);
      } finally {
          setIsProcessing(false);
      }
  };

  const handlePageChange = () => {
       // Clear canvas automatically when changing pages
       handleClearCanvas();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#fdfbf7] text-[#1a1a1a] font-serif overflow-hidden">
      <Sidebar 
          onClearCanvas={handleClearCanvas}
          onCheck={handleCheck}
      />
      
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center relative p-4 md:p-12 overflow-y-auto">
        {/* Processing State Overlay */}
        {isProcessing && (
           <div className="fixed md:absolute inset-0 z-50 bg-[#fdfbf7]/50 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#5a5a40] animate-spin mb-4" />
              <p className="text-[#8c887d] font-sans font-medium uppercase tracking-widest text-sm">Analyzing handwriting...</p>
           </div>
        )}

        <header 
          className={`sticky top-0 z-20 w-full text-center py-4 md:py-8 bg-[#fdfbf7]/95 backdrop-blur-sm transition-opacity duration-1000 ease-in-out border-b border-[#e3dfd6]/30 ${isFading ? 'opacity-0' : ''}`}
        >
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-[10px] md:text-xs italic text-[#8c887d] mb-1 md:mb-2 uppercase tracking-tighter">오늘의 문장</p>
            <h1 className="text-lg md:text-2xl font-normal mb-2 md:mb-3 leading-snug break-keep text-[#2a2a2a]">{currentSaying.title}</h1>
            <p className="text-[#a39f94] text-[10px] md:text-xs leading-relaxed tracking-wide break-keep opacity-80">{currentSaying.description}</p>
          </div>
        </header>

        <div className="w-full max-w-5xl mx-auto mb-8">
           <TranscriptionBoard canvasRef={canvasRef} />
        </div>
        
        <div className="mb-12">
          <Pagination onPageChange={handlePageChange} />
        </div>
        
        <SettingsModal />
        <BGMPlayer />
        
        {/* Settings FAB */}
        <div className="fixed top-4 right-4 md:top-8 md:right-8 z-40">
          <button 
             onClick={useStore.getState().toggleSettings}
             className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-[#e3dfd6]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
