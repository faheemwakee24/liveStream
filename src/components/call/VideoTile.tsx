import { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

interface Props {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  mirrored?: boolean;
  micOff?: boolean;
  camOff?: boolean;  
  placeholder?: string;
}

export function VideoTile({ stream, label, muted, mirrored, micOff, camOff, placeholder }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (stream) {
      el.play().catch((err) => console.warn("[VideoTile] play() failed", err));
    }
  }, [stream]);

  const showPlaceholder = !stream || camOff;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      {/* Always mount the <video> when we have a stream so audio plays even if camera is off */}
      {stream && (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`h-full w-full object-cover ${mirrored ? "scale-x-[-1]" : ""} ${
            showPlaceholder ? "invisible" : ""
          }`}
        />
      )}

      {showPlaceholder && (
        <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-surface-2">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand text-3xl font-semibold text-primary-foreground">
              {(placeholder ?? label).slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm">{placeholder ?? "Waiting…"}</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-4">
        <span className="text-sm font-medium text-white">{label}</span>
        <div className="flex gap-2">
          {micOff && (
            <span className="rounded-full bg-destructive p-1.5">
              <MicOff className="h-3.5 w-3.5 text-white" />
            </span>
          )}
          {camOff && (
            <span className="rounded-full bg-destructive p-1.5">
              <VideoOff className="h-3.5 w-3.5 text-white" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
