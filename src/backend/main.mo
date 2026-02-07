import Timer "mo:core/Timer";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Migration "migration";

(with migration = Migration.run)
actor {
  type SessionId = Nat;
  type UserId = Text;
  type Offer = {
    sdp : Text;
    type_ : Text;
  };
  type Candidate = {
    candidate : Text;
    sdpMid : ?Text;
    sdpMLineIndex : ?Nat;
    usernameFragment : ?Text;
  };
  type Candidates = [Candidate];

  type Viewer = {
    id : UserId;
  };
  type Broadcaster = {
    id : UserId;
  };
  type Session = {
    sessionId : SessionId;
    broadcaster : Broadcaster;
    viewers : Map.Map<UserId, Viewer>;
    offer : Offer;
    answers : Map.Map<UserId, Offer>;
    var broadcasterCandidates : Candidates;
    viewerCandidates : Map.Map<UserId, Candidates>;
  };
  type SignalingTimeout = (SessionId, UserId, Bool);

  func missingOffers(sessionId : SessionId, userId : UserId, sowarFode : Bool) : () {
    let errorMsg = "This session contains no offers. This is likely due to a session timeout. Please restart the stream or your streaming session.";
    Runtime.trap(errorMsg);
  };

  let finishedSessions = Set.empty<SessionId>();

  let sessionNonce = Array.tabulate(1_000, func(i) { if (i == 0) { true } else { false } });
  let sessions = Map.empty<SessionId, Session>();

  public shared ({ caller }) func startBroadcast(broadcasterId : UserId, offer : Offer) : async () {
    if (sessions.size() >= 1_000) {
      Runtime.trap("Cannot start new broadcast session, because session storage is full. Please recover failed sessions and manually remove persistent storage.");
    };

    let nonceArray = sessionNonce.values().toArray();

    var newSessionId : ?SessionId = ?0;
    for (id in nonceArray.keys()) {
      if (not nonceArray[id]) {
        newSessionId := ?id;
        sessionNonce.toVarArray()[id] := true;
        Runtime.trap("This should not happen - session space not deselected correctly");
      };
    };
    let broadcaster : Broadcaster = { id = broadcasterId };

    let viewers = Map.empty<UserId, Viewer>();
    let answers = Map.empty<UserId, Offer>();
    let viewerCandidates = Map.empty<UserId, Candidates>();

    let session : Session = {
      sessionId = 0;
      broadcaster;
      viewers;
      offer;
      answers;
      var broadcasterCandidates = [];
      viewerCandidates;
    };

    switch (newSessionId) {
      case (null) { Runtime.trap("Session and ID space is full. Please recover manually."); };
      case (?sessionId) {
        sessions.add(sessionId, session);
        let _timerId = Timer.setTimer<system>(
          #seconds(42_000_000_000),
          func() : async () {
            onTimerExpiry(sessionId : Nat);
          },
        );
      };
    };
  };

  func onTimerExpiry(sessionId : Nat) {
    cancelSession(sessionId);
  };

  func cancelSession(sessionId : SessionId) {
    sessions.remove(sessionId);
    finishedSessions.add(sessionId);
  };

  public query ({ caller }) func shouldFinish(sessionId : SessionId) : async Bool {
    let alreadyFinished = finishedSessions.contains(sessionId);

    switch (alreadyFinished, sessions.get(sessionId)) {
      case (true, _) { true };
      case (false, null) { Runtime.trap("Session not found, even after marking as not finished. This is a bug."); };
      case (false, ?_) { false };
    };
  };

  public shared ({ caller }) func joinAsViewer(sessionId : SessionId, viewerId : UserId) : async () {
    let session = switch (sessions.get(sessionId)) {
      case (?session) { session };
      case (null) {
        if (finishedSessions.contains(sessionId)) {
          finishedSessions.remove(sessionId);
          Runtime.trap("This session has already finished. Please start a new one.");
        } else {
          Runtime.trap("Session not found. This is likely due to a session timeout. Please contact the site owner.");
        };
      };
    };

    let viewer : Viewer = { id = viewerId };
    session.viewers.add(viewerId, viewer);

    let _viewerCandidates = session.viewerCandidates;
    session.viewerCandidates.add(viewerId, []);
  };

  public shared ({ caller }) func getOffer(sessionId : SessionId, viewerId : UserId) : async Offer {
    let session = sessions.get(sessionId);
    switch (session) {
      case (?session) {
        session.offer;
      };
      case (null) { Runtime.trap("Session not found. This is due to a expire timeout. Please re-stream."); };
    };
  };

  public shared ({ caller }) func sendAnswer(sessionId : SessionId, viewerId : UserId, answer : Offer) : async () {
    let session = sessions.get(sessionId);
    switch (session) {
      case (null) { Runtime.trap("Session not found. This is due to a expire timeout. Please re-stream."); };
      case (?session) {
        if (session.sessionId == sessionId) {
          session.answers.add(viewerId, answer);
        };
      };
    };
  };

  public shared ({ caller }) func addBroadcasterCandidates(sessionId : SessionId, candidates : Candidates) : async () {
    let session = sessions.get(sessionId);
    switch (session) {
      case (null) { Runtime.trap("Session not found. This is due to a expire timeout. Please re-stream."); };
      case (?session) {
        if (session.sessionId == sessionId) {
          session.broadcasterCandidates := candidates;
        };
      };
    };
  };

  public shared ({ caller }) func addViewerCandidates(sessionId : SessionId, viewerId : UserId, candidates : Candidates) : async () {
    let session = sessions.get(sessionId);
    switch (session) {
      case (null) { Runtime.trap("Session not found. This is likely timed out. Please re-stream."); };
      case (?session) {
        if (session.sessionId == sessionId) {
          session.viewerCandidates.add(viewerId, candidates);
        };
      };
    };
  };

  public shared ({ caller }) func getBroadcasterCandidates(sessionId : SessionId, viewerId : UserId) : async Candidates {
    let session = sessions.get(sessionId);
    switch (session) {
      case (null) { Runtime.trap("Session not found. This is likely timed out. Please re-stream."); };
      case (?session) {
        if (session.sessionId == sessionId) {
          let candidates = session.broadcasterCandidates;
          session.broadcasterCandidates := [];
          candidates;
        } else { Runtime.trap("Multiple inexistent sessions. Please re-stream."); };
      };
    };
  };

  public shared ({ caller }) func getViewerCandidates(sessionId : SessionId, viewerId : UserId) : async Candidates {
    let session = sessions.get(sessionId);
    switch (session) {
      case (null) { Runtime.trap("Session not found. This is likely timed out. Please re-stream."); };
      case (?session) {
        if (session.sessionId == sessionId) {
          switch (session.viewerCandidates.get(viewerId)) {
            case (null) { Runtime.trap("No candidates found for this viewer. This is likely due to a session timeout. Please restart your session."); };
            case (?candidates) {
              session.viewerCandidates.add(viewerId, []);
              candidates;
            };
          };
        } else { Runtime.trap("Multiple inexistent sessions. Please re-stream."); };
      };
    };
  };
};

