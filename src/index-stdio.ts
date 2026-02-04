#!/usr/bin/env node

/**
 * Point d'entrée du serveur MCP Thaïs - Transport STDIO
 * Pour connexion avec Claude Desktop
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp/server.js';

async function main() {
    // Créer le serveur MCP
    const server = createMcpServer();
    
    // Créer le transport STDIO (pour Claude Desktop)
    const transport = new StdioServerTransport();
    
    // Connecter le serveur au transport
    await server.connect(transport);
    
    // Le serveur est maintenant prêt à recevoir des requêtes via stdin/stdout
    // Aucun log ici car stdout est utilisé pour la communication MCP
}

main().catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
});
