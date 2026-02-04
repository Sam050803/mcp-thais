/**
 * Tool MCP : Recherche de clients
 */

import { z } from 'zod';
import { clientService } from '../../services/client.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const searchClientsSchema = z.object({
    query: z.string().optional().describe(`Recherche textuelle (nom, email)`),
    email: z.string().optional().describe(`Recherche par email exact`),
    phone: z.string().optional().describe(`Recherche par téléphone`),
    vip_only: z.boolean().default(false).describe(`Clients VIP uniquement`),
    limit: z.number().min(1).max(50).default(10).describe(`Limite résultats (1-50)`),
});

export type SearchClientsParams = z.infer<typeof searchClientsSchema>;

export const searchClientsDescription = `Recherche de clients dans la base CRM avec historique de séjours.

Permet de trouver un client par nom, email ou téléphone et affiche son historique complet.`;

export async function handleSearchClients(
    params: SearchClientsParams
): Promise<McpToolResult> {
    try {
        const result = await clientService.searchClients(params);
        return mcpSuccess(result);
    } catch (error: any) {
        return mcpError(error.message);
    }
}