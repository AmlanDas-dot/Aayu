import { FileText, CreditCard, FileCheck, MapPin, Image as ImageIcon } from "lucide-react";

const DOCUMENTS = [
  { icon: FileText, title: "Aadhaar Card", sub: "Identity Proof" },
  { icon: CreditCard, title: "Bank Passbook", sub: "Bank Details" },
  { icon: FileCheck, title: "Income Certificate", sub: "(If applicable)" },
  { icon: MapPin, title: "Address Proof", sub: "Residence Proof" },
  { icon: ImageIcon, title: "Photo", sub: "Passport Size" },
];

export function DocumentsRequired() {
  return (
    <section className="documents-section">
      <h2 className="section-heading">Documents You May Need</h2>
      <p className="section-sub">Keep these documents handy to apply for most schemes</p>
      <div className="docs-grid">
        {DOCUMENTS.map(d => {
          const IconComponent = d.icon;
          return (
            <div key={d.title} className="doc-item-card">
              <div className="doc-item-icon-wrap">
                <IconComponent size={24} />
              </div>
              <div className="doc-item-title">{d.title}</div>
              <div className="doc-item-sub">{d.sub}</div>
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
