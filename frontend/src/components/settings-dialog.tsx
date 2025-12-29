'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Settings, User, Mail, Shield, LogOut, Download, Upload, RefreshCw } from 'lucide-react'
import { portfolioAPI, coinAPI, metalsAPI } from '@/lib/api'
import { exportAllPortfoliosToCSV } from '@/lib/export'
import { ImportCoinsSettings } from '@/components/import-coins-settings'
import axios from 'axios'

interface SettingsDialogProps {
  trigger?: React.ReactNode
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [syncingPcgs, setSyncingPcgs] = useState(false)
  const { user, logout } = useAuth()

  const exportToCSV = async () => {
    try {
      setExporting(true)
      
      // Fetch all portfolios
      const portfolios = await portfolioAPI.getAll()
      
      // Fetch all coins for all portfolios
      const allCoins = []
      for (const portfolio of portfolios) {
        const coins = await coinAPI.getByPortfolio(portfolio.id)
        allCoins.push(...coins)
      }

      if (allCoins.length === 0) {
        alert('No coins to export')
        return
      }

      // Use the existing export function
      exportAllPortfoliosToCSV(portfolios, allCoins)

      alert(`Successfully exported ${allCoins.length} coins from ${portfolios.length} portfolio(s)`)
    } catch (error: any) {
      console.error('Export failed:', error)
      alert(error.response?.data?.error || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const exportToJSON = async () => {
    try {
      setExporting(true)

      // Fetch all portfolios
      const portfolios = await portfolioAPI.getAll()

      // Fetch all coins for each portfolio
      const portfoliosWithCoins = await Promise.all(
        portfolios.map(async (portfolio) => {
          const coins = await coinAPI.getByPortfolio(portfolio.id)
          return {
            ...portfolio,
            coins
          }
        })
      )

      // Create JSON export structure
      const exportData = {
        export_date: new Date().toISOString(),
        user_email: user?.email,
        portfolios: portfoliosWithCoins,
        summary: {
          total_portfolios: portfolios.length,
          total_coins: portfoliosWithCoins.reduce((sum, p) => sum + p.coins.length, 0),
          total_value: portfoliosWithCoins.reduce((sum, p) =>
            sum + p.coins.reduce((coinSum, c) => coinSum + (parseFloat(String(c.current_value)) || 0), 0), 0
          )
        }
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `aureus-portfolio-export-${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`Successfully exported ${exportData.summary.total_coins} coins from ${exportData.summary.total_portfolios} portfolio(s)`)
    } catch (error: any) {
      console.error('Export failed:', error)
      alert(error.response?.data?.error || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const backfillMetalComposition = async () => {
    try {
      setBackfilling(true)

      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/metals/backfill-composition`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      alert(`Successfully updated ${response.data.updated} of ${response.data.total_coins} coins with metal composition data`)

      // Reload the page to show updated melt values
      window.location.reload()
    } catch (error: any) {
      console.error('Backfill failed:', error)
      alert(error.response?.data?.error || 'Failed to backfill metal composition')
    } finally {
      setBackfilling(false)
    }
  }

  const syncPcgsValues = async () => {
    try {
      setSyncingPcgs(true)

      const response = await coinAPI.syncPcgsValues()

      let message = `Successfully updated ${response.updated} of ${response.total_coins} coins with PCGS numismatic values`

      if (response.failed > 0) {
        message += `\n\n${response.failed} coin(s) failed to update`
        if (response.errors && response.errors.length > 0) {
          message += `:\n${response.errors.slice(0, 5).join('\n')}`
          if (response.errors.length > 5) {
            message += `\n... and ${response.errors.length - 5} more errors`
          }
        }
      }

      alert(message)

      // Reload the page to show updated numismatic values
      window.location.reload()
    } catch (error: any) {
      console.error('PCGS sync failed:', error)
      alert(error.response?.data?.error || 'Failed to sync PCGS values')
    } finally {
      setSyncingPcgs(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Email Address</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{user?.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">Account Created</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Display Preferences</CardTitle>
              <CardDescription className="text-sm">
                Customize how your portfolio is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default View</Label>
                  <p className="text-sm text-slate-600">Choose grid or table view</p>
                </div>
                <select className="border rounded-md px-3 py-2 text-sm">
                  <option>Grid View</option>
                  <option>Table View</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Currency Format</Label>
                  <p className="text-sm text-slate-600">Display prices in</p>
                </div>
                <select className="border rounded-md px-3 py-2 text-sm">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Management</CardTitle>
              <CardDescription className="text-sm">
                Export or manage your portfolio data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={backfillMetalComposition}
                disabled={backfilling}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${backfilling ? 'animate-spin' : ''}`} />
                {backfilling ? 'Updating...' : 'Update Melt Values for All Coins'}
              </Button>
              <p className="text-xs text-slate-500 px-1">
                Automatically adds metal composition and calculates melt values for coins that don't have them yet.
              </p>
              <div className="border-t pt-3 mt-3" />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={syncPcgsValues}
                disabled={syncingPcgs}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncingPcgs ? 'animate-spin' : ''}`} />
                {syncingPcgs ? 'Syncing...' : 'Sync PCGS Numismatic Values'}
              </Button>
              <p className="text-xs text-slate-500 px-1">
                Updates numismatic values for all coins with PCGS certification numbers using current PCGS pricing data.
              </p>
              <div className="border-t pt-3 mt-3" />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportToCSV}
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export All Data (CSV)'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportToJSON}
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
              </Button>
              <ImportCoinsSettings />
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-600">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}