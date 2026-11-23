export type ToolType = 
  | 'pen' 
  | 'brush' 
  | 'highlighter' 
  | 'eraser' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'heart'
  | 'text';

export type BackgroundStyle = 'white' | 'dark' | 'grid' | 'dots' | 'vintage' | 'pastel-pink';

export interface UserProfile {
  id: string;
  name: string;
  username: string; // e.g. "thang_sketch", "lucy99"
  email: string;
  avatar: string;
  createdAt: number;
}

export interface FriendUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  connectedAt: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername: string;
  fromUserAvatar: string;
  toUserId: string;
  toUserUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface SketchItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderUsername?: string;
  recipientId?: string; // which friend received this sketch
  imageDataUrl: string;
  caption?: string;
  timestamp: number;
  reactions: Record<string, number>;
}
