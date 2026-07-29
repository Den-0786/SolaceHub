import { Phone, MessageCircle, Mail, MapPin, ArrowRight } from 'lucide-react';
import { useOwnerSettings } from '../hooks/useOwnerSettings.js';

function CTA({ id, isContactExpanded, setIsContactExpanded }) {
  const { settings } = useOwnerSettings();

  const profile = {
    name: settings.developerName,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.masterEmail,
    location: settings.location,
    portfolioUrl: settings.portfolioUrl
  };

  return (
    <section id={id} className="py-16 lg:py-24 min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-dark-slate rounded-2xl p-8 sm:p-16 lg:p-20 mx-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to support your families better?
        </h2>
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          Join hundreds of memorial homes that have transformed their tribute operations 
          with our digital solution. Start your free trial today and experience the difference.
        </p>
        <button 
          onClick={() => setIsContactExpanded(!isContactExpanded)}
          className="bg-accent-gold text-text-primary px-8 py-4 rounded-full font-semibold text-lg hover:bg-accent-gold-light transition"
        >
          {isContactExpanded ? 'Close Contact Info' : ' Get in Touch'}
        </button>

        {isContactExpanded && (
          <div className="mt-8 transition-all duration-300 ease-in-out">
            <div className="border border-amber-500/20 bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                <img src="/SolaceHubLogo.jpeg" alt="SolaceHub" className="h-8 w-8 rounded-full" />
                <div className="text-left">
                  <h3 className="text-white font-bold text-lg">SolaceHub</h3>
                  <p className="text-gray-400 text-sm">{profile.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-accent-gold/20 rounded-lg p-2">
                    <Phone size={18} className="text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="text-white text-sm font-medium">{profile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="bg-accent-gold/20 rounded-lg p-2">
                    <MessageCircle size={18} className="text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">WhatsApp</p>
                    <a 
                      href={`https://wa.me/${profile.whatsapp.replace(/\s/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-sm font-medium hover:text-accent-gold transition"
                    >
                      {profile.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="bg-accent-gold/20 rounded-lg p-2">
                    <Mail size={18} className="text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <a 
                      href={`mailto:${profile.email}`}
                      className="text-white text-sm font-medium hover:text-accent-gold transition"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="bg-accent-gold/20 rounded-lg p-2">
                    <MapPin size={18} className="text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Location</p>
                    <p className="text-white text-sm font-medium">{profile.location}</p>
                  </div>
                </div>
              </div>

              <a 
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-accent-gold text-text-primary px-6 py-3 rounded-full font-semibold text-sm hover:bg-accent-gold-light transition w-full justify-center"
              >
                Visit Developer Portfolio & Send Message
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

export default CTA;
