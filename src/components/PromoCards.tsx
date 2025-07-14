import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

const gamblingSites = [
  {
    id: 'site_1',
    name: 'Datdrop',
    url: 'https://datdrop.com/p/cin',
    promoCode: 'cin',
    description: 'CS:GO case opening and battle site',
    bonusAmount: '5% Deposit Bonus',
    bonusType: 'Deposit Bonus',
    features: ['Case Battles', 'Instant Payouts', 'Provably Fair'],
    color: 'from-blue-400 to-cyan-600',
    logoUrl: '/datdrop-logo.png'
  },
  {
    id: 'site_2',
    name: 'CSGOGEM',
    url: 'https://csgogem.com/r/20OFF',
    promoCode: '20OFF',
    description: 'Upgrade, open cases, and win big on CSGOGEM!',
    bonusAmount: '5% Deposit Bonus',
    bonusType: 'Deposit Bonus',
    features: ['Upgrades', 'Case Battles', 'Provably Fair'],
    color: 'from-green-400 to-emerald-600',
    logoUrl: 'https://csgogem.com/favicon.ico'
  },
  {
    id: 'site_3',
    name: 'PackDraw',
    url: 'https://packdraw.com?ref=itscin',
    promoCode: 'itscin',
    description: 'Open packs and win daily rewards on PackDraw!',
    bonusAmount: '5% up to $200 Daily',
    bonusType: 'Daily Bonus',
    features: ['Pack Opening', 'Daily Rewards', 'Fast Withdrawals'],
    color: 'from-purple-400 to-pink-600',
    logoUrl: 'https://cdn.packdraw.com/logo.png'
  },
  {
    id: 'site_4',
    name: 'CSGO LUCK',
    url: 'https://csgoluck.com/r/CIN5',
    promoCode: 'CIN5',
    description: 'Get 75% extra coins up to $100 on CSGO Luck!',
    bonusAmount: '75% Extra Coins up to $100',
    bonusType: 'Deposit Bonus',
    features: ['Coinflip', 'Roulette', 'Crash'],
    color: 'from-yellow-400 to-orange-600',
    logoUrl: '/csgoluck-logo.png'
  },
  {
    id: 'site_5',
    name: 'Rain.gg',
    url: 'https://rain.gg/r/cin',
    promoCode: 'cin',
    description: '3 Free Boxes and +5% Bonus up to $100 Coins!',
    bonusAmount: '3 Free Boxes +5% up to $100',
    bonusType: 'Free Boxes & Bonus',
    features: ['Free Boxes', 'Bonus Coins', 'Jackpot'],
    color: 'from-blue-400 to-cyan-600',
    logoUrl: 'https://rain.gg/favicon.ico'
  },
  {
    id: 'site_6',
    name: 'Clash.gg',
    url: 'https://clash.gg/r/CIN',
    promoCode: 'CIN',
    description: 'Get a 5% deposit bonus on Clash.gg!',
    bonusAmount: '5% Deposit Bonus',
    bonusType: 'Deposit Bonus',
    features: ['Case Battles', 'Upgrades', 'Provably Fair'],
    color: 'from-indigo-400 to-purple-600',
    logoUrl: 'https://clash.gg/favicon.ico'
  },
  {
    id: 'site_7',
    name: 'Skin Swap',
    url: 'https://skinswap.com/r/cin',
    promoCode: 'cin',
    description: 'Get 5% Deposit Bonus and MORE on Skin Swap!',
    bonusAmount: '5% Deposit Bonus and MORE',
    bonusType: 'Deposit Bonus',
    features: ['Skin Trading', 'Case Opening', 'Instant Swaps'],
    color: 'from-orange-400 to-red-600',
    logoUrl: 'https://skinswap.com/favicon.ico'
  }
]

export function PromoCards() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gold-gradient glow-text">
            BONUSES
          </h2>
          <p className="text-xl text-gray-300">
            Get exclusive rewards from top gambling sites using cins code
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gamblingSites.map((site) => (
            <Card key={site.id} className="card-glow glow-hover bg-black/60 border-yellow-400/30 relative overflow-hidden">
              <CardHeader className="pb-4 relative z-10">
                <div className="relative flex justify-between items-start mb-2">
                  <div className="relative w-full flex items-center">
                    {/* Logo background */}
                    <span className="absolute left-1/2 -translate-x-1/2 -top-6 z-0 opacity-30 pointer-events-none select-none">
                      <img
                        src={site.logoUrl}
                        alt={site.name + ' logo'}
                        className="w-20 h-20 object-contain rounded-full shadow-2xl glow-text"
                        style={{filter:'drop-shadow(0 0 24px #ffd700)'}}
                      />
                    </span>
                    <CardTitle className="text-xl font-bold text-yellow-400 relative z-10 mx-auto text-center w-full">
                      {site.name}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-gray-300 relative z-10">
                  {site.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="text-center p-4 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-lg border border-yellow-400/30">
                  <div className="text-sm text-gray-400 mb-1">Bonus</div>
                  <div className="text-2xl font-bold text-yellow-400">{site.bonusAmount}</div>
                  <div className="text-sm text-gray-300">{site.bonusType}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {site.features.map((feature, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-yellow-400/30">
                    <span className="font-mono text-yellow-400 font-bold">
                      {site.promoCode}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPromoCode(site.promoCode)}
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                    >
                      {copiedCode === site.promoCode ? (
                        <span className="text-green-400">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500 glow-hover"
                    onClick={() => window.open(site.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}