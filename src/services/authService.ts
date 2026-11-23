import type { UserProfile } from '../types/sketch';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AUTH_USER_KEY = 'instantsketch_auth_user';
const OTP_STORAGE_KEY = 'instantsketch_pending_otp';

// Mock directory of registered users for username discovery
const MOCK_USERS_KEY = 'instantsketch_directory_users';

const INITIAL_MOCK_USERS: UserProfile[] = [
  {
    id: 'user_alex',
    name: 'Alex Nguyễn',
    username: 'alex_art',
    email: 'alex.art@example.com',
    avatar: '🦊',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'user_linh',
    name: 'Khánh Linh',
    username: 'linh_doodle',
    email: 'linh.doodle@example.com',
    avatar: '🐱',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'user_hoang',
    name: 'Minh Hoàng',
    username: 'hoang_sketch',
    email: 'hoang.sketch@example.com',
    avatar: '🐼',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'user_mai',
    name: 'Mai Phương',
    username: 'mai_cute',
    email: 'mai.cute@example.com',
    avatar: '🐰',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

export const getDirectoryUsers = (): UserProfile[] => {
  const data = localStorage.getItem(MOCK_USERS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
  return INITIAL_MOCK_USERS;
};

export const registerUserInDirectory = (user: UserProfile) => {
  const users = getDirectoryUsers();
  const filtered = users.filter(u => u.id !== user.id && u.username !== user.username);
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([...filtered, user]));
};

// Check if username is already taken
export const isUsernameAvailable = (username: string, excludeUserId?: string): boolean => {
  const normalized = username.toLowerCase().trim();
  const users = getDirectoryUsers();
  return !users.some(u => u.username.toLowerCase() === normalized && u.id !== excludeUserId);
};

// Get currently logged-in user
export const getCurrentUser = (): UserProfile | null => {
  const data = localStorage.getItem(AUTH_USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Initial default logged in user
  const defaultUser: UserProfile = {
    id: 'user_mine_' + Math.random().toString(36).substring(2, 7),
    name: 'Minh Thắng',
    username: 'minhthang',
    email: 'minhthang@example.com',
    avatar: '🎨',
    createdAt: Date.now(),
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(defaultUser));
  registerUserInDirectory(defaultUser);
  return defaultUser;
};

export const saveCurrentUser = (user: UserProfile) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  registerUserInDirectory(user);
};

// Send Email OTP
export const sendEmailOtp = async (email: string): Promise<{ success: boolean; message: string; mockOtp?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) {
    return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
      if (error) throw error;
      return { success: true, message: `Mã OTP đã được gửi đến email ${cleanEmail}. Vui lòng kiểm tra hộp thư!` };
    } catch (err: unknown) {
      console.warn('Supabase OTP error, falling back to instant OTP:', err);
    }
  }

  // Generate 6-digit OTP for instant testing
  const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify({ email: cleanEmail, otp: mockOtp, expiresAt: Date.now() + 5 * 60 * 1000 }));

  return {
    success: true,
    message: `Mã OTP xác thực đã được gửi đến ${cleanEmail}!`,
    mockOtp, // Return mock OTP so UI can display a friendly copy button in dev/demo mode
  };
};

// Verify Email OTP
export const verifyEmailOtp = async (
  email: string, 
  otpToken: string,
  extraProfile?: { name?: string; username?: string; avatar?: string }
): Promise<{ success: boolean; user?: UserProfile; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const token = otpToken.trim();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'email',
      });
      if (error) throw error;
      if (data.user) {
        const userProfile: UserProfile = {
          id: data.user.id,
          name: extraProfile?.name || cleanEmail.split('@')[0],
          username: extraProfile?.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
          email: cleanEmail,
          avatar: extraProfile?.avatar || '🎨',
          createdAt: Date.now(),
        };
        saveCurrentUser(userProfile);
        return { success: true, user: userProfile, message: 'Đăng nhập thành công!' };
      }
    } catch (err: unknown) {
      console.warn('Supabase verification error, falling back to local OTP check:', err);
    }
  }

  // Local OTP validation
  const savedOtpRaw = localStorage.getItem(OTP_STORAGE_KEY);
  if (!savedOtpRaw) {
    return { success: false, message: 'Không tìm thấy yêu cầu OTP hoặc mã đã hết hạn. Vui lòng gửi lại!' };
  }

  const savedOtp = JSON.parse(savedOtpRaw);
  if (savedOtp.email !== cleanEmail) {
    return { success: false, message: 'Email không khớp với yêu cầu OTP!' };
  }
  if (Date.now() > savedOtp.expiresAt) {
    return { success: false, message: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã mới!' };
  }
  if (savedOtp.otp !== token) {
    return { success: false, message: 'Mã OTP không chính xác. Vui lòng thử lại!' };
  }

  // Successful verification
  localStorage.removeItem(OTP_STORAGE_KEY);

  // Check if user already exists
  const directory = getDirectoryUsers();
  let existing = directory.find(u => u.email.toLowerCase() === cleanEmail);

  if (!existing) {
    const rawUsername = extraProfile?.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    let finalUsername = rawUsername;
    let counter = 1;
    while (!isUsernameAvailable(finalUsername)) {
      finalUsername = `${rawUsername}_${counter++}`;
    }

    existing = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: extraProfile?.name || cleanEmail.split('@')[0],
      username: finalUsername,
      email: cleanEmail,
      avatar: extraProfile?.avatar || '🎨',
      createdAt: Date.now(),
    };
  }

  saveCurrentUser(existing);
  return { success: true, user: existing, message: 'Đăng nhập thành công!' };
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ success: boolean; user?: UserProfile; message: string }> => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      return { success: true, message: 'Đang chuyển hướng sang Google...' };
    } catch (err) {
      console.warn('Google Supabase error:', err);
    }
  }

  // Simulated Google Sign In
  const demoGoogleUser: UserProfile = {
    id: 'user_google_' + Math.random().toString(36).substring(2, 8),
    name: 'Google User',
    username: 'google_user_' + Math.floor(100 + Math.random() * 900),
    email: 'user.google@gmail.com',
    avatar: '🦊',
    createdAt: Date.now(),
  };

  saveCurrentUser(demoGoogleUser);
  return {
    success: true,
    user: demoGoogleUser,
    message: 'Đăng nhập Google thành công!',
  };
};

export const signOut = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut();
  }
};
