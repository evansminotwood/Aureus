import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Types
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  coin_count?: number
  total_value?: number
  coins?: Coin[]
}

export interface Coin {
  id: string
  portfolio_id: string
  coin_type: string
  year: number
  mint_mark: string
  denomination: string
  pcgs_cert_number: string
  purchase_price: number
  purchase_date: string
  current_value: number
  numismatic_value: number
  last_price_update: string
  image_url: string
  thumbnail_url: string
  notes: string
  quantity: number
  metal_type: string
  metal_weight: number
  metal_purity: number
  created_at: string
  updated_at: string
}

export interface PortfolioStats {
  total_coins: number
  total_value: number
  total_purchase_cost: number
  total_gain_loss: number
  gain_loss_percent: number
}

export interface PCGSPriceData {
  pcgs_number: string
  cert_number: string
  grade: string
  price: number
  coin_title: string
  year: number
  mint_mark: string
  denomination: string
  series_name: string
}

export interface ImageDetail {
  Url: string
  Resolution: string
  Description: string
}

export interface PCGSImageData {
  CertNo: string
  Images: ImageDetail[]
  HasObverseImage: boolean
  HasReverseImage: boolean
  HasTrueViewImage: boolean
  ImageReady: boolean
  IsValidRequest: boolean
  ServerMessage: string
}

export interface SpotPrices {
  gold: number
  silver: number
  platinum: number
  palladium: number
  updated_at: string
}

export interface MetalComposition {
  Name: string
  MetalType: string
  Weight: number
  Purity: number
  Description: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Auth API
export const authAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/register', { email, password })
    localStorage.setItem('token', data.token)
    return data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    return data
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get('/api/auth/me')
    return data
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token')
  },
}

// Portfolio API
export const portfolioAPI = {
  getAll: async (): Promise<Portfolio[]> => {
    const { data } = await api.get('/api/portfolios')
    return data
  },

  getById: async (id: string): Promise<Portfolio> => {
    const { data } = await api.get(`/api/portfolios/${id}`)
    return data
  },

  create: async (name: string, description: string): Promise<Portfolio> => {
    const { data } = await api.post('/api/portfolios', { name, description })
    return data
  },

  update: async (id: string, name: string, description: string): Promise<Portfolio> => {
    const { data } = await api.put(`/api/portfolios/${id}`, { name, description })
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/portfolios/${id}`)
  },

  getStats: async (id: string): Promise<PortfolioStats> => {
    const { data } = await api.get(`/api/portfolios/${id}/stats`)
    return data
  },

  getCoins: async (id: string): Promise<Coin[]> => {
    const { data } = await api.get(`/api/portfolios/${id}/coins`)
    return data
  },
}

// Coin API
export const coinAPI = {
  create: async (coin: {
    portfolio_id: string
    coin_type: string
    year?: number
    mint_mark?: string
    denomination?: string
    pcgs_cert_number?: string
    purchase_price?: number
    current_value?: number
    numismatic_value?: number
    image_url?: string
    thumbnail_url?: string
    notes?: string
    quantity?: number
    metal_type?: string
    metal_weight?: number
    metal_purity?: number
  }): Promise<Coin> => {
    const { data } = await api.post('/api/coins', coin)
    return data
  },

  getById: async (id: string): Promise<Coin> => {
    const { data } = await api.get(`/api/coins/${id}`)
    return data
  },

  getByPortfolio: async (portfolioId: string): Promise<Coin[]> => {
    const { data } = await api.get(`/api/portfolios/${portfolioId}/coins`)
    return data
  },

  update: async (id: string, updates: Partial<Coin>): Promise<Coin> => {
    const { data } = await api.put(`/api/coins/${id}`, updates)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/coins/${id}`)
  },

  syncPcgsValues: async (): Promise<{
    message: string
    total_coins: number
    updated: number
    failed: number
    errors?: string[]
  }> => {
    const { data } = await api.post('/api/coins/sync-pcgs-values')
    return data
  },
}

// PCGS API with session-based caching
const pcgsCache = {
  price: new Map<string, { data: PCGSPriceData; timestamp: number }>(),
  images: new Map<string, { data: PCGSImageData; timestamp: number }>(),
}

// Cache duration: until page refresh (no expiry during session)
const CACHE_DURATION = Infinity

export const pcgsAPI = {
  getPrice: async (certNumber: string): Promise<PCGSPriceData> => {
    // Check cache first
    const cached = pcgsCache.price.get(certNumber)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    const { data } = await api.get(`/api/pcgs/price?cert_number=${certNumber}`)

    // Store in cache
    pcgsCache.price.set(certNumber, { data, timestamp: Date.now() })

    return data
  },

  getImages: async (certNumber: string): Promise<PCGSImageData> => {
    // Check cache first
    const cached = pcgsCache.images.get(certNumber)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    const { data } = await api.get(`/api/pcgs/images?cert_number=${certNumber}`)

    // Store in cache
    pcgsCache.images.set(certNumber, { data, timestamp: Date.now() })

    return data
  },

  // Clear cache (useful for testing or manual refresh)
  clearCache: () => {
    pcgsCache.price.clear()
    pcgsCache.images.clear()
  },
}

// Metals API
export const metalsAPI = {
  getSpotPrices: async (): Promise<SpotPrices> => {
    const { data } = await api.get('/api/metals/spot-prices')
    return data
  },

  getCompositions: async (): Promise<Record<string, MetalComposition>> => {
    const { data } = await api.get('/api/metals/compositions')
    return data
  },

  getComposition: async (coinType: string): Promise<MetalComposition> => {
    const { data } = await api.get(`/api/metals/composition?coin_type=${coinType}`)
    return data
  },

  calculateMeltValue: async (metalType: string, weight: number, purity: number): Promise<{ melt_value: number }> => {
    const { data } = await api.post('/api/metals/melt-value', {
      metal_type: metalType,
      weight,
      purity,
    })
    return data
  },
}

export default api