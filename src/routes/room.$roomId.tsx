import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Video as VideoIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTile } from "@/components/call/VideoTile";
import { CallControls } from "@/components/call/CallControls";
import { ChatPanel } from "@/components/call/ChatPanel";
import { usePeerConnection } from "@/lib/webrtc/usePeerConnection";

export const Route = createFileRoute("/room/$roomId")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.roomId} — Loop` },
      { name: "description", content: "Join this Loop video call room." },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();

  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Acquire camera + mic when joined
  useEffect(() => {
    if (!joined) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
        setLocalStream(stream);
      } catch (e) {
        console.error(e);
        setMediaError("We couldn't access your camera or mic. Check browser permissions and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [joined]);

  // Stop tracks on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pc = usePeerConnection(joined ? roomId : null, localStream);

  // unread chat badge
  useEffect(() => {
    if (chatOpen) {
      setUnread(0);
      return;
    }
    const lastPeer = [...pc.messages].reverse().find((m) => m.from === "peer");
    if (lastPeer) setUnread((u) => u + 0); // increment based on count diff below
  }, [pc.messages, chatOpen]);

  const peerMsgCount = pc.messages.filter((m) => m.from === "peer").length;
  const prevPeerCountRef = useRef(0);
  useEffect(() => {
    if (peerMsgCount > prevPeerCountRef.current && !chatOpen) {
      setUnread((u) => u + (peerMsgCount - prevPeerCountRef.current));
    }
    prevPeerCountRef.current = peerMsgCount;
  }, [peerMsgCount, chatOpen]);

  const toggleMic = () => {
    if (!localStream) return;
    const next = !micOn;
    localStream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  };

  const toggleCam = () => {
    if (!localStream) return;
    const next = !camOn;
    localStream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  };

  const toggleScreen = useCallback(async () => {
    if (sharingScreen) {
      const screen = screenStreamRef.current;
      screen?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const cam = cameraTrackRef.current;
      await pc.replaceVideoTrack(cam);
      setSharingScreen(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      await pc.replaceVideoTrack(track);
      setSharingScreen(true);
      track.onended = () => {
        const cam = cameraTrackRef.current;
        pc.replaceVideoTrack(cam).catch(() => {});
        screenStreamRef.current = null;
        setSharingScreen(false);
      };
    } catch (e) {
      console.error(e);
    }
  }, [sharingScreen, pc]);

  const copyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied — share it with someone to call them.");
  };

  const leave = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate({ to: "/" });
  };

  if (!joined) {
    return <Lobby roomId={roomId} onJoin={() => setJoined(true)} onCopyLink={copyLink} />;
  }

  if (mediaError) {
    return (
      <div className="flex min-h-screen items-center justify-center radial-bg p-6">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <h2 className="font-display text-xl font-semibold">Camera blocked</h2>
          <p className="mt-2 text-sm text-muted-foreground">{mediaError}</p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-6 bg-gradient-brand text-primary-foreground">
            Back home
          </Button>
        </div>
      </div>
    );
  }

  const statusLabel =
    pc.status === "connected"
      ? "Connected"
      : pc.peerCount === 0
        ? "Waiting for the other person…"
        : pc.status === "connecting"
          ? "Connecting…"
          : pc.status === "disconnected"
            ? "Disconnected"
            : "Setting up…";

  return (
    <div className="flex h-screen flex-col radial-bg">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={leave}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Leave call
        </button>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              pc.status === "connected" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
          />
          {statusLabel}
        </div>
        <button
          onClick={copyLink}
          className="rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs hover:bg-surface-2"
        >
          Room: <span className="font-mono">{roomId}</span>
        </button>
      </header>

      <main className="flex flex-1 gap-4 overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-1 items-center justify-center">
          <div className="grid h-full w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2">
            <VideoTile
              stream={pc.remoteStream}
              label="Them"
              placeholder={pc.peerCount === 0 ? "Waiting for someone to join…" : "Connecting…"}
              camOff={!pc.remoteStream || pc.remoteStream.getVideoTracks().length === 0}
            />
            <VideoTile
              stream={localStream}
              label="You"
              muted
              mirrored={!sharingScreen}
              micOff={!micOn}
              camOff={!camOn}
              placeholder="You"
            />
          </div>
        </div>

        <ChatPanel
          open={chatOpen}
          messages={pc.messages}
          onClose={() => setChatOpen(false)}
          onSend={pc.sendMessage}
        />
      </main>

      <footer className="flex justify-center pb-6">
        <CallControls
          micOn={micOn}
          camOn={camOn}
          sharingScreen={sharingScreen}
          chatOpen={chatOpen}
          unread={unread}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
          onToggleScreen={toggleScreen}
          onToggleChat={() => setChatOpen((o) => !o)}
          onCopyLink={copyLink}
          onLeave={leave}
        />
      </footer>
    </div>
  );
}

function Lobby({ roomId, onJoin, onCopyLink }: { roomId: string; onJoin: () => void; onCopyLink: () => void }) {
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPreviewStream(stream);
      } catch (e) {
        console.error(e);
        setErr("Allow camera & microphone access to continue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleJoin = () => {
    // stop preview tracks; the call page acquires its own
    previewStream?.getTracks().forEach((t) => t.stop());
    onJoin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center radial-bg p-6">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass overflow-hidden rounded-3xl p-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-2">
            {previewStream ? (
              <video
                autoPlay
                muted
                playsInline
                ref={(el) => {
                  if (el && previewStream) el.srcObject = previewStream;
                }}
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : err}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
            <VideoIcon className="h-3.5 w-3.5 text-cyan" />
            Private room
          </div>
          <h1 className="font-display text-4xl font-bold">Ready to join?</h1>
          <p className="mt-3 text-muted-foreground">
            You're about to enter room{" "}
            <span className="font-mono text-foreground">{roomId}</span>. Share the link below with one other person so they can hop in.
          </p>

          <button
            onClick={onCopyLink}
            className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 text-left text-sm hover:bg-surface-2"
          >
            <span className="truncate font-mono text-muted-foreground">
              {typeof window !== "undefined" ? window.location.href : `/room/${roomId}`}
            </span>
            <span className="shrink-0 text-gradient-brand font-semibold">Copy</span>
          </button>

          <Button
            onClick={handleJoin}
            disabled={!!err && !previewStream}
            size="lg"
            className="mt-6 h-14 w-full rounded-full bg-gradient-brand text-base font-semibold text-primary-foreground shadow-lg shadow-violet/30 hover:opacity-90"
          >
            Join call
          </Button>

          {err && <p className="mt-3 text-center text-sm text-destructive">{err}</p>}
        </div>
      </div>
    </div>
  );
}
