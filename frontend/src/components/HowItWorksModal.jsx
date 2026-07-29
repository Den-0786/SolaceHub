import { useState, useEffect } from 'react';
import { X, FolderPlus, Receipt, Utensils, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

function HowItWorksModal({ isOpen, onClose }) {
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleStep = (stepNumber) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  if (!isOpen) return null;

  const steps = [
    {
      number: '01',
      title: 'Event & Deceased Profile Setup',
      icon: FolderPlus,
      description: 'Family or admin configures the funeral event details, memorial profile, and local currency settings.'
    },
    {
      number: '02',
      title: 'Desk Collection Workstation',
      icon: Receipt,
      description: 'Attendants record cash/digital contributions on a desk tablet/laptop and instantly issue physical thermal receipts or digital SMS chits to donors.'
    },
    {
      number: '03',
      title: 'Meal & Refreshment Token Distribution',
      icon: Utensils,
      description: 'Automatic generation and validation of food, drink, and water tokens (chits) to replace paper meal tickets at Akan traditional funeral receptions.'
    },
    {
      number: '04',
      title: 'Live Admin Dashboard & Reporting',
      icon: BarChart3,
      description: 'Family heads track live totals, search specific contributions, and export encrypted PDF/Excel audit reports for accounting.'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              How SolaceHub Works
            </h2>
            <p className="text-gray-500 text-sm">
              Click a step to learn more
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-4 space-y-3">
          {steps.map((step) => (
            <div key={step.number} className="border-2 border-black rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => toggleStep(step.number)}
                className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 rounded-lg p-2">
                    <step.icon size={18} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-amber-600">STEP {step.number}</span>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                </div>
                {expandedStep === step.number ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>
              
              {expandedStep === step.number && (
                <div className="p-4 bg-white border-t-2 border-black">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security Badge */}
        <div className="px-4 pb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-center gap-2">
            <span className="text-sm">🔒</span>
            <span className="text-xs text-slate-700 font-medium">
              Enterprise Grade Security | End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-full font-medium hover:bg-slate-800 transition text-sm"
          >
            Got it, back to home
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksModal;
