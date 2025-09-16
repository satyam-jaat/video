const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json({ limit: '10mb' }));  // To accept big image frames
app.use(express.static('public'));  // Serve frontend

// Simple frame receiver endpoint
app.post('/process-frame', (req, res) => {
    const imageData = req.body.image;
    console.log('Received frame of size:', imageData.length);
    // You can save or process the imageData (base64) here for ML later
    res.sendStatus(200);
});

// Room tracking
const ROOM_ID = '12345678';
let usersInRoom = 0;

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', (roomId) => {
        if (roomId !== ROOM_ID) {
            socket.emit('room-error', 'Invalid room ID');
            return;
        }

        if (usersInRoom >= 2) {
            socket.emit('room-error', 'Room full');
            return;
        }

        socket.join(roomId);
        usersInRoom++;
        console.log(`User joined room ${roomId}. Total users: ${usersInRoom}`);

        socket.emit('room-joined');

        socket.on('disconnect', () => {
            usersInRoom--;
            console.log(`User disconnected. Remaining users: ${usersInRoom}`);
        });

        // Relay signaling data
        socket.on('signal', (data) => {
            socket.to(roomId).emit('signal', data);
        });
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
