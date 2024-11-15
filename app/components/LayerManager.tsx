'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'

interface Layer {
  id: string
  file: File
  preview: string
  opacity: number
  visible: boolean
}

export default function LayerManager() {
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (layers.length + files.length > 5) {
      alert('Maximum 5 photos allowed')
      return
    }

    const newLayers = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      opacity: 1,
      visible: true
    }))

    setLayers([...layers, ...newLayers])
  }

  const updateLayerOpacity = (id: string, opacity: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, opacity } : layer
    ))
  }

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(layer =>
      layer.id === id ? { ...layer, visible: !layer.visible } : layer
    ))
  }

  const removeLayer = (id: string) => {
    setLayers(layers.filter(layer => layer.id !== id))
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-[600px] w-full">
      {/* Preview Area */}
      <div className="flex-1 relative bg-background border rounded-lg shadow-sm min-h-[500px]">
        <div className="absolute inset-0">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className="absolute inset-0"
              style={{
                opacity: layer.opacity,
                display: layer.visible ? 'block' : 'none',
                zIndex: layers.length - index
              }}
            >
              <Image
                src={layer.preview}
                alt={`Layer ${index + 1}`}
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Layer Controls */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-background border rounded-lg shadow-sm p-4">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={layers.length >= 5}
          >
            Add Photo
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <ScrollArea className="h-[500px] bg-background border rounded-lg shadow-sm p-4">
          <div className="space-y-2">
            <AnimatePresence>
              {layers.map((layer, index) => (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-3 rounded-lg border ${
                    selectedLayer === layer.id ? 'border-primary' : 'border-border'
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility(layer.id)
                      }}
                    >
                      {layer.visible ? '👁️' : '👁️‍🗨️'}
                    </Button>
                    <span className="flex-1">Layer {layers.length - index}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLayer(layer.id)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={layer.opacity}
                    onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 