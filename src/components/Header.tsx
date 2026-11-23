import React from 'react';
import type { UserProfile } from '../types/sketch';
import { Send, Smartphone, History, Users, Sparkles } from 'lucide-react';

interface HeaderProps {
  profile: UserProfile;
  onOpenPairModal: () => void;
  onOpenWidgetModal: () => void;
  onOpenHistoryModal: () => void;
  onSendSketch: () => void;
  isSending: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenPairModal,
  onOpenWidgetModal,
  onOpenHistoryModal,
  onSendSketch,
  isSending,
}) => {
  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between select-none z-30">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
            InstantSketch
            <span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Vẽ lên Widget bạn bè</p>
        </div>
      </div>

      {/* Middle: Partner status pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPairModal}
          className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 px-3 py-1.5 rounded-full transition-all active:scale-95 text-xs text-slate-200"
          title="Ghép đôi với bạn bè"
        >
          {profile.partnerName ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm">{profile.partnerAvatar || '🦊'}</span>
              <span className="font-semibold max-w-[90px] sm:max-w-[130px] truncate">{profile.partnerName}</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-indigo-300">Ghép đôi bạn bè</span>
            </>
          )}
        </button>

        {/* History / Timeline button */}
        <button
          onClick={onOpenHistoryModal}
          className="p-2 rounded-full bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95"
          title="Lịch sử các bức vẽ"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Widget Simulator button */}
        <button
          onClick={onOpenWidgetModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition-all active:scale-95 text-xs font-semibold"
          title="Xem thử Widget trên màn hình điện thoại"
        >
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Widget Điện thoại</span>
        </button>

        {/* Send to Partner Widget Button */}
        <button
          onClick={onSendSketch}
          disabled={isSending}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Gửi Ngay!</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </header>
  );
};
