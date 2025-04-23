const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat message', (msg) => {
    // Broadcast message to all clients except sender
    socket.broadcast.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
