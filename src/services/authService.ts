import type { UserProfile } from '../types/sketch';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const AUTH_USER_KEY = 'instantsketch_auth_user';
const DIRECTORY_USERS_KEY = 'instantsketch_directory_users';

export const getDirectoryUsers = (): UserProfile[] => {
  const data = localStorage.getItem(DIRECTORY_USERS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return [];
};

export const registerUserInDirectory = (user: UserProfile) => {
  const users = getDirectoryUsers();
  const filtered = users.filter(u => u.id !== user.id && u.username !== user.username);
  localStorage.setItem(DIRECTORY_USERS_KEY, JSON.stringify([...filtered, user]));
};

export const isUsernameAvailable = (username: string, excludeUserId?: string): boolean => {
  const normalized = username.toLowerCase().trim();
  const users = getDirectoryUsers();
  return !users.some(u => u.username.toLowerCase() === normalized && u.id !== excludeUserId);
};

export const getCurrentUser = (): UserProfile | null => {
  const data = localStorage.getItem(AUTH_USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return null;
};

export const saveCurrentUser = (user: UserProfile) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  registerUserInDirectory(user);
};

// Initialize auth state listener for Google OAuth redirects and persisted sessions
export const initAuthListener = (onUserLoaded: (user: UserProfile) => void): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  // Check current session
  client.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      handleSupabaseUser(session.user, onUserLoaded);
    }
  });

  // Listen to auth state changes (e.g. Google OAuth redirect callback)
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      handleSupabaseUser(session.user, onUserLoaded);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

const handleSupabaseUser = (
  authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  onUserLoaded: (user: UserProfile) => void
) => {
  const email = authUser.email || '';
  const meta = authUser.user_metadata || {};
  const current = getCurrentUser();

  const name = (meta.full_name as string) || (meta.name as string) || current?.name || email.split('@')[0] || 'User';
  const username = current?.username || (email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : `user_${authUser.id.slice(0, 5)}`);
  const avatar = current?.avatar || '🎨';

  const userProfile: UserProfile = {
    id: authUser.id,
    name,
    username,
    email,
    avatar,
    createdAt: current?.createdAt || Date.now(),
  };

  saveCurrentUser(userProfile);
  onUserLoaded(userProfile);
};

// Real Email OTP Sender
export const sendEmailOtp = async (
  email: string
): Promise<{ success: boolean; message: string; needConfig?: boolean }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) {
    return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' };
  }

  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      needConfig: true,
      message: 'Chưa cấu hình Supabase URL & Key. Vui lòng nhập Supabase Project để gửi mã OTP thật về hộp thư Gmail của bạn!',
    };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, message: `Lỗi từ Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: `Đã gửi mã OTP thật về email ${cleanEmail}. Vui lòng mở hộp thư (kiểm tra cả mục Hộp thư đến và Spam/Rác) để lấy mã 6 chữ số!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Không thể gửi email OTP: ${msg}` };
  }
};

// Real Email OTP Verifier
export const verifyEmailOtp = async (
  email: string,
  otpToken: string,
  extraProfile?: { name?: string; username?: string; avatar?: string }
): Promise<{ success: boolean; user?: UserProfile; message: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const token = otpToken.trim();

  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase! Vui lòng cài đặt Supabase để xác thực mã OTP thật.',
    };
  }

  try {
    const { data, error } = await client.auth.verifyOtp({
      email: cleanEmail,
      token,
      type: 'email',
    });

    if (error) {
      return { success: false, message: `Mã OTP không hợp lệ hoặc đã hết hạn: ${error.message}` };
    }

    if (data.user) {
      const rawUser = extraProfile?.username || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      const userProfile: UserProfile = {
        id: data.user.id,
        name: extraProfile?.name || cleanEmail.split('@')[0],
        username: rawUser,
        email: cleanEmail,
        avatar: extraProfile?.avatar || '🎨',
        createdAt: Date.now(),
      };
      saveCurrentUser(userProfile);
      return { success: true, user: userProfile, message: 'Đăng nhập thành công!' };
    }

    return { success: false, message: 'Không tìm thấy thông tin người dùng từ mã OTP.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Lỗi xác thực OTP: ${msg}` };
  }
};

// Real Google OAuth Sign In
export const signInWithGoogle = async (): Promise<{ success: boolean; message: string; needConfig?: boolean }> => {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      success: false,
      needConfig: true,
      message: 'Chưa cấu hình Supabase! Vui lòng điền Supabase URL & Key để liên kết Google OAuth thật.',
    };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, message: `Lỗi đăng nhập Google: ${error.message}` };
    }

    return { success: true, message: 'Đang chuyển hướng sang Google để đăng nhập tài khoản thật...' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Lỗi kết nối Google: ${msg}` };
  }
};

export const signOut = async () => {
  localStorage.removeItem(AUTH_USER_KEY);
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
};
