'use client';

import React from 'react';
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
  FontFamilyIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CropIcon,
  AspectRatioIcon,
  PlusIcon
} from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FontFamilyPicker from './font-picker';
import ColorPicker from './color-picker';
import SliderField from './slider-field';
import InputField from './input-field';

interface IntegratedPanelProps {
  selectedLayer: string | null;
  setSelectedLayer: (layerId: string | null) => void;
  layers: {
    images: ImageLayer[];
    texts: TextSet[];
  };
  onImageUpdate: (layerId: string, updates: Partial<ImageLayer>) => void;
  onTextUpdate: (textId: string, updates: Partial<TextSet>) => void;
  onAddText: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  cropMode: 'free' | 'fixed' | null;
  setCropMode: (mode: 'free' | 'fixed' | null) => void;
}

export function IntegratedPanel({
  selectedLayer,
  setSelectedLayer,
  layers,
  onImageUpdate,
  onTextUpdate,
  onAddText,
  onFileChange,
  cropMode,
  setCropMode
}: IntegratedPanelProps) {
  const selectedImage = layers.images.find(img => img.id === selectedLayer);
  const selectedText = layers.texts.find(text => text.id === selectedLayer);
  
  const [activeTab, setActiveTab] = React.useState<string>("transform");
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedLayer) {
      const isImage = layers.images.some(img => img.id === selectedLayer);
      const isText = layers.texts.some(text => text.id === selectedLayer);
      
      if (isImage) {
        setActiveTab("transform");
      } else if (isText) {
        setActiveTab("text");
      }
    }
  }, [selectedLayer, layers.images, layers.texts]);

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

  const handleResetTransform = () => {
    if (!selectedImage) return;
    
    const originalDims = selectedImage.originalDimensions;
    if (!originalDims) return;

    const containerWidth = window.innerWidth * 0.6;
    const containerHeight = window.innerHeight * 0.6;
    
    const aspectRatio = originalDims.width / originalDims.height;
    let newWidth = containerWidth;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * aspectRatio;
    }

    onImageUpdate(selectedImage.id, {
        rotation: 0,
        position: { x: 50, y: 50 },
        size: {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        },
        crop: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            aspect: undefined
        },
        opacity: 1
    });

    setCropMode(null);
  };

  const handleToolClick = (toolName: string) => {
    setSelectedTool(selectedTool === toolName ? null : toolName);
    
    if (toolName.startsWith('crop-')) {
      if (selectedTool === toolName) {
        setCropMode(null);
      } else {
        const ratio = 
          toolName === 'crop-free' ? undefined :
          toolName === 'crop-1:1' ? 1 :
          toolName === 'crop-16:9' ? 16/9 :
          toolName === 'crop-4:3' ? 4/3 :
          toolName === 'crop-3:2' ? 3/2 :
          toolName === 'crop-9:16' ? 9/16 : undefined;
          
        if (selectedImage) {
          const imageAspectRatio = selectedImage.size.width / selectedImage.size.height;
          let newCrop = { x: 0, y: 0, width: 100, height: 100 };

          if (ratio && ratio > imageAspectRatio) {
            newCrop.height = (imageAspectRatio / ratio) * 100;
            newCrop.y = (100 - newCrop.height) / 2;
          } else if (ratio) {
            newCrop.width = (ratio / imageAspectRatio) * 100;
            newCrop.x = (100 - newCrop.width) / 2;
          }

          onImageUpdate(selectedImage.id, {
            crop: {
              ...newCrop,
              aspect: ratio
            }
          });
        }
        setCropMode(ratio === undefined ? 'free' : 'fixed');
      }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <Tabs 
        defaultValue="transform" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col h-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 h-[calc(100%-2rem)]">
          <div className="px-4 pb-4">
            <TabsContent value="transform" className="mt-0 space-y-6">
              {selectedImage && (
                <div className="space-y-6">
                  {/* Position Controls - Simplified */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Position</Label>
                    <div className="space-y-4">
                      <SliderField
                        attribute="position.x"
                        label="X Position"
                        min={0}
                        max={100}
                        step={1}
                        currentValue={selectedImage.position.x}
                        handleAttributeChange={(_, value) => onImageUpdate(selectedImage.id, { 
                          position: { ...selectedImage.position, x: value } 
                        })}
                      />
                      <SliderField
                        attribute="position.y"
                        label="Y Position"
                        min={0}
                        max={100}
                        step={1}
                        currentValue={selectedImage.position.y}
                        handleAttributeChange={(_, value) => onImageUpdate(selectedImage.id, { 
                          position: { ...selectedImage.position, y: value } 
                        })}
                      />
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

                  {/* Crop Controls */}
                  <div className="space-y-2">
                    <Label>Crop</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTool === 'crop-free' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-free')}
                      >
                        <CropIcon className="mr-2 h-4 w-4" />
                        Free
                      </Button>
                      <Button
                        variant={selectedTool === 'crop-1:1' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-1:1')}
                      >
                        <AspectRatioIcon className="mr-2 h-4 w-4" />
                        1:1
                      </Button>
                      <Button
                        variant={selectedTool === 'crop-16:9' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-16:9')}
                      >
                        <AspectRatioIcon className="mr-2 h-4 w-4" />
                        16:9
                      </Button>
                      <Button
                        variant={selectedTool === 'crop-4:3' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-4:3')}
                      >
                        <AspectRatioIcon className="mr-2 h-4 w-4" />
                        4:3
                      </Button>
                      <Button
                        variant={selectedTool === 'crop-3:2' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-3:2')}
                      >
                        <AspectRatioIcon className="mr-2 h-4 w-4" />
                        3:2
                      </Button>
                      <Button
                        variant={selectedTool === 'crop-9:16' ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolClick('crop-9:16')}
                      >
                        <AspectRatioIcon className="mr-2 h-4 w-4" />
                        9:16
                      </Button>
                    </div>
                  </div>

                  {/* Rotation Controls */}
                  <div className="space-y-2">
                    <Label>Rotation</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedTool === 'rotate-left' ? "default" : "outline"}
                        size="icon" 
                        onClick={() => {
                          handleToolClick('rotate-left');
                          handleRotate('left');
                        }}
                        title="Rotate Left"
                      >
                        <RotateCounterClockwiseIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={selectedTool === 'rotate-right' ? "default" : "outline"}
                        size="icon" 
                        onClick={() => {
                          handleToolClick('rotate-right');
                          handleRotate('right');
                        }}
                        title="Rotate Right"
                      >
                        <RotateCounterClockwiseIcon className="h-4 w-4 transform scale-x-[-1]" />
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
                  <div className="space-y-2">
                    <Label>Reset</Label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResetTransform}
                    >
                      <ReloadIcon className="mr-2 h-4 w-4" />
                      Reset Transform
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="text" className="mt-0 space-y-6">
              {selectedText ? (
                <div className="space-y-6">
                  {/* Text Content and Font */}
                  <div className="space-y-4">
                    <InputField
                      attribute="text"
                      label="Text Content"
                      currentValue={selectedText.text}
                      handleAttributeChange={(attribute, value) => {
                        const processedValue = value.replace(/\r\n/g, '\n');
                        onTextUpdate(selectedText.id, { [attribute]: processedValue });
                      }}
                      multiline
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FontFamilyPicker
                        attribute="fontFamily"
                        currentFont={selectedText.fontFamily}
                        handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                      />
                      <ColorPicker
                        attribute="color"
                        label="Color"
                        currentColor={selectedText.color}
                        handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                      />
                    </div>
                  </div>

                  {/* Position and Size */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Position & Size</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onTextUpdate(selectedText.id, {
                          position: { x: 50, y: 50 },
                          rotation: 0
                        })}
                        className="h-8"
                      >
                        <ReloadIcon className="h-3 w-3 mr-2" />
                        Reset
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">X Position</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedText.position?.x || 50)}
                          min={0}
                          max={100}
                          onChange={(e) => onTextUpdate(selectedText.id, { 
                            position: { ...selectedText.position, x: Number(e.target.value) } 
                          })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Y Position</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedText.position?.y || 50)}
                          min={0}
                          max={100}
                          onChange={(e) => onTextUpdate(selectedText.id, { 
                            position: { ...selectedText.position, y: Number(e.target.value) } 
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Size</Label>
                      <Slider
                        value={[selectedText.fontSize]}
                        min={10}
                        max={800}
                        step={1}
                        onValueChange={([value]) => onTextUpdate(selectedText.id, { fontSize: value })}
                        className="my-2"
                      />
                    </div>
                  </div>

                  {/* Style Controls */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Style</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Weight</Label>
                        <Select 
                          value={selectedText.fontWeight.toString()}
                          onValueChange={(value) => onTextUpdate(selectedText.id, { fontWeight: Number(value) })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                              <SelectItem key={weight} value={weight.toString()}>
                                {weight}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Rotation</Label>
                        <Input
                          type="number"
                          value={selectedText.rotation}
                          min={-360}
                          max={360}
                          onChange={(e) => onTextUpdate(selectedText.id, { rotation: Number(e.target.value) })}
                          className="h-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Opacity</Label>
                      <Slider
                        value={[selectedText.opacity]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([value]) => onTextUpdate(selectedText.id, { opacity: value })}
                        className="my-2"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onAddText}
                      className="w-full"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add New Text
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 space-y-3 border-2 border-dashed rounded-lg border-muted-foreground/25">
                  <FontFamilyIcon className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add text to your design</p>
                  <Button 
                    onClick={onAddText}
                    size="sm"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Text
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </Card>
  );
} 