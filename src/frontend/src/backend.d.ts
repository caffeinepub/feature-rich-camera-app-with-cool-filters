import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = string;
export type SessionId = bigint;
export type Candidates = Array<Candidate>;
export interface Candidate {
    usernameFragment?: string;
    candidate: string;
    sdpMid?: string;
    sdpMLineIndex?: bigint;
}
export interface Offer {
    sdp: string;
    type: string;
}
export interface backendInterface {
    addBroadcasterCandidates(sessionId: SessionId, candidates: Candidates): Promise<void>;
    addViewerCandidates(sessionId: SessionId, viewerId: UserId, candidates: Candidates): Promise<void>;
    getBroadcasterCandidates(sessionId: SessionId, viewerId: UserId): Promise<Candidates>;
    getOffer(sessionId: SessionId, viewerId: UserId): Promise<Offer>;
    getViewerCandidates(sessionId: SessionId, viewerId: UserId): Promise<Candidates>;
    joinAsViewer(sessionId: SessionId, viewerId: UserId): Promise<void>;
    sendAnswer(sessionId: SessionId, viewerId: UserId, answer: Offer): Promise<void>;
    shouldFinish(sessionId: SessionId): Promise<boolean>;
    startBroadcast(broadcasterId: UserId, offer: Offer): Promise<void>;
}
