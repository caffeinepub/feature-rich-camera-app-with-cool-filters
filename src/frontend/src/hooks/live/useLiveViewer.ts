import { useState, useEffect, useRef } from 'react';
import { useActor } from '../useActor';
import { SessionId, Candidate } from '../../backend';
import { SignalingClient } from '../../lib/live/signaling';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface UseLiveViewerReturn {
  connectionState: ConnectionState;
  error: string | null;
  isJoining: boolean;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  joinSession: (sessionId: SessionId) => Promise<boolean>;
  leaveSession: () => Promise<void>;
}

export function useLiveViewer(): UseLiveViewerReturn {
  const { actor } = useActor();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<SessionId | null>(null);
  const viewerIdRef = useRef<string>('');

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
  };

  const joinSession = async (sessionId: SessionId): Promise<boolean> => {
    if (!actor) {
      setError('Backend not ready');
      return false;
    }

    setIsJoining(true);
    setError(null);
    setConnectionState('connecting');

    try {
      sessionIdRef.current = sessionId;
      viewerIdRef.current = `viewer-${Date.now()}`;
      signalingClientRef.current = new SignalingClient(actor);

      // Join as viewer
      await actor.joinAsViewer(sessionId, viewerIdRef.current);

      // Get broadcaster's offer
      const offer = await actor.getOffer(sessionId, viewerIdRef.current);

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionRef.current = pc;

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

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
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionState('disconnected');
          setError('Connection lost');
        } else if (state === 'connecting') {
          setConnectionState('connecting');
        }
      };

      // Set remote description
      await pc.setRemoteDescription({
        type: offer.type as RTCSdpType,
        sdp: offer.sdp,
      });

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer to backend
      await actor.sendAnswer(sessionId, viewerIdRef.current, {
        sdp: answer.sdp!,
        type: answer.type,
      });

      // Wait for ICE gathering
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send ICE candidates
      if (candidates.length > 0) {
        await actor.addViewerCandidates(sessionId, viewerIdRef.current, candidates);
      }

      // Start polling for broadcaster candidates
      startPolling(sessionId, viewerIdRef.current);

      setIsJoining(false);
      return true;
    } catch (err: any) {
      console.error('Failed to join session:', err);
      let errorMessage = 'Failed to join session';
      
      if (err.message?.includes('not found')) {
        errorMessage = 'Session not found. The broadcaster may have ended the stream.';
      } else if (err.message?.includes('finished')) {
        errorMessage = 'This session has already finished. Please request a new stream.';
      } else if (err.message?.includes('timeout') || err.message?.includes('timed out')) {
        errorMessage = 'Session expired. Please ask the broadcaster to restart.';
      }
      
      setError(errorMessage);
      setConnectionState('disconnected');
      setIsJoining(false);
      cleanup();
      return false;
    }
  };

  const startPolling = (sessId: SessionId, viewerId: string) => {
    if (!actor || !peerConnectionRef.current) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Check if session should finish
        const shouldFinish = await actor.shouldFinish(sessId);
        if (shouldFinish) {
          setError('Broadcast ended');
          setConnectionState('disconnected');
          await leaveSession();
          return;
        }

        // Poll for broadcaster candidates
        const broadcasterCandidates = await actor.getBroadcasterCandidates(sessId, viewerId);
        
        if (broadcasterCandidates && broadcasterCandidates.length > 0 && peerConnectionRef.current) {
          for (const candidate of broadcasterCandidates) {
            const rtcCandidate = new RTCIceCandidate({
              candidate: candidate.candidate,
              sdpMid: candidate.sdpMid,
              sdpMLineIndex: candidate.sdpMLineIndex ? Number(candidate.sdpMLineIndex) : null,
            });
            await peerConnectionRef.current.addIceCandidate(rtcCandidate);
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (err.message?.includes('not found') || err.message?.includes('timed out')) {
          setError('Broadcast ended or connection lost');
          setConnectionState('disconnected');
          await leaveSession();
        }
      }
    }, 2000);
  };

  const leaveSession = async () => {
    await cleanup();
    sessionIdRef.current = null;
    viewerIdRef.current = '';
    setConnectionState('idle');
    setError(null);
  };

  return {
    connectionState,
    error,
    isJoining,
    remoteVideoRef,
    joinSession,
    leaveSession,
  };
}
