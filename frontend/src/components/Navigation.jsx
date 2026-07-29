import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '/SolaceHubLogo.jpeg';

function Navigation({ activeSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const navItems = [
    { name: 'Home', section: 'hero-section' },
    { name: 'Literacy', section: 'literacy-section' },
    { name: 'Contact', section: 'cta-section' }
  ];

  return (
    <header className="bg-light-cream fixed top-0 left-0 right-0 z-50 border-b border-gray-200 transition-all duration-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="SolaceHub" className="h-8 w-8 rounded-full" />
            <span className="text-xl font-bold text-text-primary">SolaceHub</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.section)}
                className={`text-sm font-medium transition ${
                  activeSection === item.section.replace('-section', '')
                    ? 'text-text-primary border-b-2 border-accent-gold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-text-muted hover:text-text-primary transition text-sm">
              SIGN IN
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.section)}
                className={`block text-sm font-medium transition w-full text-left ${
                  activeSection === item.section.replace('-section', '')
                    ? 'text-text-primary border-b-2 border-accent-gold'
                    : 'text-text-muted'
                }`}
              >
                {item.name}
              </button>
            ))}
            <Link to="/login" className="block text-text-muted text-sm">SIGN IN</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navigation;
