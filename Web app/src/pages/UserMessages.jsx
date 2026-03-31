import { useState, useEffect, useRef } from "react";
import { fetchUserMessages, sendUserMessage } from "../services/messageService";
import { useAppContext } from "../context/AppContext";
import EmptyState from "../components/EmptyState";

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
        <button className="secondary-btn" onClick={loadMessages} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="card chat-window user-chat-window" style={{ height: "calc(100vh - 220px)" }}>
        <div className="chat-messages">
          {loading && <div className="inbox-loading">Loading your messages...</div>}
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
                  className={`chat-bubble-container ${
                    isUser ? "is-admin" : "is-user"
                  }`}
                  /* Note: we repurpose `.is-admin` for the right-hand bubble, which in the user view is the user. */
                >
                  <div className="chat-bubble">
                    <p className="chat-text">{msg.message}</p>
                    <span className="chat-time">{formatDate(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
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
