'use client';

import { useStore } from '../store/useStore';
import { X, Music, Type } from 'lucide-react';

export default function SettingsModal() {
  const { isSettingsOpen, toggleSettings, theme, setTheme } = useStore();

  if (!isSettingsOpen) return null;

  const gridThemes = [
    { name: 'Standard', value: '#d9adad', bg: 'bg-[#d9adad]' },
    { name: 'Warm Notebook', value: '#e3dfd6', bg: 'bg-[#e3dfd6]' },
    { name: 'Blueprint', value: '#93c5fd', bg: 'bg-blue-300' },
    { name: 'Manuscript', value: '#cdc1b5', bg: 'bg-[#cdc1b5]' }
  ];

  const fontThemes = [
    { name: 'Default Serif', value: 'serif' },
    { name: '가람연꽃 (Custom)', value: 'GaramYeonggot' },
    { name: '갈맷글 (Custom)', value: 'Galmaetgeul' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm"
        onClick={toggleSettings}
      />
      
      {/* Modal */}
      <div className="relative bg-[#fdfbf7] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e3dfd6]">
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Preferences</h2>
            <button 
               onClick={toggleSettings}
               className="p-1 rounded-md hover:bg-white text-[#8c887d] transition-colors"
            >
               <X className="w-5 h-5" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-[#1a1a1a] max-h-[70vh] overflow-y-auto w-full">
            
            {/* Grid Color */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c887d] mb-3 flex items-center gap-2">
                 Grid Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 {gridThemes.map(t => (
                     <button
                        key={t.value}
                        onClick={() => setTheme({ gridColor: t.value })}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${
                          theme.gridColor === t.value 
                            ? 'border-[#5a5a40] bg-white text-[#1a1a1a] ring-1 ring-[#5a5a40]' 
                            : 'border-[#e3dfd6] hover:border-[#8c887d] bg-white'
                        }`}
                     >
                        <div className={`w-4 h-4 rounded-full ${t.bg}`} />
                        {t.name}
                     </button>
                 ))}
              </div>
            </div>

            {/* Font Theme */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c887d] mb-3 flex items-center gap-2">
                 Font Theme
              </h3>
              <div className="flex flex-col gap-2">
                 {fontThemes.map(f => (
                     <button
                        key={f.value}
                        onClick={() => setTheme({ fontFamily: f.value })}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all ${
                          theme.fontFamily === f.value 
                            ? 'border-[#5a5a40] bg-white text-[#1a1a1a] ring-1 ring-[#5a5a40] font-medium' 
                            : 'border-[#e3dfd6] hover:border-[#8c887d] bg-white text-[#8c887d]'
                        }`}
                        style={{ fontFamily: f.value }}
                     >
                        {f.name}
                     </button>
                 ))}
              </div>
            </div>

            {/* Toggle Features */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-[#8c887d] mb-3 block">
                 Features
               </h3>
               
               <button 
                  onClick={() => setTheme({ bgmEnabled: !theme.bgmEnabled })}
                  className="w-full flex justify-between items-center bg-white p-4 rounded-xl border border-[#e3dfd6]"
               >
                  <div className="flex items-center gap-3 font-medium text-[#1a1a1a]">
                     <Music className="w-5 h-5 text-[#8c887d]" />
                     Background Music
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors flex items-center p-1 ${theme.bgmEnabled ? 'bg-[#5a5a40]' : 'bg-[#e3dfd6]'}`}>
                     <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme.bgmEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
               </button>

               <button 
                  onClick={() => setTheme({ textEffect: !theme.textEffect })}
                  className="w-full flex justify-between items-center bg-white p-4 rounded-xl border border-[#e3dfd6]"
               >
                  <div className="flex items-center gap-3 font-medium text-left text-[#1a1a1a]">
                     <Type className="w-5 h-5 text-[#8c887d]" />
                     <div>
                       Completion Text Effect
                       <p className="text-xs text-[#8c887d] font-normal mt-0.5">Animate text when transcription is perfect.</p>
                     </div>
                  </div>
                  <div className={`w-12 h-6 shrink-0 rounded-full transition-colors flex items-center p-1 ${theme.textEffect ? 'bg-[#5a5a40]' : 'bg-[#e3dfd6]'}`}>
                     <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme.textEffect ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
               </button>
            </div>
        </div>
      </div>
    </div>
  );
}
