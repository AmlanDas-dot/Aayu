import nurseImg from "@/assets/nurse-phone.png";

export function SchemeNeedHelp() {
  return (
    <div className="rail-help-card">
      <div className="rhc-inner">
        <div className="rhc-content">
          <div className="rhc-title">Need Help Applying?</div>
          <p className="rhc-desc">Our AI Assistant can guide you step-by-step to apply for any scheme.</p>
          <button className="rhc-btn">
            Ask Assistant
          </button>
        </div>
        <div className="rhc-img-wrap">
          <img src={nurseImg} alt="Help" className="rhc-nurse-img" />
        </div>
      </div>
    </div>
  );
}
