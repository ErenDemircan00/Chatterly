import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import "../styles/ChatPage.css"; // CSS dosyası eklendi

const SOCKET_URL = "http://localhost:5000";

function ChatPage() {
  const [username, setUsername] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const [searchParams] = useSearchParams();
  const userParam = searchParams.get("user");

  useEffect(() => {
    let name = window.localStorage.getItem("chat_username");
    if (!name) {
      name = window.prompt("Kullanıcı adınızı girin:");
      window.localStorage.setItem("chat_username", name);
    }
    setUsername(name);
  }, []);

  useEffect(() => {
    if (!username) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    socket.on("history", (historyMessages) => {
      setMessages(historyMessages);
    });
    return () => {
      socket.disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (userParam) {
      setSelectedChat({ username: userParam });
      setChats((prev) => {
        if (!prev.some((c) => c.username === userParam)) {
          return [...prev, { username: userParam }];
        }
        return prev;
      });
    }
  }, [userParam]);

  useEffect(() => {
    if (!selectedChat || !username || !socketRef.current) return;
    setMessages([]);
    socketRef.current.emit("get_history", {
      from: username,
      to: selectedChat.username,
    });
  }, [selectedChat, username]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    const msg = {
      sender: username,
      to: selectedChat.username,
      text: newMessage,
      timestamp: Date.now(),
    };
    socketRef.current.emit("send_message", msg);
    setNewMessage("");
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">Sohbetler</div>
        <ul className="chat-list">
          {chats.map((chat, idx) => (
            <li
              key={chat.username || idx}
              onClick={() => setSelectedChat(chat)}
              className={`chat-list-item ${
                selectedChat?.username === chat.username ? "active" : ""
              }`}
            >
              {chat.username}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          {selectedChat ? selectedChat.username : "Bir sohbet seçin"}
        </div>
        <div className="chat-messages">
          {selectedChat ? (
            messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message ${
                    msg.sender === username ? "sent" : "received"
                  }`}
                >
                  <div className="chat-text">{msg.text}</div>
                  <div className="chat-meta">
                    <span className="chat-sender">{msg.sender}</span>
                    <span className="chat-time">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-placeholder">Henüz mesaj yok.</div>
            )
          ) : (
            <div className="chat-placeholder">Sohbet seçilmedi.</div>
          )}
        </div>

        {selectedChat && (
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Mesaj yaz..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn">
              Gönder
            </button>
          </form>
        )}
      </div>
      <div className="light-beam"></div>
    </div>
  );
}

export default ChatPage;
