#!/usr/bin/env node

/**
 * Point d'entrée du serveur MCP Thaïs
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, logConfig } from './config.js';
import { createMcpServer } from './mcp/server.js';
import { thaisClient } from './thais/thais.client.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('Main');

async function main(): Promise<void> {
    try {
        if (config.debug) logConfig();

        logger.info('Test de connexion API Thaïs...');
        const isConnected = await thaisClient.testConnection();
        if (!isConnected) throw new Error('Connexion API impossible');
        logger.success('Connexion API OK');

        const server = createMcpServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);

        logger.success('🚀 Serveur MCP Thaïs démarré !');

    } catch (error: any) {
        logger.error('Erreur fatale', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main();