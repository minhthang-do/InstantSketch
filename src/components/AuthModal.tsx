import React, { useState } from 'react';
import type { UserProfile } from '../types/sketch';
import { 
  sendEmailOtp, verifyEmailOtp, signInWithGoogle, 
  signOut, isUsernameAvailable, saveCurrentUser 
} from '../services/authService';
import { X, Mail, ShieldCheck, LogOut, Check, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
}

const AVATAR_OPTIONS = ['🎨', '🦊', '🐱', '🐼', '🐰', '🐶', '🦄', '🐻', '🐯', '🐧'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  // Email OTP state
  const [email, setEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otpToken, setOtpToken] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [selectedAvatar] = useState('🎨');
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Edit profile state
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '🎨');

  if (!isOpen) return null;

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const result = await sendEmailOtp(email);
    setIsLoading(false);

    if (result.success) {
      setOtpStep('verify');
      if (result.mockOtp) {
        setDemoOtpCode(result.mockOtp);
      }
      setStatusMessage({ text: result.message, isError: false });
    } else {
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const result = await verifyEmailOtp(email, otpToken, {
      name: newName.trim() || undefined,
      username: newUsername.trim() || undefined,
      avatar: selectedAvatar,
    });
    setIsLoading(false);

    if (result.success && result.user) {
      onUserChange(result.user);
      setStatusMessage({ text: 'Đăng nhập thành công!', isError: false });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setStatusMessage({ text: result.message, isError: true });
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    setIsLoading(false);

    if (result.success && result.user) {
      onUserChange(result.user);
      onClose();
    }
  };

  // Handle Save Profile
  const handleSaveProfile = () => {
    if (!currentUser) return;

    const trimmedUser = editUsername.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    if (!trimmedUser) {
      setStatusMessage({ text: 'Username không được để trống!', isError: true });
      return;
    }

    if (trimmedUser !== currentUser.username && !isUsernameAvailable(trimmedUser, currentUser.id)) {
      setStatusMessage({ text: `Username @${trimmedUser} đã có người sử dụng! Vui lòng chọn tên khác.`, isError: true });
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      username: trimmedUser,
      avatar: editAvatar,
    };

    saveCurrentUser(updated);
    onUserChange(updated);
    setStatusMessage({ text: 'Đã lưu thông tin hồ sơ!', isError: false });
  };

  // Handle Sign Out
  const handleSignOut = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      signOut();
      onUserChange(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {currentUser ? 'Hồ Sơ & Tài Khoản' : 'Đăng Nhập InstantSketch'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser ? `@${currentUser.username}` : 'Đăng nhập qua Email OTP hoặc Google'}
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

        {/* Message Banner */}
        {statusMessage && (
          <div className={`px-5 py-2.5 text-xs font-medium ${statusMessage.isError ? 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="p-5">
          {currentUser ? (
            /* Logged in: Profile Settings */
            <div className="space-y-4">
              {/* Avatar Selection */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1.5 block uppercase tracking-wider">
                  Chọn Avatar đại diện:
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      className={`text-2xl p-2 rounded-2xl border transition-all ${
                        editAvatar === av 
                          ? 'border-indigo-500 bg-indigo-600/30 scale-110 shadow-lg shadow-indigo-500/20' 
                          : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block uppercase tracking-wider">
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="VD: Minh Thắng"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wider">
                  <span>Username</span>
                  <span className="text-[10px] text-slate-500 lowercase">(để người khác tìm kiếm bạn)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="VD: thang_sketch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Email info */}
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-medium">{currentUser.email}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Hồ Sơ</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition-all border border-rose-500/30 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in: Sign in with Email OTP or Google */
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Đăng nhập nhanh bằng Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-[1px] bg-slate-800" />
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Hoặc qua Email OTP</span>
                <div className="flex-1 h-[1px] bg-slate-800" />
              </div>

              {otpStep === 'send' ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium mb-1 block">
                      Nhập địa chỉ Email:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.includes('@')}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isLoading ? 'Đang gửi...' : 'Gửi mã OTP xác thực'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  {/* Demo OTP Helper pill */}
                  {demoOtpCode && (
                    <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-400">Mã OTP thử nghiệm: </span>
                        <strong className="text-indigo-300 font-mono tracking-widest text-sm">{demoOtpCode}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpToken(demoOtpCode)}
                        className="text-[11px] bg-indigo-600 px-2 py-0.5 rounded-md text-white font-semibold"
                      >
                        Tự điền
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-300 font-medium mb-1 block">
                      Nhập mã OTP gồm 6 chữ số:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="VD: 123456"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Tên bạn:</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Minh Thắng"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">Username (@):</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="thang_art"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpToken.length < 4}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Đang xác thực...' : 'Xác thực & Bắt đầu vẽ!'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep('send')}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-300 py-1"
                  >
                    Quay lại đổi email
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
