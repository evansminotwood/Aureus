'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { portfolioAPI, Portfolio, Coin } from '@/lib/api'
import { exportPortfolioToCSV } from '@/lib/export'
import { CreatePortfolioDialog } from '@/components/create-portfolio-dialog'
import { AddCoinDialog } from '@/components/add-coin-dialog'
import { ImportCoinsDialog } from '@/components/import-coins-dialog'
import { DeletePortfolioDialog } from '@/components/delete-portfolio-dialog'
import { DeleteCoinDialog } from '@/components/delete-coin-dialog'
import { UploadImageDialog } from '@/components/upload-image-dialog'
import { EditCoinDialog } from '@/components/edit-coin-dialog'
import { PortfolioStatsDialog } from '@/components/portfolio-stats-dialog'
import { SettingsDialog } from '@/components/settings-dialog'
import { PCGSPriceDisplay } from '@/components/pcgs-price-display'
import { CoinDetailDialog } from '@/components/coin-detail-dialog'
import { ImageZoomDialog } from '@/components/image-zoom-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Upload,
  Wallet,
  Camera,
  Settings,
  LogOut,
  Loader2,
  MoreVertical,
  Edit,
  BarChart3,
  Download
} from 'lucide-react'

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadPortfolios()
  }, [isAuthenticated, router])

  useEffect(() => {
    if (selectedPortfolio) {
      loadCoins(selectedPortfolio)
    }
  }, [selectedPortfolio])

  const loadPortfolios = async () => {
    try {
      const data = await portfolioAPI.getAll()
      setPortfolios(data)
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load portfolios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCoins = async (portfolioId: string) => {
    try {
      const data = await portfolioAPI.getCoins(portfolioId)
      setCoins(data)
    } catch (error) {
      console.error('Failed to load coins:', error)
    }
  }

  const totalCoins = portfolios.reduce((sum, p) => sum + (p.coin_count || 0), 0)
  const selectedPortfolioData = portfolios.find(p => p.id === selectedPortfolio)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Aureus</h1>
              <p className="text-xs text-slate-600">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SettingsDialog />
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCoins}</div>
              <p className="text-xs text-muted-foreground">
                In your collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolios</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolios.length}</div>
              <p className="text-xs text-muted-foreground">
                Active collections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Portfolios */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Portfolios</CardTitle>
                  <CreatePortfolioDialog onSuccess={loadPortfolios} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {portfolios.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">
                    No portfolios yet. Create one to get started!
                  </p>
                ) : (
                  portfolios.map(portfolio => (
                    <div
                      key={portfolio.id}
                      className={`relative w-full p-3 rounded-lg border transition-colors ${
                        selectedPortfolio === portfolio.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedPortfolio(portfolio.id)}
                        className="w-full text-left"
                      >
                        <div className="font-medium pr-8">{portfolio.name}</div>
                        <div className="text-sm text-slate-600 mt-1">
                          {portfolio.coin_count || 0} coins
                        </div>
                      </button>
                      <div className="absolute top-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <PortfolioStatsDialog
                                portfolioId={portfolio.id}
                                portfolioName={portfolio.name}
                                trigger={
                                  <button className="w-full flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    View Statistics
                                  </button>
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const portfolioData = portfolios.find(p => p.id === portfolio.id)
                                if (portfolioData) {
                                  exportPortfolioToCSV(portfolioData, coins)
                                }
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export to CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <button className="w-full">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <DeletePortfolioDialog
                                portfolioId={portfolio.id}
                                portfolioName={portfolio.name}
                                onSuccess={() => {
                                  loadPortfolios()
                                  setSelectedPortfolio(null)
                                }}
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Coins */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedPortfolioData?.name || 'Select a Portfolio'}
                    </CardTitle>
                    <CardDescription>
                      {coins.length} coins in this portfolio
                    </CardDescription>
                  </div>
                  {selectedPortfolio && (
                    <div className="flex gap-2">
                      <UploadImageDialog
                        portfolioId={selectedPortfolio}
                        onSuccess={() => {
                          loadCoins(selectedPortfolio)
                          loadPortfolios()
                        }}
                      />
                      <AddCoinDialog
                        portfolioId={selectedPortfolio}
                        onSuccess={() => {
                          loadCoins(selectedPortfolio)
                          loadPortfolios()
                        }}
                      />
                      <ImportCoinsDialog
                        portfolioId={selectedPortfolio}
                        onSuccess={() => {
                          loadCoins(selectedPortfolio)
                          loadPortfolios()
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {coins.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No coins in this portfolio yet</p>
                    {selectedPortfolio && (
                      <AddCoinDialog
                        portfolioId={selectedPortfolio}
                        onSuccess={() => {
                          loadCoins(selectedPortfolio)
                          loadPortfolios()
                        }}
                        trigger={
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Coin
                          </Button>
                        }
                      />
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue="grid">
                    <TabsList>
                      <TabsTrigger value="grid">Grid</TabsTrigger>
                      <TabsTrigger value="table">Table</TabsTrigger>
                    </TabsList>

                    <TabsContent value="grid" className="mt-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coins.map(coin => (
                          <Card key={coin.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative group">
                            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <EditCoinDialog
                                coin={coin}
                                onSuccess={() => {
                                  loadCoins(selectedPortfolio!)
                                  loadPortfolios()
                                }}
                                trigger={
                                  <Button variant="ghost" size="sm" className="bg-white/90 hover:bg-white">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                }
                              />
                              <DeleteCoinDialog
                                coinId={coin.id}
                                coinName={coin.coin_type}
                                onSuccess={() => {
                                  loadCoins(selectedPortfolio!)
                                  loadPortfolios()
                                }}
                              />
                            </div>
                            <div className="aspect-square bg-slate-100 flex items-center justify-center">
                              {coin.image_url ? (
                                <ImageZoomDialog
                                  imageUrl={coin.image_url}
                                  alt={coin.coin_type}
                                  trigger={
                                    <button className="w-full h-full cursor-zoom-in">
                                      <img src={coin.image_url} alt={coin.coin_type} className="w-full h-full object-cover" />
                                    </button>
                                  }
                                />
                              ) : (
                                <Camera className="w-12 h-12 text-slate-400" />
                              )}
                            </div>
                            <CardContent className="p-4">
                              <div className="font-semibold text-lg">{coin.coin_type}</div>
                              <div className="text-sm text-slate-600 mb-2">
                                {coin.year} {coin.mint_mark && `· ${coin.mint_mark}`}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                {coin.pcgs_cert_number && (
                                  <Badge variant="outline" className="text-xs">
                                    PCGS {coin.pcgs_cert_number}
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-3 space-y-3">
                                <div className="space-y-3">
                                  {coin.purchase_price > 0 && (
                                    <div>
                                      <div className="text-xs text-slate-500">Purchase Price</div>
                                      <div className="font-bold text-lg">
                                        ${coin.purchase_price.toFixed(2)}
                                      </div>
                                    </div>
                                  )}
                                  {coin.numismatic_value > 0 && (
                                    <div>
                                      <div className="text-xs text-slate-500">Numismatic Value</div>
                                      <div className="font-bold text-lg text-blue-600">
                                        ${coin.numismatic_value.toFixed(2)}
                                      </div>
                                    </div>
                                  )}
                                  {coin.metal_type && (
                                    <div>
                                      <div className="text-xs text-slate-500">Melt Value</div>
                                      <div className="font-bold text-lg text-green-600">
                                        ${coin.current_value ? coin.current_value.toFixed(2) : '0.00'}
                                      </div>
                                      <div className="text-xs text-slate-500 mt-1">
                                        {coin.metal_weight > 0
                                          ? `${coin.metal_type.charAt(0).toUpperCase() + coin.metal_type.slice(1)} · ${coin.metal_weight.toFixed(4)} oz · ${coin.metal_purity}% pure`
                                          : `${coin.metal_type.charAt(0).toUpperCase() + coin.metal_type.slice(1)} · base metal`
                                        }
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {coin.pcgs_cert_number && (
                                  <PCGSPriceDisplay certNumber={coin.pcgs_cert_number} />
                                )}
                                <CoinDetailDialog
                                  coin={coin}
                                  trigger={
                                    <Button variant="outline" size="sm" className="w-full">
                                      View Details & History
                                    </Button>
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="table" className="mt-4">
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left p-3 font-medium">Coin</th>
                              <th className="text-left p-3 font-medium">Year</th>
                              <th className="text-left p-3 font-medium">PCGS Cert</th>
                              <th className="text-right p-3 font-medium">Purchase Price</th>
                              <th className="text-right p-3 font-medium">Numismatic Value</th>
                              <th className="text-right p-3 font-medium">Melt Value</th>
                              <th className="text-right p-3 font-medium">PCGS Value</th>
                              <th className="text-center p-3 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coins.map(coin => (
                              <tr key={coin.id} className="border-t hover:bg-slate-50">
                                <td className="p-3">{coin.coin_type}</td>
                                <td className="p-3">{coin.year} {coin.mint_mark}</td>
                                <td className="p-3">
                                  {coin.pcgs_cert_number && (
                                    <a
                                      href={`https://www.pcgs.com/cert/${coin.pcgs_cert_number}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block"
                                    >
                                      <Badge variant="outline" className="text-xs hover:bg-amber-50">
                                        {coin.pcgs_cert_number}
                                      </Badge>
                                    </a>
                                  )}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  {coin.purchase_price > 0 ? `$${coin.purchase_price.toFixed(2)}` : '-'}
                                </td>
                                <td className="p-3 text-right font-medium text-blue-600">
                                  {coin.numismatic_value > 0 ? `$${coin.numismatic_value.toFixed(2)}` : '-'}
                                </td>
                                <td className="p-3 text-right">
                                  {coin.metal_type ? (
                                    <div className="font-bold text-green-600">
                                      ${coin.current_value ? coin.current_value.toFixed(2) : '0.00'}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {coin.pcgs_cert_number ? (
                                    <PCGSPriceDisplay certNumber={coin.pcgs_cert_number} className="text-right" />
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center gap-1">
                                    <CoinDetailDialog coin={coin} />
                                    <EditCoinDialog
                                      coin={coin}
                                      onSuccess={() => {
                                        loadCoins(selectedPortfolio!)
                                        loadPortfolios()
                                      }}
                                    />
                                    <DeleteCoinDialog
                                      coinId={coin.id}
                                      coinName={coin.coin_type}
                                      onSuccess={() => {
                                        loadCoins(selectedPortfolio!)
                                        loadPortfolios()
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}