import { SwitchCamera, Grid3x3, Timer, Maximize, Image as ImageIcon, FlipHorizontal2, Video as VideoIcon, Camera, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

type CaptureMode = 'photo' | 'video' | 'live';

interface MobileCameraOverlayProps {
  isActive: boolean;
  isLoading: boolean;
  currentFacingMode: 'user' | 'environment';
  timer: 0 | 3 | 10;
  showGrid: boolean;
  mirror: boolean;
  zoom: number;
  countdown?: number | null;
  captureMode?: CaptureMode;
  isRecording?: boolean;
  onSwitchCamera: () => void;
  onTimerChange: (timer: 0 | 3 | 10) => void;
  onGridToggle: () => void;
  onMirrorToggle: () => void;
  onZoomChange: (zoom: number) => void;
  onViewGallery: () => void;
  onCapture?: () => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCaptureModeChange?: (mode: CaptureMode) => void;
  isDesktop: boolean;
}

export default function MobileCameraOverlay({
  isActive,
  isLoading,
  currentFacingMode,
  timer,
  showGrid,
  mirror,
  zoom,
  countdown,
  captureMode = 'photo',
  isRecording = false,
  onSwitchCamera,
  onTimerChange,
  onGridToggle,
  onMirrorToggle,
  onZoomChange,
  onViewGallery,
  onCapture,
  onStartRecording,
  onStopRecording,
  onCaptureModeChange,
  isDesktop,
}: MobileCameraOverlayProps) {
  if (isDesktop) {
    // Desktop: Side panel layout
    return (
      <Card className="w-full lg:w-80 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Camera Controls</h2>
          
          <div className="space-y-4">
            {/* Capture Mode Toggle */}
            {onCaptureModeChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Capture Mode</label>
                <div className="flex gap-2">
                  <Button
                    variant={captureMode === 'photo' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => onCaptureModeChange('photo')}
                    disabled={isRecording}
                  >
                    <Camera className="w-4 h-4" />
                    Photo
                  </Button>
                  <Button
                    variant={captureMode === 'video' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => onCaptureModeChange('video')}
                    disabled={isRecording}
                  >
                    <VideoIcon className="w-4 h-4" />
                    Video
                  </Button>
                  <Button
                    variant={captureMode === 'live' ? 'default' : 'outline'}
                    className="flex-1 gap-2"
                    onClick={() => onCaptureModeChange('live')}
                    disabled={isRecording}
                  >
                    <Radio className="w-4 h-4" />
                    Live
                  </Button>
                </div>
              </div>
            )}

            {/* Switch Camera */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onSwitchCamera}
              disabled={!isActive || isLoading || isRecording}
            >
              <SwitchCamera className="w-4 h-4" />
              Switch Camera ({currentFacingMode === 'user' ? 'Front' : 'Back'})
            </Button>

            {/* Timer - Only for photo mode */}
            {captureMode === 'photo' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Timer
                </label>
                <div className="flex gap-2">
                  {[0, 3, 10].map((t) => (
                    <Button
                      key={t}
                      variant={timer === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onTimerChange(t as 0 | 3 | 10)}
                      className="flex-1"
                      disabled={isRecording}
                    >
                      {t === 0 ? 'Off' : `${t}s`}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid */}
            <Button
              variant={showGrid ? 'default' : 'outline'}
              className="w-full justify-start gap-2"
              onClick={onGridToggle}
              disabled={isRecording}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid Overlay
            </Button>

            {/* Mirror */}
            <Button
              variant={mirror ? 'default' : 'outline'}
              className="w-full justify-start gap-2"
              onClick={onMirrorToggle}
              disabled={isRecording}
            >
              <FlipHorizontal2 className="w-4 h-4" />
              Mirror Mode
            </Button>

            {/* Zoom */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Maximize className="w-4 h-4" />
                Zoom: {zoom.toFixed(1)}x
              </label>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => onZoomChange(v)}
                min={1}
                max={3}
                step={0.1}
                disabled={!isActive || isRecording}
              />
            </div>

            {/* Gallery Button */}
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={onViewGallery}
              disabled={isRecording}
            >
              <ImageIcon className="w-4 h-4" />
              View Gallery
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Mobile: Overlay layout
  return (
    <>
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 camera-overlay-top">
        <div className="flex items-center justify-between p-3 pb-safe">
          {/* Capture Mode Toggle */}
          {onCaptureModeChange && (
            <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-full p-1">
              <Button
                variant={captureMode === 'photo' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCaptureModeChange('photo')}
                disabled={isRecording}
                className={`h-8 px-3 rounded-full text-xs ${captureMode === 'photo' ? '' : 'text-white hover:text-white hover:bg-white/20'}`}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                variant={captureMode === 'video' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCaptureModeChange('video')}
                disabled={isRecording}
                className={`h-8 px-3 rounded-full text-xs ${captureMode === 'video' ? '' : 'text-white hover:text-white hover:bg-white/20'}`}
              >
                <VideoIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={captureMode === 'live' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onCaptureModeChange('live')}
                disabled={isRecording}
                className={`h-8 px-3 rounded-full text-xs ${captureMode === 'live' ? '' : 'text-white hover:text-white hover:bg-white/20'}`}
              >
                <Radio className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Timer Control - Only for photo mode */}
          {captureMode === 'photo' && (
            <div className="flex gap-1 bg-black/50 backdrop-blur-sm rounded-full p-1">
              {[0, 3, 10].map((t) => (
                <Button
                  key={t}
                  variant={timer === t ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onTimerChange(t as 0 | 3 | 10)}
                  disabled={isRecording}
                  className={`h-8 px-3 rounded-full text-xs ${timer === t ? '' : 'text-white hover:text-white hover:bg-white/20'}`}
                >
                  {t === 0 ? <Timer className="w-4 h-4" /> : `${t}s`}
                </Button>
              ))}
            </div>
          )}

          {/* Grid & Mirror Toggle */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onGridToggle}
              disabled={isRecording}
              className={`h-10 w-10 rounded-full ${showGrid ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'}`}
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onMirrorToggle}
              disabled={isRecording}
              className={`h-10 w-10 rounded-full ${mirror ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'}`}
            >
              <FlipHorizontal2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Overlay Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 camera-overlay-bottom">
        <div className="flex flex-col items-center gap-4 p-4 pb-safe-extra">
          {/* Zoom Slider */}
          {zoom > 1 && (
            <div className="w-full max-w-xs bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="flex items-center gap-3">
                <Maximize className="w-4 h-4 text-white flex-shrink-0" />
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => onZoomChange(v)}
                  min={1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                  disabled={isRecording}
                />
                <span className="text-white text-sm font-medium w-10 text-right">
                  {zoom.toFixed(1)}x
                </span>
              </div>
            </div>
          )}

          {/* Main Controls */}
          <div className="flex items-center justify-between w-full max-w-md">
            {/* Gallery Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onViewGallery}
              disabled={isRecording}
              className="h-14 w-14 rounded-full bg-black/50 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              <ImageIcon className="w-6 h-6" />
            </Button>

            {/* Capture/Record Button */}
            <div className="relative">
              {captureMode === 'photo' ? (
                <Button
                  size="lg"
                  onClick={onCapture}
                  disabled={countdown !== null || isRecording}
                  className="w-20 h-20 rounded-full p-0 relative bg-white/20 hover:bg-white/30 backdrop-blur-sm border-4 border-white"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  disabled={countdown !== null}
                  className={`w-20 h-20 rounded-full p-0 relative backdrop-blur-sm border-4 ${
                    isRecording 
                      ? 'bg-red-600/80 hover:bg-red-700/80 border-red-600' 
                      : 'bg-white/20 hover:bg-white/30 border-white'
                  }`}
                >
                  <div className={`${isRecording ? 'w-8 h-8 rounded-sm bg-white' : 'w-16 h-16 rounded-full bg-red-600'}`} />
                </Button>
              )}
            </div>

            {/* Switch Camera Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onSwitchCamera}
              disabled={!isActive || isLoading || isRecording}
              className="h-14 w-14 rounded-full bg-black/50 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              <SwitchCamera className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
