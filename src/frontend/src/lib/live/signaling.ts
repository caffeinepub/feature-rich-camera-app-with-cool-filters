import { backendInterface } from '../../backend';
import type { SessionId, UserId, Offer, Candidate, Candidates } from '../../backend';

export class SignalingClient {
  private actor: backendInterface;

  constructor(actor: backendInterface) {
    this.actor = actor;
  }

  async startBroadcast(broadcasterId: UserId, offer: Offer): Promise<void> {
    try {
      await this.actor.startBroadcast(broadcasterId, offer);
    } catch (err: any) {
      throw new Error(`Failed to start broadcast: ${err.message}`);
    }
  }

  async joinAsViewer(sessionId: SessionId, viewerId: UserId): Promise<void> {
    try {
      await this.actor.joinAsViewer(sessionId, viewerId);
    } catch (err: any) {
      throw new Error(`Failed to join session: ${err.message}`);
    }
  }

  async getOffer(sessionId: SessionId, viewerId: UserId): Promise<Offer> {
    try {
      return await this.actor.getOffer(sessionId, viewerId);
    } catch (err: any) {
      throw new Error(`Failed to get offer: ${err.message}`);
    }
  }

  async sendAnswer(sessionId: SessionId, viewerId: UserId, answer: Offer): Promise<void> {
    try {
      await this.actor.sendAnswer(sessionId, viewerId, answer);
    } catch (err: any) {
      throw new Error(`Failed to send answer: ${err.message}`);
    }
  }

  async addBroadcasterCandidates(sessionId: SessionId, candidates: Candidates): Promise<void> {
    try {
      await this.actor.addBroadcasterCandidates(sessionId, candidates);
    } catch (err: any) {
      throw new Error(`Failed to add broadcaster candidates: ${err.message}`);
    }
  }

  async addViewerCandidates(sessionId: SessionId, viewerId: UserId, candidates: Candidates): Promise<void> {
    try {
      await this.actor.addViewerCandidates(sessionId, viewerId, candidates);
    } catch (err: any) {
      throw new Error(`Failed to add viewer candidates: ${err.message}`);
    }
  }

  async getBroadcasterCandidates(sessionId: SessionId, viewerId: UserId): Promise<Candidates> {
    try {
      return await this.actor.getBroadcasterCandidates(sessionId, viewerId);
    } catch (err: any) {
      throw new Error(`Failed to get broadcaster candidates: ${err.message}`);
    }
  }

  async getViewerCandidates(sessionId: SessionId, viewerId: UserId): Promise<Candidates> {
    try {
      return await this.actor.getViewerCandidates(sessionId, viewerId);
    } catch (err: any) {
      throw new Error(`Failed to get viewer candidates: ${err.message}`);
    }
  }

  async shouldFinish(sessionId: SessionId): Promise<boolean> {
    try {
      return await this.actor.shouldFinish(sessionId);
    } catch (err: any) {
      return true; // Assume finished on error
    }
  }

  // Helper to convert browser RTCIceCandidate to backend Candidate type
  static toBrowserCandidate(candidate: Candidate): RTCIceCandidateInit {
    return {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex ? Number(candidate.sdpMLineIndex) : null,
    };
  }

  // Helper to convert backend Candidate to browser RTCIceCandidate
  static toBackendCandidate(candidate: RTCIceCandidate): Candidate {
    return {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid || undefined,
      sdpMLineIndex: candidate.sdpMLineIndex !== null ? BigInt(candidate.sdpMLineIndex) : undefined,
      usernameFragment: candidate.usernameFragment || undefined,
    };
  }
}
