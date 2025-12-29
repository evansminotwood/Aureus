'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ImageZoomDialogProps {
  imageUrl: string
  alt: string
  trigger?: React.ReactNode
}

export function ImageZoomDialog({ imageUrl, alt, trigger }: ImageZoomDialogProps) {
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [showMagnifier, setShowMagnifier] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return

    const rect = imgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMagnifierPosition({ x, y })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
          <div
            className="relative"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowMagnifier(true)}
            onMouseLeave={() => setShowMagnifier(false)}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Magnifying Glass */}
            {showMagnifier && imgRef.current && (
              <div
                className="absolute pointer-events-none border-4 border-white rounded-full shadow-2xl overflow-hidden"
                style={{
                  width: '200px',
                  height: '200px',
                  left: `${magnifierPosition.x - 100}px`,
                  top: `${magnifierPosition.y - 100}px`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${imgRef.current.width * 2.5}px ${imgRef.current.height * 2.5}px`,
                  backgroundPosition: `-${magnifierPosition.x * 2.5 - 100}px -${magnifierPosition.y * 2.5 - 100}px`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
