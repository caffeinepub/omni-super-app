import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "./useActor";

let _pendingOffer: SignalMessage | undefined;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

export type WebRTCCallState =
  | "idle"
  | "outgoing-ringing"
  | "incoming-ringing"
  | "connected"
  | "ended";

export interface IncomingCallInfo {
  fromId777: string;
  callType: "voice" | "video";
}

interface SignalMessage {
  type: "offer" | "answer" | "ice" | "hangup";
  fromId777: string;
  callType?: "voice" | "video";
  sdp?: RTCSessionDescriptionInit;
  ice?: RTCIceCandidateInit;
}

export function useWebRTC(myId777: string | null) {
  const { actor } = useActor();

  const [callState, setCallState] = useState<WebRTCCallState>("idle");
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [remoteId777, setRemoteId777] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);
  const callStateRef = useRef<WebRTCCallState>("idle");

  // Keep ref in sync with state
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const sendSignalMsg = useCallback(
    async (toId777: string, msg: SignalMessage) => {
      if (!actor) return;
      try {
        await (actor as any).sendSignal(toId777, JSON.stringify(msg));
      } catch (e) {
        console.error("sendSignal error", e);
      }
    },
    [actor],
  );

  const createPC = useCallback(
    (targetId777: string, _type: "voice" | "video") => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignalMsg(targetId777, {
            type: "ice",
            fromId777: myId777 ?? "",
            ice: e.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "connected" &&
          callStateRef.current !== "connected"
        ) {
          setCallState("connected");
          durationIntervalRef.current = setInterval(
            () => setDuration((d) => d + 1),
            1000,
          );
        }
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          hangUp();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myId777, sendSignalMsg],
  );

  const getMedia = useCallback(async (type: "voice" | "video") => {
    const constraints =
      type === "video"
        ? { video: true, audio: true }
        : { video: false, audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      return null;
    }
  }, []);

  const initiateCall = useCallback(
    async (targetId777: string, type: "voice" | "video") => {
      if (!actor || !myId777) {
        toast.error("Arama yapabilmek için ICP ile giriş yapman gerekiyor");
        return;
      }
      setCallType(type);
      setRemoteId777(targetId777);
      setCallState("outgoing-ringing");
      setDuration(0);

      const pc = createPC(targetId777, type);
      const stream = await getMedia(type);
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await sendSignalMsg(targetId777, {
        type: "offer",
        fromId777: myId777,
        callType: type,
        sdp: offer,
      });
    },
    [actor, myId777, createPC, getMedia, sendSignalMsg],
  );

  const rejectCall = useCallback(async () => {
    if (!incomingCall || !myId777) return;
    await sendSignalMsg(incomingCall.fromId777, {
      type: "hangup",
      fromId777: myId777,
    });
    setIncomingCall(null);
  }, [incomingCall, myId777, sendSignalMsg]);

  const hangUp = useCallback(async () => {
    if (remoteId777 && myId777) {
      await sendSignalMsg(remoteId777, {
        type: "hangup",
        fromId777: myId777,
      });
    }
    pcRef.current?.close();
    pcRef.current = null;
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallState("idle");
    setRemoteId777(null);
    setDuration(0);
    setMuted(false);
    setVideoOff(false);
  }, [remoteId777, myId777, sendSignalMsg]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getAudioTracks()) {
        t.enabled = !t.enabled;
      }
    }
    setMuted((m) => !m);
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getVideoTracks()) {
        t.enabled = !t.enabled;
      }
    }
    setVideoOff((v) => !v);
  }, []);

  // Signal polling
  useEffect(() => {
    if (!actor || !myId777) return;

    const poll = async () => {
      try {
        const signals = await (actor as any).pollMySignals();
        for (const raw of signals) {
          try {
            const msg: SignalMessage = JSON.parse(raw);
            await handleSignal(msg);
          } catch {}
        }
      } catch {}
    };

    pollIntervalRef.current = setInterval(poll, 2000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, myId777]);

  const handleSignal = useCallback(async (msg: SignalMessage) => {
    const state = callStateRef.current;

    if (msg.type === "offer" && msg.sdp && msg.callType) {
      // Store the offer SDP for when user answers
      if (state === "idle") {
        setIncomingCall({ fromId777: msg.fromId777, callType: msg.callType });
        // We need to handle the offer SDP when answering
        // Store it temporarily
        _pendingOffer = msg;
      }
    } else if (msg.type === "answer" && msg.sdp) {
      const pc = pcRef.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        } catch {}
      }
    } else if (msg.type === "ice" && msg.ice) {
      if (pcRef.current?.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.ice));
        } catch {}
      } else {
        pendingIceCandidates.current.push(msg.ice);
      }
    } else if (msg.type === "hangup") {
      pcRef.current?.close();
      pcRef.current = null;
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getTracks()) t.stop();
        localStreamRef.current = null;
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setCallState("idle");
      setIncomingCall(null);
      setRemoteId777(null);
      setDuration(0);
    }
  }, []);

  // Override answerCall to handle the stored offer
  const answerCallWithOffer = useCallback(async () => {
    if (!incomingCall || !actor || !myId777) return;
    const { fromId777, callType: ct } = incomingCall;
    const pendingOffer = _pendingOffer;

    setCallType(ct);
    setRemoteId777(fromId777);
    setCallState("connected");
    setIncomingCall(null);
    setDuration(0);
    durationIntervalRef.current = setInterval(
      () => setDuration((d) => d + 1),
      1000,
    );

    const pc = createPC(fromId777, ct);
    const stream = await getMedia(ct);
    if (stream) {
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }
    }

    if (pendingOffer?.sdp) {
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(pendingOffer.sdp),
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignalMsg(fromId777, {
          type: "answer",
          fromId777: myId777,
          sdp: answer,
        });
      } catch (e) {
        console.error("answer error", e);
      }
    }

    // Apply pending ICE
    for (const ice of pendingIceCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(ice));
      } catch {}
    }
    pendingIceCandidates.current = [];
    _pendingOffer = undefined;
  }, [incomingCall, actor, myId777, createPC, getMedia, sendSignalMsg]);

  return {
    callState,
    callType,
    remoteId777,
    incomingCall,
    duration,
    muted,
    videoOff,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    answerCall: answerCallWithOffer,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo,
  };
}
