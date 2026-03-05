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
const controles = new Map();

// Rota única - serve a página completa
app.get('/', (req, res) => {
    const modo = req.query.modo || 'controle';
    const codigo = req.query.codigo || '';
    
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 Controle Remoto Universal</title>
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
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .card {
            background: white;
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .card h2 {
            margin-bottom: 20px;
            color: #4a5568;
            font-size: 1.5em;
        }

        .card h3 {
            margin-bottom: 15px;
            color: #4a5568;
        }

        .tab-container {
            display: flex;
            gap: 5px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .tab-button {
            flex: 1;
            padding: 15px;
            border: none;
            background: rgba(255,255,255,0.2);
            color: white;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 10px 10px 0 0;
            min-width: 100px;
        }

        .tab-button:hover {
            background: rgba(255,255,255,0.3);
        }

        .tab-button.active {
            background: white;
            color: #667eea;
            font-weight: bold;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .input-group {
            margin-bottom: 20px;
        }

        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #4a5568;
        }

        input[type="text"], input[type="url"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 1em;
        }

        input:focus {
            outline: none;
            border-color: #667eea;
        }

        button {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        button.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        button.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        button.secondary {
            background: #e2e8f0;
            color: #4a5568;
        }

        .control-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            font-size: 1.1em;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .small-btn {
            background: #e2e8f0;
            color: #4a5568;
            padding: 10px;
            font-size: 0.9em;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }

        .status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }

        .status.success {
            background: #c6f6d5;
            color: #22543d;
        }

        .status.error {
            background: #fed7d7;
            color: #742a2a;
        }

        .divider {
            text-align: center;
            margin: 20px 0;
            position: relative;
        }

        .divider::before, .divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 45%;
            height: 1px;
            background: #e2e8f0;
        }

        .divider::before { left: 0; }
        .divider::after { right: 0; }

        .log-container {
            background: #f7fafc;
            border-radius: 10px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.9em;
        }

        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .log-entry.success { color: #22543d; }
        .log-entry.error { color: #742a2a; }
        .log-entry.info { color: #2c5282; }

        .timestamp {
            color: #718096;
            margin-right: 10px;
        }

        .celular-mode .container {
            max-width: 400px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            padding: 15px;
            background: #f7f7f7;
            border-radius: 50px;
        }

        .pulse {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }

        .codigo {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 5px;
            text-align: center;
            margin: 20px 0;
        }

        .comando-recebido {
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin: 10px 0;
            animation: slideIn 0.3s;
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .info-box {
            background: #ebf4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }

        @media (max-width: 640px) {
            .grid-2, .grid-3 { grid-template-columns: 1fr; }
            h1 { font-size: 1.5em; }
        }
    </style>
</head>
<body class="${modo === 'celular' ? 'celular-mode' : ''}">
    <div class="container">
        <h1>${modo === 'celular' ? '📱 Modo Celular' : '🎮 Painel de Controle'}</h1>
        
        <div id="interface"></div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        // ==================== CONFIGURAÇÃO INICIAL ====================
        const socket = io();
        const urlParams = new URLSearchParams(window.location.search);
        const modo = '${modo}';
        const codigoUrl = '${codigo}';
        
        let celularConectado = false;
        let codigoAtual = codigoUrl || null;
        let celularInfo = {};

        // ==================== FUNÇÕES UTILITÁRIAS ====================
        function getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                plataforma: navigator.platform,
                idioma: navigator.language,
                resolucao: \`\${window.screen.width}x\${window.screen.height}\`,
                conexao: navigator.connection ? navigator.connection.effectiveType : 'Desconhecido'
            };
        }

        function adicionarLog(mensagem, tipo) {
            const logDiv = document.getElementById('log-comandos');
            if (!logDiv) return;
            
            const entry = document.createElement('div');
            entry.className = \`log-entry \${tipo}\`;
            const timestamp = new Date().toLocaleTimeString();
            entry.innerHTML = \`<span class="timestamp">[\${timestamp}]</span> \${mensagem}\`;
            logDiv.insertBefore(entry, logDiv.firstChild);
            
            while (logDiv.children.length > 10) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }

        function gerarCodigoAleatorio() {
            return Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        // ==================== FUNÇÕES DE INTERFACE ====================
        function renderizarInterface() {
            if (modo === 'celular') {
                renderizarInterfaceCelular();
            } else {
                renderizarInterfaceControle();
            }
        }

        function renderizarInterfaceControle() {
            document.getElementById('interface').innerHTML = \`
                <div class="tab-container">
                    <button class="tab-button active" onclick="mudarAba('conectar')">🔌 Conectar</button>
                    <button class="tab-button" onclick="mudarAba('controles')">🎯 Controles</button>
                    <button class="tab-button" onclick="mudarAba('sensores')">📊 Sensores</button>
                </div>
                
                <div id="aba-conectar" class="tab-content active">
                    <div class="card">
                        <h2>Conectar ao Celular</h2>
                        <div class="input-group">
                            <label>Código de Conexão:</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" id="codigo-conexao" placeholder="Digite o código" maxlength="6" style="flex: 1;" value="\${codigoAtual || ''}">
                                <button onclick="gerarNovoCodigo()" class="secondary">🎲 Gerar</button>
                            </div>
                        </div>
                        <button onclick="conectarCelular()" class="primary" style="width: 100%;">Conectar</button>
                        
                        <div class="divider">OU</div>
                        
                        <div class="input-group">
                            <label>QR Code:</label>
                            <div id="qrcode-container" style="text-align: center; min-height: 200px;">
                                <p>Digite um código ou clique em "Gerar"</p>
                            </div>
                        </div>
                        
                        <div id="status-conexao" class="status" style="display: none;"></div>
                    </div>
                </div>
                
                <div id="aba-controles" class="tab-content">
                    <div class="card">
                        <h2>Controles Básicos</h2>
                        <div class="grid-2">
                            <button onclick="enviarComando('vibrar', 200)" class="control-btn">
                                <span>📳</span> Vibrar (200ms)
                            </button>
                            <button onclick="enviarComando('vibrar', 500)" class="control-btn">
                                <span>📳📳</span> Vibrar (500ms)
                            </button>
                            <button onclick="enviarComando('alerta', {mensagem: 'Olá do computador!'})" class="control-btn">
                                <span>⚠️</span> Mostrar Alerta
                            </button>
                            <button onclick="enviarComando('beep', true)" class="control-btn">
                                <span>🔊</span> Beep Sonoro
                            </button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h2>Navegação</h2>
                        <div class="input-group">
                            <label>URL:</label>
                            <input type="url" id="url-navegacao" placeholder="https://exemplo.com">
                        </div>
                        <button onclick="navegarParaUrl()" class="primary" style="width: 100%;">Ir para URL</button>
                        
                        <div class="grid-3" style="margin-top: 15px;">
                            <button onclick="enviarComando('navegar', {url: 'https://google.com'})" class="small-btn">Google</button>
                            <button onclick="enviarComando('navegar', {url: 'https://youtube.com'})" class="small-btn">YouTube</button>
                            <button onclick="enviarComando('navegar', {url: 'https://github.com'})" class="small-btn">GitHub</button>
                        </div>
                    </div>
                </div>
                
                <div id="aba-sensores" class="tab-content">
                    <div class="card">
                        <h2>Sensores do Celular</h2>
                        <button onclick="enviarComando('sensor', {tipo: 'acelerometro'})" class="primary" style="width: 100%;">
                            📱 Ler Acelerômetro
                        </button>
                        
                        <div id="dados-sensor" class="info-box" style="display: none; margin-top: 20px;">
                            <h4>Dados do Sensor:</h4>
                            <pre id="sensor-valores" style="background: white; padding: 10px; border-radius: 5px;"></pre>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📋 Log de Comandos</h3>
                    <div id="log-comandos" class="log-container">
                        <p>Aguardando comandos...</p>
                    </div>
                </div>
            \`;
            
            if (codigoAtual) {
                document.getElementById('codigo-conexao').value = codigoAtual;
                gerarQRCode(codigoAtual);
            }
        }

        function renderizarInterfaceCelular() {
            const codigo = codigoUrl || gerarCodigoAleatorio();
            if (!codigoUrl) {
                window.history.replaceState({}, '', \`/?modo=celular&codigo=\${codigo}\`);
            }
            
            celularInfo = getDeviceInfo();
            
            document.getElementById('interface').innerHTML = \`
                <div class="celular-container">
                    <div class="card">
                        <div id="conexao-status" class="status-indicator">
                            <div class="pulse"></div>
                            <span>Conectando...</span>
                        </div>
                        
                        <div class="info-box">
                            <h4>Informações do Dispositivo</h4>
                            <p><strong>Plataforma:</strong> \${celularInfo.plataforma}</p>
                            <p><strong>Resolução:</strong> \${celularInfo.resolucao}</p>
                            <p><strong>Conexão:</strong> \${celularInfo.conexao}</p>
                        </div>
                        
                        <div id="info-codigo" style="display: none;">
                            <h3 style="text-align: center;">Código de Conexão</h3>
                            <div class="codigo" id="codigo-conexao"></div>
                            <p style="text-align: center; color: #718096;">Use este código no painel de controle</p>
                        </div>
                        
                        <div id="comandos-recebidos" style="display: none; margin-top: 20px;">
                            <h4>Últimos Comandos:</h4>
                            <div id="lista-comandos"></div>
                        </div>
                    </div>
                </div>
            \`;
            
            // Registrar celular
            socket.emit('registrar-celular', {
                codigo: codigo,
                info: celularInfo
            });
        }

        // ==================== FUNÇÕES DO CONTROLE ====================
        function mudarAba(aba) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(\`aba-\${aba}\`).classList.add('active');
            event.target.classList.add('active');
        }

        function gerarNovoCodigo() {
            const codigo = gerarCodigoAleatorio();
            document.getElementById('codigo-conexao').value = codigo;
            gerarQRCode(codigo);
        }

        async function gerarQRCode(codigo) {
            try {
                const response = await fetch(\`/api/qrcode/\${codigo}\`);
                const data = await response.json();
                
                document.getElementById('qrcode-container').innerHTML = \`
                    <img src="\${data.qrCode}" alt="QR Code" style="max-width: 200px;">
                    <p><small>Escaneie com o celular</small></p>
                \`;
            } catch (error) {
                console.error('Erro ao gerar QR Code:', error);
            }
        }

        function conectarCelular() {
            const codigo = document.getElementById('codigo-conexao').value.trim().toUpperCase();
            if (!codigo) {
                alert('Digite um código de conexão');
                return;
            }
            
            codigoAtual = codigo;
            socket.emit('registrar-controle', { codigo });
            adicionarLog(\`🔄 Tentando conectar ao código: \${codigo}\`, 'info');
        }

        function enviarComando(comando, valor) {
            if (!codigoAtual) {
                alert('Conecte a um celular primeiro');
                return;
            }
            
            if (!celularConectado) {
                alert('Celular não está conectado');
                return;
            }
            
            socket.emit('comando', {
                codigo: codigoAtual,
                comando: comando,
                valor: valor
            });
            
            adicionarLog(\`📤 Comando enviado: \${comando}\`, 'info');
        }

        function navegarParaUrl() {
            const url = document.getElementById('url-navegacao').value;
            if (url) {
                enviarComando('navegar', { url });
            } else {
                alert('Digite uma URL');
            }
        }

        // ==================== SOCKET EVENTS ====================
        socket.on('connect', () => {
            if (modo === 'celular') {
                document.getElementById('conexao-status').innerHTML = \`
                    <div class="pulse" style="background: #FFC107;"></div>
                    <span>Conectado ao servidor, registrando...</span>
                \`;
            }
        });

        socket.on('celular-registrado', (data) => {
            if (data.sucesso) {
                document.getElementById('conexao-status').innerHTML = \`
                    <div class="pulse" style="background: #4CAF50;"></div>
                    <span>✅ Celular pronto para controle!</span>
                \`;
                
                document.getElementById('info-codigo').style.display = 'block';
                document.getElementById('codigo-conexao').textContent = data.codigo;
            }
        });

        socket.on('controle-registrado', (data) => {
            if (data.sucesso) {
                celularConectado = true;
                const statusDiv = document.getElementById('status-conexao');
                statusDiv.style.display = 'block';
                statusDiv.className = 'status success';
                statusDiv.innerHTML = '✅ Conectado ao celular';
                adicionarLog(\`🎮 Controle conectado ao código \${data.codigo}!\`, 'success');
            } else {
                celularConectado = false;
                const statusDiv = document.getElementById('status-conexao');
                statusDiv.style.display = 'block';
                statusDiv.className = 'status error';
                statusDiv.innerHTML = '❌ Código inválido ou celular não conectado';
                adicionarLog(\`❌ \${data.erro || 'Erro ao conectar'}\`, 'error');
            }
        });

        socket.on('celular-conectado', (data) => {
            if (data.codigo === codigoAtual) {
                adicionarLog('📱 Celular conectado!', 'success');
            }
        });

        socket.on('celular-desconectado', (data) => {
            if (data.codigo === codigoAtual) {
                celularConectado = false;
                const statusDiv = document.getElementById('status-conexao');
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    statusDiv.className = 'status error';
                    statusDiv.innerHTML = '❌ Celular desconectado';
                }
                adicionarLog('📱 Celular desconectado!', 'error');
            }
        });

        socket.on('executar-comando', (data) => {
            const { comando, valor } = data;
            
            const listaComandos = document.getElementById('lista-comandos');
            if (listaComandos) {
                const comandoDiv = document.createElement('div');
                comandoDiv.className = 'comando-recebido';
                comandoDiv.innerHTML = \`<strong>\${comando}:</strong> \${JSON.stringify(valor)}\`;
                listaComandos.insertBefore(comandoDiv, listaComandos.firstChild);
                
                if (listaComandos.children.length > 5) {
                    listaComandos.removeChild(listaComandos.lastChild);
                }
                
                document.getElementById('comandos-recebidos').style.display = 'block';
            }
            
            // Executar comando
            switch(comando) {
                case 'vibrar':
                    if (navigator.vibrate) {
                        navigator.vibrate(valor || 200);
                        socket.emit('resposta', { comando, resultado: 'Vibração executada' });
                    } else {
                        socket.emit('resposta', { comando, erro: 'Vibração não suportada' });
                    }
                    break;
                    
                case 'alerta':
                    alert(valor.mensagem || 'Comando recebido!');
                    socket.emit('resposta', { comando, resultado: 'Alerta mostrado' });
                    break;
                    
                case 'beep':
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        
                        oscillator.frequency.value = 800;
                        gainNode.gain.value = 0.1;
                        
                        oscillator.start();
                        oscillator.stop(audioCtx.currentTime + 0.1);
                        
                        socket.emit('resposta', { comando, resultado: 'Beep executado' });
                    } catch (e) {
                        socket.emit('resposta', { comando, erro: 'Erro ao executar beep' });
                    }
                    break;
                    
                case 'sensor':
                    if (valor.tipo === 'acelerometro' && window.DeviceOrientationEvent) {
                        window.addEventListener('deviceorientation', function handler(e) {
                            socket.emit('resposta', {
                                comando: 'dados-sensor',
                                resultado: {
                                    alpha: e.alpha,
                                    beta: e.beta,
                                    gamma: e.gamma
                                }
                            });
                            window.removeEventListener('deviceorientation', handler);
                        }, { once: true });
                    }
                    break;
                    
                case 'navegar':
                    if (valor.url) {
                        window.location.href = valor.url;
                    }
                    break;
                    
                default:
                    socket.emit('resposta', { 
                        comando, 
                        resultado: 'Comando recebido' 
                    });
            }
        });

        socket.on('resposta-controle', (data) => {
            if (data.erro) {
                adicionarLog(\`❌ Erro no comando "\${data.comando}": \${data.erro}\`, 'error');
            } else {
                adicionarLog(\`✅ Resposta de "\${data.comando}": \${JSON.stringify(data.resultado)}\`, 'success');
                
                if (data.comando === 'dados-sensor') {
                    document.getElementById('dados-sensor').style.display = 'block';
                    document.getElementById('sensor-valores').textContent = 
                        JSON.stringify(data.resultado, null, 2);
                }
            }
        });

        socket.on('disconnect', () => {
            if (modo === 'celular') {
                document.getElementById('conexao-status').innerHTML = \`
                    <div class="pulse" style="background: #f44336;"></div>
                    <span>❌ Desconectado do servidor</span>
                \`;
            }
        });

        // ==================== INICIALIZAÇÃO ====================
        renderizarInterface();

        // Event listeners
        if (modo !== 'celular') {
            document.getElementById('codigo-conexao')?.addEventListener('input', (e) => {
                const codigo = e.target.value.toUpperCase();
                if (codigo.length === 6) {
                    gerarQRCode(codigo);
                }
            });
        }
    </script>
</body>
</html>
    `);
});

// API para gerar QR Code
app.get('/api/qrcode/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo;
        const baseUrl = process.env.RAILWAY_STATIC_URL || `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/?modo=celular&codigo=${codigo}`;
        const qrCode = await QRCode.toDataURL(url);
        res.json({ qrCode, url });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    socket.on('registrar-celular', (data) => {
        const { codigo, info } = data;
        
        dispositivos.set(socket.id, {
            tipo: 'celular',
            codigo: codigo,
            info: info,
            conectadoEm: new Date()
        });
        
        controles.set(codigo, socket.id);
        
        console.log(\`Celular registrado com código: \${codigo}\`);
        
        socket.emit('celular-registrado', { 
            sucesso: true, 
            codigo: codigo 
        });
        
        socket.broadcast.emit('celular-conectado', { codigo });
    });

    socket.on('registrar-controle', (data) => {
        const { codigo } = data;
        const celularSocketId = controles.get(codigo);
        
        if (celularSocketId) {
            dispositivos.set(socket.id, {
                tipo: 'controle',
                codigo: codigo,
                conectadoEm: new Date()
            });
            
            socket.emit('controle-registrado', { 
                sucesso: true, 
                codigo: codigo 
            });
            
            console.log(\`Controle registrado para código: \${codigo}\`);
        } else {
            socket.emit('controle-registrado', { 
                sucesso: false, 
                erro: 'Código inválido ou celular não conectado' 
            });
        }
    });

    socket.on('comando', (data) => {
        const { codigo, comando, valor } = data;
        const celularSocketId = controles.get(codigo);
        
        if (celularSocketId) {
            io.to(celularSocketId).emit('executar-comando', {
                comando,
                valor,
                origem: socket.id
            });
        }
    });

    socket.on('resposta', (data) => {
        const { comando, resultado, erro } = data;
        
        const dispositivoInfo = dispositivos.get(socket.id);
        if (dispositivoInfo) {
            socket.broadcast.emit('resposta-controle', {
                comando,
                resultado,
                erro,
                codigo: dispositivoInfo.codigo
            });
        }
    });

    socket.on('disconnect', () => {
        const dispositivoInfo = dispositivos.get(socket.id);
        
        if (dispositivoInfo) {
            if (dispositivoInfo.tipo === 'celular') {
                controles.delete(dispositivoInfo.codigo);
                socket.broadcast.emit('celular-desconectado', {
                    codigo: dispositivoInfo.codigo
                });
                console.log(\`Celular desconectado: código \${dispositivoInfo.codigo}\`);
            }
            dispositivos.delete(socket.id);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 Servidor rodando na porta \${PORT}\`);
    console.log(\`📱 Acesse: http://localhost:\${PORT} (local)\`);
    if (process.env.RAILWAY_STATIC_URL) {
        console.log(\`🌍 Railway URL: \${process.env.RAILWAY_STATIC_URL}\`);
    }
});