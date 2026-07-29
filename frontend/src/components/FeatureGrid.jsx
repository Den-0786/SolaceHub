import { FileText, Tablet, Lock } from 'lucide-react';

function FeatureGrid({ id }) {
  return (
    <section id={id} className="bg-light-cream py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-2xl p-8 shadow-lg flex flex-col">
            <h3 className="text-2xl font-bold text-text-primary mb-2">Financial Integrity</h3>
            <p className="text-text-muted mb-6">
              Complete transparency in every transaction. Track every donation with precision 
              and maintain accurate records for families and administrators.
            </p>
            <div className="bg-gray-100 rounded-xl p-4 flex-grow">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop" 
                alt="Laptop with analytics dashboard" 
                className="w-full rounded-lg h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="bg-dark-slate rounded-2xl p-8 text-white flex-1">
              <div className="flex items-start gap-4">
                <div className="bg-accent-gold/20 rounded-lg p-3">
                  <FileText size={24} className="text-accent-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Legacy Export</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Export comprehensive reports in multiple formats. Generate professional 
                    PDFs and Excel spreadsheets for families and organizational records.
                  </p>
                  <p className="text-gray-400 text-sm mt-3">
                    Preserve every contribution with detailed audit trails and customizable reporting templates.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full">
                <div className="bg-primary-green/10 rounded-lg p-3 mb-4">
                  <Tablet size={24} className="text-primary-green" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Optimized for Tablets</h3>
                <p className="text-accent-gold text-sm font-semibold mb-2">DESK READY</p>
                <p className="text-text-muted text-sm">
                  Perfect for tribute desk operations with touch-optimized interface.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full">
                <div className="bg-primary-green/10 rounded-lg p-3 mb-4">
                  <Lock size={24} className="text-primary-green" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Secure Processing</h3>
                <p className="text-accent-gold text-sm font-semibold mb-2">ENCRYPTED DATA</p>
                <p className="text-text-muted text-sm">
                  Bank-level security protects all sensitive donation information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureGrid;
