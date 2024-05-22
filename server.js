import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameRooms = {};io.on('connection', (socket) => {
    console.log('A user connected');

    // Join a game room
    socket.on('joinRoom', (roomData) => {
        const roomId = roomData.roomId;
        const room = gameRooms[roomId];
        
        if (!room) {
            // If the room doesn't exist, create it
            gameRooms[roomId] = { player1: socket.id, player2: null };
            socket.join(roomId);
            console.log('User joined room:', roomId);
            io.to(roomId).emit('roomJoined', { roomId: roomId, players: [socket.id] });
        } else if (room.player2) {
            // If the room is full, emit an error message
            socket.emit('roomFull', 'Questa stanza è già piena. Scegli un\'altra stanza.');
        } else {
            // If there's room for another player, join the room
            room.player2 = socket.id;
            socket.join(roomId);
            console.log('User joined room:', roomId);
            io.to(roomId).emit('roomJoined', { roomId: roomId, players: [room.player1, socket.id] });
        }
    });

    // Handle move event
    socket.on('move', (data) => {
        const roomId = data.roomId;
        const room = gameRooms[roomId];
        console.log('User room:', roomId);
        if (room && room.player1 && room.player2) {
            console.log('Move received:', data);
            console.log(`User Id socket: ${socket.id}`);
            console.log('User room:', roomId);
            // Broadcast the move to the other player in the room
            socket.to(roomId).emit('opponentMove', data);
            console.log(`Emitted 'opponentMove' to room ${roomId}`);
        } else {
            console.log('Unable to make move: Both players are not present in the room');
        }
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    
        // Check if the disconnected player was in a game room
        for (const roomId in gameRooms) {
            if (gameRooms.hasOwnProperty(roomId)) {
                const room = gameRooms[roomId];
                if (room.player1 === socket.id) {
                    // Player 1 disconnected, so player 2 wins
                    if (room.player2) {
                        io.to(roomId).emit('gameOver', { winner: room.player2 });
                    }
                    delete gameRooms[roomId];
                } else if (room.player2 === socket.id) {
                    // Player 2 disconnected, so player 1 wins
                    if (room.player1) {
                        io.to(roomId).emit('gameOver', { winner: room.player1 });
                    }
                    delete gameRooms[roomId];
                }
            }
        }
    });
});


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
