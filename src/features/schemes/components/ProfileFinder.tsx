export function ProfileFinder({
  ageGroup, setAgeGroup, gender, setGender, state, setState, onFindSchemes
}: any) {
  return (
    <div className="rail-card">
      <div className="rail-title">Find Schemes for You</div>
      <p className="rail-sub">Tell us about yourself</p>
      <div className="find-scheme-fields">
        {[
          { label: "Age Group", val: ageGroup, setter: setAgeGroup },
          { label: "Gender", val: gender, setter: setGender },
          { label: "State", val: state, setter: setState },
        ].map(({ label, val, setter }) => (
          <label key={label} className="find-scheme-label">
            <span className="fsl-text">{label}</span>
            <select className="fsl-select" value={val} onChange={e => setter(e.target.value)}>
              <option value="">Select</option>
              {label === "Age Group" && ["0-5 years", "6-18 years", "19-45 years", "45+ years"].map(o => <option key={o} value={o}>{o}</option>)}
              {label === "Gender" && ["Male", "Female", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
              {label === "State" && [
                <option key="national" value="all">All States (National Schemes)</option>,
                <option key="gujarat" value="Gujarat">Gujarat</option>,
                <option key="odisha" value="Odisha">Odisha</option>
              ]}
            </select>
          </label>
        ))}
      </div>
      <button className="show-my-schemes-btn" onClick={onFindSchemes}>Show My Schemes</button>
    </div>
  );
}
