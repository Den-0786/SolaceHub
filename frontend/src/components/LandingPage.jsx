import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import Features from './Features';
import FeatureGrid from './FeatureGrid';
import CTA from './CTA';
import Footer from './Footer';
import ScrollReveal from './common/ScrollReveal';
import LegalModal from './common/LegalModal';

function LandingPage() {
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('privacy');

  const handleGetStarted = () => {
    setIsContactExpanded(true);
    setTimeout(() => {
      document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenLegalModal = (tab) => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  useEffect(() => {
    const sections = ['hero-section', 'literacy-section', 'cta-section'];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id.replace('-section', ''));
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-light-cream">
      <Navigation activeSection={activeSection} />
      <ScrollReveal>
        <Hero id="hero-section" onGetStarted={handleGetStarted} />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <Features />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <FeatureGrid id="literacy-section" />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <CTA id="cta-section" isContactExpanded={isContactExpanded} setIsContactExpanded={setIsContactExpanded} />
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <Footer onContactClick={handleGetStarted} onOpenLegalModal={handleOpenLegalModal} />
      </ScrollReveal>

      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        legalTab={legalTab}
      />
    </div>
  );
}

export default LandingPage;
