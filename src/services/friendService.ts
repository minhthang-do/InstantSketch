import type { FriendUser, FriendRequest, UserProfile } from '../types/sketch';
import { getDirectoryUsers } from './authService';

const REQUESTS_KEY = 'instantsketch_friend_requests';
const FRIENDS_KEY = 'instantsketch_friends_list';
const ACTIVE_FRIEND_KEY = 'instantsketch_active_friend_id';

// BroadcastChannel for instant cross-tab friend sync
let friendSyncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    friendSyncChannel = new BroadcastChannel('instantsketch_friend_sync');
  }
} catch {
  // ignore
}

export const broadcastFriendChange = (payload: unknown) => {
  if (friendSyncChannel) {
    friendSyncChannel.postMessage(payload);
  }
};

export const subscribeToFriendSync = (callback: (data: unknown) => void) => {
  if (!friendSyncChannel) return () => {};
  const handler = (e: MessageEvent) => callback(e.data);
  friendSyncChannel.addEventListener('message', handler);
  return () => friendSyncChannel?.removeEventListener('message', handler);
};

// All friend requests
export const getAllRequests = (): FriendRequest[] => {
  const data = localStorage.getItem(REQUESTS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return [];
};

export const saveAllRequests = (requests: FriendRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  broadcastFriendChange({ type: 'REQUESTS_UPDATED' });
};

// Get friends for specific user
export const getFriends = (userId: string): FriendUser[] => {
  const key = `${FRIENDS_KEY}_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Pre-seed 1 friend so user has immediate companionship
  const seededFriend: FriendUser = {
    id: 'user_alex',
    name: 'Alex Nguyễn',
    username: 'alex_art',
    avatar: '🦊',
    status: 'online',
    connectedAt: Date.now() - 1000 * 60 * 60 * 24,
  };
  localStorage.setItem(key, JSON.stringify([seededFriend]));
  return [seededFriend];
};

export const saveFriends = (userId: string, friends: FriendUser[]) => {
  const key = `${FRIENDS_KEY}_${userId}`;
  localStorage.setItem(key, JSON.stringify(friends));
  broadcastFriendChange({ type: 'FRIENDS_UPDATED' });
};

// Search users by @username or name
export interface SearchUserResult extends UserProfile {
  relationship: 'self' | 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none';
  requestId?: string;
}

export const searchUsers = (
  query: string, 
  currentUser: UserProfile
): SearchUserResult[] => {
  const clean = query.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  const directory = getDirectoryUsers();
  const friends = getFriends(currentUser.id);
  const requests = getAllRequests();

  return directory
    .filter(u => {
      const matchUsername = u.username.toLowerCase().includes(clean);
      const matchName = u.name.toLowerCase().includes(clean);
      return matchUsername || matchName;
    })
    .map(u => {
      if (u.id === currentUser.id) {
        return { ...u, relationship: 'self' };
      }

      // Check if already friends
      if (friends.some(f => f.id === u.id)) {
        return { ...u, relationship: 'friend' };
      }

      // Check incoming request
      const incoming = requests.find(
        r => r.fromUserId === u.id && r.toUserId === currentUser.id && r.status === 'pending'
      );
      if (incoming) {
        return { ...u, relationship: 'pending_incoming', requestId: incoming.id };
      }

      // Check outgoing request
      const outgoing = requests.find(
        r => r.fromUserId === currentUser.id && r.toUserId === u.id && r.status === 'pending'
      );
      if (outgoing) {
        return { ...u, relationship: 'pending_outgoing', requestId: outgoing.id };
      }

      return { ...u, relationship: 'none' };
    });
};

// Send a friend request
export const sendFriendRequest = (
  currentUser: UserProfile, 
  targetUser: UserProfile
): { success: boolean; message: string } => {
  if (currentUser.id === targetUser.id) {
    return { success: false, message: 'Bạn không thể tự gửi lời mời kết bạn cho chính mình!' };
  }

  const friends = getFriends(currentUser.id);
  if (friends.some(f => f.id === targetUser.id)) {
    return { success: false, message: `Bạn và @${targetUser.username} đã là bạn bè rồi!` };
  }

  const allReqs = getAllRequests();
  const existingPending = allReqs.find(
    r => (r.fromUserId === currentUser.id && r.toUserId === targetUser.id && r.status === 'pending')
  );
  if (existingPending) {
    return { success: false, message: 'Bạn đã gửi lời mời kết bạn trước đó, vui lòng đợi người ấy chấp nhận!' };
  }

  const newRequest: FriendRequest = {
    id: 'freq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    fromUserId: currentUser.id,
    fromUserName: currentUser.name,
    fromUserUsername: currentUser.username,
    fromUserAvatar: currentUser.avatar,
    toUserId: targetUser.id,
    toUserUsername: targetUser.username,
    status: 'pending',
    timestamp: Date.now(),
  };

  saveAllRequests([newRequest, ...allReqs]);
  return { success: true, message: `Đã gửi lời mời kết bạn đến @${targetUser.username}!` };
};

// Accept or Reject a friend request
export const respondToFriendRequest = (
  requestId: string, 
  action: 'accept' | 'reject',
  currentUser: UserProfile
): { success: boolean; message: string } => {
  const allReqs = getAllRequests();
  const req = allReqs.find(r => r.id === requestId);

  if (!req) {
    return { success: false, message: 'Không tìm thấy lời mời kết bạn này!' };
  }

  // Update request status
  const updatedReqs: FriendRequest[] = allReqs.map(r => 
    r.id === requestId 
      ? { ...r, status: (action === 'accept' ? 'accepted' : 'rejected') as 'accepted' | 'rejected' } 
      : r
  );
  saveAllRequests(updatedReqs);

  if (action === 'accept') {
    // Add to receiver's friends
    const receiverFriends = getFriends(currentUser.id);
    if (!receiverFriends.some(f => f.id === req.fromUserId)) {
      receiverFriends.push({
        id: req.fromUserId,
        name: req.fromUserName,
        username: req.fromUserUsername,
        avatar: req.fromUserAvatar,
        status: 'online',
        connectedAt: Date.now(),
      });
      saveFriends(currentUser.id, receiverFriends);
    }

    // Add to sender's friends
    const senderFriends = getFriends(req.fromUserId);
    if (!senderFriends.some(f => f.id === currentUser.id)) {
      senderFriends.push({
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        status: 'online',
        connectedAt: Date.now(),
      });
      saveFriends(req.fromUserId, senderFriends);
    }

    // Set this newly added friend as active partner
    setActiveFriendId(req.fromUserId);

    return { 
      success: true, 
      message: `Đã chấp nhận lời mời kết bạn từ @${req.fromUserUsername}! Cả hai đã có thể vẽ cho nhau.` 
    };
  }

  return { success: true, message: `Đã từ chối lời mời kết bạn từ @${req.fromUserUsername}.` };
};

// Get pending incoming requests for a user
export const getIncomingRequests = (userId: string): FriendRequest[] => {
  return getAllRequests().filter(r => r.toUserId === userId && r.status === 'pending');
};

// Active friend selected for Widget and Sending sketches
export const getActiveFriendId = (userId: string): string | null => {
  const saved = localStorage.getItem(`${ACTIVE_FRIEND_KEY}_${userId}`);
  if (saved) return saved;

  const friends = getFriends(userId);
  return friends.length > 0 ? friends[0].id : null;
};

export const setActiveFriendId = (friendId: string) => {
  localStorage.setItem(ACTIVE_FRIEND_KEY, friendId);
  broadcastFriendChange({ type: 'ACTIVE_FRIEND_CHANGED', friendId });
};
