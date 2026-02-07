import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Save, RotateCw, Crop, Sticker, Sparkles, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Photo } from '../App';
import { savePhotoToGallery } from '../lib/storage';
import { applyFilter, FilterType, applyBeauty } from '../lib/filters';

interface EditorScreenProps {
  photo: Photo | null;
  onBack: () => void;
  onViewGallery: () => void;
}

const FILTERS: { name: string; type: FilterType }[] = [
  { name: 'Original', type: 'original' },
  { name: 'Black & White', type: 'blackwhite' },
  { name: 'Sepia', type: 'sepia' },
  { name: 'Vintage', type: 'vintage' },
  { name: 'Neon Pop', type: 'neon' },
  { name: 'Cinematic', type: 'cinematic' },
  { name: 'Blur', type: 'blur' },
  { name: 'Sharpen', type: 'sharpen' },
  { name: 'Edge Sketch', type: 'edge' },
];

const ASPECT_RATIOS = [
  { name: 'Free', value: 'free' },
  { name: '1:1', value: '1:1' },
  { name: '4:5', value: '4:5' },
  { name: '16:9', value: '16:9' },
];

const STICKERS = ['⭐', '❤️', '🔥', '✨', '🎨', '📸', '🌈', '🎭'];

const MASKS = [
  { id: 'none', name: 'None', path: '' },
  { id: 'masquerade', name: 'Masquerade', path: '/assets/generated/mask-masquerade.dim_512x512.png' },
  { id: 'cyber-visor', name: 'Cyber Visor', path: '/assets/generated/mask-cyber-visor.dim_512x512.png' },
  { id: 'cute', name: 'Cute', path: '/assets/generated/mask-cute.dim_512x512.png' },
];

