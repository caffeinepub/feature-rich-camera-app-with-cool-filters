import { useState } from 'react';
import { HelpCircle, Camera, Grid3x3, Sparkles, Download, Database, Smile, Video as VideoIcon, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40"
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to SnapStudio!</DialogTitle>
          <DialogDescription>
            Your creative camera app with powerful filters, editing tools, video recording, and live streaming
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Camera Permissions</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                When you first open the camera, your browser will ask for permission to access your camera. 
                Click "Allow" to start capturing photos and videos. You can switch between front and back cameras on supported devices.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/10">
                  <VideoIcon className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg">Video Recording</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                Switch to Video mode to record videos. Tap the red button to start recording and tap again to stop. 
                While recording, you'll see a timer and recording indicator. After stopping, preview your video and choose to save it to the gallery or discard it.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                  <Radio className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg">Live Streaming</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                <strong>Starting a Live Broadcast:</strong> Switch to Live mode and tap "Go Live" to start broadcasting. 
                Share the session code or link with viewers so they can join your stream.
                <br /><br />
                <strong>Joining a Live Stream:</strong> Enter the session code shared by the broadcaster or open their shareable link to watch the live stream.
                <br /><br />
                <strong>Limitations:</strong> This is a basic peer-to-peer live streaming feature. Connection quality depends on both the broadcaster's and viewer's network conditions. 
                It's not designed for large-scale broadcasts or professional streaming. NAT and firewall configurations may affect connectivity.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/10">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg">Capture Tools</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                Use the timer (3s/10s) for hands-free photo shots, enable the grid overlay for better composition, 
                toggle mirror mode for selfies, and adjust zoom to get the perfect frame. Timer is only available in Photo mode.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-lg">Filters & Editing</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                After capturing a photo, apply cool filters like Vintage, Neon Pop, Cinematic, and more. 
                Adjust intensity with sliders, crop to different aspect ratios, rotate, flip, and add stickers or frames.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                  <Smile className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold text-lg">Beauty Effects</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                Use the Beauty tab to enhance your photos with smoothing (softens skin texture) and whitening (brightens skin tone). 
                Adjust the intensity of each effect independently to achieve your desired look.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                  <Sparkles className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-semibold text-lg">Mask Overlays</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                Add fun mask overlays to your photos from the Creative tab. Choose from masquerade, cyber visor, or cute masks. 
                Adjust opacity, size, and position to perfectly place the mask on your photo.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Saving & Exporting</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                Save your edited photos and recorded videos to the gallery. Export photos as PNG or JPEG with adjustable quality. 
                Export videos in their original format. All media is stored locally in your browser.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">Gallery & Storage</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-13">
                All your photos and videos are stored locally in your browser using IndexedDB. 
                Your media stays private and is never uploaded to any server. You can view, edit, export, or delete items from the gallery at any time.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
