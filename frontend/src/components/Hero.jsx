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
            <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 h-[400px] sm:h-[450px] lg:h-[500px] flex items-center justify-center shadow-2xl relative overflow-hidden">
              <img 
                src="/pos.jpg" 
                alt="Memorial candles and flowers" 
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-black/20 to-transparent rounded-tl-3xl"></div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                <p className="text-xs font-semibold text-gray-900">SolaceHub</p>
                <p className="text-[10px] text-gray-600">Tribute Management</p>
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
