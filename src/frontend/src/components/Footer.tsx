import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-center px-4">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          © 2026. Built with <Heart className="w-3.5 h-3.5 text-destructive fill-destructive" /> using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
