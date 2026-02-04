#!/usr/bin/env node

/**
 * Point d'entrée du serveur MCP Thaïs
 * Mode HTTP Streamable pour Claude Desktop via mcp-remote
 */

import crypto from 'node:crypto';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './mcp/server.js';
import { thaisClient } from './thais/thais.client.js';

const app = express();
const PORT = process.env.PORT || 3000;

const log = (msg: string) => {
    console.log(`[${new Date().toISOString()}] ${msg}`);
};

// Configuration CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id'],
    exposedHeaders: ['Mcp-Session-Id']
}));

// Map pour stocker les transports par session
const transports = new Map<string, StreamableHTTPServerTransport>();

// Créer un nouveau transport et serveur MCP pour chaque session
async function createTransportAndServer(): Promise<StreamableHTTPServerTransport> {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID()
    });
    
    const server = createMcpServer();
    await server.connect(transport);
    
    return transport;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'MCP Thaïs Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Page d'information
app.get('/info', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MCP Thaïs Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #2563eb; }
        .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; }
        .info { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
        code { background: #1f2937; color: #10b981; padding: 2px 6px; border-radius: 3px; }
        pre { background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🏨 MCP Thaïs Server</h1>
    <div class="status">✅ Serveur actif</div>
    
    <div class="info">
        <h2>ℹ️ Information</h2>
        <p>Le serveur MCP fonctionne sur <code>http://localhost:${PORT}/mcp</code></p>
    </div>
    
    <h2>📋 Configuration Claude Desktop</h2>
    <p>Éditez <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> :</p>
    <pre>{
  "mcpServers": {
    "thais": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:${PORT}/mcp", "--allow-http"]
    }
  }
}</pre>
    
    <h2>🛠️ Outils disponibles</h2>
    <ul>
        <li><code>thais_check_availability</code> - Vérifier les disponibilités</li>
        <li><code>thais_list_room_types</code> - Lister les types de chambres</li>
        <li><code>thais_get_room_details</code> - Détails d'une chambre</li>
        <li><code>thais_create_e_reservation</code> - Créer une e-réservation</li>
    </ul>
    
    <h2>🔗 Liens utiles</h2>
    <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="https://demo.thais-hotel.com/hub/doc/index.html" target="_blank">API Thaïs Documentation</a></li>
    </ul>
</body>
</html>
    `);
});

// Rediriger la racine vers /info
app.get('/', (req, res) => {
    res.redirect('/info');
});

// Endpoint MCP principal - SANS middleware express.json()
// Le SDK MCP gère lui-même le parsing du body
app.all('/mcp', async (req: Request, res: Response) => {
    log(`📡 MCP ${req.method} - Session: ${req.headers['mcp-session-id'] || 'nouvelle'}`);
    
    try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        
        // POST sans session = nouvelle connexion, créer transport
        if (req.method === 'POST' && !sessionId) {
            log('🆕 Nouvelle session MCP');
            
            // Vérifier API
            const isConnected = await thaisClient.testConnection();
            if (!isConnected) {
                log('❌ API Thaïs indisponible');
                res.status(503).json({ 
                    jsonrpc: '2.0',
                    error: { code: -32000, message: 'API Thaïs indisponible' },
                    id: null
                });
                return;
            }
            log('✅ API OK');
            
            const transport = await createTransportAndServer();
            await transport.handleRequest(req, res);
            
            const newSessionId = res.getHeader('mcp-session-id') as string;
            if (newSessionId) {
                transports.set(newSessionId, transport);
                log(`✅ Session créée: ${newSessionId.substring(0, 8)}...`);
            }
            return;
        }
        
        // Requête avec session existante
        if (sessionId) {
            let transport = transports.get(sessionId);
            
            if (!transport) {
                log(`🆕 Nouvelle session pour ID: ${sessionId.substring(0, 8)}...`);
                transport = await createTransportAndServer();
                transports.set(sessionId, transport);
            }
            
            if (req.method === 'DELETE') {
                transports.delete(sessionId);
                log(`🗑️ Session fermée: ${sessionId.substring(0, 8)}...`);
            }
            
            await transport.handleRequest(req, res);
            return;
        }
        
        // GET sans session = SSE
        if (req.method === 'GET') {
            log('🆕 Nouvelle connexion SSE');
            const transport = await createTransportAndServer();
            await transport.handleRequest(req, res);
            
            const newSessionId = res.getHeader('mcp-session-id') as string;
            if (newSessionId) {
                transports.set(newSessionId, transport);
            }
            return;
        }
        
        res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Invalid Request' },
            id: null
        });
        
    } catch (error: any) {
        log(`❌ Erreur: ${error.message}`);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: error.message },
                id: null
            });
        }
    }
});

async function startServer() {
    try {
        log('🚀 Démarrage du serveur MCP Thaïs...');
        
        const isConnected = await thaisClient.testConnection();
        if (!isConnected) {
            log('⚠️ API Thaïs non disponible au démarrage');
        } else {
            log('✅ Connexion API Thaïs OK');
        }

        app.listen(PORT, () => {
            log(`✨ Serveur démarré: http://localhost:${PORT}`);
            log(`📡 Endpoint MCP: http://localhost:${PORT}/mcp`);
            log(`ℹ️ Infos: http://localhost:${PORT}/info`);
            log('');
            log('📋 Configuration Claude Desktop:');
            log(JSON.stringify({
                mcpServers: {
                    thais: {
                        command: 'npx',
                        args: ['-y', 'mcp-remote', `http://localhost:${PORT}/mcp`, '--allow-http']
                    }
                }
            }, null, 2));
        });

    } catch (error: any) {
        log(`❌ Erreur: ${error.message}`);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    log('👋 Arrêt...');
    transports.clear();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('👋 Arrêt...');
    transports.clear();
    process.exit(0);
});

// Démarrage du serveur
startServer();
