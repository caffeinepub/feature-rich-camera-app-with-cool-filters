import { useState, useEffect } from 'react';
import { Camera, AlertCircle, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { useCamera } from '../camera/useCamera';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Photo, Video } from '../App';
import { saveVideoToGallery } from '../lib/storage';
import MobileCameraOverlay from '../components/camera/MobileCameraOverlay';

interface CameraScreenProps {
  onPhotoCapture: (photo: Photo) => void;
  onViewGallery: () => void;
  onStartLive: () => void;
}

type CaptureMode = 'photo' | 'video' | 'live';

export default function CameraScreen({ onPhotoCapture, onViewGallery, onStartLive }: CameraScreenProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    currentFacingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const {
    isRecording,
    elapsedTime,
    error: videoError,
    isSupported: isVideoSupported,
    videoBlob,
    videoUrl,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVideoRecorder();

  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [showGrid, setShowGrid] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [timer, setTimer] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  useEffect(() => {
    if (currentFacingMode === 'user') {
      setMirror(true);
    }
  }, [currentFacingMode]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timeout = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timeout);
    } else if (countdown === 0) {
      handleCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const photo: Photo = {
            id: Date.now().toString(),
            dataUrl: e.target?.result as string,
            timestamp: Date.now(),
            width: img.width,
            height: img.height,
          };
          onPhotoCapture(photo);
          toast.success('Photo captured!');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureClick = () => {
    if (timer > 0) {
      setCountdown(timer);
      toast.info(`Timer started: ${timer}s`);
    } else {
      handleCapture();
    }
  };

  const handleStartRecording = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('Camera not ready');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    const success = await startRecording(stream);
    
    if (success) {
      toast.success('Recording started');
    } else {
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
    toast.success('Recording stopped');
    setShowVideoPreview(true);
  };

  const handleSaveVideo = async () => {
    if (!videoBlob) return;

    const video: Omit<Video, 'url'> = {
      id: Date.now().toString(),
      blob: videoBlob,
      timestamp: Date.now(),
      duration: elapsedTime,
      mimeType: videoBlob.type,
    };

    await saveVideoToGallery(video);
    toast.success('Video saved to gallery!');
    clearRecording();
    setShowVideoPreview(false);
  };

  const handleDiscardVideo = () => {
    clearRecording();
    setShowVideoPreview(false);
    toast.info('Video discarded');
  };

  const handleSwitchCamera = async () => {
    const success = await switchCamera();
    if (success) {
      toast.success('Camera switched');
    }
  };

  const handleCaptureModeChange = (mode: CaptureMode) => {
    if (mode === 'live') {
      onStartLive();
    } else {
      setCaptureMode(mode);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSupported === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Camera Not Supported</h2>
          <p className="text-muted-foreground">
            Your browser doesn't support camera access. Please try a modern browser like Chrome, Firefox, or Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Layout (lg+) */}
      <div className="hidden lg:flex flex-1 flex-row gap-4 p-4">
        {/* Camera Preview */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden relative">
            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                  {error.type === 'permission' && ' Please allow camera access in your browser settings.'}
                </AlertDescription>
              </Alert>
            )}

            {videoError && captureMode === 'video' && (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{videoError.message}</AlertDescription>
              </Alert>
            )}

            <div className="relative w-full h-full min-h-[400px] bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
                style={{ transform: `scale(${zoom}) ${mirror ? 'scaleX(-1)' : ''}` }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Grid Overlay */}
              {showGrid && isActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/30" />
                    ))}
                  </div>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-semibold">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  REC {formatTime(elapsedTime)}
                </div>
              )}

              {/* Countdown */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-8xl font-bold text-white animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center space-y-2">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}

              {/* Start Camera Prompt */}
              {!isActive && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    onClick={startCamera}
                    className="gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </Button>
                </div>
              )}

              {/* Retry Button */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    onClick={retry}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Capture Button */}
          {isActive && (
            <div className="flex justify-center">
              {captureMode === 'photo' ? (
                <Button
                  size="lg"
                  onClick={handleCaptureClick}
                  disabled={countdown !== null || isRecording}
                  className="w-20 h-20 rounded-full p-0 relative"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={!isVideoSupported || countdown !== null}
                  className={`w-20 h-20 rounded-full p-0 relative ${isRecording ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  <div className={`${isRecording ? 'w-8 h-8 rounded-sm' : 'w-16 h-16 rounded-full'} bg-white`} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <MobileCameraOverlay
          isActive={isActive}
          isLoading={isLoading}
          currentFacingMode={currentFacingMode}
          timer={timer}
          showGrid={showGrid}
          mirror={mirror}
          zoom={zoom}
          captureMode={captureMode}
          isRecording={isRecording}
          onSwitchCamera={handleSwitchCamera}
          onTimerChange={setTimer}
          onGridToggle={() => setShowGrid(!showGrid)}
          onMirrorToggle={() => setMirror(!mirror)}
          onZoomChange={setZoom}
          onViewGallery={onViewGallery}
          onCaptureModeChange={handleCaptureModeChange}
          isDesktop={true}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex-1 flex flex-col relative bg-black">
        {/* Full-screen Camera Preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
            style={{ transform: `scale(${zoom}) ${mirror ? 'scaleX(-1)' : ''}` }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Grid Overlay */}
          {showGrid && isActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-semibold z-50">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              REC {formatTime(elapsedTime)}
            </div>
          )}

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <div className="text-8xl font-bold text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <div className="text-white text-center space-y-2">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {/* Start Camera Prompt */}
          {!isActive && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <Button
                size="lg"
                onClick={startCamera}
                className="gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Camera
              </Button>
            </div>
          )}

          {/* Retry Button */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4">
              <Alert variant="destructive" className="mb-4 max-w-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                  {error.type === 'permission' && ' Please allow camera access in your browser settings.'}
                </AlertDescription>
              </Alert>
              <Button
                size="lg"
                onClick={retry}
                variant="secondary"
                className="gap-2"
              >
                <Camera className="w-5 h-5" />
                Retry
              </Button>
            </div>
          )}

          {/* Video Error */}
          {videoError && captureMode === 'video' && !error && (
            <div className="absolute top-20 left-4 right-4 z-40">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{videoError.message}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Mobile Overlay Controls */}
        {isActive && (
          <MobileCameraOverlay
            isActive={isActive}
            isLoading={isLoading}
            currentFacingMode={currentFacingMode}
            timer={timer}
            showGrid={showGrid}
            mirror={mirror}
            zoom={zoom}
            countdown={countdown}
            captureMode={captureMode}
            isRecording={isRecording}
            onSwitchCamera={handleSwitchCamera}
            onTimerChange={setTimer}
            onGridToggle={() => setShowGrid(!showGrid)}
            onMirrorToggle={() => setMirror(!mirror)}
            onZoomChange={setZoom}
            onViewGallery={onViewGallery}
            onCapture={handleCaptureClick}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCaptureModeChange={handleCaptureModeChange}
            isDesktop={false}
          />
        )}
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          
          {videoUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDiscardVideo}>
              Discard
            </Button>
            <Button onClick={handleSaveVideo}>
              Save to Gallery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
