import React, { useState } from 'react';
import type { SketchItem, UserProfile } from '../types/sketch';
import { X, Smartphone, Sparkles, RefreshCw, CheckCircle2, Heart } from 'lucide-react';

interface WidgetSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestSketch: SketchItem | null;
  profile: UserProfile;
  onSimulateFriendSketch: () => void;
}

export const WidgetSimulatorModal: React.FC<WidgetSimulatorModalProps> = ({
  isOpen,
  onClose,
  latestSketch,
  profile,
  onSimulateFriendSketch,
}) => {
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium'>('medium');
  const [phoneOs, setPhoneOs] = useState<'android' | 'ios'>('android');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleSimulate = () => {
    setIsSimulating(true);
    onSimulateFriendSketch();
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };

  const formattedTime = latestSketch 
    ? new Date(latestSketch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Vừa xong';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-none">Mô Phỏng Widget Màn Hình Điện Thoại</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kết nối cùng {profile.partnerName || 'Bạn bè'} &bull; Xem trước giao diện Widget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* OS Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setPhoneOs('android')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                phoneOs === 'android' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setPhoneOs('ios')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                phoneOs === 'ios' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              iOS / iPhone
            </button>
          </div>

          {/* Size Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setWidgetSize('small')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                widgetSize === 'small' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Widget Vuông (2x2)
            </button>
            <button
              onClick={() => setWidgetSize('medium')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                widgetSize === 'medium' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Widget Ngang (4x2)
            </button>
          </div>

          {/* Test Live Update button */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-600/80 hover:bg-pink-600 text-white font-medium active:scale-95 transition-all text-xs shadow-sm shadow-pink-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Thử nhận vẽ mới từ bạn</span>
          </button>
        </div>

        {/* Phone Mockup Screen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="w-[300px] sm:w-[320px] rounded-[42px] p-3 bg-slate-800 shadow-2xl border-4 border-slate-700 relative overflow-hidden">
            {/* Camera punch hole / Dynamic Island */}
            {phoneOs === 'ios' ? (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              </div>
            ) : (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-20 border border-slate-800" />
            )}

            {/* Phone Screen Wallpaper Container */}
            <div className="w-full h-[520px] rounded-[34px] bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 relative p-4 flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Wallpaper Ambient Glow */}
              <div className="absolute top-10 left-10 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Status bar */}
              <div className="flex justify-between items-center text-[10px] text-white/80 font-semibold px-2 pt-1 z-10">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-white/80 rounded-sm p-[1px] flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Home Screen Content */}
              <div className="my-auto py-2 flex flex-col items-center">
                {/* Clock / Date widget glance */}
                <div className="text-center mb-3">
                  <div className="text-3xl font-extralight text-white tracking-tight">09:41</div>
                  <div className="text-[11px] text-white/70 font-medium">Thứ Hai, 23 Tháng 11</div>
                </div>

                {/* THE INSTANTSKETCH WIDGET */}
                <div 
                  className={`relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-md transition-all duration-300 group ${
                    widgetSize === 'small' ? 'w-36 h-36' : 'w-full h-44'
                  }`}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {latestSketch ? (
                    <div className="w-full h-full relative flex flex-col">
                      <img 
                        src={latestSketch.imageDataUrl} 
                        alt="Friend sketch" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />

                      {/* Widget Header Badge */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-white text-[10px]">
                          <span>{latestSketch.senderAvatar || '🦊'}</span>
                          <span className="font-semibold truncate max-w-[80px]">{latestSketch.senderName}</span>
                        </div>
                        <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[9px] text-white/80 font-medium">
                          {formattedTime}
                        </div>
                      </div>

                      {/* Love reaction icon bottom right */}
                      <div className="absolute bottom-2 right-2 bg-pink-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <Heart className="w-2.5 h-2.5 fill-current" />
                        <span>Live</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-900 text-slate-300">
                      <Sparkles className="w-6 h-6 text-indigo-400 mb-1" />
                      <p className="text-xs font-semibold">Chưa có hình vẽ</p>
                      <p className="text-[10px] text-slate-400">Hãy vẽ và gửi ngay cho bạn bè!</p>
                    </div>
                  )}
                </div>

                {/* App Icons Row */}
                <div className="grid grid-cols-4 gap-3 mt-4 w-full px-2">
                  {[
                    { name: 'InstantSketch', icon: '🎨', color: 'from-pink-500 to-indigo-500' },
                    { name: 'Ảnh', icon: '🖼️', color: 'from-amber-400 to-rose-400' },
                    { name: 'Nhạc', icon: '🎵', color: 'from-emerald-400 to-teal-500' },
                    { name: 'Cài đặt', icon: '⚙️', color: 'from-slate-500 to-slate-700' },
                  ].map((app, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${app.color} flex items-center justify-center text-lg shadow-md`}>
                        {app.icon}
                      </div>
                      <span className="text-[9px] text-white/90 font-medium truncate max-w-[50px]">{app.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Dock */}
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-2.5 flex justify-around items-center z-10 border border-white/20 shadow-lg">
                {['📞', '💬', '🧭', '📷'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-lg shadow">
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Instructions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Khi cài app lên điện thoại:</strong> Nhấn giữ khoảng trống màn hình &gt; chọn <strong>Widgets</strong> &gt; tìm <strong>InstantSketch</strong> để ghim widget ra màn hình!
          </span>
        </div>
      </div>
    </div>
  );
};
