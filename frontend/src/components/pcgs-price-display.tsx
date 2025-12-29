'use client'

import { useState, useEffect } from 'react'
import { pcgsAPI, PCGSPriceData } from '@/lib/api'
import { Loader2, ExternalLink } from 'lucide-react'

interface PCGSPriceDisplayProps {
  certNumber: string
  className?: string
}

export function PCGSPriceDisplay({ certNumber, className }: PCGSPriceDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [priceData, setPriceData] = useState<PCGSPriceData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!certNumber) return

    const fetchPCGSPrice = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await pcgsAPI.getPrice(certNumber)
        setPriceData(data)
      } catch (err: any) {
        setError('Unable to fetch PCGS price')
        console.error('PCGS API error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPCGSPrice()
  }, [certNumber])

  if (!certNumber) return null

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Loading PCGS value...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-xs text-slate-400 ${className}`}>
        {error}
      </div>
    )
  }

  if (!priceData || !priceData.price) return null

  const isCompact = className?.includes('text-right')

  if (isCompact) {
    return (
      <div className="font-bold text-amber-600">
        ${priceData.price.toFixed(2)}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            PCGS Value
            <a
              href={`https://www.pcgs.com/cert/${certNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="font-bold text-lg text-amber-600">
            ${priceData.price.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
