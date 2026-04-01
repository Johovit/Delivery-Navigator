import { useState, useEffect, useRef } from "react";
import { fetchUserMessages, sendUserMessage } from "../services/messageService";
import { useAppContext } from "../context/AppContext";
import EmptyState from "../components/EmptyState";
import { Loader, RefreshCw } from "lucide-react";

function UserMessages() {
  const { showToast } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await fetchUserMessages();
      setMessages(msgs);
    } catch (err) {
      showToast(err.message || "Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      const newMsg = await sendUserMessage(messageText);
      setMessages((prev) => [...prev, newMsg]);
      setMessageText("");
    } catch (err) {
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="page user-messages-page">
      <div className="page-header-row">
        <div>
          <h3 className="page-title">Support Messages</h3>
          <p className="page-sub">Chat with our support team</p>
        </div>
        <button
          className="icon-btn"
          onClick={loadMessages}
          disabled={loading}
          aria-label="Refresh messages"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </div>

      <div className="card chat-window user-chat-window flex flex-col w-full h-[calc(100vh-160px)] min-h-[400px]">
        <div className="chat-messages flex-1 overflow-y-auto w-full">
          {loading && (
            <div className="inbox-loading" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <Loader className="spin" size={18} /> Loading your messages...
            </div>
          )}
          {!loading && messages.length === 0 && (
            <EmptyState
              variant="messages"
              title="No messages yet"
              message="Start a conversation with our support team."
            />
          )}
          {!loading &&
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`chat-bubble-container w-full max-w-full flex ${isUser ? "justify-end" : "justify-start"} mb-4 ${
                    isUser ? "is-admin" : "is-user"
                  }`}
                >
                  <div className="chat-bubble break-words overflow-hidden max-w-[85%] sm:max-w-[70%]">
                    <p className="chat-text whitespace-pre-wrap">{msg.message}</p>
                    <span className="chat-time">{formatDate(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area mt-auto w-full flex" onSubmit={handleSendMessage}>
          <label htmlFor="messageText" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Message</label>
          <input
            id="messageText"
            name="messageText"
            autoComplete="off"
            type="text"
            className="flex-1 w-full min-w-0"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={!messageText.trim() || sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserMessages;
