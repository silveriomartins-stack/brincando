const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Controle Celular</title></head>
        <body>
            <h1>✅ Servidor funcionando!</h1>
            <p>Porta: ${PORT}</p>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                socket.on('connect', () => {
                    document.body.innerHTML += '<p>✅ Conectado ao WebSocket</p>';
                });
            </script>
        </body>
        </html>
    `);
});

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
