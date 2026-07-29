import logo from '/SolaceHubLogo.jpeg';

function Footer({ onContactClick, onOpenLegalModal }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="SolaceHub" className="h-10 w-10 rounded-full" />
            <div>
              <h3 className="text-xl font-bold text-text-primary">SolaceHub</h3>
              <p className="text-text-muted text-sm">
                Dignified digital solutions for modern memorial services.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenLegalModal('privacy'); }} className="text-text-muted hover:text-text-primary transition">
              Privacy Policy
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenLegalModal('terms'); }} className="text-text-muted hover:text-text-primary transition">
              Terms of Service
            </a>
            <a href="#" onClick={onContactClick} className="text-text-muted hover:text-text-primary transition">
              Contact Support
            </a>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-text-muted text-sm">
            © {currentYear} SolaceHub. All rights reserved.
          </p>
        </div>
      </div>
      
    </footer>
  );
}

export default Footer;
