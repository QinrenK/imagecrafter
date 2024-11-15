import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface ResizableImageProps {
  src: string;
  alt: string;
  isSelected: boolean;
  opacity: number;
  type: 'original' | 'removed-bg';
  size: { width: number; height: number };
  rotation: number;
  onResize: (size: { width: number; height: number }) => void;
  onRotate: (rotation: number) => void;
  onSelect: () => void;
  zIndex: number;
}

export const ResizableImage = ({
  src,
  alt,
  isSelected,
  opacity,
  type,
  size,
  rotation,
  onResize,
  onRotate,
  onSelect,
  zIndex
}: ResizableImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const aspectRatio = useRef(1);
  const currentHandle = useRef<string>('');

  const handleImageLoad = useCallback((e: any) => {
    const img = e.target;
    aspectRatio.current = img.naturalWidth / img.naturalHeight;
    const maxWidth = window.innerWidth * 0.6;
    const maxHeight = window.innerHeight * 0.6;
    
    let newWidth = Math.min(maxWidth, img.naturalWidth);
    let newHeight = newWidth / aspectRatio.current;
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio.current;
    }
    
    onResize({ width: newWidth, height: newHeight });
  }, [onResize]);

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    if (!containerRef.current || !isSelected) return;
    e.stopPropagation();
    e.preventDefault();
    
    isResizing.current = true;
    currentHandle.current = handle;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [isSelected, size]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    e.preventDefault();

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;

    switch (currentHandle.current) {
      case 'se':
      case 'nw':
        newWidth = Math.max(100, startSize.current.width + deltaX);
        newHeight = newWidth / aspectRatio.current;
        break;
      case 'sw':
      case 'ne':
        newWidth = Math.max(100, startSize.current.width - deltaX);
        newHeight = newWidth / aspectRatio.current;
        break;
    }

    if (newWidth < 100) {
      newWidth = 100;
      newHeight = newWidth / aspectRatio.current;
    }

    requestAnimationFrame(() => {
      onResize({ 
        width: Math.round(newWidth), 
        height: Math.round(newHeight) 
      });
    });
  }, [onResize]);

  const handleResizeEnd = useCallback((e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    isResizing.current = false;
    currentHandle.current = '';
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  useEffect(() => {
    return () => {
      if (isResizing.current) {
        handleResizeEnd();
      }
    };
  }, [handleResizeEnd]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none touch-none",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ 
        width: `${size.width}px`, 
        height: `${size.height}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        cursor: isResizing.current ? `${currentHandle.current}-resize` : 'default',
        position: 'relative',
        zIndex: isSelected ? 9999 : zIndex,
      }}
      onClick={onSelect}
    >
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ 
            opacity,
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
          className={cn(
            "transition-opacity duration-200",
            type === 'removed-bg' && "mix-blend-normal"
          )}
          onLoad={handleImageLoad}
          priority
        />
      </div>
      
      {isSelected && (
        <>
          {[
            { pos: 'nw', cursor: 'nw-resize' },
            { pos: 'ne', cursor: 'ne-resize' },
            { pos: 'se', cursor: 'se-resize' },
            { pos: 'sw', cursor: 'sw-resize' }
          ].map(({ pos, cursor }) => (
            <div
              key={pos}
              onMouseDown={(e) => handleResizeStart(e, pos)}
              className={cn(
                "absolute w-4 h-4 bg-primary rounded-full border-2 border-white hover:scale-110 transition-transform",
                {
                  'top-0 left-0': pos === 'nw',
                  'top-0 right-0': pos === 'ne',
                  'bottom-0 right-0': pos === 'se',
                  'bottom-0 left-0': pos === 'sw',
                }
              )}
              style={{ 
                cursor,
                zIndex: 10000,
                touchAction: 'none',
                pointerEvents: 'auto'
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}; 