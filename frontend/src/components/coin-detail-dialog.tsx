'use client'

import { useState } from 'react'
import { Coin } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CoinPriceChart } from '@/components/coin-price-chart'
import { ImageZoomDialog } from '@/components/image-zoom-dialog'
import { Eye, Calendar, DollarSign, TrendingUp, Scale } from 'lucide-react'

interface CoinDetailDialogProps {
  coin: Coin
  trigger?: React.ReactNode
}

export function CoinDetailDialog({ coin, trigger }: CoinDetailDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{coin.coin_type}</DialogTitle>
          <DialogDescription>
            {coin.year} {coin.mint_mark && `· ${coin.mint_mark}`} {coin.denomination && `· ${coin.denomination}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coin Images */}
          {(coin.image_url || coin.thumbnail_url) && (
            <div className="flex justify-center">
              <ImageZoomDialog
                imageUrl={coin.image_url || coin.thumbnail_url}
                alt={coin.coin_type}
                trigger={
                  <button className="cursor-zoom-in hover:opacity-90 transition-opacity">
                    <img
                      src={coin.image_url || coin.thumbnail_url}
                      alt={coin.coin_type}
                      className="max-h-64 rounded-lg border"
                    />
                  </button>
                }
              />
            </div>
          )}

          {/* Coin Information Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {coin.pcgs_cert_number && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">PCGS Certified</Badge>
                </div>
                <p className="text-sm text-slate-600">Cert Number</p>
                <p className="text-lg font-semibold">{coin.pcgs_cert_number}</p>
                <a
                  href={`https://www.pcgs.com/cert/${coin.pcgs_cert_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  View on PCGS →
                </a>
              </div>
            )}

            {coin.purchase_price > 0 && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Purchase Price</span>
                </div>
                <p className="text-2xl font-bold">${coin.purchase_price.toFixed(2)}</p>
                {coin.purchase_date && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-500">
                      {new Date(coin.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {coin.numismatic_value > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">Numismatic Value</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">${coin.numismatic_value.toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-1">Collector's market value</p>
              </div>
            )}

            {coin.current_value > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-600">Melt Value</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">${coin.current_value.toFixed(2)}</p>
                {coin.metal_type && (
                  <p className="text-xs text-amber-600 mt-1">
                    {coin.metal_weight > 0
                      ? `${coin.metal_type} · ${coin.metal_weight}oz · ${coin.metal_purity}%`
                      : `${coin.metal_type} · base metal`
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Metal Composition */}
          {coin.metal_type && (coin.metal_weight > 0 || coin.current_value > 0) && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-2">Metal Composition</h3>
              {coin.metal_weight > 0 ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Metal Type</p>
                    <p className="font-medium capitalize">{coin.metal_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Weight</p>
                    <p className="font-medium">{coin.metal_weight} troy oz</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Purity</p>
                    <p className="font-medium">{coin.metal_purity}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-slate-600 mb-1">Base Metal Alloy</p>
                  <p className="font-medium">
                    {coin.coin_type.toLowerCase().includes('nickel') || coin.coin_type.toLowerCase().includes('buffalo')
                      ? '75% copper, 25% nickel · 5.00 grams'
                      : '95% copper, 5% zinc'}
                  </p>
                  {coin.current_value > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Melt value calculated using current copper and nickel spot prices
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {coin.notes && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{coin.notes}</p>
            </div>
          )}

          {/* Price History Chart */}
          <CoinPriceChart coinId={coin.id} coinName={coin.coin_type} />

          {/* Additional Details */}
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 pt-4 border-t">
            <div>
              <p className="text-xs">Quantity</p>
              <p className="font-medium">{coin.quantity || 1}</p>
            </div>
            {coin.last_price_update && (
              <div>
                <p className="text-xs">Last Price Update</p>
                <p className="font-medium">
                  {new Date(coin.last_price_update).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
