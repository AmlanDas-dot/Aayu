import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { LiveAlertsSidebar } from "@/components/dashboard/LiveAlertsSidebar";
import { AayuSidebar } from "@/components/navigation/AayuSidebar";
import { AccountDropdown } from "@/components/navigation/AccountDropdown";
import "@/aayu-home.css";

import logoHeart from "@/assets/logo-heart.png";

import Docs from "@/assets/Docs.png";
import Screening from "@/assets/Screening.png";
import Nearby from "@/assets/Nearby.png";
import Nutrition from "@/assets/Nutrition.png";
import FamilyHealth from "@/assets/Family_health.png";
import Schemes from "@/assets/Schemes.png";
import Dengue from "@/assets/dengue.png";
import Malaria from "@/assets/malaria.png";
import Tuberculosis from "@/assets/tuberculosis.png";
import Flu from "@/assets/flu.png";
import Maternal from "@/assets/maternal.png";
import StepTell from "@/assets/step_tell.png";
import StepQuestions from "@/assets/step_questions.png";
import StepGuidance from "@/assets/step_guidance.png";
import StepConsult from "@/assets/step_consult.png";

export function HomePage() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mapCenter, setMapCenter] = useState({ lat: 19.816389349047885, lng: 85.83363572524317 });
    const [mapZoom, setMapZoom] = useState(13);

    const handleAlertClick = useCallback((lat: number, lng: number) => {
        setMapCenter({ lat, lng });
        setMapZoom(15);
    }, []);


    return (
        <div className="homepage-root">


            <div className="wrapper d-flex">

                <AayuSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

                <main className="main flex-grow-1">

                    <div className="topbar d-flex align-items-center justify-content-between">

                        <div className="search" onClick={() => navigate('/search')} style={{ cursor: 'pointer' }}>
                            <span>Search for diseases, symptoms, articles, schemes...</span>
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </div>

                        <div className="profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="profile-item" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
                                <i className="fa-solid fa-globe"></i>
                                <span>English</span>
                                <i className="fa-solid fa-chevron-down"></i>
                            </div>
                            <AccountDropdown />
                        </div>

                    </div>

                    <div className="content-layout">

                        {/*  LEFT SIDE  */}

                        <div className="main-content">

                            <div className="hero">
                                <div className="hero-card">

                                    <div className="hero-left">

                                        <div className="subtitle">
                                            Your AI Health Assistant
                                        </div>

                                        <div className="hero-title">
                                            Information.<br />
                                            Guidance.<br />
                                            Care.
                                        </div>

                                        <div className="hero-desc">
                                            Ask anything about symptoms, disease prevention,
                                            nutrition, government schemes or nearby healthcare
                                            facilities in your own language.
                                        </div>

                                        <div className="tags">
                                            <div className="tag">Multilingual</div>
                                            <div className="tag">Offline First</div>
                                            <div className="tag">Trusted Sources</div>
                                            <div className="tag">Privacy Focused</div>
                                        </div>

                                    </div>

                                </div>
                                <div className="chat-box">

                                    <div className="chat-title">
                                        Talk to AAYU
                                    </div>

                                    <p className="chat-sub">
                                        Voice, text or image-based healthcare assistance.
                                    </p>

                                    <div className="chat-input">

                                        <input placeholder="Ask about symptoms, nutrition, schemes..." />

                                        <button className="send-btn" onClick={() => navigate('/chat')}>
                                            ➤
                                        </button>

                                    </div>

                                    <div className="quick-actions">

                                        <button className="action-btn" onClick={() => navigate('/chat')}>
                                            <div className="action-icon">
                                                <i className="fa-solid fa-microphone"></i>
                                            </div>
                                            <span>Speak</span>
                                        </button>

                                        <button className="action-btn" onClick={() => navigate('/chat')}>
                                            <div className="action-icon">
                                                <i className="fa-solid fa-camera text-xl"></i>
                                            </div>
                                            <span>Scan / Upload</span>
                                        </button>

                                        <button className="action-btn" onClick={() => navigate('/chat')}>
                                            <div className="action-icon">
                                                <i className="fa-solid fa-headphones text-xl"></i>
                                            </div>
                                            <span>Listen</span>
                                        </button>

                                    </div>

                                </div>

                            </div>

                            <div className="section">

                                <div className="section-title">
                                    Start Here — What Would You Like To Do?
                                </div>

                                <div className="section-layout">

                                    <div className="grid">
                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/records')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={Docs} alt="My Health Records icon" />
                                            <h3>My Health Records</h3>
                                            <p>
                                                Vaccination records, prescriptions and reports.
                                            </p>
                                        </div>

                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/screening')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={Screening} alt="Screening & Guidance icon" />
                                            <h3>Screening & Guidance</h3>
                                            <p>
                                                Symptom assessment and healthcare guidance.
                                            </p>
                                        </div>

                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/hospitals')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={Nearby} alt="Nearby Healthcare icon" />
                                            <h3>Nearby Healthcare</h3>
                                            <p>
                                                Hospitals, clinics and health camps.
                                            </p>
                                        </div>

                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/nutrition')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={Nutrition} alt="Nutrition icon" />
                                            <h3>Nutrition</h3>
                                            <p>
                                                Personalized food and diet guidance.
                                            </p>
                                        </div>

                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/family')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={FamilyHealth} alt="Family Health icon" />
                                            <h3>Family Health</h3>
                                            <p>
                                                Manage health information for family members.
                                            </p>
                                        </div>

                                        <div className="card col-12 col-md-6 col-xl-4" onClick={() => navigate('/schemes')} style={{ cursor: 'pointer' }}>
                                            <img className="card-icon" src={Schemes} alt="Government Schemes icon" />
                                            <h3>Government Schemes</h3>
                                            <p>
                                                Discover benefits and eligibility information.
                                            </p>
                                        </div>

                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: '320px', flex: 1, alignSelf: 'stretch' }}>
                                        <div className="map-card" style={{ flex: 1, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                                            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'}>
                                                <Map 
                                                    defaultCenter={mapCenter} 
                                                    center={mapCenter}
                                                    defaultZoom={mapZoom} 
                                                    zoom={mapZoom}
                                                    mapId={import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'}
                                                    onCenterChanged={(e) => setMapCenter(e.detail.center)}
                                                    onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                                                    disableDefaultUI={true}
                                                >
                                                    <AdvancedMarker position={mapCenter}>
                                                        <Pin background={"#ef4444"} borderColor={"#b91c1c"} glyphColor={"#fff"} />
                                                    </AdvancedMarker>
                                                </Map>
                                            </APIProvider>
                                        </div>
                                        <div style={{ background: 'white', borderRadius: '0 0 20px 20px', border: '1px solid #e5e7eb', borderTop: 'none', padding: '16px 18px', boxShadow: '0 5px 20px rgba(0,0,0,.04)' }}>
                                            <div className="healthcare-item">
                                                <div className="hc-icon red"><i className="fa-solid fa-hospital"></i></div>
                                                <div><h5>Hospitals</h5><p>Find multi-speciality hospitals near you</p></div>
                                            </div>
                                            <div className="healthcare-item">
                                                <div className="hc-icon blue"><i className="fa-solid fa-house-medical"></i></div>
                                                <div><h5>PHC / CHC</h5><p>Locate Primary &amp; Community Health Centers</p></div>
                                            </div>
                                            <div className="healthcare-item">
                                                <div className="hc-icon green"><i className="fa-solid fa-campground"></i></div>
                                                <div><h5>Health Camps</h5><p>Find upcoming health camps in your area</p></div>
                                            </div>
                                            <div className="healthcare-item" style={{ marginBottom: 0 }}>
                                                <div className="hc-icon rose"><i className="fa-solid fa-droplet"></i></div>
                                                <div><h5>Blood Banks</h5><p>Search blood banks and donate blood</p></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>



                    {/*  AI SCREENING & GUIDANCE  */}
                    <div className="screening-section" style={{ margin: '0 30px 30px' }}>
                        <h2>AI Screening & Guidance – <span>Simple, Safe & Helpful</span></h2>
                        <div className="screening-top">
                            <div className="screening-left">
                                <ul>
                                    <li><i className="fa-solid fa-circle-check"></i> Answer easy questions about your symptoms</li>
                                    <li><i className="fa-solid fa-circle-check"></i> Get possible health risk insights</li>
                                    <li><i className="fa-solid fa-circle-check"></i> Receive guidance and preventive tips</li>
                                    <li><i className="fa-solid fa-circle-check"></i> Consult a healthcare professional for confirmation</li>
                                </ul>
                            </div>
                            <div className="screening-flow">
                                <div className="screening-step">
                                    <img src={StepTell} alt="Tell AAYU" />
                                    <span>Tell AAYU how you are feeling</span>
                                </div>
                                <div className="screening-arrow">→</div>
                                <div className="screening-step">
                                    <img src={StepQuestions} alt="Answer questions" />
                                    <span>Answer a few simple questions</span>
                                </div>
                                <div className="screening-arrow">→</div>
                                <div className="screening-step">
                                    <img src={StepGuidance} alt="Get guidance" />
                                    <span>Get AI-driven guidance</span>
                                </div>
                                <div className="screening-arrow">→</div>
                                <div className="screening-step">
                                    <img src={StepConsult} alt="Consult professional" />
                                    <span>Consult a healthcare professional</span>
                                </div>
                            </div>
                        </div>
                        <div className="screening-disclaimer">
                            <i className="fa-solid fa-shield-halved"></i>
                            AAYU provides information and guidance only. It does not diagnose medical conditions or replace professional medical advice.
                        </div>
                    </div>

                    {/*  DISEASE AWARENESS CENTRE  */}
                    <div className="disease-section" style={{ margin: '0 30px 30px' }}>
                        <div className="disease-header">
                            <h2>Disease Awareness Centre</h2>
                            <span style={{ cursor: 'pointer' }}>View all diseases <i className="fa-solid fa-arrow-right"></i></span>
                        </div>
                        <div className="disease-carousel-wrap">
                            <button className="carousel-btn prev" onClick={() => document.getElementById('diseaseCarousel')?.scrollBy(-200, 0)}>
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <div className="disease-carousel" id="diseaseCarousel">
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Dengue' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Dengue} alt="Dengue" />
                                    <h4>Dengue</h4>
                                    <p>Symptoms, prevention and care tips</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Malaria' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Malaria} alt="Malaria" />
                                    <h4>Malaria</h4>
                                    <p>Symptoms, prevention and care tips</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Tuberculosis' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Tuberculosis} alt="Tuberculosis" />
                                    <h4>Tuberculosis</h4>
                                    <p>Symptoms, prevention and care tips</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Seasonal Flu' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Flu} alt="Seasonal Flu" />
                                    <h4>Seasonal Flu</h4>
                                    <p>Symptoms, prevention and care tips</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Maternal Health' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Maternal} alt="Maternal Health" />
                                    <h4>Maternal Health</h4>
                                    <p>Care during pregnancy and beyond</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Diabetes' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Screening} alt="Diabetes" />
                                    <h4>Diabetes</h4>
                                    <p>Management, diet and lifestyle</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Hypertension' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Screening} alt="Hypertension" />
                                    <h4>Hypertension</h4>
                                    <p>Blood pressure control and tips</p>
                                </div>
                                <div className="disease-card" onClick={() => navigate('/chat', { state: { initialMessage: 'Tell me about Asthma' } })} style={{ cursor: 'pointer' }}>
                                    <img src={Flu} alt="Asthma" />
                                    <h4>Asthma</h4>
                                    <p>Triggers, inhalers and prevention</p>
                                </div>
                            </div>
                            <button className="carousel-btn next" onClick={() => document.getElementById('diseaseCarousel')?.scrollBy(200, 0)}>
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    {/*  CONNECT ON WHATSAPP  */}
                    <div className="healthcare-row" style={{ margin: '0 30px 30px' }}>
                        <div className="whatsapp-connect">
                            <div className="wa-header">
                                <h3>Connect on WhatsApp</h3>
                            </div>
                            <div className="wa-brand">
                                <div className="wa-brand-icon"><i className="fa-brands fa-whatsapp"></i></div>
                                <div>
                                    <h4>AAYU is now on WhatsApp!</h4>
                                    <p>Your health assistant in your pocket.</p>
                                </div>
                            </div>
                            <ul className="wa-features">
                                <li><i className="fa-solid fa-check"></i> Ask questions</li>
                                <li><i className="fa-solid fa-check"></i> Send voice notes</li>
                                <li><i className="fa-solid fa-check"></i> Upload documents & images (OCR)</li>
                                <li><i className="fa-solid fa-check"></i> Get information on schemes & centers</li>
                            </ul>
                            <button className="wa-chat-btn" onClick={() => window.open('https://wa.me/?text=Emergency:%20I%20need%20medical%20assistance.%20Please%20help.', '_blank')}>Chat on WhatsApp <i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                        </div>
                    </div>

                    {/*  POWERED BY TRUSTED KNOWLEDGE  */}
                    <div className="trusted-section" style={{ margin: '0 30px 30px' }}>
                        <h2>Powered by Trusted Knowledge</h2>
                        <div className="trusted-logos">
                            <div className="trusted-logo">
                                <div className="trusted-logo-icon who"><i className="fa-solid fa-globe"></i></div>
                                <div><h5>World Health Organization</h5><p>WHO</p></div>
                            </div>
                            <div className="trusted-logo">
                                <div className="trusted-logo-icon icmr"><i className="fa-solid fa-flask"></i></div>
                                <div><h5>Indian Council of Medical Research</h5><p>ICMR</p></div>
                            </div>
                            <div className="trusted-logo">
                                <div className="trusted-logo-icon mohfw"><i className="fa-solid fa-building-columns"></i></div>
                                <div><h5>Ministry of Health & Family Welfare</h5><p>Government of India</p></div>
                            </div>
                            <div className="trusted-logo">
                                <div className="trusted-logo-icon icd"><i className="fa-solid fa-book-medical"></i></div>
                                <div><h5>ICD-11</h5><p>International Classification of Diseases</p></div>
                            </div>
                            <div className="trusted-logo">
                                <div className="trusted-logo-icon medline"><i className="fa-solid fa-heart-pulse"></i></div>
                                <div><h5>MedlinePlus</h5><p>Trusted Health Information</p></div>
                            </div>
                        </div>
                    </div>

                    {/*  FEATURE BADGES  */}
                    <div className="feature-badges" style={{ margin: '0 30px 30px' }}>
                        <div className="feature-badge">
                            <div className="fb-icon"><i className="fa-solid fa-circle-check"></i></div>
                            <div><h5>Verified Medical Knowledge (FAQ)</h5><p>Answers from trusted medical sources</p></div>
                        </div>
                        <div className="feature-badge">
                            <div className="fb-icon"><i className="fa-solid fa-language"></i></div>
                            <div><h5>Multilingual Support</h5><p>Gujarati, Hindi, English, Odia & more</p></div>
                        </div>
                        <div className="feature-badge">
                            <div className="fb-icon"><i className="fa-solid fa-microphone"></i></div>
                            <div><h5>Voice First</h5><p>Speak naturally, get replies easily</p></div>
                        </div>
                        <div className="feature-badge">
                            <div className="fb-icon"><i className="fa-solid fa-wifi"></i></div>
                            <div><h5>Offline First</h5><p>Works even without internet</p></div>
                        </div>
                        <div className="feature-badge">
                            <div className="fb-icon"><i className="fa-solid fa-lock"></i></div>
                            <div><h5>Privacy & Security</h5><p>Your data is protected</p></div>
                        </div>
                    </div>

                    {/*  FOOTER  */}
                    <div className="footer-new" style={{ margin: '0 30px 30px' }}>
                        <div className="footer-left">
                            <img src={logoHeart} alt="AAYU" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                            <div className="footer-brand">
                                <h3>AAYU</h3>
                                <p>AI-Powered Public<br />Health Assistant</p>
                            </div>
                        </div>
                        <div className="footer-center">
                            <h3>Your Health. Your Data. Your Control.</h3>
                            <p>Secure. Private. Built for everyone.</p>
                            <div className="footer-pills">
                                <span className="footer-pill">Secure & Private</span>
                                <span className="footer-pill">You Stay in Control</span>
                                <span className="footer-pill">Guidance, Not Diagnosis</span>
                                <span className="footer-pill">Consult Professionals</span>
                            </div>
                        </div>
                        <div className="footer-shield">
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                    </div>

                        </div>
                        <aside className="right-panel">
                            <LiveAlertsSidebar onAlertClick={handleAlertClick} />
                        </aside>
                    </div>
                </main>

            </div>


        </div>
    );
}
