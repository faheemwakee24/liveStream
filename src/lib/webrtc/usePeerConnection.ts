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
  const politeRef = useRef(true);
  const queuedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const peerIdRef = useRef<string | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<PeerConnectionState["status"]>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleMessage = useCallback(async (msg: SignalPayload) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (msg.type === "bye") {
      setStatus("disconnected");
      setRemoteStream(null);
      peerIdRef.current = null;
      return;
    }
    if (!peerIdRef.current) peerIdRef.current = msg.from;

    try {
      if (msg.type === "offer") {
        const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";
        if (offerCollision && !politeRef.current) return;
        await pc.setRemoteDescription(msg.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingRef.current?.send({ type: "answer", sdp: pc.localDescription!.toJSON(), from: signalingRef.current.selfId });
        for (const c of queuedCandidatesRef.current) await pc.addIceCandidate(c);
        queuedCandidatesRef.current = [];
      } else if (msg.type === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(msg.sdp);
          for (const c of queuedCandidatesRef.current) await pc.addIceCandidate(c);
          queuedCandidatesRef.current = [];
        }
      } else if (msg.type === "ice") {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(msg.candidate);
        } else {
          queuedCandidatesRef.current.push(msg.candidate);
        }
      } else if (msg.type === "ready") {
        // peer is ready — initiator (lexicographically smaller id) creates offer
        if (signalingRef.current && signalingRef.current.selfId < msg.from) {
          politeRef.current = false;
          try {
            makingOfferRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signalingRef.current.send({ type: "offer", sdp: pc.localDescription!.toJSON(), from: signalingRef.current.selfId });
          } finally {
            makingOfferRef.current = false;
          }
        } else {
          politeRef.current = true;
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
          setMessages((m) => [...m, { id: crypto.randomUUID(), from: "peer", text: data.text, at: Date.now() }]);
        }
      } catch {}
    };
  }, []);

  // Build peer connection once we have a local stream + signaling ready
  useEffect(() => {
    if (!roomId || !localStream || !signaling.ready) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    setStatus("waiting");

    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }

    const remote = new MediaStream();
    setRemoteStream(remote);
    pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach((t) => {
        if (!remote.getTracks().find((rt) => rt.id === t.id)) remote.addTrack(t);
      });
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

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setStatus("connected");
      else if (s === "connecting" || s === "new") setStatus("connecting");
      else if (s === "disconnected" || s === "failed" || s === "closed") setStatus("disconnected");
    };

    // Initiator creates data channel
    const dc = pc.createDataChannel("chat", { negotiated: true, id: 0 });
    setupDataChannel(dc);

    // announce readiness
    signalingRef.current.send({ type: "ready", from: signalingRef.current.selfId });

    return () => {
      try { signalingRef.current.send({ type: "bye", from: signalingRef.current.selfId }); } catch {}
      // local tracks are owned by the page; don't stop them here
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      pcRef.current = null;
      dcRef.current = null;
      setRemoteStream(null);
      setStatus("disconnected");
    };
  }, [roomId, localStream, signaling.ready, setupDataChannel]);

  // When peers list changes (someone new arrives), send a ready ping so we negotiate
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
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "me", text, at: Date.now() }]);
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
