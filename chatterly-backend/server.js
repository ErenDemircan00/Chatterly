const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Geliştirme için tüm originlere izin veriyoruz
    methods: ['GET', 'POST']
  }
});

const MESSAGES_FILE = path.join(__dirname, 'messages.json');

app.use(cors());
app.get('/', (req, res) => {
  res.send('Socket.io sunucusu çalışıyor!');
});

// Yardımcı fonksiyon: Dosyadan tüm mesajları oku
function readMessages() {
  try {
    const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}
// Yardımcı fonksiyon: Mesajı dosyaya ekle
function saveMessage(message) {
  const messages = readMessages();
  messages.push(message);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// Socket.io bağlantılarını dinle
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // 1. Kullanıcı geçmiş mesajları istediğinde
  socket.on('get_history', ({ from, to }) => {
    const allMessages = readMessages();
    // Sadece ilgili iki kullanıcı arasındaki mesajlar
    const chatMessages = allMessages.filter(
      (msg) =>
        (msg.sender === from && msg.to === to) ||
        (msg.sender === to && msg.to === from)
    );
    socket.emit('history', chatMessages);
  });

  // 2. Mesaj gönderme event'i
  socket.on('send_message', (data) => {
    // Mesajı dosyaya kaydet
    saveMessage(data);
    // Gelen mesajı tüm kullanıcılara ilet
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.io sunucusu ${PORT} portunda çalışıyor.`);
}); 