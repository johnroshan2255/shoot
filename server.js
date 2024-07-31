import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { log } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname,'public')));

const connectedUsers = new Set();

const players = {};

io.on('connection', (socket) => {

    let RandomX = Math.floor(Math.random() * 700) + 50;
    let RandomY = Math.floor(Math.random() * 500) + 50;


    // socket.emit('currentPlayers', players);

    socket.on('joinRoom', (username) => {
      if (!connectedUsers.has(username)) {
        players[socket.id] = {
            x: RandomX,
            y: RandomY,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            score: 0,
            direction: 'left',
            width: 50,
            height: 50,
            gun: {
              x: RandomX + 25,
              y: RandomY + 20,
            },
            username: username,
            hasGun: false,
            life: 15,
        };

        connectedUsers.add(username);

        io.emit('currentPlayers', players);

        socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

      }
    });

    // socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });
    // socket.emit('createGun', {id: socket.id});

    socket.on('playerMovement', ({ x, y, direction }) => {
        players[socket.id].x = x;
        players[socket.id].y = y;
        players[socket.id].direction = direction;
        socket.broadcast.emit('playerMoved', { id: socket.id, ...players[socket.id] });
    });

    socket.on('gunCreated', ({ hasGun }) => {
      players[socket.id].hasGun = hasGun;
      console.log(players);
    });

    socket.on('gunMovement', ({ gun }) => {
        if (players[socket.id]) {
            players[socket.id].gun = gun;
            socket.broadcast.emit('gunMoved', { id: socket.id, gun });
        }
    });

    socket.on('audioStream', (audioData) => {
      console.log('audio');
      io.emit('audioStream', audioData);
    });

    socket.on('shoot', (bulletData) => {
      socket.broadcast.emit('bulletFired', bulletData);
    });

    socket.on('playerHit', ({ hit, shooter }) => {
      if (players[hit] && players[shooter]) {
        players[shooter].score += 1;
        players[hit].life -= 1;
        let life = players[hit].life;
        if(players[hit].life <= 0){
          if (hit) {
            const userSocket = io.sockets.sockets.get(hit);
            console.log(userSocket);
            if (userSocket) {
                connectedUsers.delete(players[hit].username);
                userSocket.disconnect(); // Disconnect the user
                 // Remove from map
            }
        }
        }
        io.emit('scoreUpdate', {
          id: shooter,
          score: players[shooter].score,
          life: life,
          hit: hit,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
      if ( typeof players[socket.id] !== 'undefined' && connectedUsers.has(players[socket.id].username)) {
        connectedUsers.delete(players[socket.id].username);
      }
      delete players[socket.id];
      io.emit('playerDisconnected', socket.id);
    });

});

const checkUserConnection = (req, res, next) => {
  const username = req.query.username;  // Get username from query parameter or other method

  if (connectedUsers.has(username)) {
    next();  // User is connected, proceed to the game page
  } else {
    res.redirect('/');  // User not connected, redirect to the home page
  }
}

app.get('/', (req, res) => {
  res.sendFile(join(__dirname,'index.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(join(__dirname,'game.html'));
});


const PORT = 2255;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
