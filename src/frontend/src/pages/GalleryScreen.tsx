import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Download, Edit, AlertCircle, Video as VideoIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Photo, Video, MediaItem } from '../App';
import { 
  getAllPhotos, 
  deletePhoto, 
  clearAllPhotos, 
  getAllVideos,
  deleteVideo,
  clearAllMedia,
  getStorageSize 
} from '../lib/storage';

interface GalleryScreenProps {
  onEditPhoto: (photo: Photo) => void;
  onBackToCamera: () => void;
}

export default function GalleryScreen({ onEditPhoto, onBackToCamera }: GalleryScreenProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [storageSize, setStorageSize] = useState('0 KB');

  useEffect(() => {
    loadMedia();
    updateStorageSize();
  }, []);

  const loadMedia = async () => {
    const [photos, videos] = await Promise.all([getAllPhotos(), getAllVideos()]);
    
    const photoItems: MediaItem[] = photos.map(photo => ({ ...photo, type: 'photo' as const }));
    const videoItems: MediaItem[] = videos.map(video => ({ ...video, type: 'video' as const }));
    
    const allItems = [...photoItems, ...videoItems].sort((a, b) => b.timestamp - a.timestamp);
    setMediaItems(allItems);
  };

  const updateStorageSize = async () => {
    const size = await getStorageSize();
    setStorageSize(size);
  };

  const handleDelete = async (item: MediaItem) => {
    if (item.type === 'photo') {
      await deletePhoto(item.id);
      toast.success('Photo deleted');
    } else {
      await deleteVideo(item.id);
      toast.success('Video deleted');
    }
    loadMedia();
    updateStorageSize();
    setSelectedItem(null);
  };

  const handleClearAll = async () => {
    await clearAllMedia();
    toast.success('All media cleared');
    loadMedia();
    updateStorageSize();
    setShowDeleteAll(false);
  };

  const handleExport = (item: MediaItem) => {
    const link = document.createElement('a');
    
    if (item.type === 'photo') {
      link.download = `snapstudio-photo-${item.id}.jpg`;
      link.href = item.dataUrl;
    } else {
      link.download = `snapstudio-video-${item.id}.webm`;
      link.href = item.url;
    }
    
    link.click();
    toast.success(`${item.type === 'photo' ? 'Photo' : 'Video'} exported!`);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBackToCamera}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Gallery</h2>
            <p className="text-sm text-muted-foreground">
              {mediaItems.length} {mediaItems.length === 1 ? 'item' : 'items'} • {storageSize}
            </p>
          </div>
        </div>

        {mediaItems.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAll(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Gallery Grid */}
      {mediaItems.length === 0 ? (
        <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Media Yet</h3>
          <p className="text-muted-foreground mb-4">
            Capture your first photo or video to see it here
          </p>
          <Button onClick={onBackToCamera}>Go to Camera</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mediaItems.map((item) => (
            <Card
              key={item.id}
              className="group relative aspect-square overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === 'photo' ? (
                <img
                  src={item.dataUrl}
                  alt={`Photo ${item.id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <Badge className="absolute top-2 left-2 gap-1 bg-black/70 text-white">
                    <VideoIcon className="w-3 h-3" />
                    {formatDuration(item.duration)}
                  </Badge>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {item.type === 'photo' && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPhoto(item);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(item);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {selectedItem.type === 'photo' ? (
                <img
                  src={selectedItem.dataUrl}
                  alt="Selected"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  className="w-full h-auto max-h-[70vh] object-contain bg-black"
                />
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                {selectedItem.type === 'photo' && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => onEditPhoto(selectedItem)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleExport(selectedItem)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(selectedItem)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {new Date(selectedItem.timestamp).toLocaleString()}
              </p>
              {selectedItem.type === 'photo' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.width} × {selectedItem.height}
                  </p>
                  {selectedItem.filter && (
                    <p className="text-sm text-muted-foreground">
                      Filter: {selectedItem.filter}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Duration: {formatDuration(selectedItem.duration)}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Clear All Confirmation */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {mediaItems.length} items from your gallery. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
