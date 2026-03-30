import { useState, useEffect, useRef } from "react";
import {
  fetchAdminInboxList,
  fetchConversationMessages,
  sendAdminReply,
} from "../../services/messageService";
import { useAppContext } from "../../context/AppContext";

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
        <button className="secondary-btn" onClick={loadInbox} disabled={loadingList}>
          🔄 Refresh Inbox
        </button>
      </div>

      <div className="inbox-container">
        {/* Left Side: Users List */}
        <div className="inbox-sidebar">
          {loadingList ? (
            <div className="inbox-loading">Loading users...</div>
          ) : inboxList.length === 0 ? (
            <div className="empty-state">
              <p>No messages found.</p>
            </div>
          ) : (
            <ul className="inbox-user-list">
              {inboxList.map((conver) => (
                <li
                  key={conver.conversation_user_id}
                  className={`inbox-user-item ${
                    selectedUser === conver.conversation_user_id ? "active" : ""
                  }`}
                  onClick={() => setSelectedUser(conver.conversation_user_id)}
                >
                  <div className="inbox-user-avatar">
                    {conver.conversation_user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="inbox-user-info">
                    <span className="inbox-user-id" title={conver.conversation_user_id}>
                      {conver.conversation_user_id.slice(0, 8)}...
                    </span>
                    <span className="inbox-last-msg">
                      {conver.message.length > 30
                        ? conver.message.slice(0, 30) + "..."
                        : conver.message}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side: Chat Window */}
        <div className="inbox-chat-area">
          {selectedUser ? (
            <div className="chat-window">
              <div className="chat-header">
                <h4>Conversation with {selectedUser.slice(0, 8)}...</h4>
              </div>

              <div className="chat-messages">
                {loadingChat && <div className="inbox-loading">Loading messages...</div>}
                {!loadingChat && messages.length === 0 && (
                  <div className="empty-state">No messages yet.</div>
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
                <input
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
            <div className="empty-state chat-empty">
              <span>💬</span>
              <p>Select a user to view the conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminInbox;
