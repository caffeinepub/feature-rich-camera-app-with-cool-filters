import { useState, useEffect } from 'react';
import { useLiveViewer } from '../hooks/live/useLiveViewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Radio, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface LiveViewerScreenProps {
  initialSessionCode: string | null;
  onExit: () => void;
}

export default function LiveViewerScreen({ initialSessionCode, onExit }: LiveViewerScreenProps) {
  const [sessionCode, setSessionCode] = useState(initialSessionCode || '');
  const [hasJoined, setHasJoined] = useState(false);

  const {
    connectionState,
    error,
    isJoining,
    remoteVideoRef,
    joinSession,
    leaveSession,
  } = useLiveViewer();

  useEffect(() => {
    if (initialSessionCode) {
      handleJoin();
    }
  }, [initialSessionCode]);

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      toast.error('Please enter a session code');
      return;
    }

    const sessionId = BigInt(sessionCode.trim());
    const success = await joinSession(sessionId);
    
    if (success) {
      setHasJoined(true);
      toast.success('Joined live session!');
    } else {
      toast.error('Failed to join session');
    }
  };

  const handleLeave = async () => {
    await leaveSession();
    toast.info('Left session');
    onExit();
  };

  const getStatusText = () => {
    if (connectionState === 'connecting') return 'Connecting to broadcaster...';
    if (connectionState === 'connected') return 'Connected';
    if (connectionState === 'disconnected') return 'Disconnected';
    return 'Waiting...';
  };

  const getStatusColor = () => {
    if (connectionState === 'connected') return 'bg-green-600';
    if (connectionState === 'connecting') return 'bg-yellow-600';
    if (connectionState === 'disconnected') return 'bg-red-600';
    return 'bg-gray-600';
  };

  if (!hasJoined) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Radio className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Join Live Stream</h2>
            <p className="text-muted-foreground">
              Enter the session code shared by the broadcaster
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Code</label>
              <Input
                type="text"
                placeholder="Enter code (e.g., 0)"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="text-center text-lg font-mono"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onExit} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                disabled={!sessionCode.trim() || isJoining}
                className="flex-1 gap-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Stream'
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <Radio className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This is a basic peer-to-peer connection. Stream quality depends on both your network and the broadcaster's connection.
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Video Player */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          controls
          className="w-full h-full object-contain bg-black"
        />

        {/* Status Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold z-10">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${connectionState === 'connected' ? 'animate-pulse' : ''}`} />
          {getStatusText()}
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeave}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Loading State */}
        {connectionState === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center space-y-2">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Connecting to broadcaster...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && connectionState === 'disconnected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <Card className="max-w-md p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Connection Failed</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleLeave} className="w-full">
                Exit Stream
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
