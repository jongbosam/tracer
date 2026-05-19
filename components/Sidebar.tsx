'use client';

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SAMPLE_TEXTS } from '../lib/sample-texts';
import { Eraser, Undo2, Redo2, Pen, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ 
  onClearCanvas, 
  onCheck,
  onUndo,
  onRedo,
  isOpen,
  onToggle
}: { 
  onClearCanvas: () => void, 
  onCheck: () => void,
  onUndo: () => void,
  onRedo: () => void,
  isOpen: boolean,
  onToggle: () => void
}) {
  const currentTextIndex = useStore((state) => state.currentTextIndex);
  const setTextIndex = useStore((state) => state.setTextIndex);
  const opacity = useStore((state) => state.opacity);
  const setOpacity = useStore((state) => state.setOpacity);
  const penColor = useStore((state) => state.penColor);
  const setPenColor = useStore((state) => state.setPenColor);
  const penSize = useStore((state) => state.penSize);
  const setPenSize = useStore((state) => state.setPenSize);
  const isEraser = useStore((state) => state.isEraser);
  const toggleEraser = useStore((state) => state.toggleEraser);
  const penOnlyMode = useStore((state) => state.penOnlyMode);
  const togglePenOnlyMode = useStore((state) => state.togglePenOnlyMode);
  const timer = useStore((state) => state.timer);
  const isTimerRunning = useStore((state) => state.isTimerRunning);
  const tickTimer = useStore((state) => state.tickTimer);
  const stats = useStore((state) => state.stats);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);

  // Handle Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tickTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed top-1/2 -translate-y-1/2 left-0 md:left-4 z-50 p-1.5 bg-white border border-l-0 md:border-l border-[#e3dfd6] rounded-r-md md:rounded-full shadow-sm text-[#8c887d] hover:text-[#5a5a40] hover:bg-[#f5f2ed] transition-colors"
        title="사이드바 열기"
      >
        <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
      </button>
    );
  }

  return (
    <aside className="w-full md:w-80 bg-[#f5f2ed] border-b md:border-b-0 md:border-r border-[#e3dfd6] flex flex-col shrink-0 transition-all font-serif text-[#1a1a1a] md:h-full z-30 relative">
      <button 
        onClick={onToggle}
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 p-1.5 bg-white border border-[#e3dfd6] rounded-full shadow-sm text-[#8c887d] hover:text-[#5a5a40] hover:bg-[#f5f2ed] transition-colors z-40"
        title="사이드바 닫기"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="p-4 md:p-8 overflow-y-auto h-full flex flex-col w-full">
        <div className="space-y-6 md:space-y-10 flex flex-col sm:flex-row md:flex-col gap-4 sm:gap-8 md:gap-0 relative">
          <div className="shrink-0">
            {/* User Profile */}
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              {/* Mobile close button inside header area */}
              <button 
                onClick={onToggle}
                className="md:hidden mr-2 p-1.5 bg-white border border-[#e3dfd6] rounded-md shadow-sm text-[#8c887d] hover:text-[#5a5a40] hover:bg-[#f5f2ed] transition-colors"
                title="사이드바 닫기"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#5a5a40] flex items-center justify-center text-white font-sans text-lg md:text-xl">
              YS
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">Yi Sang</h2>
              <p className="text-[9px] md:text-[10px] text-[#8c887d] font-sans tracking-widest uppercase">Master Transcriber</p>
            </div>
          </div>

          {/* Stats Board */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2 md:gap-4 font-sans">
            <div className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-[#ede9e1]">
              <p className="text-[9px] md:text-[10px] uppercase tracking-tighter text-[#8c887d] mb-0.5 md:mb-1">Timer</p>
              <p className="text-base md:text-xl font-medium">{formatTime(timer)}</p>
            </div>
            <div className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-[#ede9e1]">
              <p className="text-[9px] md:text-[10px] uppercase tracking-tighter text-[#8c887d] mb-0.5 md:mb-1">진행률</p>
              <p className="text-base md:text-xl font-medium">{stats.completion}%</p>
            </div>
            <div className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-[#ede9e1]">
              <p className="text-[9px] md:text-[10px] uppercase tracking-tighter text-[#8c887d] mb-0.5 md:mb-1">정확도</p>
              <p className="text-base md:text-xl font-medium text-emerald-700">{stats.accuracy}%</p>
            </div>
            <div className="bg-white p-2 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-[#ede9e1]">
              <p className="text-[9px] md:text-[10px] uppercase tracking-tighter text-[#8c887d] mb-0.5 md:mb-1">오탈자</p>
              <p className="text-base md:text-xl font-medium text-rose-700">{stats.errorCount}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Text Selection */}
          <div>
            <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#8c887d] block mb-2 font-sans font-bold">
              원문 선택
            </label>
            <select
              value={currentTextIndex}
              onChange={(e) => {
                setTextIndex(Number(e.target.value));
                onClearCanvas();
              }}
              className="w-full bg-white border border-[#e3dfd6] p-2 rounded-lg text-sm font-sans focus:outline-none focus:ring-1 focus:ring-[#5a5a40]"
            >
              {SAMPLE_TEXTS.map((text, idx) => (
                <option key={idx} value={idx}>
                  {text.title} ({text.gradeLevel}학년)
                </option>
              ))}
            </select>
            <p className="mt-2 text-[10px] text-[#8c887d] font-sans">
              {SAMPLE_TEXTS[currentTextIndex]?.note}
            </p>
          </div>

          {/* Text Overlay Controls */}
          <div>
            <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#8c887d] block mb-2 md:mb-4 font-sans font-bold">
              원문 투명도 조절
            </label>
            <div className="relative flex items-center group">
              <input 
                type="range" 
                min="0" max="1" step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 md:h-2 bg-[#e3dfd6] rounded-lg appearance-none cursor-pointer accent-[#5a5a40]"
                style={{
                   background: `linear-gradient(to right, #5a5a40 ${opacity * 100}%, #e3dfd6 ${opacity * 100}%)`
                }}
              />
              <div className="ml-2 text-[10px] font-sans font-bold text-[#8c887d] w-6 md:w-8">
                {Math.round(opacity * 100)}%
              </div>
            </div>
          </div>

          {/* Drawing Tools */}
          <div>
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#8c887d] block font-sans">
                펜 설정
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`p-1 rounded-md transition-colors ${canUndo ? 'text-[#5a5a40] hover:bg-[#e3dfd6]' : 'text-[#d9d5ce] cursor-not-allowed'}`}
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`p-1 rounded-md transition-colors ${canRedo ? 'text-[#5a5a40] hover:bg-[#e3dfd6]' : 'text-[#d9d5ce] cursor-not-allowed'}`}
                  title="Redo"
                >
                  <Redo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                {['#1a1a1a', '#4a6d8c', '#8c4a4a'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full ${penColor === color && !isEraser ? 'border-2 border-white ring-1 ring-black' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    title="Pen Color"
                  />
                ))}
                <button
                   onClick={toggleEraser}
                   className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors ${
                     isEraser 
                       ? 'bg-[#1a1a1a] text-white' 
                       : 'bg-white text-[#1a1a1a] border border-[#e3dfd6]'
                   }`}
                   title="Eraser"
                >
                    <Eraser className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                   onClick={togglePenOnlyMode}
                   className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors ${
                     penOnlyMode 
                       ? 'bg-blue-500 text-white border-transparent' 
                       : 'bg-white text-[#1a1a1a] border border-[#e3dfd6]'
                   }`}
                   title={penOnlyMode ? "Pen/Stylus Only: ON" : "Any Touch: ON (Click to require Pen)"}
                >
                    <Pen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center bg-white border border-[#e3dfd6] rounded-full px-2 md:px-3 gap-1 md:gap-2 relative min-w-[60px] md:min-w-[80px] h-7 md:h-8">
                <span className="w-2 md:w-3 h-2 md:h-3 bg-black rounded-full shrink-0" style={{ transform: `scale(${penSize / 5})` }}></span>
                <span className="text-[10px] md:text-xs font-sans font-bold ml-auto text-right w-3 md:w-4">
                  {penSize === 4 ? 'EF' : penSize === 6 ? 'F' : penSize === 8 ? 'M' : 'B'}
                </span>
                <button 
                  aria-label="Change Pen Size" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onClick={() => {
                    const sizes = [4, 6, 8, 14];
                    const currentIndex = sizes.indexOf(penSize) !== -1 ? sizes.indexOf(penSize) : 0;
                    setPenSize(sizes[(currentIndex + 1) % sizes.length]);
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 md:flex-col md:space-y-4 pt-4 md:pt-6 mt-6 md:mt-10 border-t border-[#e3dfd6]">
         <button 
           onClick={onCheck}
           className="flex-1 md:w-full py-3 md:py-4 bg-[#5a5a40] text-white rounded-full font-sans text-[10px] md:text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
         >
            최종 제출 (AI 채점)
         </button>
         <button 
           onClick={onClearCanvas}
           className="flex-1 md:w-full py-3 md:py-4 border border-[#5a5a40] text-[#5a5a40] rounded-full font-sans text-[10px] md:text-sm tracking-widest uppercase hover:bg-white transition-colors"
         >
            Clear
         </button>
      </div>
      </div>
    </aside>
  );
}
