// app/app/page.tsx
'use client'

import React, { useRef, useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Separator } from '@/components/ui/separator';
import Authenticate from '@/components/authenticate';
import { Button } from '@/components/ui/button';
import { removeBackground } from "@imgly/background-removal";
import { PlusIcon, ReloadIcon, EyeClosedIcon, EyeOpenIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { LayerItem } from "@/components/editor/layer-item";

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
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
    const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
    const [isIntegratedPanelOpen, setIsIntegratedPanelOpen] = useState(true);
    const [cropMode, setCropMode] = useState<'free' | 'fixed' | null>(null);

    useEffect(() => {
        const updateDimensions = () => {
            setCanvasDimensions({
                width: window.innerWidth * 0.6,
                height: window.innerHeight * 0.6
            });
        };

        updateDimensions();

        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

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
        if (!canvasRef.current) {
            console.error('Canvas reference not found');
            return;
        }

        try {
            setIsProcessing(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Could not get canvas context');
                return;
            }

            // Set canvas size to match the container
            const containerWidth = window.innerWidth * 0.6;
            const containerHeight = window.innerHeight * 0.6;
            canvas.width = containerWidth;
            canvas.height = containerHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a promise to handle image loading
            const loadImage = (url: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = document.createElement('img');
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                    img.src = url;
                });
            };

            // Compose the image
            const composeImage = async () => {
                try {
                    // Draw white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw images
                    for (const layer of [...layers.images].reverse()) {
                        if (!layer.isVisible) continue;

                        try {
                            const img = await loadImage(layer.imageUrl);
                            
                            ctx.save();
                            
                            // Apply transformations
                            ctx.globalAlpha = layer.opacity;
                            
                            // Calculate center position
                            const x = (layer.position.x / 100) * canvas.width;
                            const y = (layer.position.y / 100) * canvas.height;
                            
                            // Move to position, rotate, then draw
                            ctx.translate(x, y);
                            ctx.rotate((layer.rotation * Math.PI) / 180);
                            
                            // Draw image centered at transformed position
                            ctx.drawImage(
                                img,
                                -layer.size.width / 2,
                                -layer.size.height / 2,
                                layer.size.width,
                                layer.size.height
                            );
                            
                            ctx.restore();
                        } catch (error) {
                            console.error(`Failed to load image for layer ${layer.id}:`, error);
                        }
                    }

                    // Draw text layers
                    textSets.forEach(textSet => {
                        ctx.save();
                        
                        // Configure text properties
                        ctx.font = `${textSet.fontWeight} ${textSet.fontSize}px ${textSet.fontFamily}`;
                        ctx.fillStyle = textSet.color;
                        ctx.globalAlpha = textSet.opacity;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        // Calculate position
                        const x = canvas.width * (textSet.position.x / 100);
                        const y = canvas.height * (textSet.position.y / 100);

                        // Apply rotation
                        ctx.translate(x, y);
                        ctx.rotate((textSet.rotation * Math.PI) / 180);
                        
                        // Draw text
                        ctx.fillText(textSet.text, 0, 0);
                        ctx.restore();
                    });

                    // Convert to PNG and download
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const dataUrl = canvas.toDataURL('image/png', 1.0);
                    
                    // Create and trigger download
                    const link = document.createElement('a');
                    link.download = `imagecrafter-${timestamp}.png`;
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                } catch (error) {
                    console.error('Error composing image:', error);
                    throw error;
                }
            };

            // Execute composition
            composeImage().finally(() => {
                setIsProcessing(false);
            });

        } catch (error) {
            console.error('Error saving image:', error);
            setIsProcessing(false);
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
        const integratedPanel = document.querySelector('[data-integrated-panel]') as HTMLElement;
        if (integratedPanel) {
            if (isImage) {
                integratedPanel.setAttribute('data-active-tab', 'transform');
            } else if (isText) {
                integratedPanel.setAttribute('data-active-tab', 'text');
            }
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

    const handleCropAspectRatio = (ratio: number | null) => {
        if (!selectedLayer) return;
        const layer = layers.images.find(img => img.id === selectedLayer);
        if (!layer) return;

        if (ratio === null) {
            // Reset to full image but keep current position and size
            handleImageUpdate(layer.id, {
                crop: {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    aspect: undefined
                }
            });
            return;
        }

        // Calculate new crop dimensions while maintaining aspect ratio
        const imageAspectRatio = layer.size.width / layer.size.height;
        let newCrop = { x: 0, y: 0, width: 100, height: 100 };

        if (ratio > imageAspectRatio) {
            // Target ratio is wider than image ratio
            newCrop.height = (imageAspectRatio / ratio) * 100;
            newCrop.y = (100 - newCrop.height) / 2;
        } else {
            // Target ratio is taller than image ratio
            newCrop.width = (ratio / imageAspectRatio) * 100;
            newCrop.x = (100 - newCrop.width) / 2;
        }

        handleImageUpdate(layer.id, {
            crop: {
                ...newCrop,
                aspect: ratio
            }
        });
    };

    const handleCropResizeStart = (e: React.MouseEvent, handle: string) => {
        if (!selectedLayer || cropMode !== 'free') return;
        e.stopPropagation();
        
        const layer = layers.images.find(img => img.id === selectedLayer);
        if (!layer) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startCrop = { ...layer.crop };

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = (e.clientX - startX) / layer.size.width * 100;
            const deltaY = (e.clientY - startY) / layer.size.height * 100;

            let newCrop = { ...startCrop };

            switch (handle) {
                case 'nw':
                    newCrop.x = Math.min(Math.max(0, startCrop.x + deltaX), startCrop.x + startCrop.width - 10);
                    newCrop.y = Math.min(Math.max(0, startCrop.y + deltaY), startCrop.y + startCrop.height - 10);
                    newCrop.width = Math.max(10, startCrop.width - deltaX);
                    newCrop.height = Math.max(10, startCrop.height - deltaY);
                    break;
                case 'ne':
                    newCrop.y = Math.min(Math.max(0, startCrop.y + deltaY), startCrop.y + startCrop.height - 10);
                    newCrop.width = Math.max(10, Math.min(100 - startCrop.x, startCrop.width + deltaX));
                    newCrop.height = Math.max(10, startCrop.height - deltaY);
                    break;
                case 'se':
                    newCrop.width = Math.max(10, Math.min(100 - startCrop.x, startCrop.width + deltaX));
                    newCrop.height = Math.max(10, Math.min(100 - startCrop.y, startCrop.height + deltaY));
                    break;
                case 'sw':
                    newCrop.x = Math.min(Math.max(0, startCrop.x + deltaX), startCrop.x + startCrop.width - 10);
                    newCrop.width = Math.max(10, startCrop.width - deltaX);
                    newCrop.height = Math.max(10, Math.min(100 - startCrop.y, startCrop.height + deltaY));
                    break;
            }

            handleImageUpdate(layer.id, { crop: newCrop });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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
                            <Button 
                                onClick={saveCompositeImage}
                                disabled={!layers.images.length}
                                className="w-fit"
                            >
                                {isProcessing ? (
                                    <>
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save image'
                                )}
                            </Button>
                            <ModeToggle />
                            <Avatar>
                                <AvatarImage src={user?.user_metadata.avatar_url} />
                            </Avatar>
                        </div>
                    </header>
                    <Separator />
                    <div className='flex flex-row gap-4 p-4 h-[calc(100vh-5rem)] relative'>
                        {/* Layers Panel */}
                        <div className={cn(
                            "flex transition-all duration-300 ease-in-out",
                            isLayersPanelOpen ? "w-64" : "w-0"
                        )}>
                            <div className={cn(
                                "flex-1 flex flex-col gap-4 overflow-hidden",
                                !isLayersPanelOpen && "hidden"
                            )}>
                                <Card className="p-4">
                                    <h3 className="text-sm font-medium mb-2">Layers</h3>
                                    <ScrollArea className="h-[calc(100vh-12rem)]">
                                        {layers.images.map((layer) => (
                                            <LayerItem
                                                key={layer.id}
                                                layer={layer}
                                                isSelected={selectedLayer === layer.id}
                                                onSelect={handleLayerSelect}
                                                onVisibilityToggle={toggleLayerVisibility}
                                                onOpacityChange={updateLayerOpacity}
                                            />
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
                                                    <div 
                                                        className="w-12 h-12 rounded-md bg-accent/50 flex items-center justify-center"
                                                        role="presentation"
                                                    >
                                                        <span className="text-xs">Text {index + 1}</span>
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm truncate">{textSet.text}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-xs text-muted-foreground">
                                                                {textSet.fontFamily}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </Card>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background shadow-md rounded-l-none"
                                onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
                            >
                                {isLayersPanelOpen ? (
                                    <ChevronLeftIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronRightIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Main Canvas Area */}
                        <div className={cn(
                            "flex-1 flex flex-col items-center gap-4 transition-all duration-300",
                            !isLayersPanelOpen && "ml-8",
                            !isIntegratedPanelOpen && "mr-8"
                        )}>
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
                                                    zIndex: getLayerZIndex(layer.id, index, layers.images.length)
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLayerSelect(layer.id);
                                                }}
                                            >
                                                <div className="relative w-full h-full">
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
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            ...(selectedLayer !== layer.id && {
                                                                clipPath: `inset(${layer.crop.y}% ${100 - (layer.crop.x + layer.crop.width)}% ${100 - (layer.crop.y + layer.crop.height)}% ${layer.crop.x}%)`
                                                            })
                                                        }}
                                                        priority
                                                    />
                                                    
                                                    {selectedLayer === layer.id && (
                                                        <>
                                                            {/* Dark overlay for non-cropped area */}
                                                            <div className="absolute inset-0">
                                                                {/* Top overlay */}
                                                                <div 
                                                                    className="absolute bg-black/50"
                                                                    style={{
                                                                        left: '0',
                                                                        top: '0',
                                                                        width: '100%',
                                                                        height: `${layer.crop.y}%`
                                                                    }}
                                                                />
                                                                {/* Bottom overlay */}
                                                                <div 
                                                                    className="absolute bg-black/50"
                                                                    style={{
                                                                        left: '0',
                                                                        top: `${layer.crop.y + layer.crop.height}%`,
                                                                        width: '100%',
                                                                        height: `${100 - (layer.crop.y + layer.crop.height)}%`
                                                                    }}
                                                                />
                                                                {/* Left overlay */}
                                                                <div 
                                                                    className="absolute bg-black/50"
                                                                    style={{
                                                                        left: '0',
                                                                        top: `${layer.crop.y}%`,
                                                                        width: `${layer.crop.x}%`,
                                                                        height: `${layer.crop.height}%`
                                                                    }}
                                                                />
                                                                {/* Right overlay */}
                                                                <div 
                                                                    className="absolute bg-black/50"
                                                                    style={{
                                                                        left: `${layer.crop.x + layer.crop.width}%`,
                                                                        top: `${layer.crop.y}%`,
                                                                        width: `${100 - (layer.crop.x + layer.crop.width)}%`,
                                                                        height: `${layer.crop.height}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            
                                                            {/* Crop border and handles */}
                                                            <div 
                                                                className="absolute border-2 border-white"
                                                                style={{
                                                                    top: `${layer.crop.y}%`,
                                                                    left: `${layer.crop.x}%`,
                                                                    width: `${layer.crop.width}%`,
                                                                    height: `${layer.crop.height}%`,
                                                                    pointerEvents: 'none'
                                                                }}
                                                            >
                                                                {cropMode === 'free' && (
                                                                    <>
                                                                        {['nw', 'ne', 'se', 'sw'].map((handle) => (
                                                                            <div
                                                                                key={handle}
                                                                                onMouseDown={(e) => handleCropResizeStart(e, handle)}
                                                                                className={cn(
                                                                                    "absolute w-4 h-4 bg-primary rounded-full border-2 border-white hover:scale-110 transition-transform cursor-pointer",
                                                                                    {
                                                                                        '-top-2 -left-2': handle === 'nw',
                                                                                        '-top-2 -right-2': handle === 'ne',
                                                                                        '-bottom-2 -right-2': handle === 'se',
                                                                                        '-bottom-2 -left-2': handle === 'sw'
                                                                                    }
                                                                                )}
                                                                                style={{
                                                                                    pointerEvents: 'auto',
                                                                                    cursor: `${handle}-resize`
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ))}

                                    {textSets.map((textSet, index) => (
                                        <div
                                            key={textSet.id}
                                            className={cn(
                                                "absolute cursor-move whitespace-pre",
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
                                                whiteSpace: 'pre',
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

                        {/* Integrated Panel */}
                        <div className={cn(
                            "flex transition-all duration-300 ease-in-out",
                            isIntegratedPanelOpen ? "w-80" : "w-0"
                        )}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background shadow-md rounded-r-none"
                                onClick={() => setIsIntegratedPanelOpen(!isIntegratedPanelOpen)}
                            >
                                {isIntegratedPanelOpen ? (
                                    <ChevronRightIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronLeftIcon className="h-4 w-4" />
                                )}
                            </Button>
                            <div className={cn(
                                "flex-1",
                                !isIntegratedPanelOpen && "hidden"
                            )}>
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
                                    cropMode={cropMode}
                                    setCropMode={setCropMode}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <Authenticate />
            )}
            <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
                aria-hidden="true"
                className="absolute"
                width={canvasDimensions.width}
                height={canvasDimensions.height}
            />
        </>
    );
}

export default Page;