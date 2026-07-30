import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AayuSidebar } from "@/components/navigation/AayuSidebar";
import { AccountDropdown } from "@/components/navigation/AccountDropdown";

export function HomePage() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="homepage-root">
            <div className="wrapper d-flex">
                <AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <main className="main flex-grow-1">
                    <div className="topbar d-flex align-items-center justify-content-between" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
                        <div style={{ flex: 1 }}></div>
                        <div className="profile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button className="profile-item" onClick={() => navigate('/settings')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg)', borderRadius: '99px', fontSize: '15px', fontWeight: 600, border: 'none', color: 'inherit' }}>
                                <i className="fa-solid fa-globe" aria-hidden="true"></i>
                                <span>English</span>
                                <i className="fa-solid fa-chevron-down" style={{ fontSize: '12px' }} aria-hidden="true"></i>
                            </button>
                            <AccountDropdown />
                        </div>
                    </div>

                    <div className="content-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>

                        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px' }}>
                            <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                                How are you feeling today?
                            </h1>
                            <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Talk to AAYU about your symptoms, upload medical records, or ask about government health schemes in your language.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '60px', width: '100%' }}>
                            <button onClick={() => navigate('/chat')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--teal-bg)', border: '2px solid var(--teal)', borderRadius: '32px', width: '100%', maxWidth: '340px', height: '200px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0, 128, 128, 0.2)', transition: 'all 0.2s', padding: '20px' }} onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 128, 128, 0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 128, 128, 0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                <div style={{ background: 'var(--teal)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                                    <i className="fa-solid fa-microphone"></i>
                                </div>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--teal-dark)' }}>Tap to Speak</span>
                            </button>

                            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', width: '100%' }}>
                                <button onClick={() => navigate('/chat')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '24px', width: '158px', height: '160px', cursor: 'pointer', boxShadow: 'var(--shadow)', transition: 'all 0.2s', padding: '20px' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                    <div style={{ background: '#eff6ff', color: '#1d4ed8', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                                        <i className="fa-solid fa-camera"></i>
                                    </div>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Scan</span>
                                </button>

                                <button onClick={() => navigate('/chat')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '24px', width: '158px', height: '160px', cursor: 'pointer', boxShadow: 'var(--shadow)', transition: 'all 0.2s', padding: '20px' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                    <div style={{ background: '#f5f3ff', color: '#6d28d9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                                        <i className="fa-solid fa-keyboard"></i>
                                    </div>
                                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Type</span>
                                </button>
                            </div>
                        </div>

                        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                            <div className="section" style={{ marginTop: '20px' }}>
                                <div className="section-title" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
                                    Quick Links
                                </div>

                                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                    <button className="card" onClick={() => navigate('/records')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '16px', width: '100%', textAlign: 'left', background: 'var(--white)', border: '1px solid var(--border)', color: 'inherit' }}>
                                        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '12px', fontSize: '24px' }} aria-hidden="true">
                                            <i className="fa-regular fa-file-lines"></i>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>My Records</h3>
                                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Vaccinations & prescriptions</p>
                                        </div>
                                    </button>

                                    <button className="card" onClick={() => navigate('/hospitals')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '16px', width: '100%', textAlign: 'left', background: 'var(--white)', border: '1px solid var(--border)', color: 'inherit' }}>
                                        <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '12px', borderRadius: '12px', fontSize: '24px' }} aria-hidden="true">
                                            <i className="fa-solid fa-hospital"></i>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Nearby Care</h3>
                                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Find clinics & hospitals</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
