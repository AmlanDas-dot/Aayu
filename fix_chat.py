import re

with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the return statement
start_idx = content.find('  return (\n    <div className="flex-1 flex flex-col xl:flex-row items-start gap-6 m-0 p-[30px]">')
if start_idx == -1:
    print("Could not find start of return block!")
    exit(1)

new_return = """  return (
    <div className="flex-1 flex flex-col xl:flex-row items-start gap-6 m-0 p-[30px] bg-[#f5f8fa]">
      {/* CENTER (Chat Workspace) */}
      <div className="flex-1 min-w-0 flex flex-col rounded-[24px] shadow-[0_10px_30px_rgba(15,118,110,0.08)] border border-[#eef2f7] bg-white overflow-hidden h-[calc(100vh-140px)]">
        
        {/* DISCLAIMER BANNER */}
        <div className="bg-[#fffbeb] text-[#b45309] py-3 px-6 text-[13px] font-semibold flex items-center gap-2 border-b border-[#fef3c7]">
          <span>⚠️</span>
          AAYU provides health guidance, not diagnosis. Always consult a qualified healthcare professional.
        </div>

        <div className="flex flex-1 min-h-0">
          
          {/* PREVIOUS CONVERSATIONS PANEL */}
          <div className="w-[280px] border-r border-[#e5e7eb] flex-col bg-[#f8fafc] hidden lg:flex">
            <div className="p-5 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-[#1f2937] m-0">Conversation History</h3>
              <button onClick={handleClearSession} className="w-8 h-8 rounded-lg border-none bg-[#0f766e] text-white cursor-pointer transition-colors hover:bg-[#115e59] flex items-center justify-center font-bold" title="New Chat">
                +
              </button>
            </div>
            
            <div className="mx-5 mb-5 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[13px]">🔍</span>
              <input type="text" placeholder="Search conversations..." className="w-full border border-[#e2e8f0] rounded-lg py-2 pr-3 pl-8 text-[13px] outline-none" />
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 pb-5">
              <div className="p-3 rounded-xl flex gap-3 cursor-pointer mb-2 transition-colors bg-white border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <div className="w-9 h-9 rounded-lg bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center shrink-0">💬</div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1f2937] m-[0_0_4px_0]">Current Session</h4>
                  <span className="text-[11px] text-[#94a3b8] block mb-1">Active now</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-[20px_30px] border-b border-[#e5e7eb] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src="/src/assets/Logo2.png" alt="AAYU Avatar" className="w-12 h-12 rounded-xl bg-[#0f766e] object-contain p-1" />
                <div>
                  <h2 className="text-[18px] font-bold text-[#1f2937] m-[0_0_4px_0]">AI Screening & Guidance</h2>
                  <div className="text-[13px] text-[#64748b] flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#22c55e] rounded-full inline-block"></span> Online
                    <span className="text-[#cbd5e1]">•</span>
                    Powered by Trusted Health Knowledge
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-[30px] flex flex-col gap-6 bg-[#f8fafc]">
              
              {/* Emergency Alert */}
              {emergencyAlert && <EmergencyAlert emergency={emergencyAlert} />}

              {/* Initial Welcome Message from API is in messages array */}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' ? (
                     <img src="/src/assets/Logo2.png" alt="AAYU" className="w-9 h-9 rounded-xl bg-[#0f766e] object-contain p-[2px] shrink-0" />
                  ) : (
                     <div className="w-9 h-9 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shrink-0 font-bold">👤</div>
                  )}
                  
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`py-4 px-5 text-[15px] leading-[1.6] ${
                      msg.role === 'user' 
                        ? 'bg-[#0f766e] text-white rounded-[16px_16px_0_16px] border-none' 
                        : 'bg-white text-[#334155] rounded-[0_16px_16px_16px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#eef2f7]'
                    }`}>
                      
                      {msg.isTyping ? (
                         <div className="flex gap-[5px] py-1">
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                         </div>
                      ) : (
                        <>
                          {/* Risk Badge */}
                          {msg.risk_level && msg.risk_level !== "routine" && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] mb-4 ${
                               msg.risk_level === 'emergency' ? 'bg-[#fff1f1] text-[#b91c1c] border border-[#fca5a5]' : 'bg-[#fff7ed] text-[#c2410c] border border-[#fdba74]'
                            }`}>
                              {RISK_CONFIG[msg.risk_level].icon} Risk Level: <strong>{RISK_CONFIG[msg.risk_level].label}</strong>
                            </div>
                          )}

                          <p style={{ whiteSpace: "pre-line", margin: 0, wordBreak: "break-word" }}>{msg.text}</p>

                          {/* Retrieved docs */}
                          {msg.retrieved_documents && msg.retrieved_documents.length > 0 && !screeningActive && (
                            <div className="mt-4">
                              <h4 className="text-[14px] font-bold text-[#1f2937] mb-2">Recommended Resources:</h4>
                              <ul className="m-[8px_0_8px_20px] p-0 list-disc">
                                {msg.retrieved_documents.map((doc: any, i: number) => (
                                  <li key={i} className="mb-1"><a href="#" className="text-[#0f766e] no-underline font-semibold flex items-center gap-2">{doc.title || doc.category || "Health Info"}</a></li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Disclaimer */}
                          {msg.disclaimer && (
                            <div className="flex gap-[10px] p-3 bg-[#f1f5f9] rounded-lg text-[12px] text-[#475569] mt-4 items-start">
                              <span className="text-[#0f766e] mt-0.5">ℹ️</span>
                              {msg.disclaimer}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <span className={`text-[11px] mt-2 block text-right ${msg.role === 'user' ? 'text-[#0f766e]' : 'text-[#94a3b8]'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />

              {/* SCREENING PANEL */}
              {screeningActive && screeningQuestion && (
                <div className="m-[0_12px_10px] rounded-2xl border-[1.5px] border-teal-400/40 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 overflow-hidden shadow-[0_4px_28px_rgba(20,184,166,0.14)]">
                  <div className="p-[9px_16px] bg-teal-500/10 border-b border-teal-500/20 flex justify-between items-center">
                    <span className="text-[0.78rem] font-bold text-teal-600 tracking-wider uppercase">
                      {getLabels(language).healthScreening}
                    </span>
                    <span className="text-[0.73rem] text-slate-400 font-medium">
                      {getLabels(language).questionOf(screeningQIndex + 1, screeningQTotal)}
                    </span>
                  </div>
                  
                  <div className="h-[3px] bg-teal-500/10">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500" style={{ width: `${(screeningQIndex / screeningQTotal) * 100}%` }} />
                  </div>

                  <div className="p-[14px_16px_12px] flex flex-col gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-800 leading-relaxed mb-1">{screeningQuestion.text}</p>
                      {screeningQuestion.hint && <p className="text-[0.73rem] text-slate-500 italic">💡 {screeningQuestion.hint}</p>}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {screeningQuestion.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleScreeningAnswer(opt)}
                          disabled={isProcessing}
                          className={`px-5 py-2 rounded-full border-[1.5px] font-semibold text-[0.88rem] transition-all
                            ${isProcessing 
                              ? 'border-teal-500/30 bg-teal-500/5 text-slate-500 cursor-not-allowed opacity-55' 
                              : 'border-teal-500/50 bg-teal-500/10 text-teal-600 cursor-pointer hover:bg-teal-500/20 hover:-translate-y-[1px]'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="p-[20px_30px] border-t border-[#e5e7eb] bg-white">
              
              {/* Quick Chips */}
              <div className="flex gap-[10px] mb-4 overflow-x-auto pb-1" style={{ display: screeningActive ? "none" : undefined }}>
                {["Fever and headache", "Stomach pain", "Skin rash", "Nutrition advice", "Nearby hospital"].map((q) => (
                  <button key={q} onClick={() => handleSend(q)} className="py-2 px-4 rounded-full border border-[#e2e8f0] text-[13px] font-semibold text-[#475569] cursor-pointer transition-colors hover:border-[#0f766e] hover:text-[#0f766e] hover:bg-[#f0fdfa] whitespace-nowrap bg-transparent">
                    {q}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] p-2">
                <button className="w-10 h-10 rounded-lg border-none bg-transparent text-[#64748b] text-[18px] cursor-pointer transition-colors hover:bg-[#e2e8f0] hover:text-[#1f2937] flex items-center justify-center">
                   📷
                </button>
                <button className="w-10 h-10 rounded-lg border-none bg-transparent text-[#64748b] text-[18px] cursor-pointer transition-colors hover:bg-[#e2e8f0] hover:text-[#1f2937] flex items-center justify-center">
                   📎
                </button>
                
                <input 
                  type="text" 
                  value={transcribing ? "⏳ Transcribing voice..." : input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder={transcribing ? "Please wait..." : "Describe your symptoms or ask AAYU..."}
                  disabled={isProcessing || transcribing}
                  className="flex-1 border-none outline-none bg-transparent p-[10px] text-[15px]" 
                />
                
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || transcribing}
                  className={`w-10 h-10 rounded-lg border-none bg-transparent text-[18px] cursor-pointer transition-colors hover:bg-[#e2e8f0] flex items-center justify-center ${isRecording ? 'text-red-500 bg-red-100 hover:text-red-600' : 'text-[#0f766e] hover:text-[#1f2937]'}`}
                >
                  {isRecording ? '🛑' : '🎤'}
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={isProcessing || transcribing || !input.trim()}
                  className="w-10 h-10 rounded-xl border-none bg-[#0f766e] text-white text-[16px] cursor-pointer transition-colors hover:bg-[#115e59] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➤
                </button>
              </div>

              {/* Language Selection & Auto-speak placed cleanly below input */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <label className="text-[12px] font-semibold text-slate-500">Language:</label>
                  <select
                    className="border border-slate-200 rounded-md py-1 px-2 text-[12px] outline-none text-slate-700 bg-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-1.5 text-[12px] cursor-pointer text-slate-500 font-medium">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => {
                      setAutoSpeak(e.target.checked);
                      if (!e.target.checked) stopSpeaking();
                    }}
                    className="cursor-pointer"
                  />
                  📢 Auto-read
                </label>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE (Alerts - Kept identically to layout, using pure Tailwind) */}
      <aside className="hidden lg:flex flex-col gap-[20px] w-[340px] shrink-0">
        <div className="bg-white rounded-[22px] border border-[#eceff3] shadow-[0_8px_22px_rgba(15,23,42,0.05)] overflow-hidden">
            <div className="flex items-center justify-between p-[18px_18px_14px]">
              <div className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-[0.02em] text-[#7f1d1d] uppercase">
                <span className="text-[#d32f2f] text-[18px]">⚠️</span>
                <span>Health Alerts</span>
              </div>
              <a href="#" className="text-[#0f766e] text-[14px] font-bold no-underline">View all</a>
            </div>

            <div className="m-[0_10px_10px] p-[18px] rounded-[18px] bg-gradient-to-b from-[#fff8f7] to-[#fff3f1] border border-[#fde3df]">
              <div className="flex flex-col gap-2">
                <h4 className="text-[18px] leading-[1.45] m-0 text-[#991b1b] font-bold">Dengue cases rising in some districts</h4>
                <span className="self-start px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#fee2e2] text-[#dc2626]">HIGH ALERT</span>
              </div>
              <p className="mt-[10px] mb-4 text-[#475569] leading-relaxed text-[14px]">
                Stay safe and follow preventive measures. Use mosquito repellents and keep surroundings clean.
              </p>
              <button className="bg-transparent border-none text-[#0f766e] font-bold text-[14px] cursor-pointer p-0 hover:underline">
                See Advisory →
              </button>
            </div>
        </div>

        <div className="bg-[#0f766e] rounded-[20px] p-[24px] text-white min-h-[220px] flex flex-col justify-end" style={{ background: 'url("/stay_alert.jpeg") center/cover no-repeat', backgroundColor: '#0f766e' }}>
          <h3 className="text-[22px] font-bold mb-2">Stay Ahead,<br/>Stay Healthy!</h3>
          <p className="text-[14px] opacity-90 leading-relaxed max-w-[240px]">Real-time updates on seasonal alerts and important health news.</p>
          <button className="mt-[16px] bg-white text-[#0f766e] border-none py-[10px] px-[16px] rounded-[10px] font-bold text-[14px] cursor-pointer self-start transition-transform hover:scale-105">
            View All Updates →
          </button>
        </div>

        <div className="bg-white rounded-[22px] border border-[#eceff3] shadow-[0_8px_22px_rgba(15,23,42,0.05)] p-6">
            <h3 className="m-[0_0_16px] text-[#1f2937] font-bold text-[18px]">Why AAYU?</h3>
            <ul className="list-none p-0 m-0">
              <li className="flex gap-3 items-start text-[#475569] leading-[1.6] mb-3 text-[14px]">
                <span className="text-[#0f766e] font-bold mt-1 text-[12px]">●</span> Verified medical knowledge from trusted sources
              </li>
              <li className="flex gap-3 items-start text-[#475569] leading-[1.6] mb-3 text-[14px]">
                <span className="text-[#0f766e] font-bold mt-1 text-[12px]">●</span> Voice based interaction for everyone
              </li>
              <li className="flex gap-3 items-start text-[#475569] leading-[1.6] mb-0 text-[14px]">
                <span className="text-[#0f766e] font-bold mt-1 text-[12px]">●</span> Works offline, your health always with you
              </li>
            </ul>
        </div>
      </aside>

    </div>
  );
}
"""

content = content[:start_idx] + new_return
with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
