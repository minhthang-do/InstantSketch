import React from 'react';
import type { SketchItem } from '../types/sketch';
import { X, Download, Clock, Sparkles } from 'lucide-react';

interface HistoryFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: SketchItem[];
  onAddReaction: (sketchId: string, emoji: string) => void;
}

const EMOJI_REACTIONS = ['❤️', '🔥', '🥰', '😂', '✨'];

export const HistoryFeedModal: React.FC<HistoryFeedModalProps> = ({
  isOpen,
  onClose,
  timeline,
  onAddReaction,
}) => {
  if (!isOpen) return null;

  const handleDownload = (dataUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `InstantSketch_${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Kỷ Niệm Các Bức Vẽ</h2>
              <p className="text-xs text-slate-400">Tất cả hình vẽ đã trao đổi giữa bạn và bạn bè</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Sketches */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {timeline.length === 0 ? (
            <div className="py-14 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-semibold text-sm">Chưa có bức vẽ nào</p>
              <p className="text-xs text-slate-500 mt-1">Hãy vẽ một bức tranh thật đẹp rồi bấm "Gửi Ngay" nhé!</p>
            </div>
          ) : (
            timeline.map((item) => {
              const timeString = new Date(item.timestamp).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              });

              return (
                <div 
                  key={item.id} 
                  className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3 shadow-lg flex flex-col gap-2.5"
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm shadow">
                        {item.senderAvatar || '🦊'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{item.senderName}</div>
                        <div className="text-[10px] text-slate-400">{timeString}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(item.imageDataUrl, item.id)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Tải ảnh về máy"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sketch Image */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                    <img 
                      src={item.imageDataUrl} 
                      alt="Drawing" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Reaction Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {EMOJI_REACTIONS.map((emoji) => {
                      const count = item.reactions?.[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => onAddReaction(item.id, emoji)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-90 ${
                            count > 0 
                              ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' 
                              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-[11px] font-bold">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
