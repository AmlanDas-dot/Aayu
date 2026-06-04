import { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`message ${message.role}`}
      style={{
        // Belt-and-suspenders wrapping — handles URLs, long medical terms
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
        maxWidth: "75%",
        minWidth: 0,
      }}
    >
      {message.text}
    </div>
  );
}
