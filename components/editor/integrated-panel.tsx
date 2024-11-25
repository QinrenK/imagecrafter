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
import FontFamilyPicker from './font-picker';
import ColorPicker from './color-picker';
import SliderField from './slider-field';
import InputField from './input-field';

interface IntegratedPanelProps {
  selectedLayer: string | null;
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

  const handleCropAspectRatio = (ratio: number | null) => {
    if (!selectedImage) return;
    
    if (ratio === null) {
      setCropMode('free');
      return;
    }

    setCropMode('fixed');
    
    const imageAspectRatio = selectedImage.size.width / selectedImage.size.height;
    let newCrop = { x: 0, y: 0, width: 100, height: 100 };

    if (ratio > imageAspectRatio) {
      newCrop.height = (imageAspectRatio / ratio) * 100;
      newCrop.y = (100 - newCrop.height) / 2;
    } else {
      newCrop.width = (ratio / imageAspectRatio) * 100;
      newCrop.x = (100 - newCrop.width) / 2;
    }

    onImageUpdate(selectedImage.id, {
      crop: {
        ...newCrop,
        aspect: ratio
      }
    });
  };

  const handleResetTransform = () => {
    if (!selectedImage) return;
    
    // Get original dimensions from the layer
    const originalDims = selectedImage.originalDimensions;
    if (!originalDims) return;

    // Calculate container dimensions (60% of viewport)
    const containerWidth = window.innerWidth * 0.6;
    const containerHeight = window.innerHeight * 0.6;
    
    // Calculate dimensions to fit container while maintaining aspect ratio
    const aspectRatio = originalDims.width / originalDims.height;
    let newWidth = containerWidth;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > containerHeight) {
        newHeight = containerHeight;
        newWidth = newHeight * aspectRatio;
    }

    // Reset all transformations including crop
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

    // Reset crop mode to ensure preview updates correctly
    setCropMode(null);
  };

  const handleToolClick = (toolName: string) => {
    // If the tool is already selected, deselect it
    if (selectedTool === toolName) {
        setSelectedTool(null);
        // Reset crop mode if it's a crop tool
        if (toolName.startsWith('crop-')) {
            setCropMode(null);
        }
    } else {
        // Select the new tool
        setSelectedTool(toolName);
        // Handle specific tool actions
        if (toolName.startsWith('crop-')) {
            const ratio = toolName === 'crop-free' ? null : 
                toolName === 'crop-1:1' ? 1 :
                toolName === 'crop-16:9' ? 16/9 :
                toolName === 'crop-4:3' ? 4/3 :
                toolName === 'crop-3:2' ? 3/2 :
                toolName === 'crop-9:16' ? 9/16 : null;
            handleCropAspectRatio(ratio);
        }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="transform" value={activeTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="transform" className="space-y-6 mt-0 px-4">
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

          <TabsContent value="text" className="space-y-4 mt-0">
            {selectedText ? (
              <div className="space-y-4">
                <InputField
                  attribute="text"
                  label="Text"
                  currentValue={selectedText.text}
                  handleAttributeChange={(attribute, value) => {
                    const processedValue = value.replace(/\r\n/g, '\n');
                    onTextUpdate(selectedText.id, { [attribute]: processedValue });
                  }}
                  multiline
                />

                <FontFamilyPicker
                  attribute="fontFamily"
                  currentFont={selectedText.fontFamily}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <ColorPicker
                  attribute="color"
                  label="Text Color"
                  currentColor={selectedText.color}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <SliderField
                  attribute="position.x"
                  label="X Position"
                  min={0}
                  max={100}
                  step={1}
                  currentValue={selectedText.position?.x || 50}
                  handleAttributeChange={(_, value) => onTextUpdate(selectedText.id, { 
                    position: { ...selectedText.position, x: value } 
                  })}
                />

                <SliderField
                  attribute="position.y"
                  label="Y Position"
                  min={0}
                  max={100}
                  step={1}
                  currentValue={selectedText.position?.y || 50}
                  handleAttributeChange={(_, value) => onTextUpdate(selectedText.id, { 
                    position: { ...selectedText.position, y: value } 
                  })}
                />

                <SliderField
                  attribute="fontSize"
                  label="Text Size"
                  min={10}
                  max={800}
                  step={1}
                  currentValue={selectedText.fontSize}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <SliderField
                  attribute="fontWeight"
                  label="Font Weight"
                  min={100}
                  max={900}
                  step={100}
                  currentValue={selectedText.fontWeight}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <SliderField
                  attribute="opacity"
                  label="Text Opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  currentValue={selectedText.opacity}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <SliderField
                  attribute="rotation"
                  label="Rotation"
                  min={-360}
                  max={360}
                  step={1}
                  currentValue={selectedText.rotation}
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
                />

                <div className="flex flex-row gap-2 my-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onAddText}
                  >
                    <FontFamilyIcon className="mr-2 h-4 w-4" />
                    Add New Text
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed rounded-lg border-muted-foreground/25">
                <FontFamilyIcon className="h-8 w-8 mb-4 text-muted-foreground" />
                <div className="flex flex-col items-center text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Add text to your design
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click below to add a new text layer
                  </p>
                </div>
                <Button 
                  onClick={onAddText}
                  className="w-fit"
                >
                  <FontFamilyIcon className="mr-2 h-4 w-4" />
                  Add New Text
                </Button>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
} 