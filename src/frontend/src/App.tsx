import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import CameraScreen from './pages/CameraScreen';
import EditorScreen from './pages/EditorScreen';
import GalleryScreen from './pages/GalleryScreen';
import HelpModal from './components/HelpModal';

export type Screen = 'camera' | 'editor' | 'gallery';

export interface Photo {
  id: string;
  dataUrl: string;
  timestamp: number;
  filter?: string;
  adjustments?: Record<string, number>;
  width: number;
  height: number;
  beauty?: {
    enabled: boolean;
    smoothing: number;
    whitening: number;
  };
  mask?: {
    id: string;
    opacity: number;
    scale: number;
    x: number;
    y: number;
  };
}

export interface Video {
  id: string;
  blob: Blob;
  url: string;
  timestamp: number;
  duration: number;
  mimeType: string;
}

export type MediaItem = (Photo & { type: 'photo' }) | (Video & { type: 'video' });

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const handlePhotoCapture = (photo: Photo) => {
    setCapturedPhoto(photo);
    setCurrentScreen('editor');
  };

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setCurrentScreen('editor');
  };

  const handleBackToCamera = () => {
    setCapturedPhoto(null);
    setEditingPhoto(null);
    setCurrentScreen('camera');
  };

  const handleViewGallery = () => {
    setCurrentScreen('gallery');
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-background">
        <Header 
          currentScreen={currentScreen} 
          onNavigate={setCurrentScreen}
        />
        
        <main className="flex-1 flex flex-col">
          {currentScreen === 'camera' && (
            <CameraScreen 
              onPhotoCapture={handlePhotoCapture}
              onViewGallery={handleViewGallery}
            />
          )}
          
          {currentScreen === 'editor' && (
            <EditorScreen 
              photo={capturedPhoto || editingPhoto}
              onBack={handleBackToCamera}
              onViewGallery={handleViewGallery}
            />
          )}
          
          {currentScreen === 'gallery' && (
            <GalleryScreen 
              onEditPhoto={handleEditPhoto}
              onBackToCamera={handleBackToCamera}
            />
          )}
        </main>
        
        {currentScreen !== 'camera' && <Footer />}
        <HelpModal />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
