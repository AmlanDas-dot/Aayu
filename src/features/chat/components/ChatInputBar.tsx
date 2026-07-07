import React from "react";

interface ChatInputBarProps {
  screeningActive: boolean;
  isProcessing: boolean;
  transcribing: boolean;
  isRecording: boolean;
  input: string;
  setInput: (val: string) => void;
  handleSend: (text?: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  imagePreviewUrl: string | null;
  selectedImage: File | null;
  clearImage: () => void;
  uploadProgress: number | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageSelection: (file: File) => void;
  setIsCameraOpen: (val: boolean) => void;
  language: string;
  handleLanguageSelect: (lang: string) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  stopSpeaking: () => void;
}

export function ChatInputBar({
  screeningActive,
  isProcessing,
  transcribing,
  isRecording,
  input,
  setInput,
  handleSend,
  startRecording,
  stopRecording,
  imagePreviewUrl,
  selectedImage,
  clearImage,
  uploadProgress,
  fileInputRef,
  handleImageSelection,
  setIsCameraOpen,
  language,
  handleLanguageSelect,
  autoSpeak,
  setAutoSpeak,
  stopSpeaking,
}: ChatInputBarProps) {
  return (
    <div className="chat-input-area">
      {/* Quick Prompt Chips (hidden if screening is active) */}
      {!screeningActive && (
        <div className="quick-chips">
          <button className="chip" disabled={isProcessing} onClick={() => handleSend("Fever and headache")}>Fever and headache</button>
          <button className="chip" disabled={isProcessing} onClick={() => handleSend("Stomach pain")}>Stomach pain</button>
          <button className="chip" disabled={isProcessing} onClick={() => handleSend("Skin rash")}>Skin rash</button>
          <button className="chip" disabled={isProcessing} onClick={() => handleSend("Nutrition advice")}>Nutrition advice</button>
          <button className="chip" disabled={isProcessing} onClick={() => handleSend("Nearby hospital")}>Nearby hospital</button>
        </div>
      )}

      {/* Image Preview Area */}
      {imagePreviewUrl && (
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          marginBottom: "8px",
          gap: "12px",
          position: "relative"
        }}>
          <div style={{ position: "relative", width: "60px", height: "60px" }}>
            <img
              src={imagePreviewUrl}
              alt="Upload preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid #cbd5e1"
              }}
            />
            <button
              onClick={clearImage}
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedImage?.name || "camera_capture.jpg"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#64748b" }}>
              {selectedImage ? `${(selectedImage.size / (1024 * 1024)).toFixed(2)} MB` : "Ready to send"}
            </p>
          </div>
          {uploadProgress !== null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e" }}>{uploadProgress}%</span>
              <div style={{ width: "80px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#0f766e", transition: "width 0.1s" }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text input, mic and attachments */}
      <div className="input-box">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleImageSelection(e.target.files[0]);
            }
          }}
        />
        <button
          className="input-action-btn"
          title="Take photo"
          onClick={() => setIsCameraOpen(true)}
          disabled={isProcessing}
        >
          <i className="fa-solid fa-camera"></i>
        </button>
        <button
          className="input-action-btn"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <i className="fa-solid fa-paperclip"></i>
        </button>

        <input
          type="text"
          placeholder={transcribing ? "Transcribing voice..." : "Describe your symptoms or ask AAYU..."}
          value={transcribing ? "⏳ Transcribing voice..." : input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isProcessing || transcribing}
        />

        <button
          className="input-action-btn mic-btn"
          title={isRecording ? "Stop Recording" : "Voice message"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={{
            color: isRecording ? "#ef4444" : "#0f766e",
            animation: isRecording ? "pulse-red 1.5s infinite" : "none",
            opacity: isProcessing ? 0.5 : 1,
          }}
        >
          <i className={isRecording ? "fa-solid fa-circle-stop" : "fa-solid fa-microphone"}></i>
        </button>
        <button
          className="send-msg-btn"
          onClick={() => handleSend()}
          disabled={isProcessing || transcribing || (!input.trim() && !selectedImage)}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      {/* Language Selection & Auto-read response preferences */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }} htmlFor="chat-lang-select">Language:</label>
          <select
            id="chat-lang-select"
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "0.78rem",
              background: "white",
              color: "#334155",
              outline: "none",
            }}
            value={language}
            onChange={(e) => handleLanguageSelect(e.target.value)}
            disabled={isProcessing}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="or">ଓଡ଼ିଆ (Odia)</option>
          </select>
        </div>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", cursor: "pointer", color: "#64748b", fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => {
              setAutoSpeak(e.target.checked);
              if (!e.target.checked) stopSpeaking();
            }}
            style={{ cursor: "pointer" }}
          />
          📢 Auto-read responses
        </label>
      </div>
    </div>
  );
}
export default ChatInputBar;
