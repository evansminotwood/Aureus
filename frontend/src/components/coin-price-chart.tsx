'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import axios from 'axios'

interface PriceHistory {
  id: string
  coin_id: string
  melt_value: number
  numismatic_value: number
  pcgs_value: number
  recorded_at: string
  created_at: string
}

interface CoinPriceChartProps {
  coinId: string
  coinName: string
}

export function CoinPriceChart({ coinId, coinName }: CoinPriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPriceHistory()
  }, [coinId])

  const fetchPriceHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/coins/${coinId}/price-history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      setPriceHistory(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch price history:', err)
      setError(err.response?.data?.error || 'Failed to fetch price history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Historical value tracking for {coinName}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Historical value tracking for {coinName}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Historical value tracking for {coinName}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-sm text-slate-600">No price history available yet. Price snapshots will be recorded over time.</p>
        </CardContent>
      </Card>
    )
  }

  // Format data for chart
  const chartData = priceHistory.map(record => ({
    date: new Date(record.recorded_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: priceHistory.length > 30 ? undefined : 'numeric'
    }),
    meltValue: record.melt_value,
    numismaticValue: record.numismatic_value,
    pcgsValue: record.pcgs_value > 0 ? record.pcgs_value : null,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History</CardTitle>
        <CardDescription>
          Historical value tracking for {coinName} ({priceHistory.length} data points)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value: number | undefined) => value ? `$${value.toFixed(2)}` : '$0.00'}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="meltValue"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Melt Value"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="numismaticValue"
              stroke="#2563eb"
              strokeWidth={2}
              name="Numismatic Value"
              dot={{ r: 3 }}
            />
            {chartData.some(d => d.pcgsValue !== null) && (
              <Line
                type="monotone"
                dataKey="pcgsValue"
                stroke="#16a34a"
                strokeWidth={2}
                name="PCGS Value"
                dot={{ r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
