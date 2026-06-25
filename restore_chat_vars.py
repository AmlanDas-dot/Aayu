import re

with open('src/pages/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Restore handleToggleSpeak button
speak_button = """
                          {/* Speak Button */}
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleToggleSpeak(msg.id, msg.text)}
                              className={`border-none rounded-md cursor-pointer px-2 py-1 text-[0.75rem] font-semibold inline-flex items-center gap-1 transition-colors ${speakingMsgId === msg.id ? 'bg-teal-100 text-teal-600' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                              {speakingMsgId === msg.id ? "⏹️ Stop" : "🔊 Speak"}
                            </button>
                          </div>
"""
content = re.sub(
    r'(<p style={{ whiteSpace: "pre-line", margin: 0, wordBreak: "break-word" }}>{msg\.text}</p>)',
    r'\1' + speak_button,
    content
)

# Restore KnowledgeCard
knowledge_card_replacement = """
                              <div className="mt-2 flex flex-col gap-2">
                                {msg.retrieved_documents.map((doc: any, i: number) => (
                                  <KnowledgeCard key={i} doc={doc} />
                                ))}
                              </div>
"""
content = re.sub(
    r'(<ul className="m-\[8px_0_8px_20px\] p-0 list-disc">).*?(</ul>)',
    knowledge_card_replacement,
    content,
    flags=re.DOTALL
)

# Restore runningScores
running_scores_block = """
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

                    {/* Live condition narrowing */}
                    {runningScores.length > 0 && (
                      <div className="p-[10px_12px] rounded-xl bg-slate-800/5 border border-slate-200 mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-wider">
                            {getLabels(language).currentAssessment}
                          </span>
                          <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${confidenceLabel === "High" ? "bg-green-100 text-green-600" : confidenceLabel === "Medium" ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-600"}`}>
                            {confidenceLabel} Confidence
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {runningScores.filter(c => c.score >= 0.35).slice(0, 3).map((c, i) => (
                            <div key={c.id} className="flex items-center gap-2">
                              <span className="text-[0.82rem]">{c.icon}</span>
                              <span className={`text-[0.8rem] flex-1 ${i === 0 ? "text-slate-800 font-semibold" : "text-slate-500 font-normal"}`}>
                                {c.name}
                              </span>
                              <div className="w-[60px] h-1 rounded-full bg-slate-200">
                                <div className={`h-full rounded-full transition-all duration-400 ${i === 0 ? "bg-teal-500" : "bg-slate-400/50"}`} style={{ width: `${Math.round(c.score * 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
"""
content = re.sub(
    r'<div className="flex gap-2 flex-wrap">.*?</div>',
    running_scores_block,
    content,
    flags=re.DOTALL,
    count=1
)

with open('src/pages/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Restored missing variables")
