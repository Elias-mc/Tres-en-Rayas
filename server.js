import express from 'express';
import logger from 'morgan';
import dotenv from 'dotenv';

import { Server } from 'socket.io';
import { createServer } from 'node:http';

dotenv.config();

const app = express();
const server = createServer(app);

const rooms = {};

const io = new Server(server, {
  connectionStateRecovery: {},
});

const port = process.env.PORT ?? 3000;

app.use(logger('dev'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

//Verificar ganadores
function checkWinner(board) {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const combo of wins) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log('Usuario Conectado');

  //Crear la sala
  socket.on('create room', ({ username }) => {
    const roomCode = generateRoomCode();

    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.data.symbol = 'X';

    socket.join(roomCode);

    rooms[roomCode] = {
      board: Array(9).fill(null),
      turn: 'X',
      players: 1,
    };

    socket.emit('room created', roomCode);
    socket.emit('game symbol', 'X');

    console.log(`El ${username} creo la sala ${roomCode}`);
  });

  //Unise a la sala
  socket.on('join room', ({ username, roomCode }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit('room error', 'La sala no existe');
      return;
    }

    if (room.players >= 2) {
      socket.emit('room error', 'Sala llena');
      return;
    }

    room.players++;

    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.data.symbol = 'O';

    socket.join(roomCode);

    socket.emit('game symbol', 'O');
    socket.emit('room created', roomCode);

    io.to(roomCode).emit('start game');

    io.to(roomCode).emit('game update', room);

    console.log(`${username} entro a ${roomCode}`);
  });

  //Registro de movimientos
  socket.on('move', ({ index, roomCode }) => {
    const room = rooms[roomCode];

    if (!room) return;

    const player = socket.data.symbol;

    // CASILLA OCUPADA
    if (room.board[index]) return;

    // TURNO INVALIDO
    if (player !== room.turn) return;

    // PONER FICHA
    room.board[index] = player;

    // VERIFICAR GANADOR
    const winner = checkWinner(room.board);

    if (winner) {
      io.to(roomCode).emit('game update', room);

      io.to(roomCode).emit('game winner', winner);

      delete rooms[roomCode];

      return;
    }

    // EMPATE
    const draw = room.board.every((cell) => cell);

    if (draw) {
      io.to(roomCode).emit('game draw');

      delete rooms[roomCode];

      return;
    }

    // CAMBIAR TURNO
    room.turn = player === 'X' ? 'O' : 'X';

    io.to(roomCode).emit('game update', room);
  });

  // socket.on('reset game', ({ roomCode }) => {
  //   const room = rooms[roomCode];

  //   if (!room) return;

  //   room.board = Array(9).fill(null);
  //   room.turn = 'X';

  //   io.to(roomCode).emit('game update', room);
  // });

  // DESCONECTAR
  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;

    if (!roomCode) return;

    delete rooms[roomCode];

    console.log('Jugador desconectado');
  });
});

server.listen(port, () => {
  console.log(`Servido corriendo en puerto ${port}`);
});
