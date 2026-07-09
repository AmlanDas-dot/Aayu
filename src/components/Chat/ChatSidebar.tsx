import React from "react";

interface Conversation {
  sessionId: string;
  title: string;
  timestamp: string;
  lastMessageSnippet: string;
  messages: any[];
  icon?: string;
}

interface ChatSidebarProps {
  groupedConversations: Record<string, Conversation[]>;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onStartNewSession: () => void;
  onSelectSession: (id: string) => void;
  currentSessionId: string;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  getIcon: (title: string, messages: any[]) => string;
}

export function ChatSidebar({
  groupedConversations,
  searchTerm,
  onSearchChange,
  onStartNewSession,
  onSelectSession,
  currentSessionId,
  onDeleteSession,
  getIcon,
}: ChatSidebarProps) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Conversation History</h3>
        <button className="new-chat-btn" onClick={onStartNewSession} title="New Conversation">
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
                  className={`history-card ${conv.sessionId === currentSessionId ? "active" : ""}`}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", gap: "12px", flex: 1, overflow: "hidden" }}>
                    <div className="history-card-icon">
                      <i className={`fa-solid ${conv.icon || getIcon(conv.title, conv.messages)}`}></i>
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
