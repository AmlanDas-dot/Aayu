import type { Conversation } from "../types/chat";
import { determineIcon } from "../utils/chatUtils";

interface ChatHistoryPanelProps {
  groupedConversations: Record<string, Conversation[]>;
  sessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onNewSession: () => void;
}

export function ChatHistoryPanel({
  groupedConversations,
  sessionId,
  onSelectSession,
  onDeleteSession,
  searchTerm,
  onSearchChange,
  onNewSession,
}: ChatHistoryPanelProps) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Conversation History</h3>
        <button className="new-chat-btn" onClick={onNewSession} title="New Conversation">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="history-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="history-list">
        {Object.entries(groupedConversations).map(([groupName, convs]) => {
          if (convs.length === 0) return null;
          return (
            <div key={groupName} className="history-group">
              <div className="history-group-header" style={{ fontSize: "0.8rem", color: "#888", padding: "8px 16px", fontWeight: "bold" }}>
                {groupName}
              </div>
              {convs.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={() => onSelectSession(conv.sessionId)}
                  className={`history-card ${conv.sessionId === sessionId ? "active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", gap: "12px", flex: 1, overflow: "hidden" }}>
                    <div className="history-card-icon">
                      <i className={`fa-solid ${conv.icon || determineIcon(conv.title, conv.messages)}`}></i>
                    </div>
                    <div className="history-card-content" style={{ flex: 1 }}>
                      <h4>{conv.title}</h4>
                      <span>{conv.timestamp}</span>
                      <p>{conv.lastMessageSnippet}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => onDeleteSession(e, conv.sessionId)}
                    className="delete-conv-btn"
                    title="Delete Conversation"
                    style={{
                      background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer",
                      padding: "4px", display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "4px", fontSize: "0.85rem", opacity: conv.sessionId === sessionId ? 0.8 : 0.4,
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default ChatHistoryPanel;
