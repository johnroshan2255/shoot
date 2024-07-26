import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get('/', (req, res) => {
    res.sendFile(join(__dirname,'index.html'));
});

const players = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    players[socket.id] = {
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        score: 0
    };

    socket.emit('currentPlayers', players);

    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    socket.on('playerMovement', ({ x, y }) => {
        players[socket.id].x = x;
        players[socket.id].y = y;
        socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
    });

    socket.on('shoot', (bulletData) => {
      io.emit('bulletFired', bulletData);
    });

    socket.on('playerHit', ({ hit, shooter }) => {
      if (players[hit] && players[shooter]) {
        players[shooter].score += 1;
        io.emit('scoreUpdate', {
          id: shooter,
          score: players[shooter].score
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
    });

});


const PORT = 2255;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
