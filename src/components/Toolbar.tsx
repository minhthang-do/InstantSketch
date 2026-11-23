import React, { useState } from 'react';
import type { ToolType, BackgroundStyle } from '../types/sketch';
import { 
  Pencil, Paintbrush, Highlighter, Eraser, 
  Shapes, Sliders, Layers, Minus, Square, 
  Circle as CircleIcon, Heart
} from 'lucide-react';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  bgStyle: BackgroundStyle;
  setBgStyle: (style: BackgroundStyle) => void;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', 
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#f43f5e', '#84cc16'
];

const BACKGROUND_OPTIONS: { id: BackgroundStyle; label: string; preview: string }[] = [
  { id: 'white', label: 'Trắng', preview: 'bg-white border-slate-300' },
  { id: 'dark', label: 'Tối', preview: 'bg-slate-900 border-slate-700' },
  { id: 'grid', label: 'Ô ly', preview: 'bg-white border-slate-300 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:10px_10px]' },
  { id: 'dots', label: 'Chấm chấm', preview: 'bg-white border-slate-300' },
  { id: 'vintage', label: 'Cổ điển', preview: 'bg-amber-100 border-amber-300' },
  { id: 'pastel-pink', label: 'Hồng phấn', preview: 'bg-pink-100 border-pink-300' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  bgStyle,
  setBgStyle,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushSize, setShowBrushSize] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const isShapeActive = ['line', 'rectangle', 'circle', 'heart'].includes(tool);

  return (
    <div className="relative w-full px-3 pb-3 pt-1 select-none pointer-events-auto">
      {/* Floating Panel: Color Palette */}
      {showColorPicker && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl max-w-xs w-[92vw] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Màu sắc vẽ</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tự chọn:</span>
              <label 
                className="w-7 h-7 rounded-full border-2 border-white/40 cursor-pointer shadow-inner flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 w-0 h-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setShowColorPicker(false);
                }}
                className={`w-9 h-9 rounded-full transition-transform active:scale-90 border-2 ${
                  color === c ? 'border-indigo-400 scale-110 shadow-lg' : 'border-slate-700 hover:border-slate-500'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Panel: Brush Size */}
      {showBrushSize && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl max-w-xs w-[88vw] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cỡ nét vẽ: {brushSize}px</span>
            <div 
              className="rounded-full bg-slate-100 transition-all shadow"
              style={{ width: `${Math.max(4, brushSize)}px`, height: `${Math.max(4, brushSize)}px`, backgroundColor: color }}
            />
          </div>
          <input
            type="range"
            min="2"
            max="48"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>Mảnh (2px)</span>
            <span>Vừa (16px)</span>
            <span>Đậm (48px)</span>
          </div>
        </div>
      )}

      {/* Floating Panel: Shapes */}
      {showShapePicker && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => { setTool('line'); setShowShapePicker(false); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
              tool === 'line' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Minus className="w-5 h-5 -rotate-45" />
            <span className="text-[10px]">Đường</span>
          </button>
          <button
            onClick={() => { setTool('rectangle'); setShowShapePicker(false); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
              tool === 'rectangle' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Square className="w-5 h-5" />
            <span className="text-[10px]">Hình vuông</span>
          </button>
          <button
            onClick={() => { setTool('circle'); setShowShapePicker(false); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
              tool === 'circle' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <CircleIcon className="w-5 h-5" />
            <span className="text-[10px]">Hình tròn</span>
          </button>
          <button
            onClick={() => { setTool('heart'); setShowShapePicker(false); }}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
              tool === 'heart' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-[10px]">Trái tim</span>
          </button>
        </div>
      )}

      {/* Floating Panel: Background Styles */}
      {showBgPicker && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl max-w-sm w-[92vw] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Kiểu giấy / Nền vẽ
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  setBgStyle(bg.id);
                  setShowBgPicker(false);
                }}
                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                  bgStyle === bg.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
                }`}
              >
                <div className={`w-10 h-7 rounded-md border mb-1.5 ${bg.preview}`} />
                <span className="text-xs text-slate-200">{bg.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Bottom Toolbar Dock */}
      <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-2xl p-1.5 shadow-2xl flex items-center justify-between gap-1">
        {/* Pen */}
        <button
          onClick={() => { setTool('pen'); setShowShapePicker(false); }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            tool === 'pen' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Bút vẽ nét cơ bản"
        >
          <Pencil className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Bút</span>
        </button>

        {/* Brush */}
        <button
          onClick={() => { setTool('brush'); setShowShapePicker(false); }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            tool === 'brush' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Cọ vẽ mềm mại"
        >
          <Paintbrush className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Cọ vẽ</span>
        </button>

        {/* Highlighter */}
        <button
          onClick={() => { setTool('highlighter'); setShowShapePicker(false); }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            tool === 'highlighter' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Bút dạ quang (Highlighter)"
        >
          <Highlighter className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Dạ quang</span>
        </button>

        {/* Eraser */}
        <button
          onClick={() => { setTool('eraser'); setShowShapePicker(false); }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            tool === 'eraser' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Cục tẩy"
        >
          <Eraser className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Tẩy</span>
        </button>

        {/* Shapes button */}
        <button
          onClick={() => {
            setShowShapePicker(!showShapePicker);
            setShowColorPicker(false);
            setShowBrushSize(false);
            setShowBgPicker(false);
          }}
          className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
            isShapeActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Hình khối & biểu tượng"
        >
          <Shapes className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Hình</span>
        </button>

        <div className="w-[1px] h-7 bg-slate-700/60 my-auto" />

        {/* Color Button with current color dot */}
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowBrushSize(false);
            setShowShapePicker(false);
            setShowBgPicker(false);
          }}
          className="flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 relative transition-all"
          title="Chọn bảng màu"
        >
          <div 
            className="w-5 h-5 rounded-full border-2 border-white/60 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] mt-0.5 font-medium">Màu</span>
        </button>

        {/* Brush Size Button */}
        <button
          onClick={() => {
            setShowBrushSize(!showBrushSize);
            setShowColorPicker(false);
            setShowShapePicker(false);
            setShowBgPicker(false);
          }}
          className="flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-all"
          title="Điều chỉnh cỡ nét vẽ"
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">{brushSize}px</span>
        </button>

        {/* Background Paper Style */}
        <button
          onClick={() => {
            setShowBgPicker(!showBgPicker);
            setShowColorPicker(false);
            setShowBrushSize(false);
            setShowShapePicker(false);
          }}
          className="flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 transition-all"
          title="Đổi kiểu giấy / nền"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Nền</span>
        </button>
      </div>
    </div>
  );
};
