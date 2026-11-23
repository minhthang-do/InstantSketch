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

export interface SketchItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  imageDataUrl: string;
  caption?: string;
  timestamp: number;
  reactions: Record<string, number>; // e.g. { '❤️': 3, '🔥': 1 }
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  pairCode: string;
  partnerId: string | null;
  partnerName: string | null;
  partnerAvatar: string | null;
}

export interface PlacedImage {
  id: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
