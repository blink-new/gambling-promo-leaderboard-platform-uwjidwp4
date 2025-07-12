import { Button } from './ui/button'
import { Trophy, Star, Zap } from 'lucide-react'
import { FloatingElements } from './FloatingElements'

interface HeroProps {
  setActiveTab: (tab: string) => void;
}

export function Hero({ setActiveTab }: HeroProps) {
  const scrollToPromoCards = () => {
    const promoCardsSection = document.getElementById('promo-cards');
    if (promoCardsSection) {
      promoCardsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-400/5"></div>
      
      {/* Floating Elements */}
      <FloatingElements />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 relative" style={{zIndex:2}}>
          <div className="relative inline-block" style={{zIndex:2}}>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 gold-gradient glow-text float-animation relative z-10">
              Bet Cin
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Get exclusive rewards for the best gambling sites. Our leaderboards track <span className="text-yellow-400 font-bold">players using our referral code</span> climbing the rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-yellow-400 text-black hover:bg-yellow-500 glow-hover text-lg px-8 py-4"
              onClick={scrollToPromoCards}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Claim Bonuses
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 glow-hover text-lg px-8 py-4"
              onClick={() => setActiveTab('leaderboard')}
            >
              <Star className="w-5 h-5 mr-2" />
              Join Leaderboard
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Exclusive Bonuses</h3>
            <p className="text-gray-400">Up to 3 FREE Cases!</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Track Performance</h3>
            <p className="text-gray-400">Real-time stats and rankings</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-yellow-400">Instant Access</h3>
            <p className="text-gray-400">Get codes immediately</p>
          </div>
        </div>
      </div>
    </section>
  )
}