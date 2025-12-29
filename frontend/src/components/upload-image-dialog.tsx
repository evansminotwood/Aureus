'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { coinAPI, metalsAPI } from '@/lib/api'
import { uploadCoinImage } from '@/lib/storage'
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
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface UploadImageDialogProps {
  portfolioId: string
  onSuccess: () => void
}

interface DetectedCoin {
  id: number
  coin_type: string
  denomination: string
  year: number | null
  estimated_value: number
  confidence: number
  position: {
    x: number
    y: number
    radius: number
  }
  // Metal composition (populated after detection)
  metal_type?: string
  metal_weight?: number
  metal_purity?: number
  melt_value?: number
}

export function UploadImageDialog({ portfolioId, onSuccess }: UploadImageDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detectedCoins, setDetectedCoins] = useState<DetectedCoin[]>([])
  const [savedCoins, setSavedCoins] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  // Purchase price confirmation dialog
  const [confirmCoin, setConfirmCoin] = useState<DetectedCoin | null>(null)
  const [coinFormData, setCoinFormData] = useState({
    coin_type: '',
    year: '',
    mint_mark: '',
    denomination: '',
    purchase_price: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setDetectedCoins([])
      setSavedCoins(new Set())
      setError('')
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setAnalyzing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('http://localhost:8001/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setDetectedCoins(response.data.detected_coins || [])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  // Auto-fetch metal composition for detected coins
  useEffect(() => {
    const fetchMetalComposition = async () => {
      if (detectedCoins.length === 0) return

      const updatedCoins = await Promise.all(
        detectedCoins.map(async (coin) => {
          // Skip if already has metal data
          if (coin.metal_type) return coin

          try {
            const composition = await metalsAPI.getComposition(coin.coin_type)
            return {
              ...coin,
              metal_type: composition.MetalType,
              metal_weight: composition.Weight,
              metal_purity: composition.Purity,
            }
          } catch (err) {
            // No composition found, return coin as-is
            return coin
          }
        })
      )

      setDetectedCoins(updatedCoins)
    }

    fetchMetalComposition()
  }, [detectedCoins.length]) // Only run when coins are first detected

  const handleAddCoin = (coin: DetectedCoin) => {
    // Open confirmation dialog with coin details
    setConfirmCoin(coin)
    setCoinFormData({
      coin_type: coin.coin_type,
      year: coin.year ? coin.year.toString() : '',
      mint_mark: '',
      denomination: coin.denomination,
      purchase_price: coin.estimated_value.toFixed(2),
    })
  }

  const handleConfirmAddCoin = async () => {
    if (!file || !confirmCoin) return

    setSaving(true)
    setError('')

    try {
      // Upload the image first
      const { image_url, thumbnail_url } = await uploadCoinImage(file)

      // Create the coin with the image URLs and metal content
      await coinAPI.create({
        portfolio_id: portfolioId,
        coin_type: coinFormData.coin_type,
        year: coinFormData.year ? parseInt(coinFormData.year) : undefined,
        mint_mark: coinFormData.mint_mark || undefined,
        denomination: coinFormData.denomination,
        // Don't auto-populate current_value - let user update it manually later
        purchase_price: coinFormData.purchase_price ? parseFloat(coinFormData.purchase_price) : confirmCoin.estimated_value,
        image_url,
        thumbnail_url,
        // Include metal content if available
        metal_type: confirmCoin.metal_type,
        metal_weight: confirmCoin.metal_weight,
        metal_purity: confirmCoin.metal_purity,
      })

      setSavedCoins(prev => new Set(prev).add(confirmCoin.id))

      // Close confirmation dialog
      setConfirmCoin(null)
      setCoinFormData({
        coin_type: '',
        year: '',
        mint_mark: '',
        denomination: '',
        purchase_price: '',
      })

      // Refresh the dashboard immediately
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add coin')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAllCoins = async () => {
    if (!file) return

    setSaving(true)
    setError('')

    try {
      // Upload the image once (we'll reuse it for all coins)
      const { image_url, thumbnail_url } = await uploadCoinImage(file)

      // Add all unsaved coins with the uploaded image and metal content
      for (const coin of detectedCoins) {
        if (!savedCoins.has(coin.id)) {
          await coinAPI.create({
            portfolio_id: portfolioId,
            coin_type: coin.coin_type,
            year: coin.year || undefined,
            denomination: coin.denomination,
            // Don't auto-populate current_value - let user update it manually later
            purchase_price: coin.estimated_value,
            image_url,
            thumbnail_url,
            // Include metal content if available
            metal_type: coin.metal_type,
            metal_weight: coin.metal_weight,
            metal_purity: coin.metal_purity,
          })
          setSavedCoins(prev => new Set(prev).add(coin.id))
        }
      }

      // Refresh the dashboard immediately
      onSuccess()

      // Close dialog after a short delay to show success state
      setTimeout(() => {
        setOpen(false)
        resetState()
      }, 800)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add coins')
    } finally {
      setSaving(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setDetectedCoins([])
    setSavedCoins(new Set())
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Coin Image</DialogTitle>
          <DialogDescription>
            Upload a photo of your coins and we'll identify them using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* File Upload */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="coin-image-upload"
            />
            <label htmlFor="coin-image-upload">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </span>
              </Button>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="border rounded-lg p-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg"
              />
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Image'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Detected Coins */}
          {detectedCoins.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Detected {detectedCoins.length} coin{detectedCoins.length !== 1 ? 's' : ''}
                </h3>
                <Button
                  onClick={handleAddAllCoins}
                  disabled={saving || savedCoins.size === detectedCoins.length}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : savedCoins.size === detectedCoins.length ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      All Added
                    </>
                  ) : (
                    `Add All Coins`
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedCoins.map((coin) => {
                  const isSaved = savedCoins.has(coin.id)
                  return (
                    <Card key={coin.id} className={isSaved ? 'border-green-500 bg-green-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{coin.coin_type}</h4>
                            <p className="text-sm text-slate-600">
                              {coin.year && `${coin.year} · `}
                              {coin.denomination}
                            </p>
                          </div>
                          {isSaved ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddCoin(coin)}
                              disabled={saving}
                            >
                              Add
                            </Button>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Est. Value:</span>
                            <span className="font-medium">${coin.estimated_value.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Confidence:</span>
                            <span className="font-medium">{(coin.confidence * 100).toFixed(0)}%</span>
                          </div>

                          {/* Metal Content Info */}
                          {coin.metal_type && (
                            <>
                              <div className="border-t pt-2 mt-2">
                                <div className="text-xs font-semibold text-slate-700 mb-1">Metal Content</div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Type:</span>
                                <span className="font-medium capitalize">{coin.metal_type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Weight:</span>
                                <span className="font-medium">{coin.metal_weight?.toFixed(5)} oz</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Purity:</span>
                                <span className="font-medium">{coin.metal_purity}%</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Purchase Price Confirmation Dialog */}
      <Dialog open={!!confirmCoin} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setConfirmCoin(null)
          setCoinFormData({
            coin_type: '',
            year: '',
            mint_mark: '',
            denomination: '',
            purchase_price: '',
          })
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Coin Details</DialogTitle>
            <DialogDescription>
              Review and edit the coin information before adding to your collection
            </DialogDescription>
          </DialogHeader>

          {confirmCoin && (
            <div className="space-y-4">
              {/* Metal Content Display (Read-only) */}
              {confirmCoin.metal_type && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-900 mb-2">Detected Metal Content</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-amber-700">Type:</span>
                    <span className="font-medium text-amber-900 capitalize">{confirmCoin.metal_type}</span>
                    <span className="text-amber-700">Weight:</span>
                    <span className="font-medium text-amber-900">{confirmCoin.metal_weight?.toFixed(5)} oz</span>
                    <span className="text-amber-700">Purity:</span>
                    <span className="font-medium text-amber-900">{confirmCoin.metal_purity}%</span>
                  </div>
                </div>
              )}

              {/* Editable Coin Details */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="coin-type">Coin Type *</Label>
                  <Input
                    id="coin-type"
                    value={coinFormData.coin_type}
                    onChange={(e) => setCoinFormData(prev => ({ ...prev, coin_type: e.target.value }))}
                    placeholder="e.g., Morgan Dollar"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={coinFormData.year}
                      onChange={(e) => setCoinFormData(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="e.g., 1921"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mint-mark">Mint Mark</Label>
                    <Input
                      id="mint-mark"
                      value={coinFormData.mint_mark}
                      onChange={(e) => setCoinFormData(prev => ({ ...prev, mint_mark: e.target.value }))}
                      placeholder="e.g., S, D, P"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="denomination">Denomination</Label>
                  <Input
                    id="denomination"
                    value={coinFormData.denomination}
                    onChange={(e) => setCoinFormData(prev => ({ ...prev, denomination: e.target.value }))}
                    placeholder="e.g., $1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase-price">
                    Purchase Price ($) *
                  </Label>
                  <Input
                    id="purchase-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={coinFormData.purchase_price}
                    onChange={(e) => setCoinFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                  />
                <p className="text-xs text-slate-500">
                  Default value is the estimated value. You can change it to what you actually paid.
                </p>
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfirmCoin(null)
                    setCoinFormData({
                      coin_type: '',
                      year: '',
                      mint_mark: '',
                      denomination: '',
                      purchase_price: '',
                    })
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAddCoin}
                  disabled={saving || !coinFormData.coin_type || !coinFormData.purchase_price}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Coin'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}