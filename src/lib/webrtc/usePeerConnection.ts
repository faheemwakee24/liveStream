import { useCallback, useEffect, useRef, useState } from "react";
import { useSignaling, type SignalPayload } from "./useSignaling";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export interface ChatMessage {
  id: string;
  from: "me" | "peer";
  text: string;
  at: number;
}

export interface PeerConnectionState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: "idle" | "waiting" | "connecting" | "connected" | "disconnected";
  peerCount: number;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  replaceVideoTrack: (track: MediaStreamTrack | null) => Promise<void>;
}

export function usePeerConnection(
  roomId: string | null,
  localStream: MediaStream | null,
): PeerConnectionState {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(true);
  const remoteIdRef = useRef<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<PeerConnectionState["status"]>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleMessage = useCallback(async (msg: SignalPayload) => {
    const pc = pcRef.current;
    const signaling = signalingRef.current;
    if (!pc || !signaling) return;

    // Pin to first peer we see
    if (!remoteIdRef.current && msg.from) {
      remoteIdRef.current = msg.from;
      // polite = larger id
      politeRef.current = signaling.selfId > msg.from;
    }
    if (msg.from !== remoteIdRef.current) return;

    try {
      if (msg.type === "bye") {
        setStatus("disconnected");
        setRemoteStream(null);
        remoteIdRef.current = null;
        return;
      }
      if (msg.type === "offer" || msg.type === "answer") {
        const description = msg.sdp;
        const readyForOffer =
          !makingOfferRef.current &&
          (pc.signalingState === "stable" || pc.signalingState === "have-local-offer");
        const offerCollision = description.type === "offer" && !readyForOffer;
        ignoreOfferRef.current = !politeRef.current && offerCollision;
        if (ignoreOfferRef.current) return;

        if (description.type === "offer" && pc.signalingState !== "stable") {
          // polite peer rolls back
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" } as RTCLocalSessionDescriptionInit),
            pc.setRemoteDescription(description),
          ]);
        } else {
          await pc.setRemoteDescription(description);
        }
        if (description.type === "offer") {
          await pc.setLocalDescription();
          signaling.send({
            type: "answer",
            sdp: pc.localDescription!.toJSON(),
            from: signaling.selfId,
          });
        }
      } else if (msg.type === "ice") {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch (e) {
          if (!ignoreOfferRef.current) throw e;
        }
      } else if (msg.type === "ready") {
        // Trigger negotiation by re-firing negotiationneeded if needed
        if (pc.signalingState === "stable" && !politeRef.current) {
          try {
            makingOfferRef.current = true;
            await pc.setLocalDescription();
            signaling.send({
              type: "offer",
              sdp: pc.localDescription!.toJSON(),
              from: signaling.selfId,
            });
          } finally {
            makingOfferRef.current = false;
          }
        }
      }
    } catch (e) {
      console.error("[webrtc] signal handler error", e);
    }
  }, []);

  const signaling = useSignaling(roomId, handleMessage);
  const signalingRef = useRef(signaling);
  signalingRef.current = signaling;

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.kind === "chat") {
          setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), from: "peer", text: data.text, at: Date.now() },
          ]);
        }
      } catch {}
    };
  }, []);

  // Build peer connection once we have a local stream + signaling ready
  useEffect(() => {
    if (!roomId || !localStream || !signaling.ready) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    remoteIdRef.current = null;
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    setStatus("waiting");

    // Add local tracks (transceivers created in stable order, same on both sides)
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }

    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (ev) => {
      console.log("[webrtc] ontrack", ev.track.kind, "streams:", ev.streams.length);
      const track = ev.track;
      if (!remote.getTracks().find((t) => t.id === track.id)) {
        remote.addTrack(track);
      }
      track.onunmute = () => {
        console.log("[webrtc] track unmuted", track.kind);
        setRemoteStream(new MediaStream(remote.getTracks()));
      };
      track.onended = () => {
        console.log("[webrtc] track ended", track.kind);
      };
      // Force a state update so React re-renders with the new track
      setRemoteStream(new MediaStream(remote.getTracks()));
    };


    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        signalingRef.current.send({
          type: "ice",
          candidate: ev.candidate.toJSON(),
          from: signalingRef.current.selfId,
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        signalingRef.current.send({
          type: "offer",
          sdp: pc.localDescription!.toJSON(),
          from: signalingRef.current.selfId,
        });
      } catch (e) {
        console.error("[webrtc] negotiationneeded error", e);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setStatus("connected");
      else if (s === "connecting" || s === "new") setStatus("connecting");
      else if (s === "disconnected" || s === "failed" || s === "closed") setStatus("disconnected");
    };

    // Pre-negotiated data channel (same id on both peers)
    const dc = pc.createDataChannel("chat", { negotiated: true, id: 0 });
    setupDataChannel(dc);

    // announce readiness
    signalingRef.current.send({ type: "ready", from: signalingRef.current.selfId });

    return () => {
      try {
        signalingRef.current.send({ type: "bye", from: signalingRef.current.selfId });
      } catch {}
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      pc.close();
      pcRef.current = null;
      dcRef.current = null;
      remoteIdRef.current = null;
      setRemoteStream(null);
      setStatus("disconnected");
    };
  }, [roomId, localStream, signaling.ready, setupDataChannel]);

  // When a new peer joins, re-announce so they can pick us up
  useEffect(() => {
    if (!pcRef.current || !signaling.ready) return;
    if (signaling.peers.length > 0 && pcRef.current.connectionState !== "connected") {
      signalingRef.current.send({ type: "ready", from: signalingRef.current.selfId });
    }
  }, [signaling.peers, signaling.ready]);

  const sendMessage = useCallback((text: string) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ kind: "chat", text }));
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), from: "me", text, at: Date.now() },
    ]);
  }, []);

  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack | null) => {
    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(track);
  }, []);

  return {
    localStream,
    remoteStream,
    status,
    peerCount: signaling.peers.length,
    messages,
    sendMessage,
    replaceVideoTrack,
  };
}
