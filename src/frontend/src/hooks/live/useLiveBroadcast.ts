import { useState, useEffect, useRef } from 'react';
import { useActor } from '../useActor';
import { SessionId, Offer, Candidate } from '../../backend';
import { SignalingClient } from '../../lib/live/signaling';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface UseLiveBroadcastReturn {
  sessionId: SessionId | null;
  connectionState: ConnectionState;
  viewerCount: number;
  error: string | null;
  isStarting: boolean;
  startBroadcast: (stream: MediaStream) => Promise<boolean>;
  endBroadcast: () => Promise<void>;
}

export function useLiveBroadcast(): UseLiveBroadcastReturn {
  const { actor } = useActor();
  const [sessionId, setSessionId] = useState<SessionId | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startBroadcast = async (stream: MediaStream): Promise<boolean> => {
    if (!actor) {
      setError('Backend not ready');
      return false;
    }

    setIsStarting(true);
    setError(null);

    try {
      streamRef.current = stream;
      signalingClientRef.current = new SignalingClient(actor);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionRef.current = pc;

      // Add stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      const candidates: Candidate[] = [];
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || undefined,
            sdpMLineIndex: event.candidate.sdpMLineIndex !== null ? BigInt(event.candidate.sdpMLineIndex) : undefined,
            usernameFragment: event.candidate.usernameFragment || undefined,
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setConnectionState('connected');
          setViewerCount(1);
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionState('disconnected');
          setViewerCount(0);
        } else if (state === 'connecting') {
          setConnectionState('connecting');
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerData: Offer = {
        sdp: offer.sdp!,
        type: offer.type,
      };

      // Start broadcast on backend (sessionId is always 0 for now)
      const broadcasterId = `broadcaster-${Date.now()}`;
      await actor.startBroadcast(broadcasterId, offerData);
      
      const newSessionId = BigInt(0);
      setSessionId(newSessionId);

      // Wait for ICE gathering
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send ICE candidates
      if (candidates.length > 0) {
        await actor.addBroadcasterCandidates(newSessionId, candidates);
      }

      // Start polling for viewer answers and candidates
      startPolling(newSessionId, broadcasterId);

      setIsStarting(false);
      return true;
    } catch (err: any) {
      console.error('Failed to start broadcast:', err);
      setError(err.message || 'Failed to start broadcast');
      setIsStarting(false);
      cleanup();
      return false;
    }
  };

  const startPolling = (sessId: SessionId, broadcasterId: string) => {
    if (!actor || !peerConnectionRef.current) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Check if session should finish
        const shouldFinish = await actor.shouldFinish(sessId);
        if (shouldFinish) {
          setError('Session expired');
          await endBroadcast();
          return;
        }

        // Poll for viewer candidates (simplified - just checking for first viewer)
        const viewerId = 'viewer-1';
        try {
          const viewerCandidates = await actor.getViewerCandidates(sessId, viewerId);
          
          if (viewerCandidates && viewerCandidates.length > 0 && peerConnectionRef.current) {
            for (const candidate of viewerCandidates) {
              const rtcCandidate = new RTCIceCandidate({
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex ? Number(candidate.sdpMLineIndex) : null,
              });
              await peerConnectionRef.current.addIceCandidate(rtcCandidate);
            }
          }
        } catch (err) {
          // Viewer not joined yet or no candidates
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const endBroadcast = async () => {
    await cleanup();
    setSessionId(null);
    setConnectionState('idle');
    setViewerCount(0);
    setError(null);
  };

  return {
    sessionId,
    connectionState,
    viewerCount,
    error,
    isStarting,
    startBroadcast,
    endBroadcast,
  };
}
