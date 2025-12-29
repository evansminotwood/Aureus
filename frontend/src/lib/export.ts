import { Coin, Portfolio } from './api'

export function exportPortfolioToCSV(portfolio: Portfolio, coins: Coin[]) {
  // CSV headers
  const headers = [
    'Coin Type',
    'Year',
    'Mint Mark',
    'Denomination',
    'PCGS Cert Number',
    'Quantity',
    'Purchase Price',
    'Purchase Date',
    'Current Value',
    'Numismatic Value',
    'Last Price Update',
    'Gain/Loss',
    'Gain/Loss %',
    'Notes'
  ]

  // Convert coins to CSV rows
  const rows = coins.map(coin => {
    const purchasePrice = parseFloat(coin.purchase_price?.toString() || '0')
    const currentValue = parseFloat(coin.current_value?.toString() || '0')
    const gainLoss = currentValue - purchasePrice
    const gainLossPercent = purchasePrice > 0 
      ? ((gainLoss / purchasePrice) * 100).toFixed(2)
      : '0.00'

    return [
      coin.coin_type || '',
      coin.year?.toString() || '',
      coin.mint_mark || '',
      coin.denomination || '',
      coin.pcgs_cert_number || '',
      coin.quantity || 1,
      purchasePrice.toFixed(2),
      coin.purchase_date || '',
      currentValue.toFixed(2),
      parseFloat(coin.numismatic_value?.toString() || '0').toFixed(2),
      coin.last_price_update || '',
      gainLoss.toFixed(2),
      gainLossPercent,
      `"${(coin.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${portfolio.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportAllPortfoliosToCSV(portfolios: Portfolio[], allCoins: Coin[]) {
  // CSV headers with portfolio name
  const headers = [
    'Portfolio',
    'Coin Type',
    'Year',
    'Mint Mark',
    'Denomination',
    'PCGS Cert Number',
    'Quantity',
    'Purchase Price',
    'Purchase Date',
    'Current Value',
    'Numismatic Value',
    'Last Price Update',
    'Gain/Loss',
    'Gain/Loss %',
    'Notes'
  ]

  // Convert all coins to CSV rows
  const rows = allCoins.map(coin => {
    const portfolio = portfolios.find(p => p.id === coin.portfolio_id)
    const purchasePrice = parseFloat(coin.purchase_price?.toString() || '0')
    const currentValue = parseFloat(coin.current_value?.toString() || '0')
    const gainLoss = currentValue - purchasePrice
    const gainLossPercent = purchasePrice > 0 
      ? ((gainLoss / purchasePrice) * 100).toFixed(2)
      : '0.00'

    return [
      portfolio?.name || 'Unknown',
      coin.coin_type || '',
      coin.year?.toString() || '',
      coin.mint_mark || '',
      coin.denomination || '',
      coin.pcgs_cert_number || '',
      coin.quantity || 1,
      purchasePrice.toFixed(2),
      coin.purchase_date || '',
      currentValue.toFixed(2),
      parseFloat(coin.numismatic_value?.toString() || '0').toFixed(2),
      coin.last_price_update || '',
      gainLoss.toFixed(2),
      gainLossPercent,
      `"${(coin.notes || '').replace(/"/g, '""')}"` // Escape quotes
    ]
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `all_portfolios_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}