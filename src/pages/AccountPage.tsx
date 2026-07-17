import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, updateUserPreferences } from "@/services/userProfileService";
import { uploadAvatar, deleteAvatar } from "@/services/storageService";
import { reauthenticate, changePassword, deleteAccount } from "@/services/authService";
import { Settings, UserProfile, HealthProfile } from "@/firebase/collections";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Shield, Download, Heart, Settings as SettingsIcon, RefreshCw, Cloud, CloudOff, X } from 'lucide-react';
import { generateEmergencyCardPDF } from "@/services/PdfService";

export function AccountPage() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');

  // Form States
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});
  const [preferencesForm, setPreferencesForm] = useState<Partial<Settings>>({
    theme: "system",
    preferredLanguage: "en",
    notificationsEnabled: true,
    voiceResponses: true,
    medicalReminderNotifications: true,
    autoPlayVoice: false,
  });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const [isHealthEditing, setIsHealthEditing] = useState(false);
  const [healthForm, setHealthForm] = useState<Partial<HealthProfile>>({});
  
  // Chip Inputs
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load User Profile Data
  useEffect(() => {
    if (userProfile) {
      setProfileForm(userProfile);
      if (!isHealthEditing) {
        setHealthForm(userProfile.healthProfile || {
          bloodGroup: (userProfile as any)?.bloodGroup || "",
          emergencyContact: (userProfile as any)?.emergencyContact || { name: "", phone: "", relation: "" },
        });
      }
    }
  }, [userProfile, isHealthEditing]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // BMI Calculation
  useEffect(() => {
    if (healthForm.height && healthForm.weight) {
      const heightInMeters = healthForm.height / 100;
      const bmi = parseFloat((healthForm.weight / (heightInMeters * heightInMeters)).toFixed(1));
      setHealthForm(prev => ({ ...prev, bmi }));
    } else {
      setHealthForm(prev => ({ ...prev, bmi: undefined }));
    }
  }, [healthForm.height, healthForm.weight]);

  // Unsaved Changes Protection
  const isHealthDirty = isHealthEditing && JSON.stringify(healthForm) !== JSON.stringify(userProfile?.healthProfile || {});
  
  // Custom router blocking for BrowserRouter
  useEffect(() => {
    if (!isHealthDirty) return;
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest('a');
      // If clicking an external or internal link that navigates away from the account page
      if (target && target.href && !target.href.includes('/account')) {
        if (!window.confirm("You have unsaved healthcare information. Leave without saving?")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    // Use capture phase to intercept before React Router link handlers
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [isHealthDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isHealthDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isHealthDirty]);

  const handleTabChange = (newTab: string) => {
    if (isHealthDirty) {
      if (!window.confirm("You have unsaved healthcare information. Leave without saving?")) {
        return;
      }
    }
    setIsHealthEditing(false);
    setHealthForm(userProfile?.healthProfile || {});
    setActiveTab(newTab);
    setSearchParams({tab: newTab});
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateUserProfile(currentUser.uid, profileForm);
      showMessage("Profile updated successfully", "success");
    } catch (err: any) {
      console.error("Firebase Error (Update Profile):", err.code, err.message);
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Preferences Save
  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateUserPreferences(currentUser.uid, preferencesForm);
      showMessage("Preferences updated successfully", "success");
    } catch (err: any) {
      console.error("Firebase Error (Preferences):", err.code, err.message);
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Health Profile Save
  const handleHealthSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    
    // Validation
    if (healthForm.height && (healthForm.height < 50 || healthForm.height > 250)) {
      showMessage("Height must be between 50 and 250 cm", "error");
      return;
    }
    if (healthForm.weight && (healthForm.weight < 2 || healthForm.weight > 350)) {
      showMessage("Weight must be between 2 and 350 kg", "error");
      return;
    }
    if (healthForm.emergencyContact?.name && !healthForm.emergencyContact?.phoneNumber) {
      showMessage("Emergency Contact Phone Number is required", "error");
      return;
    }

    setLoading(true);
    setSyncStatus('saving');
    try {
      const updatedProfile = { 
        ...healthForm, 
        updatedAt: new Date().toISOString() 
      };
      await updateUserProfile(currentUser.uid, { healthProfile: updatedProfile });
      setIsHealthEditing(false);
      setSyncStatus('synced');
      showMessage("Healthcare Identity updated successfully", "success");
    } catch (err: any) {
      setSyncStatus('error');
      console.error("Firebase Error (Update Health):", err.code, err.message);
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Password Handling
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showMessage("New passwords do not match", "error");
      return;
    }
    if (passwords.new.length < 8) {
      showMessage("Password must be at least 8 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await reauthenticate(passwords.current);
      await changePassword(passwords.new);
      showMessage("Password changed successfully", "success");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      console.error("Firebase Error (Change Password):", err.code, err.message);
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Avatar Management
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            else resolve(file);
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setLoading(true);
    try {
      const compressedFile = await compressImage(file);
      const url = await uploadAvatar(currentUser.uid, compressedFile);
      await updateUserProfile(currentUser.uid, { photoURL: url });
      showMessage("Profile picture updated", "success");
    } catch (err: any) {
      console.error("Firebase Error (Avatar Upload):", err.code, err.message);
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!currentUser || !userProfile?.photoURL) return;
    if (window.confirm("Remove profile photo?")) {
      setLoading(true);
      try {
        await deleteAvatar(currentUser.uid);
        await updateUserProfile(currentUser.uid, { photoURL: null });
        showMessage("Profile picture removed", "success");
      } catch (err: any) {
        showMessage(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Auth Extras
  const handleLogout = async () => {
    if (isHealthDirty) {
      if (!window.confirm("You have unsaved healthcare information. Log out anyway?")) return;
    }
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await logout();
      } catch (err) {
        console.error("Error logging out", err);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const pwd = window.prompt("To delete your account, please confirm your current password:");
    if (!pwd) return;

    const confirm = window.prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.");
    if (confirm === 'DELETE') {
      try {
        setLoading(true);
        await reauthenticate(pwd);
        await deleteAccount();
        navigate("/login");
      } catch (err: any) {
        console.error("Firebase Error (Delete Account):", err.code, err.message);
        showMessage(err.message, "error");
        setLoading(false);
      }
    }
  };


  // Utility Helpers
  const getAge = (dob?: string) => {
    if (!dob) return "-";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return { label: "-", color: "#64748b", bg: "#f8fafc" };
    if (bmi < 18.5) return { label: "Underweight", color: "#b45309", bg: "#fef3c7" };
    if (bmi < 25) return { label: "Normal", color: "#15803d", bg: "#dcfce7" };
    if (bmi < 30) return { label: "Overweight", color: "#b91c1c", bg: "#fee2e2" };
    return { label: "Obese", color: "#991b1b", bg: "#fef2f2" };
  };

  const calculateCompletion = () => {
    const requiredFields = [
      healthForm.bloodGroup,
      healthForm.emergencyContact?.phoneNumber,
      healthForm.height,
      healthForm.weight,
      healthForm.allergies !== undefined
    ];
    const filled = requiredFields.filter(f => f).length;
    const missing = [];
    if (!healthForm.bloodGroup) missing.push("Blood Group");
    if (!healthForm.emergencyContact?.phoneNumber) missing.push("Emergency Contact Phone");
    if (!healthForm.height) missing.push("Height");
    if (!healthForm.weight) missing.push("Weight");
    if (healthForm.allergies === undefined) missing.push("Allergies (even if None)");

    return { percentage: Math.round((filled / 5) * 100), missing };
  };

  const chronicConditionsList = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Kidney Disease", "Cancer", "Thyroid Disorder", "Epilepsy", "None"];

  const handleAddChip = (type: 'allergy' | 'medication') => {
    if (type === 'allergy' && newAllergy.trim() && !healthForm.allergies?.includes(newAllergy.trim())) {
      setHealthForm(prev => ({ ...prev, allergies: [...(prev.allergies || []), newAllergy.trim()] }));
      setNewAllergy("");
    }
    if (type === 'medication' && newMedication.trim() && !healthForm.currentMedications?.includes(newMedication.trim())) {
      setHealthForm(prev => ({ ...prev, currentMedications: [...(prev.currentMedications || []), newMedication.trim()] }));
      setNewMedication("");
    }
  };

  const removeChip = (type: 'allergy' | 'medication', value: string) => {
    if (type === 'allergy') {
      setHealthForm(prev => ({ ...prev, allergies: prev.allergies?.filter(a => a !== value) }));
    } else {
      setHealthForm(prev => ({ ...prev, currentMedications: prev.currentMedications?.filter(m => m !== value) }));
    }
  };

  const downloadEmergencyCard = async () => {
    try {
      await generateEmergencyCardPDF("emergency-card-render", `${userProfile?.name?.replace(/\s/g, '_')}_EmergencyCard.pdf`);
      showMessage("Emergency Card downloaded successfully", "success");
    } catch (err: any) {
      showMessage("Failed to generate PDF: " + err.message, "error");
    }
  };

  if (!currentUser) return null;
  const isEmailProvider = currentUser?.providerData.some(p => p.providerId === 'password');
  const completion = calculateCompletion();

  return (
    <div className="settings-page" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
      
      {/* Hidden Emergency Card for PDF Rendering */}
      <div id="emergency-card-render" style={{ display: 'none', width: '800px', padding: '40px', backgroundColor: 'white', color: 'black', fontFamily: 'sans-serif' }}>
        <div style={{ borderBottom: '2px solid #dc2626', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#dc2626', fontSize: '28px' }}>AAYU Emergency Medical Card</h1>
            <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>For emergency medical personnel use only</p>
          </div>
          <div style={{ width: '80px', height: '80px', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>QR</div>
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} crossOrigin="anonymous" alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
             <div style={{ width: '150px', height: '150px', borderRadius: '12px', backgroundColor: '#e2e8f0' }} />
          )}
          <div>
            <h2 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>{userProfile?.name}</h2>
            <p style={{ fontSize: '18px', margin: '0 0 5px 0' }}><strong>Age:</strong> {getAge(userProfile?.dob)} | <strong>Gender:</strong> {userProfile?.gender}</p>
            <p style={{ fontSize: '18px', margin: '0 0 5px 0', color: '#dc2626' }}><strong>Blood Group:</strong> {userProfile?.healthProfile?.bloodGroup || "Not Set"}</p>
          </div>
        </div>
        <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Known Allergies</h3>
            <p style={{ margin: 0 }}>{userProfile?.healthProfile?.allergies?.join(", ") || "None recorded"}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Medical Conditions</h3>
            <p style={{ margin: 0 }}>{userProfile?.healthProfile?.chronicConditions?.join(", ") || "None recorded"}</p>
          </div>
        </div>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Current Medications</h3>
          <p style={{ margin: 0 }}>{userProfile?.healthProfile?.currentMedications?.join(", ") || "None recorded"}</p>
        </div>
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#166534' }}>Emergency Contact</h3>
          {userProfile?.healthProfile?.emergencyContact?.name ? (
            <p style={{ margin: 0, fontSize: '18px' }}><strong>{userProfile.healthProfile.emergencyContact.name}</strong> ({userProfile.healthProfile.emergencyContact.relationship || "Contact"}): {userProfile.healthProfile.emergencyContact.countryCode} {userProfile.healthProfile.emergencyContact.phoneNumber}</p>
          ) : (
            <p style={{ margin: 0 }}>No emergency contact provided.</p>
          )}
        </div>
        <div style={{ marginTop: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Generated by AAYU on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Left Sidebar */}
      <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="settings-card" style={{ padding: '30px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0f0f0' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: '#64748b', border: '4px solid #f0f0f0' }}>
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>
                Change Photo
              </button>
              {userProfile?.photoURL && (
                <button onClick={handleAvatarRemove} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontWeight: 'bold' }}>
                  Remove
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#333' }}>{userProfile?.name}</h2>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{currentUser.email}</p>
          </div>

          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '15px' }}>Emergency Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '13px' }}>Blood Group</span><span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '13px' }}>{userProfile?.healthProfile?.bloodGroup || "Not Set"}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b', fontSize: '13px' }}>Age</span><span style={{ fontWeight: 'bold', fontSize: '13px' }}>{getAge(userProfile?.dob)}</span></div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Known Allergies</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#b91c1c' }}>{userProfile?.healthProfile?.allergies?.length ? userProfile.healthProfile.allergies.join(", ") : "Not Set"}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Emergency Contact</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{userProfile?.healthProfile?.emergencyContact?.phoneNumber || "Not Set"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card" style={{ padding: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button 
              onClick={() => handleTabChange("profile")}
              style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: activeTab === 'profile' ? '#f1f5f9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#333', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <User size={20} /> Profile Information
            </button>
            <button 
              onClick={() => handleTabChange("health")}
              style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: activeTab === 'health' ? '#f1f5f9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#333', fontWeight: activeTab === 'health' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Heart size={20} /> Healthcare Identity
            </button>
            <button 
              onClick={() => handleTabChange("preferences")}
              style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: activeTab === 'preferences' ? '#f1f5f9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#333', fontWeight: activeTab === 'preferences' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <SettingsIcon size={20} /> Preferences
            </button>
            <button 
              onClick={() => handleTabChange("security")}
              style={{ padding: '15px 20px', textAlign: 'left', backgroundColor: activeTab === 'security' ? '#f1f5f9' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#333', fontWeight: activeTab === 'security' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Shield size={20} /> Security
            </button>
          </div>
        </div>

        <div className="settings-card" style={{ padding: '20px' }}>
          <h2 className="settings-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>Family</h2>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontWeight: 'bold', color: '#64748b', margin: '0 0 15px 0' }}>No Family Connected</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => navigate('/family')} style={{ padding: '8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Create Family</button>
              <button onClick={() => navigate('/family')} style={{ padding: '8px', backgroundColor: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Join Family</button>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column Content */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 className="settings-title">My Account</h1>

        {message && (
          <div style={{ padding: '15px 20px', borderRadius: '8px', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#15803d' : '#b91c1c', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-card">
            <h2 className="settings-section-title">Edit Profile</h2>
            <form onSubmit={handleProfileSave} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Full Name</label>
                  <input type="text" value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Phone Number</label>
                  <input type="tel" value={profileForm.phoneNumber || ""} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Date of Birth</label>
                  <input type="date" max={new Date().toISOString().split("T")[0]} value={profileForm.dob || ""} onChange={e => setProfileForm({...profileForm, dob: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Gender</label>
                  <select value={profileForm.gender || ""} onChange={e => setProfileForm({...profileForm, gender: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="submit" disabled={loading} className="settings-save-btn">{loading ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header & Status */}
            <div className="settings-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#0f172a' }}>Healthcare Identity</h2>
                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span>Your core medical profile</span>
                  {userProfile?.healthProfile?.updatedAt && <span>| Last Updated: {new Date(userProfile.healthProfile.updatedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {syncStatus === 'saving' && <span style={{ color: '#ca8a04', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><RefreshCw size={14} className="animate-spin" /> Saving...</span>}
                {syncStatus === 'synced' && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Cloud size={14} /> Synced</span>}
                {syncStatus === 'error' && <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><CloudOff size={14} /> Sync Failed</span>}
                
                <button onClick={downloadEmergencyCard} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={16} /> PDF Card
                </button>
              </div>
            </div>

            {/* Profile Completion Widget */}
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>Profile Completion</span>
                <span style={{ fontWeight: 'bold', color: completion.percentage === 100 ? '#16a34a' : '#2563eb' }}>{completion.percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${completion.percentage}%`, height: '100%', backgroundColor: completion.percentage === 100 ? '#16a34a' : '#2563eb', transition: 'width 0.3s ease' }} />
              </div>
              {completion.missing.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
                  Complete these fields: <strong style={{ color: '#b91c1c' }}>{completion.missing.join(", ")}</strong>
                </div>
              )}
            </div>

            {isHealthEditing ? (
              <form onSubmit={handleHealthSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Vitals Card */}
                <div className="settings-card">
                  <h2 className="settings-section-title">Vitals & Core Info</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Blood Group</label>
                      <select value={healthForm.bloodGroup || ""} onChange={e => setHealthForm({...healthForm, bloodGroup: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Organ Donor</label>
                      <select value={healthForm.organDonor ? "yes" : "no"} onChange={e => setHealthForm({...healthForm, organDonor: e.target.value === "yes"})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="no">No</option><option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Height (cm)</label>
                      <input type="number" min="50" max="250" value={healthForm.height || ""} onChange={e => setHealthForm({...healthForm, height: e.target.value ? Number(e.target.value) : undefined})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Weight (kg)</label>
                      <input type="number" min="2" max="350" value={healthForm.weight || ""} onChange={e => setHealthForm({...healthForm, weight: e.target.value ? Number(e.target.value) : undefined})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '15px', backgroundColor: getBMICategory(healthForm.bmi).bg, padding: '15px', borderRadius: '8px', border: `1px solid ${getBMICategory(healthForm.bmi).color}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: getBMICategory(healthForm.bmi).color, fontWeight: 'bold' }}>Calculated BMI</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: getBMICategory(healthForm.bmi).color }}>{healthForm.bmi || "-"} {healthForm.bmi ? `(${getBMICategory(healthForm.bmi).label})` : ""}</div>
                  </div>
                </div>

                {/* Medical Information Card */}
                <div className="settings-card">
                  <h2 className="settings-section-title">Medical Information</h2>
                  
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Current Medications</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input type="text" placeholder="e.g. Metformin" value={newMedication} onChange={e => setNewMedication(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddChip('medication'); } }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                      <button type="button" onClick={() => handleAddChip('medication')} style={{ padding: '0 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {healthForm.currentMedications?.map((med, i) => (
                        <span key={i} style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {med} <X size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => removeChip('medication', med)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Known Allergies</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input type="text" placeholder="e.g. Penicillin, Peanuts" value={newAllergy} onChange={e => setNewAllergy(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddChip('allergy'); } }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                      <button type="button" onClick={() => handleAddChip('allergy')} style={{ padding: '0 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {healthForm.allergies?.map((allergy, i) => (
                        <span key={i} style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {allergy} <X size={14} style={{ cursor: 'pointer', color: '#f87171' }} onClick={() => removeChip('allergy', allergy)} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Chronic Conditions</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {chronicConditionsList.map(cond => {
                        const isSelected = healthForm.chronicConditions?.includes(cond);
                        return (
                          <button key={cond} type="button" onClick={() => {
                              if (cond === "None") setHealthForm(prev => ({ ...prev, chronicConditions: ["None"] }));
                              else setHealthForm(prev => {
                                const current = (prev.chronicConditions || []).filter(c => c !== "None");
                                if (isSelected) return { ...prev, chronicConditions: current.filter(c => c !== cond) };
                                return { ...prev, chronicConditions: [...current, cond] };
                              });
                            }} style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${isSelected ? '#b91c1c' : '#ccc'}`, backgroundColor: isSelected ? '#fee2e2' : 'white', color: isSelected ? '#991b1b' : '#333', fontWeight: isSelected ? 'bold' : 'normal', cursor: 'pointer' }}>
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Past Surgeries</label>
                    <textarea rows={3} placeholder="List any past surgeries..." value={healthForm.pastSurgeries || ""} onChange={e => setHealthForm({...healthForm, pastSurgeries: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Vaccination Status</label>
                      <select value={healthForm.vaccinationStatus || ""} onChange={e => setHealthForm({...healthForm, vaccinationStatus: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">Unknown</option>
                        <option value="Up to date">Up to date</option>
                        <option value="Partially vaccinated">Partially vaccinated</option>
                        <option value="Not vaccinated">Not vaccinated</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Primary Physician</label>
                      <input type="text" placeholder="Dr. Name" value={healthForm.primaryPhysician || ""} onChange={e => setHealthForm({...healthForm, primaryPhysician: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Health Insurance (Optional)</label>
                    <input type="text" placeholder="Provider & Policy Number" value={healthForm.insurance || ""} onChange={e => setHealthForm({...healthForm, insurance: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  </div>
                </div>

                {/* Lifestyle Card */}
                <div className="settings-card">
                  <h2 className="settings-section-title">Lifestyle</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Smoking</label>
                      <select value={healthForm.smoking || ""} onChange={e => setHealthForm({...healthForm, smoking: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">Select</option><option value="Never">Never</option><option value="Former">Former</option><option value="Occasional">Occasional</option><option value="Daily">Daily</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Alcohol</label>
                      <select value={healthForm.alcohol || ""} onChange={e => setHealthForm({...healthForm, alcohol: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">Select</option><option value="Never">Never</option><option value="Occasional">Occasional</option><option value="Weekly">Weekly</option><option value="Daily">Daily</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Exercise</label>
                      <select value={healthForm.exercise || ""} onChange={e => setHealthForm({...healthForm, exercise: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">Select</option><option value="None">None</option><option value="Light">Light</option><option value="Moderate">Moderate</option><option value="Active">Active</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="settings-card">
                  <h2 className="settings-section-title">Emergency Contact</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Name</label>
                      <input type="text" value={healthForm.emergencyContact?.name || ""} onChange={e => setHealthForm(prev => ({...prev, emergencyContact: { ...(prev.emergencyContact || {countryCode: '+91', phoneNumber: ''}), name: e.target.value }}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Relationship (Optional)</label>
                      <input type="text" value={healthForm.emergencyContact?.relationship || ""} onChange={e => setHealthForm(prev => ({...prev, emergencyContact: { ...(prev.emergencyContact || {countryCode: '+91', phoneNumber: '', name: ''}), relationship: e.target.value }}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px', marginTop: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Code</label>
                      <input type="text" placeholder="+91" value={healthForm.emergencyContact?.countryCode || "+91"} onChange={e => setHealthForm(prev => ({...prev, emergencyContact: { ...(prev.emergencyContact || {phoneNumber: '', name: ''}), countryCode: e.target.value }}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Phone Number {healthForm.emergencyContact?.name && <span style={{color: 'red'}}>*</span>}</label>
                      <input type="tel" required={!!healthForm.emergencyContact?.name} value={healthForm.emergencyContact?.phoneNumber || ""} onChange={e => setHealthForm(prev => ({...prev, emergencyContact: { ...(prev.emergencyContact || {countryCode: '+91', name: ''}), phoneNumber: e.target.value }}))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => { setIsHealthEditing(false); setHealthForm(userProfile?.healthProfile || {}); }} style={{ padding: '12px 24px', backgroundColor: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{loading ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsHealthEditing(true)} style={{ padding: '10px 24px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-pen"></i> Edit Profile
                  </button>
                </div>

                <div className="settings-card">
                   <h2 className="settings-section-title">Summary</h2>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                     <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                       <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>Blood Group</div>
                       <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{healthForm.bloodGroup || "Not Set"}</div>
                     </div>
                     <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                       <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>BMI</div>
                       <div style={{ fontSize: '18px', fontWeight: 'bold', color: getBMICategory(healthForm.bmi).color }}>{healthForm.bmi || "-"} <span style={{fontSize:'13px', fontWeight:'normal'}}>({getBMICategory(healthForm.bmi).label})</span></div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="settings-card">
            <h2 className="settings-section-title">App Preferences</h2>
            <p className="settings-desc">Customize how AAYU looks and behaves.</p>
            <form onSubmit={handlePreferencesSave} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Voice Responses</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Allow AAYU to speak responses aloud</div>
                </div>
                <input type="checkbox" checked={preferencesForm.voiceResponses} onChange={e => setPreferencesForm({...preferencesForm, voiceResponses: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Auto Play Voice</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Automatically play voice when response is ready</div>
                </div>
                <input type="checkbox" checked={preferencesForm.autoPlayVoice} onChange={e => setPreferencesForm({...preferencesForm, autoPlayVoice: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Push Notifications</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Receive system alerts and updates</div>
                </div>
                <input type="checkbox" checked={preferencesForm.notificationsEnabled} onChange={e => setPreferencesForm({...preferencesForm, notificationsEnabled: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Medical Reminders</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Receive notifications for medicines and appointments</div>
                </div>
                <input type="checkbox" checked={preferencesForm.medicalReminderNotifications} onChange={e => setPreferencesForm({...preferencesForm, medicalReminderNotifications: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Theme Preference</label>
                <select value={preferencesForm.theme} onChange={e => setPreferencesForm({...preferencesForm, theme: e.target.value})} style={{ width: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'right' }}>
                <button type="submit" disabled={loading} className="settings-save-btn">
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="settings-card">
              <h2 className="settings-section-title">Account Security</h2>
              <p className="settings-desc">Manage your password and authentication methods.</p>
              
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Account Created</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{new Date(userProfile?.createdAt || "").toLocaleString()}</div>
                </div>
                
                {isEmailProvider && (
                  <form onSubmit={handlePasswordChange} style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Change Password</div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Current Password (Required)</label>
                      <input type="password" required value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} style={{ width: '300px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>New Password</label>
                      <input type="password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} style={{ width: '300px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Confirm New Password</label>
                      <input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '300px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="settings-card" style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
              <h2 className="settings-section-title" style={{ color: '#b91c1c' }}>Danger Zone</h2>
              
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid #fecaca' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#111' }}>Log out of all devices</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>Sign out from this browser session.</div>
                  </div>
                  <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#b91c1c' }}>Delete Account</div>
                    <div style={{ fontSize: '13px', color: '#dc2626' }}>Permanently remove your account and all associated data.</div>
                  </div>
                  <button onClick={handleDeleteAccount} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <i className="fa-solid fa-trash"></i> Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
