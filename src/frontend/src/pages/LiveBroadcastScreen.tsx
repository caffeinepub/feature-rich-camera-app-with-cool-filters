import { useEffect, useState } from 'react';
import { useCamera } from '../camera/useCamera';
import { useLiveBroadcast } from '../hooks/live/useLiveBroadcast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Share2, Users, Radio, X } from 'lucide-react';
import { toast } from 'sonner';

interface LiveBroadcastScreenProps {
  onEnd: () => void;
}

export default function LiveBroadcastScreen({ onEnd }: LiveBroadcastScreenProps) {
  const {
    isActive,
    isSupported,
    error: cameraError,
    isLoading: cameraLoading,
    startCamera,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const {
    sessionId,
    connectionState,
    viewerCount,
    error: liveError,
    isStarting,
    startBroadcast,
    endBroadcast,
  } = useLiveBroadcast();

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    startCamera();
  }, []);

  const handleStartBroadcast = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Camera not ready');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    const success = await startBroadcast(stream);
    
    if (success) {
      setHasStarted(true);
      toast.success('Live broadcast started!');
    } else {
      toast.error('Failed to start broadcast');
    }
  };

  const handleEndBroadcast = async () => {
    await endBroadcast();
    toast.info('Broadcast ended');
    onEnd();
  };

  const getShareableLink = () => {
    if (!sessionId) return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#live-${sessionId}`;
  };

  const handleCopyCode = () => {
    if (sessionId !== null) {
      navigator.clipboard.writeText(sessionId.toString());
      toast.success('Session code copied!');
    }
  };

  const handleCopyLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const handleShare = async () => {
    const link = getShareableLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my live stream',
          text: 'Watch my live broadcast!',
          url: link,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const getStatusText = () => {
    if (!hasStarted) return 'Ready to go live';
    if (connectionState === 'connecting') return 'Connecting...';
    if (connectionState === 'connected') return 'Live';
    if (connectionState === 'disconnected') return 'Disconnected';
    return 'Waiting for viewers...';
  };

  const getStatusColor = () => {
    if (connectionState === 'connected') return 'bg-green-600';
    if (connectionState === 'connecting') return 'bg-yellow-600';
    if (connectionState === 'disconnected') return 'bg-red-600';
    return 'bg-gray-600';
  };

  if (isSupported === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <Card className="max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Camera Not Supported</h2>
          <p className="text-muted-foreground">
            Your browser doesn't support camera access required for live streaming.
          </p>
          <Button onClick={onEnd}>Back to Camera</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Camera Preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Status Indicator */}
        {hasStarted && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold z-10">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${connectionState === 'connected' ? 'animate-pulse' : ''}`} />
            {getStatusText()}
          </div>
        )}

        {/* Viewer Count */}
        {hasStarted && connectionState === 'connected' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full font-semibold z-10">
            <Users className="w-4 h-4" />
            {viewerCount}
          </div>
        )}

        {/* Loading State */}
        {cameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center space-y-2">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Camera Error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {cameraError.message}
                {cameraError.type === 'permission' && ' Please allow camera access.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Live Error */}
        {liveError && (
          <div className="absolute top-20 left-4 right-4 z-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{liveError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEndBroadcast}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm z-10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Controls Panel */}
      <div className="bg-background border-t p-4 space-y-4">
        {!hasStarted ? (
          <>
            {/* Disclaimer */}
            <Alert>
              <Radio className="h-4 w-4" />
              <AlertDescription>
                <strong>Basic P2P Live Streaming</strong>
                <br />
                This is a peer-to-peer live feature for small audiences. Connection quality depends on your network. Not suitable for large-scale broadcasts.
              </AlertDescription>
            </Alert>

            {/* Start Button */}
            <Button
              onClick={handleStartBroadcast}
              disabled={!isActive || cameraLoading || isStarting}
              className="w-full gap-2"
              size="lg"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  Go Live
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Session Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session Code</label>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 bg-muted px-4 py-2 rounded-lg font-mono text-lg font-semibold">
                    {sessionId}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Shareable Link</label>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 bg-muted px-4 py-2 rounded-lg text-sm truncate">
                    {getShareableLink()}
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* End Button */}
            <Button
              onClick={handleEndBroadcast}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              End Broadcast
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
