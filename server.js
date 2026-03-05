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
    <title>📱 Controle Remoto</title>
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
            max-width: 800px;
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
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
        }
        
        input:focus {
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
        
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
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
        
        .control-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            font-size: 18px;
            width: 100%;
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
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            margin-top: 20px;
        }
        
        .info-box {
            background: #ebf4ff;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        @media (max-width: 600px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${modo === 'celular' ? '📱 Modo Celular' : '🎮 Painel de Controle'}</h1>
        
        ${modo === 'celular' ? `
        <div class="card">
            <h2>Conectado como Celular</h2>
            <div class="codigo">${codigo}</div>
            <p style="text-align: center; color: #718096;">Use este código no painel de controle</p>
            <div id="status-celular" class="status" style="display: none;"></div>
            <div id="comandos-recebidos" class="log-container" style="display: none;">
                <h3 style="margin-bottom: 10px;">Comandos Recebidos:</h3>
                <div id="lista-comandos"></div>
            </div>
        </div>
        ` : `
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
            <h2>Controles</h2>
            <div class="grid-2">
                <button class="control-btn" onclick="enviarComando('vibrar', 200)">📳 Vibrar</button>
                <button class="control-btn" onclick="enviarComando('vibrar', 500)">📳 Vibrar Forte</button>
                <button class="control-btn" onclick="enviarComando('alerta', {msg: 'Olá!'})">⚠️ Alerta</button>
                <button class="control-btn" onclick="enviarComando('beep')">🔊 Beep</button>
            </div>
        </div>
        
        <div class="card" id="log-card" style="display: none;">
            <h3>Log de Comandos</h3>
            <div id="log-comandos" class="log-container"></div>
        </div>
        `}
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const modo = '${modo}';
        const codigoUrl = '${codigo}';
        let celularConectado = false;
        let codigoAtual = codigoUrl;

        // Funções auxiliares
        function adicionarLog(mensagem, tipo = 'info') {
            const logDiv = document.getElementById('log-comandos');
            if (!logDiv) return;
            
            const entry = document.createElement('div');
            entry.style.padding = '5px 0';
            entry.style.borderBottom = '1px solid #e2e8f0';
            entry.style.color = tipo === 'erro' ? '#742a2a' : '#22543d';
            entry.innerHTML = \`[${new Date().toLocaleTimeString()}] \${mensagem}\`;
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

        // Event Listeners
        if (modo === 'celular') {
            // Registrar celular
            socket.emit('registrar-celular', { 
                codigo: codigoUrl,
                info: { plataforma: navigator.platform }
            });
            
            socket.on('celular-registrado', () => {
                const status = document.getElementById('status-celular');
                status.style.display = 'block';
                status.className = 'status success';
                status.innerHTML = '✅ Conectado ao servidor! Aguardando comandos...';
            });
            
            socket.on('executar-comando', (data) => {
                const { comando, valor } = data;
                
                // Mostrar comando
                const lista = document.getElementById('lista-comandos');
                const comandoDiv = document.createElement('div');
                comandoDiv.style.background = '#4CAF50';
                comandoDiv.style.color = 'white';
                comandoDiv.style.padding = '10px';
                comandoDiv.style.margin = '5px 0';
                comandoDiv.style.borderRadius = '5px';
                comandoDiv.innerHTML = \`<strong>\${comando}:</strong> \${JSON.stringify(valor)}\`;
                lista.insertBefore(comandoDiv, lista.firstChild);
                
                document.getElementById('comandos-recebidos').style.display = 'block';
                
                // Executar comando
                let resposta = { comando };
                
                switch(comando) {
                    case 'vibrar':
                        if (navigator.vibrate) {
                            navigator.vibrate(valor);
                            resposta.resultado = 'Vibração executada';
                        } else {
                            resposta.erro = 'Vibração não suportada';
                        }
                        break;
                        
                    case 'alerta':
                        alert(valor.msg || 'Comando recebido!');
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
                }
                
                socket.emit('resposta', resposta);
            });
            
        } else {
            // Modo controle
            const inputCodigo = document.getElementById('codigo');
            
            inputCodigo.addEventListener('input', (e) => {
                const codigo = e.target.value.toUpperCase();
                if (codigo.length === 6) {
                    gerarQRCode(codigo);
                }
            });
            
            window.conectar = function() {
                const codigo = inputCodigo.value.toUpperCase();
                if (codigo.length === 6) {
                    codigoAtual = codigo;
                    socket.emit('registrar-controle', { codigo });
                    adicionarLog('Conectando...', 'info');
                } else {
                    alert('Digite um código de 6 dígitos');
                }
            };
            
            window.enviarComando = function(comando, valor) {
                if (!celularConectado) {
                    alert('Conecte a um celular primeiro');
                    return;
                }
                
                socket.emit('comando', {
                    codigo: codigoAtual,
                    comando: comando,
                    valor: valor
                });
                
                adicionarLog(\`Comando enviado: \${comando}\`);
            };
            
            socket.on('controle-registrado', (data) => {
                const status = document.getElementById('status-conexao');
                
                if (data.sucesso) {
                    celularConectado = true;
                    status.style.display = 'block';
                    status.className = 'status success';
                    status.innerHTML = '✅ Conectado ao celular!';
                    
                    document.getElementById('controles-card').style.display = 'block';
                    document.getElementById('log-card').style.display = 'block';
                    adicionarLog('Conectado com sucesso!');
                } else {
                    celularConectado = false;
                    status.style.display = 'block';
                    status.className = 'status error';
                    status.innerHTML = '❌ Celular não encontrado';
                }
            });
            
            socket.on('resposta-controle', (data) => {
                if (data.erro) {
                    adicionarLog(\`Erro: \${data.erro}\`, 'erro');
                } else {
                    adicionarLog(\`Resposta: \${data.comando} executado\`);
                }
            });
            
            socket.on('celular-desconectado', () => {
                celularConectado = false;
                const status = document.getElementById('status-conexao');
                status.style.display = 'block';
                status.className = 'status error';
                status.innerHTML = '❌ Celular desconectado';
                adicionarLog('Celular desconectado', 'erro');
            });
        }
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
