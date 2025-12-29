'use client'

import { useState, useEffect } from 'react'
import { coinAPI, metalsAPI, pcgsAPI } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'

interface AddCoinDialogProps {
  portfolioId: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function AddCoinDialog({ portfolioId, onSuccess, trigger }: AddCoinDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchingPcgs, setFetchingPcgs] = useState(false)
  const [pcgsWarning, setPcgsWarning] = useState('')

  const [formData, setFormData] = useState({
    coin_type: '',
    year: '',
    mint_mark: '',
    denomination: '',
    pcgs_cert_number: '',
    purchase_price: '',
    current_value: '',
    numismatic_value: '',
    notes: '',
    quantity: '1',
    metal_type: '',
    metal_weight: '',
    metal_purity: '',
    image_url: '',
    thumbnail_url: '',
  })

  // Auto-populate metal content when coin type changes
  useEffect(() => {
    if (!formData.coin_type) return

    const fetchComposition = async () => {
      try {
        // Try to extract base coin type from PCGS-style names
        // e.g., "1921-S Peace Dollar MS67" -> try "Peace Dollar"
        let coinType = formData.coin_type

        // Try exact match first
        let composition = null
        try {
          composition = await metalsAPI.getComposition(coinType)
        } catch (err) {
          // Try to extract just the coin name without year/grade/mint
          // Remove leading year patterns like "1921 " or "1921-S "
          let normalized = coinType.replace(/^\d{4}[-\s]?[A-Z]?\s*/, '')
          // Remove trailing grade patterns like " MS67" or " PR70DCAM"
          normalized = normalized.replace(/\s+[A-Z]{2}\d+[A-Z]*$/i, '')

          if (normalized !== coinType) {
            try {
              composition = await metalsAPI.getComposition(normalized)
            } catch (err2) {
              // Still not found, that's okay
            }
          }
        }

        if (composition) {
          // Only auto-populate if fields are empty
          if (!formData.metal_type && !formData.metal_weight && !formData.metal_purity) {
            setFormData(prev => ({
              ...prev,
              metal_type: composition.MetalType,
              metal_weight: composition.Weight.toString(),
              metal_purity: composition.Purity.toString(),
            }))
          }
        }
      } catch (err) {
        // Composition not found - that's okay, user can enter manually
      }
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      fetchComposition()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.coin_type])

  // Auto-fetch PCGS data when cert number changes
  useEffect(() => {
    if (!formData.pcgs_cert_number) return

    const fetchPcgsData = async () => {
      setFetchingPcgs(true)
      setError('') // Clear any previous errors
      setPcgsWarning('') // Clear any previous warnings
      try {
        console.log('Fetching PCGS data for cert:', formData.pcgs_cert_number)

        // Fetch both price data and images in parallel (both are optional)
        const [priceData, imageData] = await Promise.all([
          pcgsAPI.getPrice(formData.pcgs_cert_number).catch((err) => {
            console.error('Failed to fetch PCGS price:', err)
            // Check if it's a 404 (not found)
            if (err.response?.status === 404) {
              setPcgsWarning(`PCGS cert number "${formData.pcgs_cert_number}" not found. Please verify the number or enter coin details manually.`)
            }
            return null
          }),
          pcgsAPI.getImages(formData.pcgs_cert_number).catch((err) => {
            console.error('Failed to fetch PCGS images:', err)
            return null
          })
        ])

        console.log('PCGS price data:', priceData)
        console.log('PCGS image data:', imageData)

        // Get first image URL from the Images array
        const firstImageUrl = imageData?.Images && imageData.Images.length > 0 ? imageData.Images[0].Url : null

        if (priceData) {
          // Auto-populate available fields from PCGS (only if priceData is available)
          // NOTE: We don't auto-populate coin_type because PCGS returns full titles like
          // "1921-S Peace Dollar MS67" which don't match our composition database.
          // User should manually enter "Peace Dollar" to get proper metal composition.
          setFormData(prev => ({
            ...prev,
            // Auto-populate year if empty
            year: !prev.year && priceData?.year ? priceData.year.toString() : prev.year,
            // Auto-populate mint mark if empty
            mint_mark: !prev.mint_mark && priceData?.mint_mark ? priceData.mint_mark : prev.mint_mark,
            // Auto-populate denomination if empty
            denomination: !prev.denomination && priceData?.denomination ? priceData.denomination : prev.denomination,
            // Auto-populate numismatic value if empty
            numismatic_value: !prev.numismatic_value && priceData?.price ? priceData.price.toString() : prev.numismatic_value,
            // Auto-populate images if available (shown in preview, but not sent to backend)
            image_url: firstImageUrl || prev.image_url,
            thumbnail_url: firstImageUrl || prev.thumbnail_url,
          }))
          setPcgsWarning('') // Clear warning on success
          console.log('PCGS data populated successfully')
        } else {
          console.warn('No PCGS price data returned')
        }
      } catch (err: any) {
        console.error('Error fetching PCGS data:', err)
        // PCGS data not found - that's okay, user can enter manually
        // Don't show error to user since they can still enter manually
      } finally {
        setFetchingPcgs(false)
      }
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      fetchPcgsData()
    }, 800)

    return () => clearTimeout(timer)
  }, [formData.pcgs_cert_number])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await coinAPI.create({
        portfolio_id: portfolioId,
        coin_type: formData.coin_type,
        year: formData.year ? parseInt(formData.year) : undefined,
        mint_mark: formData.mint_mark || undefined,
        denomination: formData.denomination || undefined,
        pcgs_cert_number: formData.pcgs_cert_number || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        current_value: formData.current_value ? parseFloat(formData.current_value) : undefined,
        numismatic_value: formData.numismatic_value ? parseFloat(formData.numismatic_value) : undefined,
        notes: formData.notes || undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        metal_type: formData.metal_type || undefined,
        metal_weight: formData.metal_weight ? parseFloat(formData.metal_weight) : undefined,
        metal_purity: formData.metal_purity ? parseFloat(formData.metal_purity) : undefined,
        // Don't send image URLs - let backend auto-fetch from PCGS if cert number is provided
        // image_url: formData.image_url || undefined,
        // thumbnail_url: formData.thumbnail_url || undefined,
      })

