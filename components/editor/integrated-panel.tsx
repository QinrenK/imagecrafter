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
  ResetIcon,
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
}

export function IntegratedPanel({
  selectedLayer,
  layers,
  onImageUpdate,
  onTextUpdate,
  onAddText,
  onFileChange
}: IntegratedPanelProps) {
  const selectedImage = layers.images.find(img => img.id === selectedLayer);
  const selectedText = layers.texts.find(text => text.id === selectedLayer);
  
  const [activeTab, setActiveTab] = React.useState<string>("transform");

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

  return (
    <Card className="h-full p-4 overflow-hidden">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full h-full flex flex-col"
        data-integrated-panel
        data-active-tab={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger 
            value="transform"
          >
            Transform
          </TabsTrigger>
          <TabsTrigger 
            value="text"
          >
            Text
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="transform" className="space-y-4 mt-0">
            {selectedImage ? (
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

                {/* Add Crop Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Crop</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onImageUpdate(selectedImage.id, {
                        crop: {
                          x: 0,
                          y: 0,
                          width: 100,
                          height: 100
                        }
                      })}
                    >
                      <ResetIcon className="h-4 w-4 mr-2" />
                      Reset Crop
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedImage.crop?.x || 0)}
                          min={0}
                          max={100}
                          onChange={(e) => {
                            const x = Number(e.target.value);
                            if (x >= 0 && x <= 100) {
                              onImageUpdate(selectedImage.id, {
                                crop: { ...selectedImage.crop, x }
                              });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedImage.crop?.y || 0)}
                          min={0}
                          max={100}
                          onChange={(e) => {
                            const y = Number(e.target.value);
                            if (y >= 0 && y <= 100) {
                              onImageUpdate(selectedImage.id, {
                                crop: { ...selectedImage.crop, y }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedImage.crop?.width || 100)}
                          min={1}
                          max={100}
                          onChange={(e) => {
                            const width = Number(e.target.value);
                            if (width >= 1 && width <= 100) {
                              onImageUpdate(selectedImage.id, {
                                crop: { ...selectedImage.crop, width }
                              });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedImage.crop?.height || 100)}
                          min={1}
                          max={100}
                          onChange={(e) => {
                            const height = Number(e.target.value);
                            if (height >= 1 && height <= 100) {
                              onImageUpdate(selectedImage.id, {
                                crop: { ...selectedImage.crop, height }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onImageUpdate(selectedImage.id, {
                          crop: { ...selectedImage.crop, aspect: 1 }
                        })}
                      >
                        <AspectRatioIcon className="h-4 w-4 mr-2" />
                        1:1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onImageUpdate(selectedImage.id, {
                          crop: { ...selectedImage.crop, aspect: 16/9 }
                        })}
                      >
                        <AspectRatioIcon className="h-4 w-4 mr-2" />
                        16:9
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onImageUpdate(selectedImage.id, {
                          crop: { ...selectedImage.crop, aspect: 4/3 }
                        })}
                      >
                        <AspectRatioIcon className="h-4 w-4 mr-2" />
                        4:3
                      </Button>
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
            ) : (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 border-2 border-dashed rounded-lg border-muted-foreground/25">
                <div className="flex flex-col items-center text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Select an image to transform it
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or upload a new image to get started
                  </p>
                </div>
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                />
                <Button 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-fit"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
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
                  handleAttributeChange={(attribute, value) => onTextUpdate(selectedText.id, { [attribute]: value })}
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