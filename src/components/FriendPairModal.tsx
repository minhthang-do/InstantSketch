import React, { useState } from 'react';
import type { UserProfile } from '../types/sketch';
import { X, Copy, Check, HeartHandshake } from 'lucide-react';

interface FriendPairModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

const AVATAR_OPTIONS = ['🎨', '🦊', '🐱', '🐼', '🐰', '🐶', '🦄', '🐻', '🐯', '🐧'];

export const FriendPairModal: React.FC<FriendPairModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [myName, setMyName] = useState(profile.name);
  const [myAvatar, setMyAvatar] = useState(profile.avatar);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePairFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;

    const code = partnerCodeInput.trim().toUpperCase();
    const updated: UserProfile = {
      ...profile,
      partnerId: `partner_${code}`,
      partnerName: `Bạn bè (${code})`,
      partnerAvatar: '🦊',
    };
    onSaveProfile(updated);
    setPartnerCodeInput('');
  };

  const handleUnpair = () => {
    if (window.confirm('Bạn có muốn hủy ghép đôi với bạn bè hiện tại không?')) {
      const updated: UserProfile = {
        ...profile,
        partnerId: null,
        partnerName: null,
        partnerAvatar: null,
      };
      onSaveProfile(updated);
    }
  };

  const handleSaveMyProfile = () => {
    const updated: UserProfile = {
      ...profile,
      name: myName.trim() || 'Tôi',
      avatar: myAvatar,
    };
    onSaveProfile(updated);
    setIsEditingProfile(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Ghép Đôi Bạn Bè</h2>
              <p className="text-xs text-slate-400">Kết nối để cập nhật hình vẽ lên Widget của nhau</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* My Profile Section */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hồ sơ của bạn</span>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isEditingProfile ? 'Hủy sửa' : 'Chỉnh sửa'}
              </button>
            </div>

            {isEditingProfile ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">Chọn avatar emoji:</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setMyAvatar(av)}
                        className={`text-xl p-1.5 rounded-xl border transition-all ${
                          myAvatar === av ? 'border-pink-500 bg-pink-500/20 scale-110' : 'border-slate-700 bg-slate-900/60'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">Tên hiển thị:</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSaveMyProfile}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Lưu thay đổi
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow">
                  {profile.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-100">{profile.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Mã của bạn:</span>
                    <strong className="text-indigo-300 font-mono tracking-wider">{profile.pairCode}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Pair Code Card */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-4">
            <span className="text-xs font-semibold text-indigo-300 block mb-1">Mã kết nối của bạn</span>
            <p className="text-xs text-slate-400 mb-3">Gửi mã này cho bạn bè để người đó nhập vào điện thoại của họ:</p>
            <div className="flex items-center justify-between bg-slate-900/90 rounded-xl px-4 py-2.5 border border-indigo-500/40">
              <span className="text-lg font-black font-mono tracking-widest text-white">{profile.pairCode}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Current Partner Status or Connect Form */}
          {profile.partnerName ? (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                  {profile.partnerAvatar || '🦊'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-100 text-sm">{profile.partnerName}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Đang kết nối Widget</span>
                </div>
              </div>
              <button
                onClick={handleUnpair}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Hủy kết nối
              </button>
            </div>
          ) : (
            <form onSubmit={handlePairFriend} className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Nhập mã kết nối của bạn bè:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={partnerCodeInput}
                  onChange={(e) => setPartnerCodeInput(e.target.value)}
                  placeholder="VD: SK-1234"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 uppercase tracking-wider font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!partnerCodeInput.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Kết nối
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
