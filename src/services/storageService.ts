import type { SketchItem, UserProfile } from '../types/sketch';

const PROFILE_KEY = 'instantsketch_user_profile';
const TIMELINE_KEY = 'instantsketch_timeline';
const LATEST_WIDGET_KEY = 'instantsketch_latest_widget';

// BroadcastChannel for instant cross-tab live communication
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('instantsketch_realtime_sync');
  }
} catch {
  console.warn('BroadcastChannel not supported');
}

// Generate random friendly pair code like SK-7842
export const generatePairCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SK-${num}`;
};

export const getStoredProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Default initial profile
  const newProfile: UserProfile = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: 'Tôi (You)',
    avatar: '🎨',
    pairCode: generatePairCode(),
    partnerId: 'friend_demo',
    partnerName: 'Bạn Thân (Alex)',
    partnerAvatar: '🦊',
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
  return newProfile;
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  broadcastChange({ type: 'PROFILE_UPDATED', payload: profile });
};

export const getTimeline = (): SketchItem[] => {
  const data = localStorage.getItem(TIMELINE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  return [];
};

export const saveSketchToTimeline = (sketch: SketchItem): void => {
  const current = getTimeline();
  const updated = [sketch, ...current].slice(0, 50); // Keep last 50 sketches
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(updated));
  localStorage.setItem(LATEST_WIDGET_KEY, JSON.stringify(sketch));

  broadcastChange({ type: 'NEW_SKETCH', payload: sketch });
};

export const getLatestWidgetSketch = (): SketchItem | null => {
  const data = localStorage.getItem(LATEST_WIDGET_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const timeline = getTimeline();
  return timeline.length > 0 ? timeline[0] : null;
};

export const addReactionToSketch = (sketchId: string, emoji: string): SketchItem[] => {
  const current = getTimeline();
  const updated = current.map(item => {
    if (item.id === sketchId) {
      const reactions = { ...item.reactions };
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      return { ...item, reactions };
    }
    return item;
  });
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(updated));
  broadcastChange({ type: 'REACTION_UPDATED', payload: { sketchId, emoji } });
  return updated;
};

// Broadcast channel helpers
export const broadcastChange = (message: { type: string; payload: unknown }): void => {
  if (syncChannel) {
    syncChannel.postMessage(message);
  }
};

export const subscribeToSync = (callback: (msg: { type: string; payload: unknown }) => void): (() => void) => {
  if (!syncChannel) return () => {};

  const handler = (event: MessageEvent) => {
    callback(event.data);
  };

  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
};
