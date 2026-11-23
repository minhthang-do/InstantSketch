import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { ToolType, BackgroundStyle, UserProfile, FriendUser, SketchItem } from './types/sketch';
import { 
  getCurrentUser, initAuthListener 
} from './services/authService';
import { 
  getFriends, getActiveFriendId, getIncomingRequests, 
  subscribeToFriendSync 
} from './services/friendService';
import { 
  getTimeline, saveSketchToTimeline, getLatestWidgetSketch, 
  addReactionToSketch, subscribeToSync 
} from './services/storageService';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Header } from './components/Header';
import { WidgetSimulatorModal } from './components/WidgetSimulatorModal';
import { FriendsModal } from './components/FriendsModal';
import { AuthModal } from './components/AuthModal';
import { HistoryFeedModal } from './components/HistoryFeedModal';

export function App() {
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#ec4899');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('white');

  // Auth User & Friend state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [activeFriend, setActiveFriend] = useState<FriendUser | null>(() => {
    if (!currentUser) return null;
    const friends = getFriends(currentUser.id);
    const activeId = getActiveFriendId(currentUser.id);
    return friends.find(f => f.id === activeId) || (friends.length > 0 ? friends[0] : null);
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(() => {
    return currentUser ? getIncomingRequests(currentUser.id).length : 0;
  });

  const [timeline, setTimeline] = useState<SketchItem[]>(getTimeline());
  const [latestWidgetSketch, setLatestWidgetSketch] = useState<SketchItem | null>(getLatestWidgetSketch());

  // Modals
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Incoming notification
  const [incomingNotification, setIncomingNotification] = useState<{
    senderName: string;
    senderAvatar: string;
    sketch: SketchItem;
  } | null>(null);

  const canvasExporterRef = useRef<(() => string) | null>(null);

  // Listen to Supabase Google OAuth and auth session changes
  useEffect(() => {
    const unsub = initAuthListener((user) => {
      setCurrentUser(user);
      const friends = getFriends(user.id);
      const activeId = getActiveFriendId(user.id);
      setActiveFriend(friends.find(f => f.id === activeId) || (friends.length > 0 ? friends[0] : null));
    });
    return () => unsub();
  }, []);

  // Sync friend requests badge
  useEffect(() => {
    if (!currentUser) return;
    const updateReqs = () => {
      setPendingRequestsCount(getIncomingRequests(currentUser.id).length);
    };
    updateReqs();
    const unsub = subscribeToFriendSync(updateReqs);
    return () => unsub();
  }, [currentUser]);

  // Initial welcome sketch if timeline empty
  useEffect(() => {
    if (timeline.length === 0) {
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 600;
      dummyCanvas.height = 450;
      const ctx = dummyCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 450);

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 0; x < 600; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 450);
          ctx.stroke();
        }

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(300, 240);
        ctx.bezierCurveTo(300, 210, 250, 160, 210, 160);
        ctx.bezierCurveTo(160, 160, 160, 220, 160, 220);
        ctx.bezierCurveTo(160, 280, 240, 330, 300, 370);
        ctx.bezierCurveTo(360, 330, 440, 280, 440, 220);
        ctx.bezierCurveTo(440, 220, 440, 160, 390, 160);
        ctx.bezierCurveTo(350, 160, 300, 210, 300, 240);
        ctx.fill();

        ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('Chào mừng bạn đến với InstantSketch! ✨', 300, 80);

        ctx.font = '20px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Kết bạn qua @username & cập nhật Widget tức thì', 300, 115);

        const demoItem: SketchItem = {
          id: 'welcome_sketch',
          senderId: activeFriend?.id || 'partner_alex',
          senderName: activeFriend?.name || 'Alex Nguyễn',
          senderAvatar: activeFriend?.avatar || '🦊',
          senderUsername: activeFriend?.username || 'alex_art',
          imageDataUrl: dummyCanvas.toDataURL(),
          timestamp: Date.now() - 1000 * 60 * 15,
          reactions: { '❤️': 5, '✨': 2 },
        };
        saveSketchToTimeline(demoItem);
        setTimeline([demoItem]);
        setLatestWidgetSketch(demoItem);
      }
    }
  }, [activeFriend, timeline.length]);

  // Real-time sketch listener
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'NEW_SKETCH') {
        const newSketch = msg.payload as SketchItem;
        setTimeline((prev) => [newSketch, ...prev.filter(s => s.id !== newSketch.id)]);
        setLatestWidgetSketch(newSketch);

        if (currentUser && newSketch.senderId !== currentUser.id) {
          setIncomingNotification({
            senderName: newSketch.senderName,
            senderAvatar: newSketch.senderAvatar,
            sketch: newSketch,
          });
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.1 },
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Send Sketch Action
  const handleSendSketch = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!activeFriend) {
      setIsFriendsModalOpen(true);
      return;
    }

    if (!canvasExporterRef.current) return;
    setIsSending(true);

    const dataUrl = canvasExporterRef.current();
    if (!dataUrl) {
      setIsSending(false);
      return;
    }

    const newSketch: SketchItem = {
      id: 'sketch_' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderUsername: currentUser.username,
      recipientId: activeFriend.id,
      imageDataUrl: dataUrl,
      timestamp: Date.now(),
      reactions: { '❤️': 1 },
    };

    saveSketchToTimeline(newSketch);
    setTimeline((prev) => [newSketch, ...prev]);
    setLatestWidgetSketch(newSketch);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
    });

    setTimeout(() => {
      setIsSending(false);
      setIsWidgetModalOpen(true);
    }, 600);
  };

  // Simulate partner replying
  const handleSimulatePartnerSketch = useCallback(() => {
    const partner = activeFriend || {
      id: 'user_alex',
      name: 'Alex Nguyễn',
      username: 'alex_art',
      avatar: '🦊',
      status: 'online' as const,
      connectedAt: Date.now(),
    };

    const partnerCanvas = document.createElement('canvas');
    partnerCanvas.width = 600;
    partnerCanvas.height = 450;
    const ctx = partnerCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 450);

    ctx.font = '72px "Segoe UI Emoji"';
    ctx.textAlign = 'center';
    ctx.fillText('🐱', 300, 200);

    ctx.font = 'bold 36px "Plus Jakarta Sans", cursive, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(`Mình nhận được rồi nè @${currentUser?.username || 'bạn'}! ✨`, 300, 280);

    ctx.font = 'bold 24px "Plus Jakarta Sans", cursive, sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.fillText('Tranh của bạn vẽ xinh quá ❤️', 300, 330);

    const partnerSketch: SketchItem = {
      id: 'partner_sketch_' + Date.now(),
      senderId: partner.id,
      senderName: partner.name,
      senderAvatar: partner.avatar,
      senderUsername: partner.username,
      recipientId: currentUser?.id,
      imageDataUrl: partnerCanvas.toDataURL(),
      timestamp: Date.now(),
      reactions: { '❤️': 3, '🔥': 2 },
    };

    saveSketchToTimeline(partnerSketch);
    setTimeline((prev) => [partnerSketch, ...prev]);
    setLatestWidgetSketch(partnerSketch);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.4 },
    });
  }, [activeFriend, currentUser]);

  const handleReaction = (sketchId: string, emoji: string) => {
    const updated = addReactionToSketch(sketchId, emoji);
    setTimeline(updated);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Header */}
      <Header
        currentUser={currentUser}
        activeFriend={activeFriend}
        pendingRequestsCount={pendingRequestsCount}
        onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onSendSketch={handleSendSketch}
        isSending={isSending}
      />

      {/* Floating Notification Toast */}
      {incomingNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-top duration-300">
          <span className="text-2xl">{incomingNotification.senderAvatar}</span>
          <div className="text-xs">
            <p className="font-bold">{incomingNotification.senderName} vừa gửi hình vẽ mới lên Widget!</p>
            <p className="text-white/80 text-[11px]">Widget trên màn hình điện thoại đã tự động cập nhật</p>
          </div>
          <button
            onClick={() => {
              setIncomingNotification(null);
              setIsWidgetModalOpen(true);
            }}
            className="px-3 py-1 bg-white text-indigo-950 font-bold rounded-xl text-xs shadow active:scale-95 transition-all"
          >
            Xem ngay
          </button>
          <button
            onClick={() => setIncomingNotification(null)}
            className="text-white/70 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Center Drawing Canvas Workspace */}
      <main className="flex-1 w-full relative overflow-hidden bg-slate-950">
        <Canvas
          tool={tool}
          color={color}
          brushSize={brushSize}
          bgStyle={bgStyle}
          onCanvasExportReady={(exporter) => {
            canvasExporterRef.current = exporter;
          }}
        />
      </main>

      {/* Bottom Floating Control Dock */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        bgStyle={bgStyle}
        setBgStyle={setBgStyle}
      />

      {/* Modals */}
      {currentUser && (
        <FriendsModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          currentUser={currentUser}
          activeFriend={activeFriend}
          onActiveFriendChange={(friend) => setActiveFriend(friend)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          if (user) {
            const friends = getFriends(user.id);
            const activeId = getActiveFriendId(user.id);
            setActiveFriend(friends.find(f => f.id === activeId) || (friends.length > 0 ? friends[0] : null));
          } else {
            setActiveFriend(null);
          }
        }}
      />

      <WidgetSimulatorModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        latestSketch={latestWidgetSketch}
        currentUser={currentUser}
        activeFriend={activeFriend}
        onSimulateFriendSketch={handleSimulatePartnerSketch}
      />

      <HistoryFeedModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        timeline={timeline}
        onAddReaction={handleReaction}
      />
    </div>
  );
}
export default App;