      // Reset form
      setFormData({
        coin_type: '',
        year: '',
        mint_mark: '',
        denomination: '',
        pcgs_cert_number: '',
        purchase_price: '',
        current_value: '',
        numismatic_value: '',
        notes: '',
        quantity: '1',
        metal_type: '',
        metal_weight: '',
        metal_purity: '',
        image_url: '',
        thumbnail_url: '',
      })
      
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add coin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Manually
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Coin</DialogTitle>
          <DialogDescription>
            Manually add a coin to your portfolio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {pcgsWarning && (
            <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-md">
              {pcgsWarning}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="pcgs_cert_number">
                PCGS Cert Number (Optional)
                {fetchingPcgs && (
                  <span className="ml-2 text-xs text-slate-500 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching coin data...
                  </span>
                )}
              </Label>
              <Input
                id="pcgs_cert_number"
                name="pcgs_cert_number"
                placeholder="Enter PCGS cert number to auto-fill coin details"
                value={formData.pcgs_cert_number}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">
                If you have a PCGS certified coin, enter the cert number here and we'll auto-populate the details below
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="coin_type">Coin Type *</Label>
              <Input
                id="coin_type"
                name="coin_type"
                placeholder="e.g., Morgan Dollar, Peace Dollar"
                value={formData.coin_type}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-slate-500">Common types: Morgan Dollar, Peace Dollar, Walking Liberty Half Dollar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year (Optional)</Label>
              <Input
                id="year"
                name="year"
                type="number"
                placeholder="e.g., 1921"
                value={formData.year}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mint_mark">Mint Mark (Optional)</Label>
              <Input
                id="mint_mark"
                name="mint_mark"
                placeholder="e.g., S, D, P"
                value={formData.mint_mark}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="denomination">Denomination (Optional)</Label>
              <Input
                id="denomination"
                name="denomination"
                placeholder="e.g., $1, 50¢, 25¢"
                value={formData.denomination}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Optional)</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price ($) (Optional)</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value ($) (Optional)</Label>
              <Input
                id="current_value"
                name="current_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.current_value}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numismatic_value">
                Numismatic Value ($) (Optional)
                {fetchingPcgs && (
                  <span className="ml-2 text-xs text-slate-500 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching PCGS price...
                  </span>
                )}
              </Label>
              <Input
                id="numismatic_value"
                name="numismatic_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.numismatic_value}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">
                {formData.pcgs_cert_number
                  ? 'Auto-populated from PCGS when cert number is entered'
                  : 'Collector/market value separate from melt value'}
              </p>
            </div>

            <div className="col-span-2 space-y-2 border-t pt-4">
              <Label className="text-base font-semibold">Metal Content (Optional)</Label>
              <p className="text-xs text-slate-500">
                Metal content auto-populates for known coin types (Morgan Dollar, Peace Dollar, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metal_type">Metal Type</Label>
              <Input
                id="metal_type"
                name="metal_type"
                placeholder="e.g., silver, gold"
                value={formData.metal_type}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metal_weight">Weight (troy oz)</Label>
              <Input
                id="metal_weight"
                name="metal_weight"
                type="number"
                step="0.00001"
                placeholder="e.g., 0.77344"
                value={formData.metal_weight}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metal_purity">Purity (%)</Label>
              <Input
                id="metal_purity"
                name="metal_purity"
                type="number"
                step="0.01"
                placeholder="e.g., 90"
                value={formData.metal_purity}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2 space-y-2 border-t pt-4">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional notes about this coin"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Coin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}