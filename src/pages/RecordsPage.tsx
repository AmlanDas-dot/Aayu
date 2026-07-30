import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthContext } from "@/contexts/HealthContext";
import { getMedicalRecords, createMedicalRecord, generateRecordId, checkDuplicateRecord } from "@/services/recordService";
import { uploadMedicalRecord } from "@/firebase/storage";
import { createMedication } from "@/services/medicationService";
import { analyzeMedicalDocument } from "@/services/geminiRecordService";
import { HealthTrends } from "@/features/records/components/HealthTrends";
import { HealthTimeline } from "@/features/records/components/HealthTimeline";
import { FileText, Upload, Search, Loader2, X, AlertCircle } from "lucide-react";
import { getFamilyMembers } from "@/services/familyService";
import { FamilyMember, MedicalRecord } from "@/firebase/collections";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";

export function RecordsPage() {
  const { currentUser } = useAuth();
  const { selectedFamilyId, selectedMemberId } = useHealthContext();
  const navigate = useNavigate();
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMember, setFilterMember] = useState(selectedMemberId || "all");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState<"records" | "timeline">("timeline");

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle' | 'selecting' | 'analyzing' | 'reviewing' | 'duplicate_check'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMemberId, setUploadMemberId] = useState(selectedMemberId || '');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [tempFileUrl, setTempFileUrl] = useState("");
  const [duplicateRecord, setDuplicateRecord] = useState<MedicalRecord | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && selectedFamilyId) {
      loadData();
    }
  }, [currentUser, selectedFamilyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (selectedFamilyId) {
        const [recordsData, membersData] = await Promise.all([
          getMedicalRecords(selectedFamilyId),
          getFamilyMembers(selectedFamilyId)
        ]);
        setRecords(recordsData);
        setMembers(membersData);
        
        // If a new family is loaded, reset member filters to the context's selected one
        setFilterMember(selectedMemberId || "all");
        if (selectedMemberId) {
          setUploadMemberId(selectedMemberId);
        } else if (membersData.length > 0) {
          setUploadMemberId(membersData[0].id!);
        }
      }
    } catch (e: any) {
      console.error("Failed to load records data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadStep('selecting');
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile || !currentUser || !selectedFamilyId || !uploadMemberId) return;
    
    // First, check for duplicates locally using file name and size
    const duplicate = await checkDuplicateRecord(selectedFamilyId, uploadMemberId, selectedFile.name, selectedFile.type);
    if (duplicate) {
      setDuplicateRecord(duplicate);
      setUploadStep('duplicate_check');
      return;
    }

    await proceedWithAnalysis();
  };

  const proceedWithAnalysis = async () => {
    if (!selectedFile || !currentUser || !selectedFamilyId || !uploadMemberId) return;
    
    setUploadStep('analyzing');
    setIsUploading(true);
    
    try {
      const recordId = generateRecordId();
      const fileUrl = await uploadMedicalRecord(selectedFamilyId, uploadMemberId, recordId, selectedFile);
      setTempFileUrl(fileUrl);
      
      const analysis = await analyzeMedicalDocument(fileUrl, selectedFile.type);
      setAnalysisResult({ ...analysis, generatedRecordId: recordId });
      setUploadStep('reviewing');
    } catch (e: any) {
      console.error("Analysis failed:", e);
      alert("Failed to analyze the document. Please try again.");
      setUploadStep('idle');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveRecord = async (replaceId?: string) => {
    if (!currentUser || !analysisResult || !tempFileUrl || !selectedFile || !selectedFamilyId || !uploadMemberId) return;
    
    setIsUploading(true);
    try {
      const newRecord: Omit<MedicalRecord, "id"> = {
        familyId: selectedFamilyId,
        memberId: uploadMemberId,
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: analysisResult.metadata?.documentTitle || selectedFile.name,
        category: analysisResult.classification || "Other",
        tags: [],
        hospital: analysisResult.metadata?.hospitalName || null,
        doctor: analysisResult.metadata?.doctorName || null,
        recordDate: analysisResult.metadata?.visitDate || null,
        language: analysisResult.metadata?.language || null,
        geminiSummary: analysisResult.summaries?.aiSummary || null,
        extractedText: analysisResult.extractedText || null,
        importantValues: analysisResult.metadata?.importantValues || {},
        fileType: selectedFile.type,
        fileURL: tempFileUrl,
        thumbnailURL: null,
        pageCount: 1,
        searchable: true,
        shared: false,
        // Legacy
        classification: analysisResult.classification,
        metadata: analysisResult.metadata,
        summaries: analysisResult.summaries
      };

      const newRecordId = await createMedicalRecord(newRecord, replaceId || analysisResult.generatedRecordId);
      
      // If it's a Prescription with medications, save them to the medication plan
      if (analysisResult.metadata?.prescribedMedications?.length > 0) {
        const meds = analysisResult.metadata.prescribedMedications;
        for (const m of meds) {
          await createMedication({
            familyId: selectedFamilyId,
            memberId: uploadMemberId,
            recordId: newRecordId,
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            medicineName: m.medicineName,
            dosage: "As prescribed", // Default dosage if not explicitly extracted
            strength: m.strength || "",
            frequency: m.frequency,
            timesPerDay: m.timesPerDay || 2,
            specificTimes: m.specificTimes || [],
            duration: m.duration || "7 days",
            startDate: new Date().toISOString(),
            beforeFood: m.beforeFood || false,
            afterFood: m.afterFood || false,
            withFood: false,
            instructions: m.instructions || "",
            prescribingDoctor: analysisResult.metadata?.doctorName || "",
            status: 'ACTIVE',
            adherencePercentage: 100,
            remainingDays: 7 // simplified for MVP
          });
        }
      }
      
      setUploadStep('idle');
      setSelectedFile(null);
      setAnalysisResult(null);
      setDuplicateRecord(null);
      await loadData();
    } catch (e: any) {
      console.error("Failed to save record:", e);
      alert("Failed to save the record.");
    } finally {
      setIsUploading(false);
    }
  };

  // Filtering
  const filteredRecords = records.filter(record => {
    const matchesMember = filterMember === 'all' || record.memberId === filterMember;
    const matchesType = filterType === 'all' || record.category === filterType;
    const matchesSearch = searchTerm === "" || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.hospital || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.doctor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.geminiSummary || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.extractedText || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesMember && matchesType && matchesSearch;
  });

  // Group by Month/Year
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    const date = new Date(record.uploadedAt);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {} as Record<string, MedicalRecord[]>);

  const uniqueClassifications = Array.from(new Set(records.map(r => r.category)));

  if (!selectedFamilyId) {
    return (
      <EmptyState
        icon={FileText}
        title="No Family Selected"
        description="You must select or create a family to view Medical Records."
        actionText="Go to Family Hub"
        onAction={() => navigate('/family')}
        className="page-container"
      />
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#0f172a' }}>Medical Records</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Intelligent central repository for your family's health history.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={18} /> Upload Record
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" style={{ display: 'none' }} />
      </div>

      {/* Health Trends Dashboard (Only if viewing a specific member) */}
      {filterMember !== 'all' && (
        <HealthTrends records={filteredRecords} />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by hospital, doctor, condition, or keyword..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
          <option value="all">All Family Members</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
          <option value="all">All Types</option>
          {uniqueClassifications.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Timeline View */}
      {loading ? (
        <LoadingState message="Loading records..." />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab("timeline")}
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'timeline' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'timeline' ? '#0284c7' : '#64748b', fontWeight: activeTab === 'timeline' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '16px' }}
            >
              Unified Health Journey
            </button>
            <button 
              onClick={() => setActiveTab("records")}
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'records' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'records' ? '#0284c7' : '#64748b', fontWeight: activeTab === 'records' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '16px' }}
            >
              Medical Records
            </button>
          </div>

          {activeTab === 'timeline' ? (
            <HealthTimeline records={filteredRecords} />
          ) : (
            <>
              {filteredRecords.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No records found"
                  description="Upload a medical report to securely store and analyze it."
                  actionText="Upload Record"
                  onAction={() => fileInputRef.current?.click()}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {Object.entries(groupedRecords).map(([month, monthRecords]) => (
                    <div key={month}>
                      <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>{month}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {monthRecords.map(record => {
                          const memberName = members.find(m => m.id === record.memberId)?.name || 'Unknown Member';
                          return (
                            <div 
                              key={record.id} 
                              onClick={() => navigate(`/records/${record.id}`)}
                              style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ padding: '4px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                                  {record.category}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{memberName}</div>
                              </div>
                              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {record.title}
                              </h4>
                              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {record.geminiSummary || "No summary available."}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                                <span>{record.hospital || "Unknown facility"}</span>
                                <span>{new Date(record.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Upload & Analyze Modal */}
      {uploadStep !== 'idle' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '30px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Upload Medical Record</h2>
              <button onClick={() => { setUploadStep('idle'); setSelectedFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>

            {uploadStep === 'selecting' && (
              <div>
                <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Selected file: <strong>{selectedFile?.name}</strong></p>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>Whose record is this?</label>
                  <select value={uploadMemberId} onChange={e => setUploadMemberId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    {members.map(m => (
                      <option key={m.id} value={m.id!}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleStartAnalysis} 
                  disabled={isUploading || !uploadMemberId}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                  {isUploading ? <><Loader2 className="animate-spin" /> Checking...</> : "Analyze & Upload"}
                </button>
              </div>
            )}

            {uploadStep === 'duplicate_check' && duplicateRecord && (
              <div>
                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={18}/> Duplicate Detected
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9a3412' }}>
                    A record named "{duplicateRecord.title}" already exists for this family member.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => proceedWithAnalysis()} style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Keep Both (Upload as new)
                  </button>
                  <button onClick={() => {
                     // In real app, we'd replace the existing record's file and re-analyze.
                     // For MVP, we proceed and overwrite the firestore doc ID.
                     proceedWithAnalysis();
                  }} style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Replace Existing
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'analyzing' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 20px', color: '#3b82f6' }} />
                <h3 style={{ margin: '0 0 10px 0' }}>Analyzing Document</h3>
                <p style={{ color: '#64748b' }}>Gemini is extracting medical insights, diagnosing lab values, and generating summaries...</p>
              </div>
            )}

            {uploadStep === 'reviewing' && analysisResult && (
              <div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                  <AlertCircle color="#16a34a" />
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#166534' }}>Analysis Complete</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>Please review the extracted information before saving to your vault.</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#b45309', lineHeight: '1.4' }}>
                    <strong>Medical Disclaimer:</strong> This summary is generated by AI and may contain inaccuracies. 
                    It is not a substitute for professional medical advice. Always consult your doctor for medical decisions.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Classification</label>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{analysisResult.classification}</div>
                </div>

                {analysisResult.metadata?.hospitalName && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Hospital / Clinic</label>
                    <div>{analysisResult.metadata.hospitalName} {analysisResult.metadata.visitDate && `(${analysisResult.metadata.visitDate})`}</div>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Summary</label>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{analysisResult.summaries?.aiSummary}</p>
                </div>

                {analysisResult.metadata?.prescribedMedications?.length > 0 && (
                  <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>💊 Prescribed Medications</h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#1e40af' }}>The following medications will be automatically added to the Medication Plan:</p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e3a8a' }}>
                      {analysisResult.metadata.prescribedMedications.map((m: any, idx: number) => (
                        <li key={idx} style={{ marginBottom: '5px' }}>
                          <strong>{m.medicineName}</strong> {m.strength ? `(${m.strength})` : ''} - {m.frequency}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                  <button onClick={() => setUploadStep('idle')} style={{ flex: 1, padding: '12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleSaveRecord(duplicateRecord?.id)} disabled={isUploading} style={{ flex: 2, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : (duplicateRecord ? "Replace in Vault" : "Save to Vault")}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
      
    </div>
  );
}

