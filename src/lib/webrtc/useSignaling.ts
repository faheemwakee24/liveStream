import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SignalPayload =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; from: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; from: string }
  | { type: "ice"; candidate: RTCIceCandidateInit; from: string }
  | { type: "ready"; from: string }
  | { type: "bye"; from: string };

export interface SignalingHandle {
  send: (msg: SignalPayload) => void;
  peers: string[];
  selfId: string;
  ready: boolean;
}

export function useSignaling(
  roomId: string | null,
  onMessage: (msg: SignalPayload) => void,
): SignalingHandle {
  const selfIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  const [peers, setPeers] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const selfId = selfIdRef.current;
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: selfId },
      },
    });

    channel.on("broadcast", { event: "signal" }, ({ payload }) => {
      const msg = payload as SignalPayload;
      if (msg.from === selfId) return;
      handlerRef.current(msg);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const ids = Object.keys(state).filter((id) => id !== selfId);
      setPeers(ids);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ joined_at: Date.now() });
        setReady(true);
      }
    });

    channelRef.current = channel;
    return () => {
      setReady(false);
      setPeers([]);
      channel.unsubscribe();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  return {
    selfId: selfIdRef.current,
    peers,
    ready,
    send: (msg) => {
      const channel = channelRef.current;
      if (!channel) return;
      channel.send({ type: "broadcast", event: "signal", payload: msg });
    },
  };
}
