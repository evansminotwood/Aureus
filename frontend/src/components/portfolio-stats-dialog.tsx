'use client'

import { useState, useEffect } from 'react'
import { portfolioAPI, PortfolioStats } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Coins as CoinsIcon, Loader2 } from 'lucide-react'

interface PortfolioStatsDialogProps {
  portfolioId: string
  portfolioName: string
  trigger?: React.ReactNode
}

export function PortfolioStatsDialog({ portfolioId, portfolioName, trigger }: PortfolioStatsDialogProps) {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadStats()
    }
  }, [open])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await portfolioAPI.getStats(portfolioId)
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const valueBreakdown = stats ? [
    { name: 'Current Value', value: stats.total_value },
    { name: 'Purchase Cost', value: stats.total_purchase_cost },
  ] : []

  const gainLossData = stats ? [
    { 
      name: 'Performance', 
      Gain: stats.total_gain_loss >= 0 ? stats.total_gain_loss : 0,
      Loss: stats.total_gain_loss < 0 ? Math.abs(stats.total_gain_loss) : 0
    }
  ] : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">View Statistics</Button>}
      </DialogTrigger>
      <DialogContent className="!max-w-none w-[90vw] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-3xl mb-2">{portfolioName} - Statistics</DialogTitle>
          <DialogDescription className="text-lg">
            Detailed analytics and performance metrics for this portfolio
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-600">Total Coins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="w-6 h-6 text-slate-400" />
                    <span className="text-4xl font-bold">{stats.total_coins}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-600">Total Melt Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <span className="text-4xl font-bold">${stats.total_value.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Based on metal content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-600">Purchase Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                    <span className="text-4xl font-bold">${stats.total_purchase_cost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-600">Gain/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {stats.total_gain_loss >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <span className={`text-4xl font-bold ${stats.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.total_gain_loss >= 0 ? '+' : ''}${stats.total_gain_loss.toFixed(2)}
                    </span>
                  </div>
                  <p className={`text-lg mt-2 font-semibold ${stats.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.gain_loss_percent >= 0 ? '+' : ''}{stats.gain_loss_percent.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Value Comparison Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Value Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={valueBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 16 }} />
                      <YAxis tick={{ fontSize: 16 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gain/Loss Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={gainLossData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 16 }} />
                      <YAxis tick={{ fontSize: 16 }} />
                      <Tooltip />
                      <Bar dataKey="Gain" fill="#10b981" />
                      <Bar dataKey="Loss" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-xl">Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Average Cost per Coin:</span>
                  <span className="font-bold text-2xl">
                    ${stats.total_coins > 0 ? (stats.total_purchase_cost / stats.total_coins).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Average Value per Coin:</span>
                  <span className="font-bold text-2xl">
                    ${stats.total_coins > 0 ? (stats.total_value / stats.total_coins).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2">
                  <span className="text-slate-600 font-semibold">Return on Investment:</span>
                  <span className={`font-bold text-3xl ${stats.gain_loss_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.gain_loss_percent >= 0 ? '+' : ''}{stats.gain_loss_percent.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-slate-600 py-12">No statistics available</p>
        )}
      </DialogContent>
    </Dialog>
  )
}