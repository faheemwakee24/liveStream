import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  micOn: boolean;
  camOn: boolean;
  sharingScreen: boolean;
  chatOpen: boolean;
  unread: number;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreen: () => void;
  onToggleChat: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
}

export function CallControls(p: Props) {
  return (
    <div className="glass flex items-center gap-2 rounded-full p-2 shadow-2xl">
      <ControlButton active={p.micOn} onClick={p.onToggleMic} label={p.micOn ? "Mute" : "Unmute"}>
        {p.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>
      <ControlButton active={p.camOn} onClick={p.onToggleCam} label={p.camOn ? "Stop video" : "Start video"}>
        {p.camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>
      <ControlButton active={p.sharingScreen} onClick={p.onToggleScreen} label="Share screen" highlight={p.sharingScreen}>
        <MonitorUp className="h-5 w-5" />
      </ControlButton>
      <ControlButton active={true} onClick={p.onToggleChat} label="Chat" badge={p.unread}>
        <MessageSquare className="h-5 w-5" />
      </ControlButton>
      <ControlButton active={true} onClick={p.onCopyLink} label="Copy link">
        <Copy className="h-5 w-5" />
      </ControlButton>
      <div className="mx-1 h-8 w-px bg-border" />
      <Button
        onClick={p.onLeave}
        className="h-12 gap-2 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90"
      >
        <PhoneOff className="h-5 w-5" />
        Leave
      </Button>
    </div>
  );
}

function ControlButton({
  children,
  active,
  highlight,
  badge,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  highlight?: boolean;
  badge?: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`relative flex h-12 w-12 items-center justify-center rounded-full transition ${
        highlight
          ? "bg-gradient-brand text-primary-foreground"
          : active
            ? "bg-surface-2 text-foreground hover:bg-surface-2/80"
            : "bg-destructive/90 text-white hover:bg-destructive"
      }`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-brand px-1 text-xs font-semibold text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
