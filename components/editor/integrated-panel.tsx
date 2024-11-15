'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageLayer, TextSet } from "@/types/editor";
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  RotateCounterClockwiseIcon,
  ReloadIcon,
  FontIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  ResetIcon
} from "@radix-ui/react-icons";

interface IntegratedPanelProps {
  selectedLayer: string | null;
  layers: {
    images: ImageLayer[];
    texts: TextSet[];
  };
  onImageUpdate: (layerId: string, updates: Partial<ImageLayer>) => void;
  onTextUpdate: (textId: string, updates: Partial<TextSet>) => void;
  onAddText: () => void;
}

export function IntegratedPanel({
  selectedLayer,
  layers,
  onImageUpdate,
  onTextUpdate,
  onAddText
}: IntegratedPanelProps) {
  const selectedImage = layers.images.find(img => img.id === selectedLayer);
  const selectedText = layers.texts.find(text => text.id === selectedLayer);

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedImage) return;
    const step = 1;
    const { position } = selectedImage;
    
    const newPosition = {
      x: position.x + (direction === 'left' ? -step : direction === 'right' ? step : 0),
      y: position.y + (direction === 'up' ? -step : direction === 'down' ? step : 0)
    };

    onImageUpdate(selectedImage.id, {
      position: {
        x: Math.max(0, Math.min(100, newPosition.x)),
        y: Math.max(0, Math.min(100, newPosition.y))
      }
    });
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (!selectedImage) return;
    const rotationStep = 90;
    const newRotation = selectedImage.rotation + (direction === 'left' ? -rotationStep : rotationStep);
    onImageUpdate(selectedImage.id, { rotation: newRotation % 360 });
  };

  return (
    <Card className="w-80 p-4">
      <Tabs defaultValue="transform" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="transform" className="space-y-4">
          {selectedImage && (
            <div className="space-y-4">
              {/* Position Controls */}
              <div className="space-y-2">
                <Label>Position</Label>
                <div className="grid grid-cols-3 gap-2 place-items-center">
                  <div />
                  <Button variant="outline" size="icon" onClick={() => handleMove('up')}>
                    <ArrowUpIcon className="h-4 w-4" />
                  </Button>
                  <div />
                  <Button variant="outline" size="icon" onClick={() => handleMove('left')}>
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleMove('down')}>
                    <ArrowDownIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleMove('right')}>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Position Input Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X Position (%)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedImage.position.x)}
                      min={0}
                      max={100}
                      onChange={(e) => {
                        const x = Number(e.target.value);
                        if (x >= 0 && x <= 100) {
                          onImageUpdate(selectedImage.id, {
                            position: { ...selectedImage.position, x }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y Position (%)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedImage.position.y)}
                      min={0}
                      max={100}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        if (y >= 0 && y <= 100) {
                          onImageUpdate(selectedImage.id, {
                            position: { ...selectedImage.position, y }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Size Controls */}
              <div className="space-y-2">
                <Label>Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width (px)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedImage.size.width)}
                      min={50}
                      onChange={(e) => {
                        const width = Number(e.target.value);
                        if (width >= 50) {
                          onImageUpdate(selectedImage.id, {
                            size: { ...selectedImage.size, width }
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height (px)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedImage.size.height)}
                      min={50}
                      onChange={(e) => {
                        const height = Number(e.target.value);
                        if (height >= 50) {
                          onImageUpdate(selectedImage.id, {
                            size: { ...selectedImage.size, height }
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Rotation Controls */}
              <div className="space-y-2">
                <Label>Rotation</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleRotate('left')}>
                    <RotateCounterClockwiseIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleRotate('right')}>
                    <ReloadIcon className="h-4 w-4 transform scale-x-[-1]" />
                  </Button>
                  <Input
                    type="number"
                    value={selectedImage.rotation}
                    min={0}
                    max={360}
                    className="w-20"
                    onChange={(e) => {
                      const rotation = Number(e.target.value) % 360;
                      onImageUpdate(selectedImage.id, { rotation });
                    }}
                  />
                </div>
              </div>

              {/* Reset Transform */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onImageUpdate(selectedImage.id, {
                  rotation: 0,
                  position: { x: 50, y: 50 },
                  size: {
                    width: Math.round(window.innerWidth * 0.4),
                    height: Math.round(window.innerHeight * 0.4)
                  }
                })}
              >
                <ResetIcon className="mr-2 h-4 w-4" />
                Reset Transform
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {selectedText ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Text Content</Label>
                <Input
                  value={selectedText.text}
                  onChange={(e) => onTextUpdate(selectedText.id, { text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Slider
                  value={[selectedText.fontSize]}
                  min={12}
                  max={200}
                  step={1}
                  onValueChange={([fontSize]) => onTextUpdate(selectedText.id, { fontSize })}
                />
              </div>

              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input
                  value={selectedText.fontFamily}
                  onChange={(e) => onTextUpdate(selectedText.id, { fontFamily: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={selectedText.color}
                  onChange={(e) => onTextUpdate(selectedText.id, { color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Opacity</Label>
                <Slider
                  value={[selectedText.opacity * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => onTextUpdate(selectedText.id, { opacity: value / 100 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Rotation</Label>
                <Slider
                  value={[selectedText.rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={([rotation]) => onTextUpdate(selectedText.id, { rotation })}
                />
              </div>

              <Button onClick={onAddText} className="w-full">
                <FontIcon className="mr-2 h-4 w-4" />
                Add New Text
              </Button>
            </div>
          ) : selectedImage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Opacity</Label>
                <Slider
                  value={[selectedImage.opacity * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) => onImageUpdate(selectedImage.id, { opacity: value / 100 })}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
} 