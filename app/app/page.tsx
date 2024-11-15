// app/app/page.tsx
'use client'

import React, { useRef, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Separator } from '@/components/ui/separator';
import Authenticate from '@/components/authenticate';
import { Button } from '@/components/ui/button';
import { removeBackground } from "@imgly/background-removal";
import { PlusIcon, ReloadIcon, EyeClosedIcon, EyeOpenIcon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import TextCustomizer from '@/components/editor/text-customizer';
import Image from 'next/image';
import { Accordion } from '@/components/ui/accordion';
import '@/app/fonts.css'
import { ModeToggle } from '@/components/mode-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { IntegratedPanel } from '@/components/editor/integrated-panel';
import { ResizableImage } from '@/components/editor/resizable-image';

interface TextSet {
    id: string;
    text: string;
    fontFamily: string;
    position: {
        x: number;
        y: number;
    };
    color: string;
    fontSize: number;
    fontWeight: number;
    opacity: number;
    rotation: number;
}

interface ImageLayer {
  id: string;
  type: 'original' | 'removed-bg';
  imageUrl: string;
  name: string;
  isVisible: boolean;
  opacity: number;
  parentId?: string;
  size: { width: number; height: number };
  rotation: number;
  position: { x: number; y: number };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    aspect?: number;
  };
}

interface LayerState {
  images: ImageLayer[];
  texts: TextSet[];
}

