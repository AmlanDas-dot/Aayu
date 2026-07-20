import { FileText, CreditCard, FileCheck, MapPin, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

const DOCUMENTS = [
  { id: 'aadhaar', icon: FileText, title: "Aadhaar Card", sub: "Identity Proof" },
  { id: 'bank', icon: CreditCard, title: "Bank Passbook", sub: "Bank Details" },
  { id: 'income', icon: FileCheck, title: "Income Certificate", sub: "(If applicable)" },
  { id: 'address', icon: MapPin, title: "Address Proof", sub: "Residence Proof" },
  { id: 'photo', icon: ImageIcon, title: "Photo", sub: "Passport Size" },
];

export function DocumentsRequired({ userDocuments = [] }: { userDocuments?: string[] }) {
  return (
    <section className="documents-section">
      <h2 className="section-heading">Documents You May Need</h2>
      <p className="section-sub">Keep these documents handy to apply for most schemes</p>
      <div className="docs-grid">
        {DOCUMENTS.map(d => {
          const IconComponent = d.icon;
          const hasDoc = userDocuments.includes(d.id);
          return (
            <div key={d.title} className="doc-item-card" style={{ border: hasDoc ? '1px solid #bbf7d0' : '1px solid #fecaca', background: hasDoc ? '#f0fdf4' : '#fef2f2' }}>
              <div className="doc-item-icon-wrap" style={{ background: hasDoc ? '#dcfce7' : '#fee2e2' }}>
                <IconComponent size={24} color={hasDoc ? '#16a34a' : '#ef4444'} />
              </div>
              <div className="doc-item-title">{d.title}</div>
              <div className="doc-item-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                {hasDoc ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#ef4444" />}
                <span style={{ color: hasDoc ? '#15803d' : '#b91c1c' }}>{hasDoc ? 'Available' : 'Missing'}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="doc-tip">
        💡 <strong>Tip:</strong> Keep scanned or clear photos of documents ready for faster application.
      </div>
    </section>
  );
}
