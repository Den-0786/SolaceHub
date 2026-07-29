import { Edit, Printer, BarChart3 } from 'lucide-react';

function Features() {
  const features = [
    {
      icon: Edit,
      title: 'Set Up the Memorial',
      description: 'Create personalized memorial pages in minutes. Customize themes, add photos, and set up donation categories.',
      step: 'STEP 01',
    },
    {
      icon: Printer,
      title: 'Instant Desk Registry',
      description: 'Generate thermal print receipts instantly at the tribute desk. Professional receipts for every donation.',
      step: 'STEP 02',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Tracking',
      description: 'Monitor donations in real-time. Export to Excel or PDF for comprehensive reporting and analysis.',
      step: 'STEP 03',
    },
  ];

  return (
    <section className="bg-light-off-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            Modernizing the Tribute Desk
          </h2>
          <p className="text-text-muted text-lg">
            Three simple steps to transform your memorial services
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 border border-accent-gold/20 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="bg-primary-green/10 rounded-lg p-3">
                  <feature.icon size={24} className="text-primary-green" />
                </div>
                <span className="text-accent-gold text-sm font-semibold">{feature.step}</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