const Page = () => {
    const { user } = useUser();
    const { session } = useSessionContext();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageSetupDone, setIsImageSetupDone] = useState<boolean>(false);
    const [removedBgImageUrl, setRemovedBgImageUrl] = useState<string | null>(null);
    const [textSets, setTextSets] = useState<TextSet[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
    const [layers, setLayers] = useState<LayerState>({
        images: [],
        texts: textSets
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [initialDimensions, setInitialDimensions] = useState<{ width: number; height: number } | null>(null);
    const [layerHistory, setLayerHistory] = useState<string[]>([]);

    const handleUploadImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            const imageUrl = URL.createObjectURL(file);

            // Get image dimensions before creating layer
            const img = document.createElement('img');
            
            img.onload = async () => {
                const aspectRatio = img.width / img.height;
                const containerWidth = window.innerWidth * 0.6;
                const containerHeight = window.innerHeight * 0.6;

                // Calculate dimensions to fit container while maintaining aspect ratio
                let newWidth = containerWidth;
                let newHeight = newWidth / aspectRatio;

                if (newHeight > containerHeight) {
                    newHeight = containerHeight;
                    newWidth = newHeight * aspectRatio;
                }

                const newImageId = `image-${Date.now()}`;
                
                // Create layers with calculated dimensions
                const originalLayer: ImageLayer = {
                    id: newImageId,
                    type: 'original',
                    imageUrl,
                    name: file.name,
                    isVisible: true,
                    opacity: 1,
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
                        height: 100
                    }
                };

                setLayers(prev => ({
                    ...prev,
                    images: [...prev.images, originalLayer]
                }));

                // Process background removal with same dimensions
                try {
                    const imageBlob = await removeBackground(imageUrl);
                    const removedBgUrl = URL.createObjectURL(imageBlob);
                    
                    const removedBgLayer: ImageLayer = {
                        ...originalLayer,
                        id: `removed-bg-${Date.now()}`,
                        type: 'removed-bg',
                        imageUrl: removedBgUrl,
                        name: `${file.name} (No Background)`,
                        parentId: newImageId,
                    };

                    setLayers(prev => ({
                        ...prev,
                        images: [...prev.images, removedBgLayer]
                    }));
                } catch (error) {
                    console.error('Background removal failed:', error);
                } finally {
                    setIsProcessing(false);
                }
            };

            img.src = imageUrl;
        }
    };

    const addNewTextSet = () => {
        const newId = `text-${Date.now()}`;
        setTextSets(prev => [...prev, {
            id: newId,
            text: 'New Text',
            fontFamily: 'Inter',
            position: {
                x: 50,
                y: 50
            },
            color: 'white',
            fontSize: 32,
            fontWeight: 400,
            opacity: 1,
            rotation: 0
        }]);
    };

    const handleAttributeChange = (id: string, attribute: string, value: any) => {
        setTextSets(prev => prev.map(set => 
            set.id === id ? { ...set, [attribute]: value } : set
        ));
    };

    const duplicateTextSet = (textSet: TextSet) => {
        const newId = `text-${Date.now()}`;
        setTextSets(prev => [...prev, { ...textSet, id: newId }]);
    };

    const removeTextSet = (id: string) => {
        setTextSets(prev => prev.filter(set => set.id !== id));
    };

    const saveCompositeImage = () => {
        if (!canvasRef.current || !isImageSetupDone) return;
    
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const bgImg = new (window as any).Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
            canvas.width = bgImg.width;
            canvas.height = bgImg.height;
    
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
            textSets.forEach(textSet => {
                ctx.save(); // Save the current state
                ctx.font = `${textSet.fontWeight} ${textSet.fontSize * 3}px ${textSet.fontFamily}`;
                ctx.fillStyle = textSet.color;
                ctx.globalAlpha = textSet.opacity;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
    
                const x = canvas.width * (textSet.position.x + 50) / 100;
                const y = canvas.height * (50 - textSet.position.y) / 100;
    
                // Move the context to the text position and rotate
                ctx.translate(x, y);
                ctx.rotate((textSet.rotation * Math.PI) / 180); // Convert degrees to radians
                ctx.fillText(textSet.text, 0, 0); // Draw text at the origin (0, 0)
                ctx.restore(); // Restore the original state
            });
    
            if (removedBgImageUrl) {
                const removedBgImg = new (window as any).Image();
                removedBgImg.crossOrigin = "anonymous";
                removedBgImg.onload = () => {
                    ctx.drawImage(removedBgImg, 0, 0, canvas.width, canvas.height);
                    const timestamp = Date.now();
                    triggerDownload(timestamp.toString());
                };
                removedBgImg.src = removedBgImageUrl;
            } else {
                const timestamp = Date.now();
                triggerDownload(timestamp.toString());
            }
        };
        bgImg.src = selectedImage || '';
    
        function triggerDownload(imageSetId: string) {
            if (!canvasRef.current) return;
            
            const dataUrl = canvasRef.current.toDataURL('image/webp', 0.8);
            const link = document.createElement('a');
            link.download = `imagecrafter-${imageSetId}.webp`;
            link.href = dataUrl;
            link.click();
        }
    };

    const toggleLayerVisibility = (layerId: string) => {
        setLayers(prev => ({
            ...prev,
            images: prev.images.map(layer => 
                layer.id === layerId 
                    ? { ...layer, isVisible: !layer.isVisible }
                    : layer
            )
        }));
    };

    const updateLayerOpacity = (layerId: string, opacity: number) => {
        setLayers(prev => ({
            ...prev,
            images: prev.images.map(layer => 
                layer.id === layerId 
                    ? { ...layer, opacity }
                    : layer
            )
        }));
    };

    const handleImageUpdate = (layerId: string, updates: Partial<ImageLayer>) => {
        setLayers(prev => ({
            ...prev,
            images: prev.images.map(layer => 
                layer.id === layerId 
                    ? { ...layer, ...updates }
                    : layer
            )
        }));
    };

    const handleLayerSelect = (layerId: string | null) => {
        if (!layerId) {
            setSelectedLayer(null);
            return;
        }

        setSelectedLayer(layerId);
        
        // Update layer history
        setLayerHistory(prev => {
            const newHistory = prev.filter(id => id !== layerId);
            return [...newHistory, layerId];
        });
        
        // Determine if the selected layer is an image or text
        const isImage = layers.images.some(img => img.id === layerId);
        const isText = textSets.some(text => text.id === layerId);
        
        // Update the integrated panel's active tab based on selection
        if (isImage) {
            const panel = document.querySelector('[value="transform"]') as HTMLButtonElement;
            if (panel) panel.click();
        } else if (isText) {
            const panel = document.querySelector('[value="text"]') as HTMLButtonElement;
            if (panel) panel.click();
        }
    };

    const handleTextUpdate = (textId: string, updates: Partial<TextSet>) => {
        setTextSets(prev => prev.map(text => 
            text.id === textId 
                ? { ...text, ...updates }
                : text
        ));
    };

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const images = [...prev.images];
            const currentIndex = images.findIndex(layer => layer.id === layerId);
            
            if (currentIndex === -1) return prev;
            
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= images.length) return prev;
            
            // Swap layers
            [images[currentIndex], images[newIndex]] = [images[newIndex], images[currentIndex]];
            
            return {
                ...prev,
                images
            };
        });
    };

    const getLayerZIndex = (layerId: string, index: number, totalLayers: number) => {
        if (selectedLayer === layerId) return 1000;
        const historyIndex = layerHistory.indexOf(layerId);
        if (historyIndex !== -1) {
            return 500 + historyIndex;
        }
        return totalLayers - index;
    };

    return (
        <>
            {user && session && session.user ? (
                <div className='flex flex-col h-screen'>
                    <header className='flex flex-row items-center justify-between p-5 px-10'>
                        <h2 className="text-[12px] md:text-2xl font-semibold tracking-tight">
                            ImageCrafter Editor
                        </h2>
                        <div className='flex gap-4'>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept=".jpg, .jpeg, .png"
                            />
                            <Button onClick={handleUploadImage}>
                                Upload image
                            </Button>
                            <ModeToggle />
                            <Avatar>
                                <AvatarImage src={user?.user_metadata.avatar_url} />
                            </Avatar>
                        </div>
                    </header>
                    <Separator />
                    <div className='flex flex-row gap-4 p-4 h-[calc(100vh-5rem)]'>
                        <div className="w-64 flex flex-col gap-4">
                            <Card className="p-4">
                                <h3 className="text-sm font-medium mb-2">Layers</h3>
                                <ScrollArea className="h-[calc(100vh-12rem)]">
                                    {layers.images.map((layer, index) => (
                                        <div 
                                            key={layer.id}
                                            className={cn(
                                                "p-2 rounded-md cursor-pointer hover:bg-accent mb-2",
                                                selectedLayer === layer.id && "bg-accent"
                                            )}
                                            onClick={() => setSelectedLayer(layer.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveLayer(layer.id, 'up');
                                                        }}
                                                    >
                                                        <ChevronUpIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === layers.images.length - 1}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveLayer(layer.id, 'down');
                                                        }}
                                                    >
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="relative w-12 h-12 rounded-md overflow-hidden">
                                                    <ResizableImage
                                                        src={layer.imageUrl}
                                                        alt={layer.name}
                                                        isSelected={selectedLayer === layer.id}
                                                        opacity={layer.opacity}
                                                        type={layer.type}
                                                        size={layer.size}
                                                        rotation={layer.rotation}
                                                        onResize={(size) => handleImageUpdate(layer.id, { size })}
                                                        onRotate={(rotation) => handleImageUpdate(layer.id, { rotation })}
                                                        onSelect={() => handleLayerSelect(layer.id)}
                                                        zIndex={selectedLayer === layer.id ? 
                                                            layers.images.length + 1 : 
                                                            layers.images.length - index}
                                                    />
                                                    {!layer.isVisible && (
                                                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                            <EyeClosedIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm truncate">
                                                        {layer.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleLayerVisibility(layer.id);
                                                            }}
                                                        >
                                                            {layer.isVisible ? (
                                                                <EyeOpenIcon className="w-4 h-4" />
                                                            ) : (
                                                                <EyeClosedIcon className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Slider 
                                                            className="w-20"
                                                            value={[layer.opacity * 100]}
                                                            onValueChange={([value]) => {
                                                                updateLayerOpacity(layer.id, value / 100);
                                                            }}
                                                            max={100}
                                                            step={1}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {textSets.map((textSet, index) => (
                                        <div 
                                            key={textSet.id}
                                            className={cn(
                                                "p-2 rounded-md cursor-pointer hover:bg-accent mb-2",
                                                selectedLayer === textSet.id && "bg-accent"
                                            )}
                                            onClick={() => setSelectedLayer(textSet.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-12 rounded-md bg-accent/50 flex items-center justify-center">
                                                    <span className="text-xs">Text {index + 1}</span>
                                                </div>
                                                <span className="text-sm truncate">{textSet.text}</span>
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </Card>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-4">
                            <Button 
                                onClick={saveCompositeImage}
                                className="w-fit px-8"
                            >
                                Save image
                            </Button>
                            
                            <div className="relative w-full h-[calc(100vh-12rem)] border border-border rounded-lg overflow-hidden">
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[10000]">
                                        <div className="flex flex-col items-center gap-2">
                                            <ReloadIcon className="w-8 h-8 animate-spin" />
                                            <p className="text-sm text-muted-foreground">Processing image...</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div 
                                    className="relative w-full h-full"
                                    onClick={() => handleLayerSelect(null)}
                                >
                                    {[...layers.images].reverse().map((layer, index) => (
                                        layer.isVisible && (
                                            <div 
                                                key={layer.id}
                                                className={cn(
                                                    "absolute",
                                                    selectedLayer === layer.id && "ring-2 ring-primary ring-offset-2"
                                                )}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${layer.position.x}%`,
                                                    top: `${layer.position.y}%`,
                                                    width: layer.size.width,
                                                    height: layer.size.height,
                                                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                                                    transformOrigin: 'center',
                                                    zIndex: getLayerZIndex(layer.id, index, layers.images.length),
                                                    overflow: 'hidden'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLayerSelect(layer.id);
                                                }}
                                            >
                                                <div 
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <Image
                                                        src={layer.imageUrl}
                                                        alt={layer.name}
                                                        width={layer.size.width}
                                                        height={layer.size.height}
                                                        className={cn(
                                                            "transition-all duration-200",
                                                            layer.type === 'removed-bg' && "mix-blend-normal"
                                                        )}
                                                        style={{ 
                                                            opacity: layer.opacity,
                                                            maxWidth: 'none',
                                                            width: `${100 * (100 / layer.crop.width)}%`,
                                                            height: `${100 * (100 / layer.crop.height)}%`,
                                                            objectFit: 'cover',
                                                            position: 'absolute',
                                                            left: `${-layer.crop.x * (100 / layer.crop.width)}%`,
                                                            top: `${-layer.crop.y * (100 / layer.crop.height)}%`,
                                                            transform: 'none'
                                                        }}
                                                        priority
                                                    />
                                                </div>
                                            </div>
                                        )
                                    ))}

                                    {textSets.map((textSet, index) => (
                                        <div
                                            key={textSet.id}
                                            className={cn(
                                                "absolute cursor-move",
                                                selectedLayer === textSet.id && "ring-2 ring-primary ring-offset-2"
                                            )}
                                            style={{
                                                position: 'absolute',
                                                left: `${textSet.position?.x || 50}%`,
                                                top: `${textSet.position?.y || 50}%`,
                                                transform: `translate(-50%, -50%) rotate(${textSet.rotation}deg)`,
                                                color: textSet.color,
                                                fontFamily: textSet.fontFamily,
                                                fontSize: `${textSet.fontSize}px`,
                                                fontWeight: textSet.fontWeight,
                                                opacity: textSet.opacity,
                                                zIndex: getLayerZIndex(
                                                    textSet.id, 
                                                    index, 
                                                    layers.images.length + textSets.length
                                                )
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLayerSelect(textSet.id);
                                            }}
                                        >
                                            {textSet.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <IntegratedPanel
                            selectedLayer={selectedLayer}
                            layers={{
                                images: layers.images,
                                texts: textSets
                            }}
                            onImageUpdate={handleImageUpdate}
                            onTextUpdate={handleTextUpdate}
                            onAddText={addNewTextSet}
                            onFileChange={handleFileChange}
                        />
                    </div>
                </div>
            ) : (
                <Authenticate />
            )}
        </>
    );
}

export default Page;