import { useEffect, useRef } from "react";
import { Message } from "../../types";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: Message[];
  isProcessing: boolean;
}

export function ChatWindow({ messages, isProcessing }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  return (
    <div
      className="conversation-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // Prevent horizontal overflow from escaping this container
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <h2 className="font-semibold mb-2">Aayu Consultation</h2>
      <div
        className="messages"
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          paddingBottom: "12px",
          minWidth: 0,
        }}
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isProcessing && (
          <div
            className="message ai"
            style={{
              opacity: 0.7,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              whiteSpace: "pre-wrap",
            }}
          >
            Aayu is thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
