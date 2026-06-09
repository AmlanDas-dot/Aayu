import { useState } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ChatWindow } from "./components/Chat/ChatWindow";
import { InputArea } from "./components/Chat/InputArea";
import { HealthSummary } from "./components/HealthPanel/HealthSummary";
import { useChat } from "./hooks/useChat";
import { APP_CONFIG } from "./config/app";
import type { LanguageCode } from "./constants/languages";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  /**
   * Active transcription/TTS language — hoisted here so it persists across
   * re-renders of InputArea and can be read by any future top-level component
   * (e.g. a settings panel).
   *
   * Default: English ("en")
   */
  const [language, setLanguage] = useState<LanguageCode>("en");

  const chat = useChat();

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        records={chat.records}
        suggestedRecordIndexes={chat.suggestedRecordIndexes}
        onSelectRecord={chat.injectHistoryRecord}
        onDeleteRecord={chat.deleteRecord}
      />

      <div className="main-content">
        <div className="main-content-inner">

          {/* Compact top-bar header — centred within main-content so it
              naturally shifts as the sidebar opens/closes */}
          <div className="app-topbar">
            <h1 className="title">{APP_CONFIG.name}</h1>
            <p className="subtitle">{APP_CONFIG.subtitle}</p>
            <p className="topbar-label">{APP_CONFIG.localOnlyLabel}</p>
          </div>

          {/* Two-column grid: chat + symptom profile */}
          <div className="main-grid">
            {/* Left column: chat window + input stacked */}
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, gap: "10px" }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatWindow
                  messages={chat.messages}
                  isProcessing={chat.isProcessing}
                />
              </div>
              <InputArea
                input={chat.input}
                setInput={chat.setInput}
                onSend={chat.handleSend}
                isProcessing={chat.isProcessing}
                language={language}
                setLanguage={setLanguage}
              />
            </div>

            {/* Right column: health profile panel */}
            <HealthSummary
              activeRecord={chat.activeRecord}
              updateField={chat.updateField}
              updateRiskFactor={chat.updateRiskFactor}
              onAskAI={chat.askAIForAdvice}
              onSave={chat.saveSession}
              onReset={chat.resetChat}
              isProcessing={chat.isProcessing}
              matchedGuidelines={chat.matchedGuidelines}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
