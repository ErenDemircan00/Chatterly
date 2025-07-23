import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";

const SOCKET_URL = "http://localhost:5000";

function ChatPage() {
  const [username, setUsername] = useState("");
  const [chats, setChats] = useState([]); // Sohbetler (örnek veri veya parametreyle)
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const [searchParams] = useSearchParams();
  const userParam = searchParams.get("user");

  // Kullanıcı adını prompt ile al
  useEffect(() => {
    let name = window.localStorage.getItem("chat_username");
    if (!name) {
      name = window.prompt("Kullanıcı adınızı girin:");
      window.localStorage.setItem("chat_username", name);
    }
    setUsername(name);
  }, []);

  // Socket bağlantısı kur
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

  // URL'de user parametresi varsa otomatik sohbet başlat
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

  // Sohbet seçilince geçmiş mesajları iste
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
    if (!socketRef.current) return;
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
    <div style={{ display: "flex", height: "80vh", background: "#f7f7f7", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      {/* Sol Panel: Sohbetler */}
      <div style={{ width: 260, background: "#fff", borderRight: "1px solid #eee", padding: 0 }}>
        <div style={{ padding: 20, fontWeight: 700, fontSize: 20, borderBottom: "1px solid #eee" }}>Sohbetler</div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {chats.map((chat, idx) => (
            <li
              key={chat.username || idx}
              onClick={() => setSelectedChat(chat)}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                background: selectedChat?.username === chat.username ? "#e3f2fd" : "#fff",
                borderBottom: "1px solid #f5f5f5",
                fontWeight: selectedChat?.username === chat.username ? 600 : 400,
                transition: "background 0.2s",
              }}
            >
              {chat.username}
            </li>
          ))}
        </ul>
      </div>

      {/* Sağ Panel: Mesajlaşma */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f9f9f9" }}>
        {/* Başlık */}
        <div style={{ padding: 20, borderBottom: "1px solid #eee", fontWeight: 600, fontSize: 18, minHeight: 60 }}>
          {selectedChat ? selectedChat.username : "Bir sohbet seçin"}
        </div>
        {/* Mesajlar */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedChat ? (
            messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === username ? "flex-end" : "flex-start",
                    background: msg.sender === username ? "#bbdefb" : "#fff",
                    color: "#222",
                    padding: "10px 16px",
                    borderRadius: 16,
                    maxWidth: "70%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ fontSize: 14 }}>{msg.text}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "#888" }}>{msg.sender}</span>
                    <span style={{ fontSize: 10, color: "#aaa", marginLeft: 8 }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
                Henüz mesaj yok.
              </div>
            )
          ) : (
            <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
              Sohbet seçilmedi.
            </div>
          )}
        </div>
        {/* Mesaj Gönderme Alanı */}
        {selectedChat && (
          <form
            style={{ display: "flex", padding: 16, borderTop: "1px solid #eee", background: "#fff" }}
            onSubmit={handleSendMessage}
          >
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Mesaj yaz..."
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc", fontSize: 15 }}
            />
            <button type="submit" style={{ marginLeft: 10, padding: "0 18px", borderRadius: 8, background: "#1976d2", color: "#fff", border: "none", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
              Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ChatPage; 