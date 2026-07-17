import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMedicalRecordById, deleteMedicalRecord } from "@/services/recordService";
import { deleteMedicalRecordFile } from "@/services/storageService";
import { MedicalRecord } from "@/firebase/collections";
import { ArrowLeft, Download, Trash2, Calendar, User, FileText, Activity, AlertTriangle, Share2, Type } from "lucide-react";

import { getFamilyMembers } from "@/services/familyService";

export function RecordDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [memberName, setMemberName] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  const loadRecord = async (recordId: string) => {
    try {
      const data = await getMedicalRecordById(recordId);
      setRecord(data);
      if (data) {
        const members = await getFamilyMembers(data.familyId);
        const m = members.find(m => m.id === data.memberId);
        setMemberName(m?.name || "Unknown Member");
      }
    } catch (err) {
      console.error("Failed to load record details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !id) return;
    if (window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      try {
        await deleteMedicalRecordFile(record.fileURL);
        await deleteMedicalRecord(id);
        navigate("/records");
      } catch (err) {
        console.error("Failed to delete record:", err);
        alert("Failed to delete record.");
      }
    }
  };

  const handleDownload = () => {
    if (record?.fileURL) {
      window.open(record.fileURL, "_blank");
    }
  };

  const handleShare = async () => {
    if (record?.fileURL && navigator.share) {
      try {
        await navigator.share({
          title: record.title,
          text: `Medical Record: ${record.title}`,
          url: record.fileURL,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (record?.fileURL) {
      // Fallback
      navigator.clipboard.writeText(record.fileURL);
      alert("Secure link copied to clipboard.");
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading record details...</div>;
  }

  if (!record) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Record not found</h2>
        <button onClick={() => navigate("/records")} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Back to Vault</button>
      </div>
    );
  }

  const isPdf = record.fileType.includes('pdf');
  const warnings = record.summaries?.warnings || [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate("/records")}
          style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <ArrowLeft size={18} /> Back to Vault
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleDownload} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
            <Download size={16} /> Download
          </button>
          <button onClick={handleShare} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
            <Share2 size={16} /> Share
          </button>
          <button onClick={handleDelete} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Left Column: Document Viewer */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Document Preview</h3>
            <span style={{ fontSize: '12px', color: '#64748b', padding: '4px 8px', backgroundColor: '#e2e8f0', borderRadius: '4px', fontWeight: 'bold' }}>
              {record.category}
            </span>
          </div>
          <div style={{ flex: 1, minHeight: '600px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isPdf ? (
              <iframe src={`${record.fileURL}#view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
            ) : (
              <img src={record.fileURL} alt="Medical Record" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}
          </div>
        </div>

        {/* Right Column: AI Extraction & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '10px' }}>
          
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '25px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>{record.title}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><User size={20} color="#64748b" /></div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Patient</div>
                  <div style={{ fontWeight: 'bold' }}>{memberName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}><Calendar size={20} color="#64748b" /></div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Date</div>
                  <div style={{ fontWeight: 'bold' }}>{record.recordDate || new Date(record.uploadedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> AI Summary
              </h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{record.geminiSummary || record.summaries?.detailedSummary || "No summary available."}</p>
            </div>

            {warnings.length > 0 && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '14px', color: '#b91c1c', textTransform: 'uppercase', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} /> Important Flags
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
                  {warnings.map((w, i) => <li key={i} style={{ marginBottom: '4px' }}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Structured Values */}
          {record.importantValues && Object.keys(record.importantValues).length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '25px' }}>
              <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} /> Extracted Metrics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {Object.entries(record.importantValues).map(([key, value]) => (
                  <div key={key} style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{key}</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text (OCR) */}
          {record.extractedText && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '25px' }}>
              <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={16} /> Full OCR Text
              </h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', border: '1px solid #f1f5f9', color: '#334155' }}>
                {record.extractedText}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
