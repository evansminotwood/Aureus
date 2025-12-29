'use client'

import { useState, useEffect } from 'react'
import { coinAPI, pcgsAPI, portfolioAPI, Coin, Portfolio } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Loader2 } from 'lucide-react'

interface EditCoinDialogProps {
  coin: Coin
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function EditCoinDialog({ coin, onSuccess, trigger }: EditCoinDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchingPcgs, setFetchingPcgs] = useState(false)
  const [previousCertNumber, setPreviousCertNumber] = useState('')
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loadingPortfolios, setLoadingPortfolios] = useState(false)

  const [formData, setFormData] = useState({
    portfolio_id: '',
    coin_type: '',
    year: '',
    mint_mark: '',
    denomination: '',
    pcgs_cert_number: '',
    purchase_price: '',
    current_value: '',
    numismatic_value: '',
    notes: '',
    quantity: '',
    metal_type: '',
    metal_weight: '',
    metal_purity: '',
    image_url: '',
    thumbnail_url: '',
  })

  // Load portfolios when dialog opens
  useEffect(() => {
    if (open) {
      const loadPortfolios = async () => {
        setLoadingPortfolios(true)
        try {
          const data = await portfolioAPI.getAll()
          setPortfolios(data)
        } catch (err) {
          console.error('Failed to load portfolios:', err)
        } finally {
          setLoadingPortfolios(false)
        }
      }
      loadPortfolios()
    }
  }, [open])

  // Initialize form with coin data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        portfolio_id: coin.portfolio_id || '',
        coin_type: coin.coin_type || '',
        year: coin.year ? String(coin.year) : '',
        mint_mark: coin.mint_mark || '',
        denomination: coin.denomination || '',
        pcgs_cert_number: coin.pcgs_cert_number || '',
        purchase_price: coin.purchase_price ? String(coin.purchase_price) : '',
        current_value: coin.current_value ? String(coin.current_value) : '',
        numismatic_value: coin.numismatic_value ? String(coin.numismatic_value) : '',
        notes: coin.notes || '',
        quantity: coin.quantity ? String(coin.quantity) : '1',
        metal_type: coin.metal_type || '',
        metal_weight: coin.metal_weight ? String(coin.metal_weight) : '',
        metal_purity: coin.metal_purity ? String(coin.metal_purity) : '',
        image_url: coin.image_url || '',
        thumbnail_url: coin.thumbnail_url || '',
      })
      setPreviousCertNumber(coin.pcgs_cert_number || '')
    }
  }, [open, coin])

  // Auto-fetch PCGS data when cert number changes
  useEffect(() => {
    if (!formData.pcgs_cert_number || formData.pcgs_cert_number === previousCertNumber) return

    const fetchPcgsData = async () => {
      setFetchingPcgs(true)
      try {
        // Fetch both price data and images in parallel (both are optional)
        const [priceData, imageData] = await Promise.all([
          pcgsAPI.getPrice(formData.pcgs_cert_number).catch(() => null),
          pcgsAPI.getImages(formData.pcgs_cert_number).catch(() => null)
        ])

        // Get first image URL from the Images array
        const firstImageUrl = imageData?.Images && imageData.Images.length > 0 ? imageData.Images[0].Url : null

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
      } catch (err) {
        // PCGS data not found - that's okay, user can enter manually
      } finally {
        setFetchingPcgs(false)
      }
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      fetchPcgsData()
    }, 800)

    return () => clearTimeout(timer)
  }, [formData.pcgs_cert_number, previousCertNumber])

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
      await coinAPI.update(coin.id, {
        portfolio_id: formData.portfolio_id,
        coin_type: formData.coin_type,
        year: formData.year ? parseInt(formData.year) : undefined,
        mint_mark: formData.mint_mark || undefined,
        denomination: formData.denomination || undefined,
        pcgs_cert_number: formData.pcgs_cert_number || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        current_value: formData.current_value ? parseFloat(formData.current_value) : undefined,
        numismatic_value: formData.numismatic_value ? parseFloat(formData.numismatic_value) : undefined,
        notes: formData.notes || undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        metal_type: formData.metal_type || undefined,
        metal_weight: formData.metal_weight ? parseFloat(formData.metal_weight) : undefined,
        metal_purity: formData.metal_purity ? parseFloat(formData.metal_purity) : undefined,
        // Don't send image URLs - let backend auto-fetch from PCGS if cert number is changed
        // image_url: formData.image_url || undefined,
        // thumbnail_url: formData.thumbnail_url || undefined,
      })

      setOpen(false)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update coin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Coin</DialogTitle>
          <DialogDescription>
            Update the details of this coin
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="portfolio_id">Portfolio</Label>
              <Select
                value={formData.portfolio_id}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, portfolio_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingPortfolios ? "Loading portfolios..." : "Select portfolio"} />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name} ({portfolio.coin_count} coins)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.portfolio_id !== coin.portfolio_id && (
                <p className="text-xs text-blue-600">
                  This coin will be moved to a different portfolio
                </p>
              )}
            </div>

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
              {loading ? 'Updating...' : 'Update Coin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}