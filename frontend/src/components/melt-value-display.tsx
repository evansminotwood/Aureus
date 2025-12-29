'use client'

import { useState, useEffect } from 'react'
import { metalsAPI } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface MeltValueDisplayProps {
  metalType?: string
  metalWeight?: number
  metalPurity?: number
  className?: string
}

export function MeltValueDisplay({
  metalType,
  metalWeight,
  metalPurity,
  className
}: MeltValueDisplayProps) {
  const [loading, setLoading] = useState(false)
  const [meltValue, setMeltValue] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!metalType) return

    // For base metals (no weight/purity), set melt value to 0
    if (!metalWeight || !metalPurity) {
      setMeltValue(0)
      return
    }

    const fetchMeltValue = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await metalsAPI.calculateMeltValue(metalType, metalWeight, metalPurity)
        setMeltValue(data.melt_value)
      } catch (err: any) {
        setError('Unable to calculate melt value')
        console.error('Melt value calculation error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeltValue()
  }, [metalType, metalWeight, metalPurity])

  if (!metalType) return null

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500">Calculating...</span>
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

  if (meltValue === null) return null

  const isCompact = className?.includes('text-right')

  if (isCompact) {
    return (
      <div className="font-bold text-green-600">
        ${meltValue.toFixed(2)}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-xs text-slate-500">Melt Value</div>
      <div className="font-bold text-lg text-green-600">
        ${meltValue.toFixed(2)}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {metalWeight && metalPurity
          ? `${metalType.charAt(0).toUpperCase() + metalType.slice(1)} · ${metalWeight.toFixed(4)} oz · ${metalPurity}% pure`
          : `${metalType.charAt(0).toUpperCase() + metalType.slice(1)} · base metal`
        }
      </div>
    </div>
  )
}
