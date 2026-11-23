import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { ToolType, BackgroundStyle, UserProfile, SketchItem } from './types/sketch';
import { 
  getStoredProfile, saveProfile, getTimeline, 
  saveSketchToTimeline, getLatestWidgetSketch, 
  addReactionToSketch, subscribeToSync 
} from './services/storageService';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Header } from './components/Header';
import { WidgetSimulatorModal } from './components/WidgetSimulatorModal';
import { FriendPairModal } from './components/FriendPairModal';
import { HistoryFeedModal } from './components/HistoryFeedModal';

export function App() {
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#ec4899');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('white');

  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [timeline, setTimeline] = useState<SketchItem[]>(getTimeline());
  const [latestWidgetSketch, setLatestWidgetSketch] = useState<SketchItem | null>(getLatestWidgetSketch());

  // Modal states
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Incoming sketch notification banner
  const [incomingNotification, setIncomingNotification] = useState<{
    senderName: string;
    senderAvatar: string;
    sketch: SketchItem;
  } | null>(null);

  // Canvas export handle
  const canvasExporterRef = useRef<(() => string) | null>(null);

  // Create initial demo sketch if timeline is empty
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
        ctx.fillText('Vẽ & gửi hình lên Widget của nhau bất cứ lúc nào', 300, 115);

        const demoItem: SketchItem = {
          id: 'welcome_sketch',
          senderId: 'partner_alex',
          senderName: profile.partnerName || 'Alex (Bạn thân)',
          senderAvatar: profile.partnerAvatar || '🦊',
          imageDataUrl: dummyCanvas.toDataURL(),
          timestamp: Date.now() - 1000 * 60 * 15,
          reactions: { '❤️': 4, '✨': 2 },
        };
        saveSketchToTimeline(demoItem);
        setTimeline([demoItem]);
        setLatestWidgetSketch(demoItem);
      }
    }
  }, [profile.partnerName, profile.partnerAvatar, timeline.length]);

  // Listen to cross-tab live sync events
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'NEW_SKETCH') {
        const newSketch = msg.payload as SketchItem;
        setTimeline((prev) => [newSketch, ...prev.filter(s => s.id !== newSketch.id)]);
        setLatestWidgetSketch(newSketch);

        if (newSketch.senderId !== profile.id) {
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
      } else if (msg.type === 'PROFILE_UPDATED') {
        setProfile(getStoredProfile());
      }
    });

    return () => unsubscribe();
  }, [profile.id]);

  // Handle Save / Update Profile
  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
    saveProfile(updated);
  };

  // Send Sketch action
  const handleSendSketch = () => {
    if (!canvasExporterRef.current) return;
    setIsSending(true);

    const dataUrl = canvasExporterRef.current();
    if (!dataUrl) {
      setIsSending(false);
      return;
    }

    const newSketch: SketchItem = {
      id: 'sketch_' + Date.now(),
      senderId: profile.id,
      senderName: profile.name,
      senderAvatar: profile.avatar,
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

  // Simulate Partner sending a sketch back
  const handleSimulatePartnerSketch = useCallback(() => {
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
    ctx.fillText('Mình vừa nhận được rồi nè! ✨', 300, 280);

    ctx.font = 'bold 24px "Plus Jakarta Sans", cursive, sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.fillText('Tranh của bạn vẽ xinh quá ❤️', 300, 330);

    const partnerSketch: SketchItem = {
      id: 'partner_sketch_' + Date.now(),
      senderId: profile.partnerId || 'partner_demo',
      senderName: profile.partnerName || 'Alex (Bạn thân)',
      senderAvatar: profile.partnerAvatar || '🦊',
      imageDataUrl: partnerCanvas.toDataURL(),
      timestamp: Date.now(),
      reactions: { '❤️': 2, '🔥': 1 },
    };

    saveSketchToTimeline(partnerSketch);
    setTimeline((prev) => [partnerSketch, ...prev]);
    setLatestWidgetSketch(partnerSketch);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.4 },
    });
  }, [profile.partnerId, profile.partnerName, profile.partnerAvatar]);

  // Handle reaction on sketch
  const handleReaction = (sketchId: string, emoji: string) => {
    const updated = addReactionToSketch(sketchId, emoji);
    setTimeline(updated);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Header */}
      <Header
        profile={profile}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onSendSketch={handleSendSketch}
        isSending={isSending}
      />

      {/* Floating Notification Toast when Partner sends sketch */}
      {incomingNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-top duration-300">
          <span className="text-2xl">{incomingNotification.senderAvatar}</span>
          <div className="text-xs">
            <p className="font-bold">{incomingNotification.senderName} vừa gửi hình vẽ mới lên Widget!</p>
            <p className="text-white/80 text-[11px]">Widget trên màn hình đã tự động cập nhật</p>
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
      <FriendPairModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      <WidgetSimulatorModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        latestSketch={latestWidgetSketch}
        profile={profile}
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
