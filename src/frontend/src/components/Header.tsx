import { Camera, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen } from '../App';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Header({ currentScreen, onNavigate }: HeaderProps) {
  const isCameraScreen = currentScreen === 'camera';
  
  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isCameraScreen ? 'lg:h-16' : ''}`}>
      <div className={`container flex items-center justify-between px-4 ${isCameraScreen ? 'h-12 lg:h-16' : 'h-16'}`}>
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent ${isCameraScreen ? 'w-8 h-8 lg:w-10 lg:h-10' : 'w-10 h-10'}`}>
            <Camera className={`text-primary-foreground ${isCameraScreen ? 'w-5 h-5 lg:w-6 lg:h-6' : 'w-6 h-6'}`} />
          </div>
          <h1 className={`font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${isCameraScreen ? 'text-base lg:text-xl' : 'text-xl'}`}>
            SnapStudio
          </h1>
        </div>
        
        <nav className="flex items-center gap-2">
          <Button
            variant={currentScreen === 'camera' ? 'default' : 'ghost'}
            size={isCameraScreen ? 'icon' : 'sm'}
            onClick={() => onNavigate('camera')}
            className={isCameraScreen ? 'gap-2 lg:w-auto lg:px-3' : 'gap-2'}
          >
            <Camera className="w-4 h-4" />
            <span className={isCameraScreen ? 'hidden lg:inline' : 'hidden sm:inline'}>Camera</span>
          </Button>
          
          <Button
            variant={currentScreen === 'gallery' ? 'default' : 'ghost'}
            size={isCameraScreen ? 'icon' : 'sm'}
            onClick={() => onNavigate('gallery')}
            className={isCameraScreen ? 'gap-2 lg:w-auto lg:px-3' : 'gap-2'}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className={isCameraScreen ? 'hidden lg:inline' : 'hidden sm:inline'}>Gallery</span>
          </Button>
          
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
