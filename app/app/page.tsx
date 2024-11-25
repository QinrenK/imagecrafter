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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

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
  originalDimensions: {
    width: number;
    height: number;
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
    const [originalDimensions, setOriginalDimensions] = useState<Map<string, { width: number; height: number }>>(new Map());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState<string | null>(null);

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
                
                // Create layers with calculated dimensions and store original dimensions
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
                    },
                    originalDimensions: {
                        width: img.width,
                        height: img.height
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

                // Store original dimensions
                setOriginalDimensions(prev => {
                    const newMap = new Map(prev);
                    newMap.set(newImageId, {
                        width: img.width,
                        height: img.height
                    });
                    return newMap;
                });
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
        
        // Select the newly created text layer
        setSelectedLayer(newId);
        
        // Add to layer history if not already using it
        setLayerHistory(prev => [...prev, newId]);
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

    const getResolutionDimensions = (resolution: string): { width: number; height: number } => {
        switch (resolution) {
            case '720p':
                return { width: 1280, height: 720 };
            case 'HD':
                return { width: 1920, height: 1080 };
            case '4K':
                return { width: 3840, height: 2160 };
            default:
                const previewContainer = document.querySelector('.relative.w-full.h-[calc(100vh-12rem)]');
                if (!previewContainer) {
                    return { width: 1920, height: 1080 }; // Default to HD if container not found
                }
                const rect = previewContainer.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
        }
    };

    const saveCompositeImage = async (resolution: string) => {
        if (!canvasRef.current) return;

        try {
            setIsProcessing(true);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Get target dimensions based on selected resolution
            const targetDimensions = getResolutionDimensions(resolution);
            
            // Set canvas size to match target resolution
            canvas.width = targetDimensions.width;
            canvas.height = targetDimensions.height;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000'; // Set background color
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate scale factors for the new resolution
            const scaleX = targetDimensions.width / canvasDimensions.width;
            const scaleY = targetDimensions.height / canvasDimensions.height;

            // Sort layers by z-index
            const allLayers = [...layers.images, ...textSets.map(text => ({
                ...text,
                type: 'text' as const
            }))].sort((a, b) => {
                const aIndex = layerHistory.indexOf(a.id);
                const bIndex = layerHistory.indexOf(b.id);
                return aIndex - bIndex;
            });

            // Draw each layer while maintaining aspect ratio
            for (const layer of allLayers) {
                if ('imageUrl' in layer && layer.isVisible) {
                    const img = document.createElement('img');
                    img.crossOrigin = "anonymous";
                    img.src = layer.imageUrl;
                    
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            // Scale dimensions and positions
                            const scaledWidth = layer.size.width * scaleX;
                            const scaledHeight = layer.size.height * scaleY;
                            const scaledX = (layer.position.x / 100) * targetDimensions.width;
                            const scaledY = (layer.position.y / 100) * targetDimensions.height;

                            // Create temporary canvas for cropping
                            const tempCanvas = document.createElement('canvas');
                            const tempCtx = tempCanvas.getContext('2d');
                            if (!tempCtx) {
                                resolve();
                                return;
                            }

                            // Set temp canvas size
                            tempCanvas.width = scaledWidth;
                            tempCanvas.height = scaledHeight;

                            // Draw image maintaining aspect ratio
                            tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                            // Apply crop if needed
                            const cropX = (layer.crop.x / 100) * scaledWidth;
                            const cropY = (layer.crop.y / 100) * scaledHeight;
                            const cropWidth = (layer.crop.width / 100) * scaledWidth;
                            const cropHeight = (layer.crop.height / 100) * scaledHeight;

                            // Create another temp canvas for the cropped result
                            const croppedCanvas = document.createElement('canvas');
                            const croppedCtx = croppedCanvas.getContext('2d');
                            if (!croppedCtx) {
                                resolve();
                                return;
                            }

                            croppedCanvas.width = cropWidth;
                            croppedCanvas.height = cropHeight;

                            // Draw the cropped portion
                            croppedCtx.drawImage(
                                tempCanvas,
                                cropX, cropY, cropWidth, cropHeight,
                                0, 0, cropWidth, cropHeight
                            );

                            // Draw to main canvas with rotation and opacity
                            ctx.save();
                            ctx.globalAlpha = layer.opacity;
                            ctx.translate(scaledX, scaledY);
                            ctx.rotate((layer.rotation * Math.PI) / 180);
                            ctx.drawImage(
                                croppedCanvas,
                                -cropWidth / 2,
                                -cropHeight / 2,
                                cropWidth,
                                cropHeight
                            );
                            ctx.restore();
                            resolve();
                        };
                        img.onerror = () => {
                            console.error('Error loading image:', layer.imageUrl);
                            resolve();
                        };
                    });
                } else if (!('imageUrl' in layer)) {
                    // Handle text layers
                    const textLayer = layer as TextSet;
                    const scaledX = (textLayer.position.x / 100) * targetDimensions.width;
                    const scaledY = (textLayer.position.y / 100) * targetDimensions.height;
                    const scaledFontSize = textLayer.fontSize * scaleX;

                    ctx.save();
                    ctx.globalAlpha = textLayer.opacity;
                    ctx.translate(scaledX, scaledY);
                    ctx.rotate((textLayer.rotation * Math.PI) / 180);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = textLayer.color;
                    ctx.font = `${textLayer.fontWeight} ${scaledFontSize}px ${textLayer.fontFamily}`;
                    ctx.fillText(textLayer.text, 0, 0);
                    ctx.restore();
                }
            }

            // Save the final image
            const timestamp = new Date().getTime();
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `imagecrafter-${resolution}-${timestamp}.png`;
            link.href = dataUrl;
            link.click();

        } catch (error) {
            console.error('Error saving image:', error);
        } finally {
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
            images: prev.images.map(layer => {
                if (layer.id === layerId) {
                    // Create new layer with updates
                    const updatedLayer = {
                        ...layer,
                        ...updates,
                        // Ensure position stays within bounds
                        position: {
                            x: Math.max(0, Math.min(100, updates.position?.x ?? layer.position.x)),
                            y: Math.max(0, Math.min(100, updates.position?.y ?? layer.position.y))
                        }
                    };
                    
                    // If this is a parent layer, update child layers too
                    const childLayers = prev.images.filter(l => l.parentId === layerId);
                    childLayers.forEach(child => {
                        const childIndex = prev.images.findIndex(l => l.id === child.id);
                        if (childIndex !== -1) {
                            prev.images[childIndex] = {
                                ...child,
                                position: updatedLayer.position,
                                size: updatedLayer.size,
                                rotation: updatedLayer.rotation,
                                crop: updatedLayer.crop
                            };
                        }
                    });

                    return updatedLayer;
                }
                return layer;
            })
        }));

        // Force a re-render of the preview panel
        requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        });
    };

    const handleLayerSelect = (layerId: string | null) => {
        setSelectedLayer(layerId);
        
        // Only update history when selecting a layer
        if (layerId) {
            setLayerHistory(prev => {
                // Remove the layer from its current position if it exists
                const newHistory = prev.filter(id => id !== layerId);
                // Add it to the end (top)
                return [...newHistory, layerId];
            });
        }
        // Don't modify history when deselecting (clicking empty canvas)
    };

    const handleTextUpdate = (textId: string, updates: Partial<TextSet>) => {
        setTextSets(prevTextSets => {
            return prevTextSets.map(textSet => {
                if (textSet.id === textId) {
                    // Ensure position is properly handled
                    const newPosition = updates.position 
                        ? { 
                            x: updates.position.x ?? textSet.position.x,
                            y: updates.position.y ?? textSet.position.y
                          }
                        : textSet.position;

                    return {
                        ...textSet,
                        ...updates,
                        position: newPosition
                    };
                }
                return textSet;
            });
        });
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

    const getLayerZIndex = (id: string) => {
        // Base z-index for all layers
        const baseZIndex = 100;
        
        // Find the index in layer history
        const historyIndex = layerHistory.indexOf(id);
        
        if (historyIndex === -1) {
            return baseZIndex;
        }
        
        // Higher index = higher z-index
        return baseZIndex + historyIndex;
    };

    const handleCropAspectRatio = (ratio: number | null) => {
        if (!selectedLayer) return;
        const layer = layers.images.find(img => img.id === selectedLayer);
        if (!layer) return;

        if (ratio === null) {
            setCropMode('free');
            return;
        }

        setCropMode('fixed');
        
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

    useEffect(() => {
        setLayers(prev => ({
            ...prev,
            texts: textSets
        }));
    }, [textSets]);

    // Add this function to handle resolution selection
    const handleResolutionSelect = (resolution: string) => {
        setSelectedResolution(resolution);
        setIsDialogOpen(false);
        saveCompositeImage(resolution);
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
                                Upload Image
                            </Button>
                            <Button 
                                onClick={() => setIsDialogOpen(true)}
                                disabled={isProcessing || layers.images.length === 0}
                                className="w-fit"
                            >
                                {isProcessing ? (
                                    <>
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Image'
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
                                    <ScrollArea className="flex-1">
                                        {/* Unified layer list */}
                                        {[...layers.images, ...textSets.map(text => ({
                                            id: text.id,
                                            type: 'text' as const,
                                            name: text.text.substring(0, 20) + (text.text.length > 20 ? '...' : ''),
                                            isVisible: true,
                                            opacity: text.opacity,
                                            preview: text
                                        }))].sort((a, b) => {
                                            const aIndex = layerHistory.indexOf(a.id);
                                            const bIndex = layerHistory.indexOf(b.id);
                                            return bIndex - aIndex; // Higher index = appears first in list
                                        }).map((layer, index) => (
                                            <div
                                                key={layer.id}
                                                className={cn(
                                                    "p-2 rounded-md cursor-pointer hover:bg-accent mb-2",
                                                    selectedLayer === layer.id && "bg-accent"
                                                )}
                                                onClick={() => handleLayerSelect(layer.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-12 h-12 rounded-md bg-accent/50 flex items-center justify-center overflow-hidden"
                                                        role="presentation"
                                                    >
                                                        {layer.type === 'text' ? (
                                                            <span className="text-xs">Text {index + 1}</span>
                                                        ) : (
                                                            <Image
                                                                src={layer.imageUrl}
                                                                alt={layer.name}
                                                                width={48}
                                                                height={48}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm truncate">{layer.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (layer.type !== 'text') {
                                                                        toggleLayerVisibility(layer.id);
                                                                    }
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
                                                                    const newOpacity = value / 100;
                                                                    if (layer.type === 'text') {
                                                                        handleTextUpdate(layer.id, { opacity: newOpacity });
                                                                    } else {
                                                                        updateLayerOpacity(layer.id, newOpacity);
                                                                    }
                                                                }}
                                                                max={100}
                                                                step={1}
                                                            />
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
                                    {/* Render images first */}
                                    {[...layers.images].map((layer) => (
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
                                                    zIndex: getLayerZIndex(layer.id)
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

                                    {/* Render text layers on top */}
                                    {textSets.map((textSet) => (
                                        <div
                                            key={textSet.id}
                                            className={cn(
                                                "absolute cursor-move select-none",
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
                                                maxWidth: 'none',
                                                wordBreak: 'normal',
                                                zIndex: getLayerZIndex(textSet.id),
                                                userSelect: 'none',
                                                WebkitUserSelect: 'none',
                                                msUserSelect: 'none'
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="z-[10001]">
                    <DialogHeader>
                        <DialogTitle>Select Resolution</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col space-y-2">
                        <Button onClick={() => handleResolutionSelect('720p')}>720p (1280×720)</Button>
                        <Button onClick={() => handleResolutionSelect('HD')}>HD (1920×1080)</Button>
                        <Button onClick={() => handleResolutionSelect('4K')}>4K (3840×2160)</Button>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default Page;