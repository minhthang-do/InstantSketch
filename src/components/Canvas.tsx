import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ToolType, BackgroundStyle } from '../types/sketch';
import { 
  Undo2, Redo2, Trash2, ImagePlus, Smile, Type, 
  Sparkles, Check, X, RotateCw, ZoomIn, ZoomOut
} from 'lucide-react';

interface CanvasProps {
  tool: ToolType;
  color: string;
  brushSize: number;
  bgStyle: BackgroundStyle;
  onUndoRedoStateChange?: (canUndo: boolean, canRedo: boolean) => void;
  onCanvasExportReady?: (exportFn: () => string) => void;
}

const STICKERS = ['❤️', '⭐', '✨', '🌸', '🐱', '🐶', '🔥', '👑', '☕', '🍰', '🍕', '💌', '🧸', '🌈', '🎉', '🍀'];

export const Canvas: React.FC<CanvasProps> = ({
  tool,
  color,
  brushSize,
  bgStyle,
  onUndoRedoStateChange,
  onCanvasExportReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  // Undo/Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Image / Sticker placement mode
  const [pendingOverlay, setPendingOverlay] = useState<{
    type: 'image' | 'sticker' | 'text';
    content: string; // url or sticker emoji or text string
    imgElement?: HTMLImageElement;
    x: number;
    y: number;
    size: number;
    rotation: number;
  } | null>(null);

  // Sticker Picker Modal
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  // Text Input Modal
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update undo/redo availability
  const updateUndoRedoState = useCallback(() => {
    const hasUndo = historyIndexRef.current > 0;
    const hasRedo = historyIndexRef.current < historyRef.current.length - 1;
    setCanUndo(hasUndo);
    setCanRedo(hasRedo);
    onUndoRedoStateChange?.(hasUndo, hasRedo);
  }, [onUndoRedoStateChange]);

  // Save current canvas state to history
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    // Truncate redo history if we are drawing after an undo
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(dataUrl);
    // Keep max 25 states
    if (historyRef.current.length > 25) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  // Draw background pattern
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    switch (bgStyle) {
      case 'dark':
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'vintage':
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'pastel-pink':
        ctx.fillStyle = '#fdf2f8';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'grid': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const gridSize = 24;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        break;
      }
      case 'dots': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#cbd5e1';
        const dotGap = 20;
        for (let x = dotGap; x < width; x += dotGap) {
          for (let y = dotGap; y < height; y += dotGap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'white':
      default:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        break;
    }
    ctx.restore();
  }, [bgStyle]);

  // Initialize Canvas dimensions on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const setupCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (canvas.width === width * dpr && canvas.height === height * dpr) return;

      const prevData = canvas.toDataURL();
      const hasContent = historyRef.current.length > 0;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        if (hasContent && prevData) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
          };
          img.src = prevData;
        } else {
          drawBackground(ctx, width, height);
          saveState();
        }
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [drawBackground, saveState]);

  // Handle background change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    if (!ctx || !container) return;

    const rect = container.getBoundingClientRect();
    if (historyRef.current.length <= 1) {
      drawBackground(ctx, rect.width, rect.height);
      saveState();
    }
  }, [bgStyle, drawBackground, saveState]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const container = containerRef.current;
      if (!canvas || !ctx || !container) return;

      const img = new Image();
      img.onload = () => {
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        updateUndoRedoState();
      };
      img.src = historyRef.current[historyIndexRef.current];
    }
  }, [updateUndoRedoState]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const container = containerRef.current;
      if (!canvas || !ctx || !container) return;

      const img = new Image();
      img.onload = () => {
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        updateUndoRedoState();
      };
      img.src = historyRef.current[historyIndexRef.current];
    }
  }, [updateUndoRedoState]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const container = containerRef.current;
    if (!canvas || !ctx || !container) return;

    if (window.confirm('Bạn có chắc chắn muốn xóa hết trang vẽ này không?')) {
      const rect = container.getBoundingClientRect();
      drawBackground(ctx, rect.width, rect.height);
      saveState();
    }
  }, [drawBackground, saveState]);

  // Export high quality PNG
  const exportCanvasDataUrl = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png', 0.95);
  }, []);

  useEffect(() => {
    if (onCanvasExportReady) {
      onCanvasExportReady(exportCanvasDataUrl);
    }
  }, [onCanvasExportReady, exportCanvasDataUrl]);

  // Pointer position helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Shape drawing helper
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    type: ToolType,
    from: { x: number; y: number },
    to: { x: number; y: number },
    strokeColor: string,
    width: number
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (type === 'line') {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (type === 'rectangle') {
      ctx.strokeRect(from.x, from.y, dx, dy);
    } else if (type === 'circle') {
      const radiusX = Math.abs(dx / 2);
      const radiusY = Math.abs(dy / 2);
      const centerX = from.x + dx / 2;
      const centerY = from.y + dy / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'heart') {
      const x = from.x + dx / 2;
      const y = from.y + dy / 2;
      const size = Math.max(Math.abs(dx), Math.abs(dy)) / 2;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(-size / 2, -size / 2, -size, topCurveHeight / 3, 0, size);
      ctx.bezierCurveTo(size, topCurveHeight / 3, size / 2, -size / 2, 0, topCurveHeight);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pendingOverlay) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const coords = getCoordinates(e);
    isDrawing.current = true;
    lastPoint.current = coords;
    startPoint.current = coords;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'brush' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 2.2;
      } else if (tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color + '66';
        ctx.lineWidth = brushSize * 2;
      } else if (tool === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = brushSize * 0.4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.shadowBlur = 0;
      }

      ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
      ctx.stroke();
    }
  };

  // Temporary snapshot for shape live previews
  const tempSnapshotRef = useRef<ImageData | null>(null);

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCoordinates(e);

    if (tool === 'pen' || tool === 'brush' || tool === 'highlighter' || tool === 'eraser') {
      if (lastPoint.current) {
        const midPoint = {
          x: (lastPoint.current.x + coords.x) / 2,
          y: (lastPoint.current.y + coords.y) / 2,
        };

        ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y);
        ctx.stroke();
        lastPoint.current = coords;
      }
    } else if (['line', 'rectangle', 'circle', 'heart'].includes(tool)) {
      if (!tempSnapshotRef.current) {
        tempSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        ctx.putImageData(tempSnapshotRef.current, 0, 0);
      }
      if (startPoint.current) {
        drawShape(ctx, tool, startPoint.current, coords, color, brushSize);
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (['line', 'rectangle', 'circle', 'heart'].includes(tool) && startPoint.current) {
        const coords = getCoordinates(e);
        if (tempSnapshotRef.current) {
          ctx.putImageData(tempSnapshotRef.current, 0, 0);
          tempSnapshotRef.current = null;
        }
        drawShape(ctx, tool, startPoint.current, coords, color, brushSize);
      }
      ctx.closePath();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }

    tempSnapshotRef.current = null;
    lastPoint.current = null;
    startPoint.current = null;
    saveState();
  };

  // Handle Image Upload Selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setPendingOverlay({
          type: 'image',
          content: dataUrl,
          imgElement: img,
          x: 100,
          y: 100,
          size: 180,
          rotation: 0,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add Sticker
  const handleSelectSticker = (emoji: string) => {
    setShowStickerPicker(false);
    setPendingOverlay({
      type: 'sticker',
      content: emoji,
      x: 140,
      y: 140,
      size: 72,
      rotation: 0,
    });
  };

  // Add Custom Text
  const handleConfirmText = () => {
    if (!customText.trim()) return;
    setShowTextInput(false);
    setPendingOverlay({
      type: 'text',
      content: customText,
      x: 120,
      y: 120,
      size: 32,
      rotation: 0,
    });
    setCustomText('');
  };

  // Stamp Pending Overlay onto Canvas
  const stampOverlay = () => {
    if (!pendingOverlay) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.translate(pendingOverlay.x, pendingOverlay.y);
    ctx.rotate((pendingOverlay.rotation * Math.PI) / 180);

    if (pendingOverlay.type === 'image' && pendingOverlay.imgElement) {
      const img = pendingOverlay.imgElement;
      const aspect = img.width / img.height;
      const w = pendingOverlay.size;
      const h = w / aspect;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else if (pendingOverlay.type === 'sticker') {
      ctx.font = `${pendingOverlay.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pendingOverlay.content, 0, 0);
    } else if (pendingOverlay.type === 'text') {
      ctx.font = `bold ${pendingOverlay.size}px "Caveat", "Plus Jakarta Sans", cursive, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pendingOverlay.content, 0, 0);
    }

    ctx.restore();
    setPendingOverlay(null);
    saveState();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Top Floating Undo / Redo / Clear Controls */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Hoàn tác"
            title="Hoàn tác (Undo)"
            className={`p-2 rounded-full transition-all ${
              canUndo 
                ? 'text-slate-200 hover:bg-slate-800 active:scale-95' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Làm lại"
            title="Làm lại (Redo)"
            className={`p-2 rounded-full transition-all ${
              canRedo 
                ? 'text-slate-200 hover:bg-slate-800 active:scale-95' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={handleClear}
            aria-label="Xóa bảng vẽ"
            title="Xóa trắng bảng vẽ"
            className="p-2 rounded-full text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stamp / Sticker Actions */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Thêm ảnh từ máy"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all"
          >
            <ImagePlus className="w-4 h-4" />
            <span className="hidden sm:inline">Chèn ảnh</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <button
            onClick={() => setShowStickerPicker(true)}
            title="Thêm sticker dễ thương"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Sticker</span>
          </button>

          <button
            onClick={() => setShowTextInput(true)}
            title="Viết chữ lên tranh"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-purple-400 hover:bg-purple-500/10 active:scale-95 transition-all"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Chữ viết</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Drawing Container */}
      <div 
        ref={containerRef}
        className="w-full h-full relative cursor-crosshair touch-none select-none overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full"
        />

        {/* Pending Image/Sticker Overlay Dragger */}
        {pendingOverlay && (
          <div
            className="absolute z-30 cursor-move border-2 border-dashed border-indigo-400 rounded-lg bg-indigo-500/10 shadow-2xl flex flex-col items-center justify-center p-2"
            style={{
              left: `${pendingOverlay.x - pendingOverlay.size / 2}px`,
              top: `${pendingOverlay.y - pendingOverlay.size / 2}px`,
              width: `${pendingOverlay.size}px`,
              height: `${pendingOverlay.size}px`,
              transform: `rotate(${pendingOverlay.rotation}deg)`,
            }}
            onPointerDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const origX = pendingOverlay.x;
              const origY = pendingOverlay.y;

              const onMove = (moveEv: PointerEvent) => {
                setPendingOverlay((prev) => 
                  prev ? {
                    ...prev,
                    x: origX + (moveEv.clientX - startX),
                    y: origY + (moveEv.clientY - startY),
                  } : null
                );
              };

              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };

              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
          >
            {pendingOverlay.type === 'image' && (
              <img 
                src={pendingOverlay.content} 
                alt="Overlay" 
                className="w-full h-full object-contain pointer-events-none select-none rounded"
              />
            )}
            {pendingOverlay.type === 'sticker' && (
              <span className="text-5xl pointer-events-none select-none">
                {pendingOverlay.content}
              </span>
            )}
            {pendingOverlay.type === 'text' && (
              <span 
                className="font-bold text-center pointer-events-none select-none"
                style={{ color: color, fontSize: `${pendingOverlay.size * 0.7}px` }}
              >
                {pendingOverlay.content}
              </span>
            )}

            <div 
              className="absolute -bottom-12 flex items-center gap-1.5 bg-slate-900/95 px-2.5 py-1 rounded-full border border-slate-700 shadow-xl pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPendingOverlay(p => p ? { ...p, size: Math.max(30, p.size - 20) } : null)}
                className="p-1 text-slate-300 hover:text-white"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPendingOverlay(p => p ? { ...p, size: Math.min(450, p.size + 20) } : null)}
                className="p-1 text-slate-300 hover:text-white"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPendingOverlay(p => p ? { ...p, rotation: (p.rotation + 45) % 360 } : null)}
                className="p-1 text-indigo-400 hover:text-indigo-300"
                title="Xoay"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-3 bg-slate-700" />
              <button
                onClick={stampOverlay}
                className="p-1 text-emerald-400 hover:text-emerald-300"
                title="Dán lên tranh (Stamp)"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPendingOverlay(null)}
                className="p-1 text-rose-400 hover:text-rose-300"
                title="Hủy bỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticker Picker Modal */}
      {showStickerPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Chọn Sticker dán
              </h3>
              <button 
                onClick={() => setShowStickerPicker(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {STICKERS.map((stk) => (
                <button
                  key={stk}
                  onClick={() => handleSelectSticker(stk)}
                  className="text-3xl p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-transform active:scale-90 flex items-center justify-center"
                >
                  {stk}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Type className="w-4 h-4 text-purple-400" /> Nhập chữ viết
              </h3>
              <button 
                onClick={() => setShowTextInput(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmText()}
              placeholder="VD: Nhớ cậu nhiều! ❤️"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-purple-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTextInput(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmText}
                disabled={!customText.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium shadow-md shadow-purple-500/25"
              >
                Đặt lên tranh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
