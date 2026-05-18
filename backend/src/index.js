const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Senior SWE: Create HTTP server to wrap Express app for Socket.io support
const server = http.createServer(app);

// Initialize Socket.io with CORS aligned with our frontend port
const io = new Server(server, {
    cors: {
        origin: "*", // In production, we would restrict this to our frontend URL
        methods: ["GET", "POST"]
    }
});

// Global socket instance for use in routes
global.io = io;

io.on('connection', (socket) => {
    console.log('Client connected to Real-time Stream:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`RiskStream AI BFF running on port ${PORT}`);
});
