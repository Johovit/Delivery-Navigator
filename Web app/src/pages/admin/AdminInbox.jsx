import { useState, useEffect, useRef } from "react";
import {
  fetchAdminInboxList,
  fetchConversationMessages,
  sendAdminReply,
} from "../../services/messageService";
import { useAppContext } from "../../context/AppContext";
import EmptyState from "../../components/EmptyState";
import { Loader, RefreshCw, ArrowLeft } from "lucide-react";

function AdminInbox() {
  const { showToast } = useAppContext();
  const [inboxList, setInboxList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInbox = async () => {
    setLoadingList(true);
    try {
      const list = await fetchAdminInboxList();
      setInboxList(list);
    } catch {
      showToast("Failed to load inbox", "error");
    } finally {
      setLoadingList(false);
    }
  };

  const loadMessages = async (userId) => {
    setLoadingChat(true);
    try {
      const msgs = await fetchConversationMessages(userId);
      setMessages(msgs);
    } catch {
      showToast("Failed to load conversation", "error");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser) return;

    setSending(true);
    try {
      const newMsg = await sendAdminReply(selectedUser, replyText);
      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
    } catch {
      showToast("Failed to send reply", "error");
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
    <div className="page admin-inbox-page">
      <div className="page-header-row">
        <div>
          <h3 className="page-title">Admin Inbox</h3>
          <p className="page-sub">Manage user conversations</p>
        </div>
        <button
          className="icon-btn"
          onClick={loadInbox}
          disabled={loadingList}
          aria-label="Refresh inbox"
          title="Refresh"
        >
          <RefreshCw size={18} className={loadingList ? "spin" : ""} />
        </button>
      </div>

      <div className={`inbox-container ${selectedUser ? "mobile-chat-view" : "mobile-list-view"}`}>
        {/* Left Side: Users List */}
        <div className="inbox-sidebar">
          {loadingList ? (
            <div className="inbox-loading" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <Loader className="spin" size={18} /> Loading users...
            </div>
          ) : inboxList.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="No conversations"
              message="When users send messages, conversations will appear here."
              compact
            />
          ) : (
            <ul className="inbox-user-list">
              {inboxList.map((conver) => {
                const profile = conver.user_profiles || {};
                const username =
                  profile?.username ||
                  profile?.email?.split("@")[0] ||
                  "Unknown";
                return (
                  <li
                    key={conver.conversation_user_id}
                    className={`inbox-user-item ${
                      selectedUser === conver.conversation_user_id ? "active" : ""
                    }`}
                    onClick={() => setSelectedUser(conver.conversation_user_id)}
                  >
                    <div className="inbox-user-avatar">
                      {String(username).charAt(0).toUpperCase()}
                    </div>
                    <div className="inbox-user-info">
                      <span className="inbox-user-id" title={conver.conversation_user_id}>
                        {username}
                      </span>
                      <span className="inbox-last-msg">
                        {conver.message.length > 30
                          ? conver.message.slice(0, 30) + "..."
                          : conver.message}
                      </span>
                      <span className="inbox-last-msg-time">
                        {formatDate(conver.created_at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right Side: Chat Window */}
        <div className="inbox-chat-area">
          {selectedUser ? (
            <div className="chat-window">
              <div className="chat-header">
                <button 
                  type="button"
                  className="icon-btn mobile-back-btn" 
                  onClick={() => setSelectedUser(null)}
                  aria-label="Back to messages"
                  title="Back"
                >
                  <ArrowLeft size={18} />
                </button>
                <h4>Conversation</h4>
              </div>

              <div className="chat-messages">
                {loadingChat && (
                  <div className="inbox-loading" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", padding: "20px" }}>
                    <Loader className="spin" size={18} /> Loading messages...
                  </div>
                )}
                {!loadingChat && messages.length === 0 && (
                  <EmptyState
                    variant="messages"
                    title="No messages yet"
                    message="Select a conversation to view messages."
                    compact
                  />
                )}
                {!loadingChat &&
                  messages.map((msg) => {
                    const isAdmin = msg.role === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-container ${
                          isAdmin ? "is-admin" : "is-user"
                        }`}
                      >
                        <div className="chat-bubble">
                          <p className="chat-text">{msg.message}</p>
                          <span className="chat-time">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendReply}>
                <label htmlFor="replyText" style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Reply Text</label>
                <input
                  id="replyText"
                  name="replyText"
                  autoComplete="off"
                  type="text"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!replyText.trim() || sending}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          ) : (
            <EmptyState
              variant="messages"
              title="Select a conversation"
              message="Choose a user from the left to view and reply to messages."
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInbox;
