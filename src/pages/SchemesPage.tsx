import { useState, useEffect } from "react";
import { searchSchemes, evaluateSchemesWithAI, type EvaluatedScheme, getSchemes } from "@/services/schemeService";
import { useAuth } from "@/contexts/AuthContext";
import { useHealthContext } from "@/hooks/useHealthContext";
import { SchemesHero } from "@/features/schemes/components/SchemesHero";
import { SchemeCard } from "@/features/schemes/components/SchemeCard";
import { TopSchemes } from "@/features/schemes/components/TopSchemes";
import { SchemeCategoryGrid } from "@/features/schemes/components/SchemeCategoryGrid";
import { DocumentsRequired } from "@/features/schemes/components/DocumentsRequired";
import { ProfileFinder } from "@/features/schemes/components/ProfileFinder";
import { SchemeAlerts } from "@/features/schemes/components/SchemeAlerts";
import { SchemesFooterBanner } from "@/features/schemes/components/SchemesFooterBanner";
import { SchemeNeedHelp } from "@/features/schemes/components/SchemeNeedHelp";
import { Lightbulb, RefreshCw, Bell, User, ClipboardList } from "lucide-react";
import { LoadingStatus } from "@/components/LoadingStatus";

export function SchemesPage() {
  const { userProfile } = useAuth();
  const { selectedMember } = useHealthContext();
  
  const [allSchemes, setAllSchemes] = useState<EvaluatedScheme[]>([]);
  const [displayed, setDisplayed] = useState<EvaluatedScheme[]>([]);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [userState, setUserState] = useState("");
  const [triggerFetch, setTriggerFetch] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSchemes();
        setAllSchemes(res);
        if (stateFilter === "all" && !query) setDisplayed(res);
      } catch (e) {
        setError("Failed to load schemes.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [triggerFetch]);
  
  useEffect(() => {
    const runAI = async () => {
      if (allSchemes.length > 0 && userProfile) {
        
        // Combine auth profile and health vault context
        const context = {
          age: (userProfile as any).age || 30,
          gender: userProfile.gender || "Male",
          medicalConditions: ["Hypertension"], // Mock from Health Vault
          location: "National"
        };
        const evaluated = await evaluateSchemesWithAI(userProfile.uid, context);
        setAllSchemes(evaluated);
        if (stateFilter === "all" && !query) setDisplayed(evaluated);
        
      }
    };
    runAI();
  }, [userProfile, selectedMember]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!query && stateFilter === "all") return;
      
      setLoading(true); setError("");
      try {
        let result: EvaluatedScheme[] = allSchemes;
        if (query.trim().length >= 2) {
           result = await searchSchemes(query.trim());
        }
        if (stateFilter !== "all") {
           result = result.filter(s => s.location === stateFilter || s.location === "National");
        }
        if (active) setDisplayed(result);
      } catch (e: any) {
        if (active) setError(e.message ?? "Search failed.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(run, query ? 300 : 0);
    return () => { active = false; clearTimeout(t); };
  }, [query, stateFilter]);

  return (
    <div className="schemes-page">
      <div className="schemes-layout">
        <main className="schemes-main">
          <SchemesHero />

          {/* Did You Know */}
          <section className="did-you-know">
            <div className="dyk-icon-wrap">
              <Lightbulb size={24} className="dyk-icon-lucide" />
            </div>
            <div className="dyk-text">
              <div className="dyk-title">Did You Know?</div>
              <p className="dyk-desc">
                More than 31 crore people have benefited from government health and nutrition schemes across India.
              </p>
              <p className="dyk-source">Source: Govt. of India (2023–24)</p>
            </div>
            <div className="dyk-dots">
              {[0,1,2,3,4].map(i => <span key={i} className={`dyk-dot ${i===0?"dyk-dot-active":""}`} />)}
            </div>
          </section>

          {/* Feature Row */}
          <section className="schemes-features-row">
            {[
              { icon: User, title: "Personalised for You", desc: "Schemes based on your profile & needs" },
              { icon: ClipboardList, title: "Easy to Apply", desc: "Step-by-step guidance in your language" },
              { icon: RefreshCw, title: "Track Application", desc: "Check status & get real-time updates" },
              { icon: Bell, title: "Stay Informed", desc: "New schemes & updates in one place" },
            ].map(f => {
              const IconComponent = f.icon;
              return (
                <div key={f.title} className="schemes-feature-item">
                  <div className="sf-icon-wrap">
                    <IconComponent size={22} className="sf-icon-lucide" />
                  </div>
                  <div className="sf-title">{f.title}</div>
                  <p className="sf-desc">{f.desc}</p>
                </div>
              );
            })}
          </section>

          {/* Search Box */}
          <section className="schemes-search-box">
            <div className="search-row">
              <span className="search-icon-s">🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search: health insurance, housing, maternity..."
                className="schemes-search-input"
              />
              {query && <button className="clear-search" onClick={() => setQuery("")}>✕</button>}
            </div>
            <div className="quick-chips">
              {["health insurance", "housing", "farmer", "women", "maternity", "education"].map(s => (
                <button key={s} className={`quick-chip ${query===s?"chip-active":""}`} onClick={() => setQuery(s===query?"":s)}>{s}</button>
              ))}
            </div>
            {!query.trim() && (
              <div className="state-filters">
                {[{id:"all",label:"All States"},{id:"national",label:"🇮🇳 National"},{id:"odisha",label:"🏛️ Odisha"},{id:"gujarat",label:"🏛️ Gujarat"}].map(f => (
                  <button key={f.id} className={`state-filter-btn ${stateFilter===f.id?"state-btn-active":""}`} onClick={() => setStateFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            )}
          </section>

          {/* Live search results */}
          {(query.trim().length >= 2 || stateFilter !== "all") && (
            <section className="schemes-results">
              {error && <div className="schemes-error">⚠️ {error}</div>}
              {!loading && <p className="results-count-text">{displayed.length} scheme{displayed.length !== 1?"s":""} found{query.trim()?` for "${query}"`:""}</p>}
              {loading ? (
                <div style={{ maxWidth: 400, margin: "20px auto" }}>
                  <LoadingStatus icon="📑" status="Searching government schemes..." />
                </div>
              ) : displayed.length === 0 ? (
                <div className="schemes-empty"><div className="empty-icon-big">🏛</div><h3>No schemes found</h3><p>🏛 Search government health schemes available to you.</p></div>
              ) : (
                <div className="schemes-results-list">
                  {displayed.map(scheme => <SchemeCard key={scheme.name} scheme={scheme} />)}
                </div>
              )}
            </section>
          )}

          {!query.trim() && stateFilter === "all" && <TopSchemes schemes={allSchemes} />}
          <SchemeCategoryGrid />
          <DocumentsRequired userDocuments={["aadhaar", "photo"]} />
          <SchemesFooterBanner />

        </main>

        <aside className="schemes-rail">
          <ProfileFinder 
            ageGroup={ageGroup} setAgeGroup={setAgeGroup} 
            gender={gender} setGender={setGender} 
            state={userState} setState={setUserState} 
            onFindSchemes={() => {
              if (userState || ageGroup || gender) {
                const targetState = userState === "all" ? "national" : (userState ? userState.toLowerCase() : stateFilter);
                setStateFilter(userState === "all" ? "all" : targetState);
                setQuery("");
                setTriggerFetch(t => t + 1);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }
            }}
          />
          <SchemeAlerts />
          <SchemeNeedHelp />
        </aside>
      </div>
    </div>
  );
}

export default SchemesPage;