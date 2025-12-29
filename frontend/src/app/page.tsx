// frontend/src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Wallet, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Aureus</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-slate-600 hover:text-slate-900">
              Features
            </Link>
            <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900">
              How it Works
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Manage Your Coin Collection with AI
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Upload photos of your coins, get instant identification and pricing, 
            and track your collection's value over time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Image */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="rounded-lg border-4 border-slate-200 bg-white shadow-2xl overflow-hidden">
            <img
              src="/Aureus.png"
              alt="Aureus Coin Collection Manager"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Manage Your Collection
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Camera className="w-12 h-12 text-amber-500 mb-2" />
              <CardTitle>AI Image Recognition</CardTitle>
              <CardDescription>
                Upload photos and let AI identify your coins automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Wallet className="w-12 h-12 text-amber-500 mb-2" />
              <CardTitle>Portfolio Management</CardTitle>
              <CardDescription>
                Organize your coins into multiple portfolios and collections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-amber-500 mb-2" />
              <CardTitle>Value Tracking</CardTitle>
              <CardDescription>
                Monitor your collection's value with real-time PCGS pricing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-amber-500 mb-2" />
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                Your data is encrypted and securely stored in the cloud
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-semibold mb-2">Upload Photo</h4>
              <p className="text-slate-600">
                Take a photo of your coins or upload from your device
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-semibold mb-2">AI Analysis</h4>
              <p className="text-slate-600">
                Our AI identifies the coin type, year, and condition
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-semibold mb-2">Track Value</h4>
              <p className="text-slate-600">
                Get instant pricing and add to your portfolio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Start Managing Your Collection?
          </h3>
          <p className="text-xl text-slate-600 mb-8">
            Join thousands of collectors using Aureus to track and value their coins.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>&copy; 2026 Aureus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}