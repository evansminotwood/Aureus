'use client'

import { useState } from 'react'
import { coinAPI } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ImportCoinsDialogProps {
  portfolioId: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export function ImportCoinsDialog({ portfolioId, onSuccess, trigger }: ImportCoinsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const downloadTemplate = () => {
    const headers = [
      'coin_type',
      'year',
      'mint_mark',
      'denomination',
      'pcgs_cert_number',
      'purchase_price',
      'quantity',
      'notes'
    ]

    const exampleRow = [
      'Peace Dollar',
      '1921',
      'S',
      '$1',
      '12345678',
      '50.00',
      '1',
      'Example coin - MS67 grade'
    ]

    const csv = [
      headers.join(','),
      exampleRow.join(','),
      // Empty row for user to fill
      Array(headers.length).fill('').join(',')
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'coin_import_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const coins = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) continue
      if (values.every(v => !v)) continue // Skip empty rows

      const coin: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        if (value) {
          coin[header] = value
        }
      })

      // Only add if at least coin_type is present
      if (coin.coin_type) {
        coins.push(coin)
      }
    }

    return coins
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setResult(null)
    setLoading(true)

    try {
      const text = await file.text()
      const coins = parseCSV(text)

      if (coins.length === 0) {
        setError('No valid coins found in CSV file')
        setLoading(false)
        return
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      // Import coins one by one
      for (const coin of coins) {
        try {
          await coinAPI.create({
            portfolio_id: portfolioId,
            coin_type: coin.coin_type,
            year: coin.year ? parseInt(coin.year) : undefined,
            mint_mark: coin.mint_mark || undefined,
            denomination: coin.denomination || undefined,
            pcgs_cert_number: coin.pcgs_cert_number || undefined,
            purchase_price: coin.purchase_price ? parseFloat(coin.purchase_price) : undefined,
            quantity: coin.quantity ? parseInt(coin.quantity) : 1,
            notes: coin.notes || undefined,
          })
          success++
        } catch (err: any) {
          failed++
          errors.push(`${coin.coin_type}: ${err.response?.data?.error || 'Failed to import'}`)
        }
      }

      setResult({ success, failed, errors })

      if (success > 0) {
        onSuccess()
      }
    } catch (err) {
      setError('Failed to parse CSV file')
    } finally {
      setLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Coins from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple coins at once. PCGS certified coins will auto-fetch images and data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2">Step 1: Download Template</h3>
            <p className="text-sm text-slate-600 mb-3">
              Download the CSV template and fill it out with your coin data.
            </p>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Template Format Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-blue-900">CSV Format:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li><strong>coin_type</strong> (required): e.g., "Peace Dollar", "Morgan Dollar"</li>
              <li><strong>year</strong> (optional): e.g., 1921</li>
              <li><strong>mint_mark</strong> (optional): e.g., S, D, P</li>
              <li><strong>denomination</strong> (optional): e.g., $1, 50¢</li>
              <li><strong>pcgs_cert_number</strong> (optional): Will auto-fetch images and price data</li>
              <li><strong>purchase_price</strong> (optional): e.g., 50.00</li>
              <li><strong>quantity</strong> (optional): Defaults to 1</li>
              <li><strong>notes</strong> (optional): Any additional notes</li>
            </ul>
          </div>

          {/* Upload File */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold mb-2">Step 2: Upload CSV File</h3>
            <p className="text-sm text-slate-600 mb-3">
              Select your completed CSV file to import.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-slate-900 file:text-white
                hover:file:bg-slate-800
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-blue-800">Importing coins...</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Import Complete</h3>
                </div>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Successfully imported:</strong> {result.success} coins</p>
                  {result.failed > 0 && (
                    <p><strong>Failed:</strong> {result.failed} coins</p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-sm text-amber-900 mb-2">Errors:</h4>
                  <ul className="text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={() => setOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
