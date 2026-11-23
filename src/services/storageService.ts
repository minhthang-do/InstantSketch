import type { SketchItem } from '../types/sketch';

const TIMELINE_KEY = 'instantsketch_timeline';
const LATEST_WIDGET_KEY = 'instantsketch_latest_widget';

let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('instantsketch_realtime_sync');
  }
} catch {
  // ignore
}

export const getTimeline = (filterFriendId?: string): SketchItem[] => {
  const data = localStorage.getItem(TIMELINE_KEY);
  if (data) {
    try {
      const all: SketchItem[] = JSON.parse(data);
      if (filterFriendId) {
        return all.filter(
          s => s.senderId === filterFriendId || s.recipientId === filterFriendId
        );
      }
      return all;
    } catch {
      // fallback
    }
  }
  return [];
};

export const saveSketchToTimeline = (sketch: SketchItem): void => {
  const current = getTimeline();
  const updated = [sketch, ...current].slice(0, 50);
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
