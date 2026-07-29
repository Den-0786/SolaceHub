import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import HowItWorksModal from './HowItWorksModal';

function Hero({ id, onGetStarted }) {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  
  return (
    <>
      <section id={id} className="bg-light-cream py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-accent-gold font-semibold text-sm tracking-wider uppercase">
              Elevating the Memorial Experience
            </p>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary leading-tight">
              Dignified, Seamless{' '}
              <span className="text-accent-gold">Tribute Collections</span>
            </h1>
            <p className="text-text-muted text-lg leading-relaxed">
              Transform your memorial services with our digital tribute management system.
              Say goodbye to manual bookkeeping and hello to precise, efficient donation tracking
              that honors every contribution with dignity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={onGetStarted} className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium shadow-lg transition flex items-center justify-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
              <button onClick={() => setIsHowItWorksOpen(true)} className="text-text-primary font-medium hover:text-accent-gold transition flex items-center justify-center gap-2">
                How it works <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 h-[400px] sm:h-[450px] lg:h-[500px] flex items-center justify-center shadow-2xl relative">
              <div className="rounded-2xl p-1 relative overflow-hidden h-full w-full">
                <img 
                  src="https://images.unsplash.com/photo-1762990006179-1d8d7c05eb89?fm=jpg&q=60&w=3000&auto=format&fit=crop" 
                  alt="Memorial candles and flowers" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                <div className="relative bg-dark-midnight rounded-xl p-2 sm:p-3 transform -rotate-4 transition-transform duration-300 w-[80%] sm:w-3/4 max-h-[90%] border-2 sm:border-4 border-black absolute top-[45%] sm:top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-white rounded-lg p-2 sm:p-3 space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 sm:pb-2">
                      <div className="flex items-center gap-1">
                        <img src="/SolaceHubLogo.jpeg" alt="SolaceHub" className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" />
                        <span className="text-text-primary font-bold text-[10px] sm:text-xs">SolaceHub</span>
                      </div>
                      <button className="bg-accent-gold text-white font-semibold text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 rounded-full hover:bg-amber-500 transition">Login</button>
                    </div>
                    <div className="text-center">
                      <p className="text-text-primary font-bold text-base sm:text-xl mb-1.5 sm:mb-2">Make a Donation</p>
                      <p className="text-text-muted text-xs sm:text-sm">Select an amount</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                      <button className="bg-light-cream border border-gray-200 sm:border-2 rounded-lg py-1.5 sm:py-2 text-text-primary font-semibold text-xs sm:text-sm hover:border-primary-green hover:text-primary-green transition">
                        $50
                      </button>
                      <button className="bg-light-cream border border-gray-200 sm:border-2 rounded-lg py-1.5 sm:py-2 text-text-primary font-semibold text-xs sm:text-sm hover:border-primary-green hover:text-primary-green transition">
                        $100
                      </button>
                      <button className="bg-black border border-gold sm:border-2 rounded-lg py-1.5 sm:py-2 text-white font-semibold text-xs sm:text-sm">
                        $250
                      </button>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <input 
                        type="text" 
                        placeholder="Donor Name" 
                        className="w-full bg-light-cream border border-gray-200 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary-green text-xs sm:text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Memorial Name" 
                        className="w-full bg-light-cream border border-gray-200 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary-green text-xs sm:text-sm"
                      />
                    </div>
                    
                      <button className="w-full bg-dark-slate text-white py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-800 transition text-xs sm:text-sm">
                      Donate Now
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl p-1.5 sm:p-2 px-3 sm:px-4 w-[90%] sm:w-[30rem] max-w-[400px] border border-gray-100">
                <p className="text-[8px] sm:text-[10px] tracking-wider text-amber-600 font-bold">RECENT TRIBUTE</p>
                <div className="flex items-center justify-between">
                  <p className="text-text-primary font-semibold text-xs sm:text-sm">$250.00 - Anonymous</p>
                  <div className="bg-amber-100 rounded-full p-0.5 sm:p-1">
                    <Check size={10} className="text-amber-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
    </>
  );
}

export default Hero;
