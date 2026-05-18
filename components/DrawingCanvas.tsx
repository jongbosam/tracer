'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useStore } from '../store/useStore';

export interface DrawingCanvasRef {
  clear: () => void;
  resetHistory: () => void;
  getDataUrl: () => string;
  undo: () => void;
  redo: () => void;
}

interface DrawingCanvasProps {
  onStrokeEnd?: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ onStrokeEnd, onHistoryChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  const { penColor, penSize, isEraser, startTimer } = useStore();

  const saveState = () => {
    if (!canvasRef.current) return;
    undoStack.current.push(canvasRef.current.toDataURL());
    redoStack.current = [];
    notifyHistoryChange();
  };

  const notifyHistoryChange = () => {
    if (onHistoryChange) {
      onHistoryChange(undoStack.current.length > 0, redoStack.current.length > 0);
    }
  };

  const restoreState = (dataUrl: string, callback?: () => void) => {
    if (!canvasRef.current || !ctx) return;
    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      if (!canvasRef.current || !ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.restore();
      if (callback) callback();
    };
  };

  // Handle Resize correctly to avoid aspect ratio stretching
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set explicit size to match CSS display size using ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        // We only want to resize if the physical size changed
        if (canvas.style.width !== `${width}px` || canvas.style.height !== `${height}px`) {
           // Save current drawing
           const tempCanvas = document.createElement('canvas');
           tempCanvas.width = canvas.width;
           tempCanvas.height = canvas.height;
           const tCtx = tempCanvas.getContext('2d');
           if (tCtx && canvas.width > 0) {
             tCtx.drawImage(canvas, 0, 0);
           }

           // Set actual size in memory (scaled to account for extra pixel density)
           canvas.width = Math.floor(width * dpr);
           canvas.height = Math.floor(height * dpr);
           
           // Normalize coordinate system to use css pixels
           context.setTransform(1, 0, 0, 1, 0, 0); // Reset existing transform first
           context.scale(dpr, dpr);

           // Set display size (css pixels)
           canvas.style.width = `${width}px`;
           canvas.style.height = `${height}px`;
           
           // Restore current drawing, mapping it correctly
           if (tCtx && tempCanvas.width > 0) {
             // old display dimensions were tempCanvas.width/oldDpr
             // For simplicity, drawn relative to full width/height
             context.save();
             context.setTransform(1, 0, 0, 1, 0, 0); // reset transform for drawing
             context.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
             context.restore();
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
        saveState();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    resetHistory: () => {
      undoStack.current = [];
      redoStack.current = [];
      notifyHistoryChange();
    },
    getDataUrl: () => {
      // Export just the drawing without background (it's transparent)
      if (canvasRef.current) {
        // For vision API, you might need a white background behind the transparent strokes.
        // But the requirement says "원문 텍스트 레이어는 캡처에서 제외되어야 합니다." so transparent is perfect.
        return canvasRef.current.toDataURL('image/png');
      }
      return '';
    },
    undo: () => {
      if (undoStack.current.length > 0) {
        if (canvasRef.current) {
          redoStack.current.push(canvasRef.current.toDataURL());
        }
        const previousState = undoStack.current.pop();
        if (previousState) {
          restoreState(previousState, () => {
            if (onStrokeEnd) onStrokeEnd();
          });
        }
        notifyHistoryChange();
      }
    },
    redo: () => {
      if (redoStack.current.length > 0) {
        if (canvasRef.current) {
          undoStack.current.push(canvasRef.current.toDataURL());
        }
        const nextState = redoStack.current.pop();
        if (nextState) {
          restoreState(nextState, () => {
            if (onStrokeEnd) onStrokeEnd();
          });
        }
        notifyHistoryChange();
      }
    }
  }));

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctx || !canvasRef.current) return;
    
    saveState();
    
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
    if (isDrawing.current && onStrokeEnd) {
      // Fire onStrokeEnd only if we were actually drawing
      onStrokeEnd();
    }
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
