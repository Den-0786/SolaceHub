import { X } from 'lucide-react';

function LegalModal({ isOpen, onClose, legalTab }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6 pt-12">
          {legalTab === 'privacy' ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Privacy Policy</h2>
              <p className="text-xs text-slate-400 mb-6">Effective Date: January 1, 2026 | Last Updated: July 27, 2026</p>
              
              <p className="text-slate-600 mb-6">
                At SolaceHub, we are committed to protecting the privacy, dignity, and confidentiality of the families we serve, as well as the donors and attendants using our system. This Privacy Policy explains how we collect, use, store, and safeguard your information during event operations, memorial donation tracking, and refreshment voucher administration.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">1. Information We Collect</h3>
                  <p className="text-slate-600 mb-3">To provide seamless event registry and receipting services, SolaceHub collects the following categories of information:</p>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Event & Memorial Details:</strong> Deceased person's full name, age, memorial image/photo, venue address, and event schedule pre-configured by the System Owner.</li>
                    <li><strong>Family & Account Contact Info:</strong> Family Head name, primary phone number, and temporary access credentials.</li>
                    <li><strong>Donation Registry Data:</strong> Donor full name, phone number, contribution amount, payment type (Cash or Mobile Money), timestamp, and collection desk attendant ID.</li>
                    <li><strong>Refreshment Voucher (Chit) Logs:</strong> Voucher issue timestamps, attendant IDs, and item allocation counts.</li>
                    <li><strong>Hardware Diagnostic Logs:</strong> Connected IP addresses, battery health, and online status of assigned tablets and thermal printers.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">2. How We Use Your Information</h3>
                  <p className="text-slate-600 mb-3">We use the collected information strictly for operational event execution:</p>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li>To log real-time financial contributions and generate physical thermal receipts.</li>
                    <li>To issue and verify refreshment chits at designated event desks.</li>
                    <li>To provide the Family Head with live dashboard analytics and printable master reports.</li>
                    <li>To generate a downloadable Master CSV Archive upon completion of the event.</li>
                    <li>To monitor system uptime and hardware status during active sessions.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">3. Data Confidentiality & Sharing</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Zero Third-Party Sales:</strong> SolaceHub does <strong>not</strong> sell, rent, trade, or commercialize any family records, donor lists, or financial data to third-party advertisers or marketers.</li>
                    <li><strong>Data Ownership:</strong> All donation records and financial tallies belong entirely to the designated Family Head.</li>
                    <li><strong>System Owner Access:</strong> System Owners retain administrative access solely for technical deployment, hardware setup, and generating master backups.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">4. Data Retention & Archival</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Active Session Window:</strong> Data remains active on collection stations for the duration of the configured event window (e.g., 2 Days).</li>
                    <li><strong>Session Locking:</strong> Once the session timer expires or the System Owner marks the event as <strong>Attended / Completed</strong>, access portals are locked and temporary credentials are invalidated.</li>
                    <li><strong>Master Export:</strong> The family or administrator can download the final Master CSV archive. Historical records are archived securely in accordance with standard data backup practices.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">5. Security Measures</h3>
                  <p className="text-slate-600 mb-3">We implement multi-layered administrative and technical security controls:</p>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li>Role-based permissions preventing unauthorized desk operators from accessing family settings.</li>
                    <li>Time-locked session tokens and temporary password fallbacks.</li>
                    <li>Encrypted communication between deployed tablets, thermal printers, and cloud servers.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-slate-900 font-bold mb-2">6. Contact Us</h3>
                  <p className="text-slate-600">
                    For privacy inquiries or data removal requests regarding an event session, please contact your designated SolaceHub System Owner or reach out to <strong>support@solacehub.com</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Terms of Service</h2>
              <p className="text-xs text-slate-400 mb-6">Effective Date: January 1, 2026 | Last Updated: July 27, 2026</p>
              
              <p className="text-slate-600 mb-6">
                Please read these Terms of Service ("Terms") carefully before using the SolaceHub platform, including our web applications, collection desk tablet interfaces, and hardware deployment units. By accessing or using SolaceHub, you agree to be bound by these Terms.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">1. Service Overview</h3>
                  <p className="text-slate-600">
                    SolaceHub is a specialized event management application designed to facilitate real-time memorial donation tracking, physical receipt printing, and refreshment voucher (chit) distribution.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">2. User Responsibilities & Account Security</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Family Head Credentials:</strong> The Family Head is responsible for maintaining the confidentiality of their dashboard password and ensuring that desk operator credentials are provided only to authorized event attendants.</li>
                    <li><strong>Accurate Data Entry:</strong> Desk attendants are responsible for verifying cash and Mobile Money amounts before printing physical receipts. SolaceHub is an administrative logging tool and does not process financial banking transactions directly.</li>
                    <li><strong>Unauthorized Access:</strong> Users agree not to attempt to bypass time-locked sessions, force master key overrides, or tamper with system hardware.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">3. Hardware Deployment & Equipment Usage</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Assigned Hardware:</strong> Physical units (tablets and 58mm/80mm thermal printers) assigned for an event remain the property of the System Owner / Service Provider.</li>
                    <li><strong>Equipment Care:</strong> The family and event organizers agree to exercise reasonable care when operating hardware on-site at venue grounds.</li>
                    <li><strong>Hardware Return:</strong> Upon conclusion of the event (or when marked <strong>Attended / Completed</strong>), all assigned hardware must be returned to the System Owner in good working order.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">4. Event Lifecycle & Session Lockout Rules</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li><strong>Configured Event Window:</strong> Access to live logging terminals is governed by the pre-assigned session timer (e.g., 24 or 48 hours).</li>
                    <li><strong>Automatic Session Lock:</strong> Upon expiry of the timer, collection portals lock automatically to prevent post-event record tampering.</li>
                    <li><strong>Time Extensions:</strong> Session extensions (e.g., +24 Hours) must be granted directly by the System Owner via the Manage Deployment panel.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-slate-900 font-bold mb-2">5. Limitation of Liability</h3>
                  <ul className="pl-5 list-disc space-y-1 text-slate-600">
                    <li>SolaceHub and its owners shall not be held liable for physical cash discrepancies on-site resulting from human entry errors by desk attendants.</li>
                    <li>SolaceHub is not responsible for event delays caused by venue power outages or total local network failures, though offline printing fallbacks are supported where applicable.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-slate-900 font-bold mb-2">6. Service Modifications & Termination</h3>
                  <p className="text-slate-600">
                    We reserve the right to suspend or lock an active deployment session in the event of clear system abuse, credential sharing outside authorized personnel, or non-payment of deployment service fees.
                  </p>
                </div>

                <div>
                  <h3 className="text-slate-900 font-bold mb-2">7. Governing Law</h3>
                  <p className="text-slate-600">
                    These Terms shall be governed and construed in accordance with the laws of the Republic of Ghana, without regard to its conflict of law provisions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LegalModal;
