export function NutritionProfileFinder({ profileType, setProfileType }: { profileType: "default" | "pregnant" | "child", setProfileType: (t: "default" | "pregnant" | "child") => void }) {
  return (
    <div className="rail-card">
      <div className="rail-title">Nutrition Profile</div>
      <p className="rail-sub">View customized nutrition plan</p>
      <div className="find-scheme-fields">
        <label className="find-scheme-label">
          <span className="fsl-text">Profile Type</span>
          <select className="fsl-select" value={profileType} onChange={e => setProfileType(e.target.value as "default" | "pregnant" | "child")}>
            <option value="default">Adult (General Health)</option>
            <option value="pregnant">Pregnant/Lactating Mother</option>
            <option value="child">Child (0-12 Years)</option>
          </select>
        </label>
      </div>
    </div>
  );
}
