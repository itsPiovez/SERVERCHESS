import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configura la connessione al database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234', // Assicurati che questa sia la tua password corretta
    database: 'CHESS'
};

let dbConnection;

// Funzione per connettersi al database
async function connectToDatabase() {
    console.log('Attempting to connect to the database...');
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        console.log('Connected to the database');
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
}

// Middleware per verificare la connessione al database
app.use((req, res, next) => {
    if (!dbConnection) {
        return res.status(500).send('Database connection not established');
    }
    next();
});

// Route per il login
app.post('/login', async (req, res) => {
    console.log('Login route called');
    console.log('Request body:', req.body);
    const { email, password } = req.body; 
    console.log(`Received email: ${email}, password: ${password}`);
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        console.log('Connecting to the database for login');
        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        console.log(`Executing query: ${query}`);
        const [rows] = await dbConnection.execute(query, [email, password]);

        console.log(`Database query completed. Rows returned: ${rows.length}`);
        if (rows.length > 0) {
            console.log('Login successful');
            res.send({ message: 'Login successful', user: rows[0] });
        } else {
            console.log('Invalid email or password');
            res.status(401).send('Invalid email or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal server error');
    }
});

// Route per la registrazione
app.post('/register', async (req, res) => {
    console.log('Registration route called');
    console.log('Request body:', req.body);  // Log del corpo della richiesta

    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).send('Email, password, and username are required');
    }

    try {
        console.log('Connecting to the database for registration');
        const [result] = await dbConnection.execute(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, password, username]
        );

        if (result.affectedRows > 0) {
            res.send({ success: true, message: 'Registration successful' });
        } else {
            res.status(500).send('Registration failed');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).send('Internal server error');
    }
});




let gameRooms = {};
io.on('connection', (socket) => {
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

// Connessione al database e avvio del server
connectToDatabase()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to the database. Server not started.', err);
    });