export default function EditorScreen({ photo, onBack, onViewGallery }: EditorScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(photo?.filter as FilterType || 'original');
  const [filterIntensity, setFilterIntensity] = useState(photo?.adjustments?.intensity || 100);
  const [rotation, setRotation] = useState(photo?.adjustments?.rotation || 0);
  const [flipH, setFlipH] = useState(photo?.adjustments?.flipH === 1);
  const [flipV, setFlipV] = useState(photo?.adjustments?.flipV === 1);
  const [aspectRatio, setAspectRatio] = useState('free');
  const [stickers, setStickers] = useState<Array<{ emoji: string; x: number; y: number }>>([]);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [exportQuality, setExportQuality] = useState(90);
  
  // Beauty filter state
  const [beautyEnabled, setBeautyEnabled] = useState(photo?.beauty?.enabled || false);
  const [smoothing, setSmoothing] = useState(photo?.beauty?.smoothing || 50);
  const [whitening, setWhitening] = useState(photo?.beauty?.whitening || 30);
  
  // Mask overlay state
  const [selectedMask, setSelectedMask] = useState(photo?.mask?.id || 'none');
  const [maskOpacity, setMaskOpacity] = useState(photo?.mask?.opacity || 80);
  const [maskScale, setMaskScale] = useState(photo?.mask?.scale || 100);
  const [maskX, setMaskX] = useState(photo?.mask?.x || 50);
  const [maskY, setMaskY] = useState(photo?.mask?.y || 50);
  
  const [loadedMaskImage, setLoadedMaskImage] = useState<HTMLImageElement | null>(null);

  // Load mask image when selection changes
  useEffect(() => {
    if (selectedMask === 'none') {
      setLoadedMaskImage(null);
      return;
    }

    const mask = MASKS.find(m => m.id === selectedMask);
    if (!mask || !mask.path) {
      setLoadedMaskImage(null);
      return;
    }

    const img = document.createElement('img');
    img.onload = () => {
      setLoadedMaskImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load mask:', mask.path);
      toast.error('Failed to load mask image');
      setLoadedMaskImage(null);
    };
    img.src = mask.path;
  }, [selectedMask]);

  useEffect(() => {
    if (photo) {
      renderCanvas();
    }
  }, [photo, selectedFilter, filterIntensity, rotation, flipH, flipV, stickers, beautyEnabled, smoothing, whitening, loadedMaskImage, maskOpacity, maskScale, maskX, maskY]);

  const renderCanvas = () => {
    if (!photo || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Apply beauty filter first (if enabled)
      if (beautyEnabled) {
        applyBeauty(ctx, canvas.width, canvas.height, smoothing / 100, whitening / 100);
      }

      // Apply selected filter
      applyFilter(ctx, canvas.width, canvas.height, selectedFilter, filterIntensity / 100);

      // Draw stickers
      stickers.forEach(({ emoji, x, y }) => {
        ctx.font = '48px Arial';
        ctx.fillText(emoji, x, y);
      });

      // Draw mask overlay
      if (loadedMaskImage && selectedMask !== 'none') {
        ctx.save();
        ctx.globalAlpha = maskOpacity / 100;
        
        const scale = maskScale / 100;
        const maskWidth = loadedMaskImage.width * scale;
        const maskHeight = loadedMaskImage.height * scale;
        
        // Position mask (x and y are percentages of canvas dimensions)
        const x = (maskX / 100) * canvas.width - maskWidth / 2;
        const y = (maskY / 100) * canvas.height - maskHeight / 2;
        
        ctx.drawImage(loadedMaskImage, x, y, maskWidth, maskHeight);
        ctx.restore();
      }
    };
    img.src = photo.dataUrl;
  };

  const handleAddSticker = (emoji: string) => {
    setStickers([...stickers, { emoji, x: 100, y: 100 }]);
    toast.success('Sticker added!');
  };

  const handleRotate = () => {
    setRotation((rotation + 90) % 360);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL(`image/${exportFormat}`, exportQuality / 100);
    const editedPhoto: Photo = {
      ...photo!,
      id: Date.now().toString(),
      dataUrl,
      timestamp: Date.now(),
      filter: selectedFilter,
      adjustments: { 
        intensity: filterIntensity, 
        rotation, 
        flipH: flipH ? 1 : 0, 
        flipV: flipV ? 1 : 0 
      },
      beauty: {
        enabled: beautyEnabled,
        smoothing,
        whitening,
      },
      mask: selectedMask !== 'none' ? {
        id: selectedMask,
        opacity: maskOpacity,
        scale: maskScale,
        x: maskX,
        y: maskY,
      } : undefined,
    };

    await savePhotoToGallery(editedPhoto);
    toast.success('Photo saved to gallery!');
    onViewGallery();
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL(`image/${exportFormat}`, exportQuality / 100);
    const link = document.createElement('a');
    link.download = `snapstudio-${Date.now()}.${exportFormat}`;
    link.href = dataUrl;
    link.click();
    toast.success('Photo exported!');
  };

  if (!photo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No photo to edit</p>
          <Button onClick={onBack} className="mt-4">
            Back to Camera
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
      {/* Preview */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Edit Photo</h2>
        </div>

        <Card className="flex-1 overflow-hidden flex items-center justify-center bg-muted/20">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            Save to Gallery
          </Button>
          <Button onClick={handleExport} variant="secondary" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Editor Panel */}
      <Card className="w-full lg:w-96 p-6">
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="beauty">Beauty</TabsTrigger>
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="creative">Creative</TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-2">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.type}
                  variant={selectedFilter === filter.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.type)}
                  className="h-auto py-2 text-xs"
                >
                  {filter.name}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Intensity: {filterIntensity}%</label>
              <Slider
                value={[filterIntensity]}
                onValueChange={([v]) => setFilterIntensity(v)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </TabsContent>

          <TabsContent value="beauty" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4" />
                <Label htmlFor="beauty-toggle" className="text-sm font-medium">
                  Enable Beauty Effect
                </Label>
              </div>
              <Switch
                id="beauty-toggle"
                checked={beautyEnabled}
                onCheckedChange={setBeautyEnabled}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Smoothing: {smoothing}%</label>
              <Slider
                value={[smoothing]}
                onValueChange={([v]) => setSmoothing(v)}
                min={0}
                max={100}
                step={1}
                disabled={!beautyEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Softens skin texture and reduces blemishes
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Whitening: {whitening}%</label>
              <Slider
                value={[whitening]}
                onValueChange={([v]) => setWhitening(v)}
                min={0}
                max={100}
                step={1}
                disabled={!beautyEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Brightens and evens out skin tone
              </p>
            </div>
          </TabsContent>

          <TabsContent value="adjust" className="space-y-4 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleRotate}
            >
              <RotateCw className="w-4 h-4" />
              Rotate 90°
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={flipH ? 'default' : 'outline'}
                onClick={() => setFlipH(!flipH)}
              >
                Flip H
              </Button>
              <Button
                variant={flipV ? 'default' : 'outline'}
                onClick={() => setFlipV(!flipV)}
              >
                Flip V
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Crop className="w-4 h-4" />
                Aspect Ratio
              </label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="creative" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sticker className="w-4 h-4" />
                Stickers
              </label>
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="lg"
                    onClick={() => handleAddSticker(emoji)}
                    className="text-2xl"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Mask Overlay
              </label>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Mask</Label>
                <Select value={selectedMask} onValueChange={setSelectedMask}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MASKS.map((mask) => (
                      <SelectItem key={mask.id} value={mask.id}>
                        {mask.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMask !== 'none' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Opacity: {maskOpacity}%</Label>
                    <Slider
                      value={[maskOpacity]}
                      onValueChange={([v]) => setMaskOpacity(v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Size: {maskScale}%</Label>
                    <Slider
                      value={[maskScale]}
                      onValueChange={([v]) => setMaskScale(v)}
                      min={20}
                      max={200}
                      step={5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Position X: {maskX}%</Label>
                      <Slider
                        value={[maskX]}
                        onValueChange={([v]) => setMaskX(v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Position Y: {maskY}%</Label>
                      <Slider
                        value={[maskY]}
                        onValueChange={([v]) => setMaskY(v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'png' | 'jpeg')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportFormat === 'jpeg' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quality: {exportQuality}%</label>
                <Slider
                  value={[exportQuality]}
                  onValueChange={([v]) => setExportQuality(v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
