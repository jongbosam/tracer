'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useStore } from '../store/useStore';

export interface DrawingCanvasRef {
  clear: () => void;
  getDataUrl: () => string;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  
  const { penColor, penSize, isEraser, startTimer } = useStore();

  // Handle Resize correctly to avoid aspect ratio stretching
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set explicit size to match CSS display size using ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // To maintain sharp lines, consider window.devicePixelRatio, 
        // but for a simple grid overlay, exact layout dimensions are fine.
        const { width, height } = entry.contentRect;
        
        // We only want to resize if the physical size changed, to not wipe canvas on state updates
        if (canvas.width !== width || canvas.height !== height) {
           // Save current drawing
           const tempCanvas = document.createElement('canvas');
           tempCanvas.width = canvas.width;
           tempCanvas.height = canvas.height;
           const tCtx = tempCanvas.getContext('2d');
           if (tCtx && canvas.width > 0) {
             tCtx.drawImage(canvas, 0, 0);
           }

           canvas.width = width;
           canvas.height = height;
           
           // Restore current drawing
           if (tCtx && tempCanvas.width > 0) {
             context.drawImage(tempCanvas, 0, 0);
           }
           
           context.lineCap = 'round';
           context.lineJoin = 'round';
        }
      }
    });

    resizeObserver.observe(canvas);
    setCtx(context);

    return () => resizeObserver.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (canvasRef.current && ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    getDataUrl: () => {
      // Export just the drawing without background (it's transparent)
      if (canvasRef.current) {
        // For vision API, you might need a white background behind the transparent strokes.
        // But the requirement says "원문 텍스트 레이어는 캡처에서 제외되어야 합니다." so transparent is perfect.
        return canvasRef.current.toDataURL('image/png');
      }
      return '';
    }
  }));

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctx || !canvasRef.current) return;
    isDrawing.current = true;
    startTimer(); // Start timer on first interaction

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Set styles based on store
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : penColor;
    ctx.lineWidth = penSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !ctx || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    isDrawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={startDrawing}
      onPointerMove={draw}
      onPointerUp={stopDrawing}
      onPointerOut={stopDrawing}
      className="absolute inset-0 z-20 w-full h-full touch-none"
      style={{
        // Touch-action none is critical for mobile preventing scrolling while drawing
        touchAction: 'none'
      }}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
