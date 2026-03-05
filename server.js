const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Armazenar dispositivos conectados
const dispositivos = new Map();

app.get('/', (req, res) => {
    const modo = req.query.modo || 'controle';
    const codigo = req.query.codigo || '';
    
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 Controle Remoto Premium</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .card {
            background: white;
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        h2 {
            color: #4a5568;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        
        h3 {
            color: #4a5568;
            margin: 15px 0 10px 0;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        input, select {
            width: 100%;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin: 5px;
        }
        
        .primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .success {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .error {
            background: #fed7d7;
            color: #742a2a;
        }
        
        .codigo {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
            text-align: center;
            margin: 20px 0;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        
        .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        
        .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        
        .control-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 10px;
            font-size: 16px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .control-btn span {
            font-size: 24px;
        }
        
        #qrcode-container {
            text-align: center;
            padding: 20px;
        }
        
        #qrcode-container img {
            max-width: 200px;
            border-radius: 10px;
        }
        
        .log-container {
            background: #f7fafc;
            border-radius: 10px;
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 14px;
        }
        
        .log-entry {
            padding: 5px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-box {
            background: #ebf4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        .media-container {
            margin-top: 20px;
            text-align: center;
        }
        
        .media-container img, .media-container video {
            max-width: 100%;
            max-height: 400px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .grid-2, .grid-3, .grid-4 {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (max-width: 480px) {
            .grid-2, .grid-3, .grid-4 {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${modo === 'celular' ? '📱 Modo Celular' : '🎮 Painel de Controle Premium'}</h1>
        
        ${modo === 'celular' ? `
        <!-- MODO CELULAR -->
        <div class="card">
            <h2>Conectado como Celular</h2>
            <div class="codigo">${codigo}</div>
            <p style="text-align: center; color: #718096;">Use este código no painel de controle</p>
            <div id="status-celular" class="status" style="display: none;"></div>
            
            <div id="comandos-recebidos" style="margin-top: 20px;">
                <h3>Comandos Recebidos:</h3>
                <div id="lista-comandos" class="log-container"></div>
            </div>
            
            <div id="media-display" class="media-container" style="display: none;"></div>
        </div>
        
        <script>
            let mediaStream = null;
            let mediaRecorder = null;
            let recordedChunks = [];
            
            socket.on('executar-comando', async (data) => {
                const { comando, valor } = data;
                const lista = document.getElementById('lista-comandos');
                const mediaDisplay = document.getElementById('media-display');
                
                // Mostrar comando
                const comandoDiv = document.createElement('div');
                comandoDiv.className = 'log-entry';
                comandoDiv.innerHTML = \`[${new Date().toLocaleTimeString()}] 📥 Comando: \${comando}\`;
                lista.insertBefore(comandoDiv, lista.firstChild);
                
                let resposta = { comando };
                
                try {
                    switch(comando) {
                        case 'vibrar':
                            if (navigator.vibrate) {
                                navigator.vibrate(valor || 200);
                                resposta.resultado = 'Vibração executada';
                            } else {
                                resposta.erro = 'Vibração não suportada';
                            }
                            break;
                            
                        case 'alerta':
                            alert(valor.msg || '📱 Comando recebido!');
                            resposta.resultado = 'Alerta mostrado';
                            break;
                            
                        case 'beep':
                            try {
                                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                                const osc = ctx.createOscillator();
                                osc.connect(ctx.destination);
                                osc.frequency.value = 800;
                                osc.start();
                                osc.stop(ctx.currentTime + 0.1);
                                resposta.resultado = 'Beep executado';
                            } catch (e) {
                                resposta.erro = 'Erro no beep';
                            }
                            break;
                            
                        case 'print':
                            try {
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                const video = document.createElement('video');
                                
                                // Capturar tela
                                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                                video.srcObject = stream;
                                
                                await new Promise(resolve => {
                                    video.onloadedmetadata = () => {
                                        video.play();
                                        resolve();
                                    };
                                });
                                
                                // Desenhar no canvas
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                
                                // Parar stream
                                stream.getTracks().forEach(track => track.stop());
                                
                                // Converter para base64
                                const screenshot = canvas.toDataURL('image/png');
                                
                                resposta.resultado = 'Screenshot capturada';
                                resposta.dados = screenshot;
                                
                                // Mostrar preview
                                mediaDisplay.style.display = 'block';
                                mediaDisplay.innerHTML = \`<img src="\${screenshot}" alt="Screenshot">\`;
                            } catch (e) {
                                resposta.erro = 'Erro ao capturar tela: ' + e.message;
                            }
                            break;
                            
                        case 'camera':
                            try {
                                if (mediaStream) {
                                    mediaStream.getTracks().forEach(track => track.stop());
                                }
                                
                                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                                    video: true,
                                    audio: valor.audio || false 
                                });
                                
                                const video = document.createElement('video');
                                video.srcObject = mediaStream;
                                video.autoplay = true;
                                video.playsInline = true;
                                
                                mediaDisplay.style.display = 'block';
                                mediaDisplay.innerHTML = '';
                                mediaDisplay.appendChild(video);
                                
                                resposta.resultado = 'Câmera ativada';
                            } catch (e) {
                                resposta.erro = 'Erro ao acessar câmera: ' + e.message;
                            }
                            break;
                            
                        case 'foto':
                            try {
                                if (!mediaStream) {
                                    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                                }
                                
                                const video = document.createElement('video');
                                video.srcObject = mediaStream;
                                video.autoplay = true;
                                
                                await new Promise(resolve => {
                                    video.onloadedmetadata = () => {
                                        video.play();
                                        resolve();
                                    };
                                });
                                
                                const canvas = document.createElement('canvas');
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                canvas.getContext('2d').drawImage(video, 0, 0);
                                
                                const foto = canvas.toDataURL('image/jpeg');
                                
                                mediaDisplay.style.display = 'block';
                                mediaDisplay.innerHTML = \`<img src="\${foto}" alt="Foto">\`;
                                
                                resposta.resultado = 'Foto tirada';
                                resposta.dados = foto;
                            } catch (e) {
                                resposta.erro = 'Erro ao tirar foto: ' + e.message;
                            }
                            break;
                            
                        case 'audio':
                            try {
                                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                mediaRecorder = new MediaRecorder(audioStream);
                                recordedChunks = [];
                                
                                mediaRecorder.ondataavailable = (e) => {
                                    if (e.data.size > 0) {
                                        recordedChunks.push(e.data);
                                    }
                                };
                                
                                mediaRecorder.onstop = () => {
                                    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                                    const reader = new FileReader();
                                    reader.readAsDataURL(blob);
                                    reader.onloadend = () => {
                                        socket.emit('resposta', {
                                            comando: 'audio-gravado',
                                            dados: reader.result
                                        });
                                    };
                                };
                                
                                if (valor.acao === 'iniciar') {
                                    mediaRecorder.start();
                                    resposta.resultado = 'Gravação de áudio iniciada';
                                } else if (valor.acao === 'parar') {
                                    mediaRecorder.stop();
                                    audioStream.getTracks().forEach(track => track.stop());
                                    resposta.resultado = 'Gravação de áudio finalizada';
                                }
                            } catch (e) {
                                resposta.erro = 'Erro no áudio: ' + e.message;
                            }
                            break;
                            
                        case 'localizacao':
                            try {
                                const position = await new Promise((resolve, reject) => {
                                    navigator.geolocation.getCurrentPosition(resolve, reject);
                                });
                                
                                resposta.resultado = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                    precisao: position.coords.accuracy
                                };
                                
                                mediaDisplay.style.display = 'block';
                                mediaDisplay.innerHTML = \`
                                    <div class="info-box">
                                        <h4>Localização:</h4>
                                        <p>Latitude: \${position.coords.latitude}</p>
                                        <p>Longitude: \${position.coords.longitude}</p>
                                        <p>Precisão: \${position.coords.accuracy}m</p>
                                        <a href="https://www.google.com/maps?q=\${position.coords.latitude},\${position.coords.longitude}" 
                                           target="_blank" class="primary" style="display: inline-block; margin-top: 10px;">
                                            Ver no Maps
                                        </a>
                                    </div>
                                \`;
                            } catch (e) {
                                resposta.erro = 'Erro ao obter localização: ' + e.message;
                            }
                            break;
                            
                        case 'bateria':
                            if (navigator.getBattery) {
                                const battery = await navigator.getBattery();
                                resposta.resultado = {
                                    nivel: battery.level * 100 + '%',
                                    carregando: battery.charging ? 'Sim' : 'Não'
                                };
                            } else {
                                resposta.erro = 'Informação de bateria não disponível';
                            }
                            break;
                            
                        case 'rede':
                            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                            if (connection) {
                                resposta.resultado = {
                                    tipo: connection.type || 'desconhecido',
                                    efetivo: connection.effectiveType,
                                    download: connection.downlink + ' Mbps',
                                    rtt: connection.rtt + ' ms'
                                };
                            } else {
                                resposta.resultado = { info: 'API de rede não disponível' };
                            }
                            break;
                            
                        case 'arquivo':
                            // Implementar upload de arquivo
                            break;
                    }
                } catch (e) {
                    resposta.erro = e.message;
                }
                
                socket.emit('resposta', resposta);
            });
            
            socket.on('celular-registrado', () => {
                const status = document.getElementById('status-celular');
                status.style.display = 'block';
                status.className = 'status success';
                status.innerHTML = '✅ Conectado ao servidor!';
            });
        </script>
        ` : `
        <!-- MODO CONTROLE -->
        <div class="card">
            <h2>Conectar ao Celular</h2>
            <div class="input-group">
                <input type="text" id="codigo" placeholder="Digite o código de 6 dígitos" maxlength="6" style="text-transform: uppercase;">
            </div>
            <button class="primary" onclick="conectar()" style="width: 100%;">Conectar</button>
            
            <div style="text-align: center; margin: 20px 0;">ou</div>
            
            <div class="input-group">
                <label>Escaneie o QR Code:</label>
                <div id="qrcode-container"></div>
            </div>
            
            <div id="status-conexao" class="status" style="display: none;"></div>
        </div>
        
        <div class="card" id="controles-card" style="display: none;">
            <h2>🎮 Controles Básicos</h2>
            <div class="grid-4">
                <button class="control-btn" onclick="enviarComando('vibrar', 200)">
                    <span>📳</span> Vibrar
                </button>
                <button class="control-btn" onclick="enviarComando('vibrar', 500)">
                    <span>📳📳</span> Vibrar Forte
                </button>
                <button class="control-btn" onclick="enviarComando('alerta', {msg: 'Olá!'})">
                    <span>⚠️</span> Alerta
                </button>
                <button class="control-btn" onclick="enviarComando('beep')">
                    <span>🔊</span> Beep
                </button>
            </div>
        </div>
        
        <div class="card" id="midia-card" style="display: none;">
            <h2>📸 Mídia e Sensores</h2>
            <div class="grid-3">
                <button class="control-btn" onclick="enviarComando('print')">
                    <span>🖥️</span> Print Screen
                </button>
                <button class="control-btn" onclick="enviarComando('camera', {audio: false})">
                    <span>📷</span> Ativar Câmera
                </button>
                <button class="control-btn" onclick="enviarComando('foto')">
                    <span>📸</span> Tirar Foto
                </button>
                <button class="control-btn" onclick="enviarComando('camera', {audio: true})">
                    <span>🎥</span> Câmera + Áudio
                </button>
                <button class="control-btn" onclick="enviarComando('audio', {acao: 'iniciar'})">
                    <span>🎤</span> Gravar Áudio
                </button>
                <button class="control-btn" onclick="enviarComando('audio', {acao: 'parar'})">
                    <span>⏹️</span> Parar Áudio
                </button>
            </div>
        </div>
        
        <div class="card" id="info-card" style="display: none;">
            <h2>ℹ️ Informações do Dispositivo</h2>
            <div class="grid-3">
                <button class="control-btn" onclick="enviarComando('localizacao')">
                    <span>📍</span> Localização
                </button>
                <button class="control-btn" onclick="enviarComando('bateria')">
                    <span>🔋</span> Bateria
                </button>
                <button class="control-btn" onclick="enviarComando('rede')">
                    <span>📶</span> Rede
                </button>
            </div>
        </div>
        
        <div class="card" id="dados-card" style="display: none;">
            <h3>📊 Dados Recebidos</h3>
            <div id="dados-display" class="info-box"></div>
        </div>
        
        <div class="card" id="log-card" style="display: none;">
            <h3>📋 Log de Comandos</h3>
            <div id="log-comandos" class="log-container"></div>
        </div>
        
        <script>
            let celularConectado = false;
            let codigoAtual = '${codigo}';
            
            function adicionarLog(mensagem, tipo = 'info') {
                const logDiv = document.getElementById('log-comandos');
                if (!logDiv) return;
                
                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.style.color = tipo === 'erro' ? '#742a2a' : '#22543d';
                entry.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${mensagem}\`;
                logDiv.insertBefore(entry, logDiv.firstChild);
            }
            
            function gerarQRCode(codigo) {
                fetch(\`/api/qrcode/\${codigo}\`)
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('qrcode-container').innerHTML = 
                            \`<img src="\${data.qrCode}" alt="QR Code">\`;
                    });
            }
            
            function conectar() {
                const codigo = document.getElementById('codigo').value.toUpperCase();
                if (codigo.length === 6) {
                    codigoAtual = codigo;
                    socket.emit('registrar-controle', { codigo });
                    adicionarLog('Conectando...');
                } else {
                    alert('Digite um código de 6 dígitos');
                }
            }
            
            function enviarComando(comando, valor) {
                if (!celularConectado) {
                    alert('Conecte a um celular primeiro');
                    return;
                }
                
                socket.emit('comando', {
                    codigo: codigoAtual,
                    comando: comando,
                    valor: valor
                });
                
                adicionarLog(\`📤 Comando enviado: \${comando}\`);
            }
            
            // Event listeners
            document.getElementById('codigo')?.addEventListener('input', (e) => {
                const codigo = e.target.value.toUpperCase();
                if (codigo.length === 6) {
                    gerarQRCode(codigo);
                }
            });
            
            socket.on('controle-registrado', (data) => {
                const status = document.getElementById('status-conexao');
                
                if (data.sucesso) {
                    celularConectado = true;
                    status.style.display = 'block';
                    status.className = 'status success';
                    status.innerHTML = '✅ Conectado ao celular!';
                    
                    document.getElementById('controles-card').style.display = 'block';
                    document.getElementById('midia-card').style.display = 'block';
                    document.getElementById('info-card').style.display = 'block';
                    document.getElementById('log-card').style.display = 'block';
                    document.getElementById('dados-card').style.display = 'block';
                    
                    adicionarLog('✅ Conectado com sucesso!');
                } else {
                    celularConectado = false;
                    status.style.display = 'block';
                    status.className = 'status error';
                    status.innerHTML = '❌ Celular não encontrado';
                }
            });
            
            socket.on('resposta-controle', (data) => {
                if (data.erro) {
                    adicionarLog(\`❌ Erro: \${data.erro}\`, 'erro');
                } else {
                    adicionarLog(\`✅ \${data.comando}: \${JSON.stringify(data.resultado)}\`);
                    
                    // Mostrar dados recebidos
                    if (data.dados) {
                        const display = document.getElementById('dados-display');
                        if (data.dados.startsWith('data:image')) {
                            display.innerHTML = \`<img src="\${data.dados}" style="max-width: 100%;">\`;
                        } else {
                            display.innerHTML = \`<pre>\${JSON.stringify(data.dados, null, 2)}</pre>\`;
                        }
                    }
                    
                    if (data.resultado && typeof data.resultado === 'object') {
                        const display = document.getElementById('dados-display');
                        display.innerHTML = \`<pre>\${JSON.stringify(data.resultado, null, 2)}</pre>\`;
                    }
                }
            });
            
            socket.on('celular-desconectado', () => {
                celularConectado = false;
                const status = document.getElementById('status-conexao');
                status.style.display = 'block';
                status.className = 'status error';
                status.innerHTML = '❌ Celular desconectado';
                adicionarLog('❌ Celular desconectado', 'erro');
            });
        </script>
        `}
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const modo = '${modo}';
    </script>
</body>
</html>
    `);
});

// API para QR Code
app.get('/api/qrcode/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo;
        const url = `${req.protocol}://${req.get('host')}/?modo=celular&codigo=${codigo}`;
        const qrCode = await QRCode.toDataURL(url);
        res.json({ qrCode });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('registrar-celular', (data) => {
        const { codigo, info } = data;
        dispositivos.set(codigo, { socketId: socket.id, info });
        socket.emit('celular-registrado', { sucesso: true });
        socket.broadcast.emit('celular-conectado', { codigo });
        console.log('Celular registrado:', codigo);
    });

    socket.on('registrar-controle', (data) => {
        const { codigo } = data;
        const celular = dispositivos.get(codigo);
        
        if (celular) {
            dispositivos.set(codigo, { ...celular, controleSocket: socket.id });
            socket.emit('controle-registrado', { sucesso: true });
            console.log('Controle conectado ao:', codigo);
        } else {
            socket.emit('controle-registrado', { sucesso: false });
        }
    });

    socket.on('comando', (data) => {
        const { codigo, comando, valor } = data;
        const celular = dispositivos.get(codigo);
        
        if (celular) {
            io.to(celular.socketId).emit('executar-comando', { comando, valor });
        }
    });

    socket.on('resposta', (data) => {
        socket.broadcast.emit('resposta-controle', data);
    });

    socket.on('disconnect', () => {
        for (let [codigo, info] of dispositivos.entries()) {
            if (info.socketId === socket.id || info.controleSocket === socket.id) {
                dispositivos.delete(codigo);
                socket.broadcast.emit('celular-desconectado', { codigo });
                console.log('Dispositivo desconectado:', codigo);
                break;
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
