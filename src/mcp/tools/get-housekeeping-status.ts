/**
 * Tool MCP : État du ménage
 */

import { z } from 'zod';
import { housekeepingService } from '../../services/housekeeping.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const getHousekeepingStatusSchema = z.object({
    floor: z.number().optional().describe(`Étage spécifique (ex: 1, 2, 3...)`),
    room_number: z.string().optional().describe(`Numéro de chambre spécifique`),
    status_filter: z.enum(['dirty', 'cleaning', 'clean', 'inspected', 'maintenance', 'ooo']).optional().describe(`Filtrer par état`),
    date: z.string().optional().describe(`Date (YYYY-MM-DD), défaut aujourd'hui`),
    detailed: z.boolean().default(true).describe(`Affichage détaillé`)
});

export type GetHousekeepingStatusParams = z.infer<typeof getHousekeepingStatusSchema>;

export const getHousekeepingStatusDescription = `Affiche l'état temps réel du ménage des chambres.

Permet de suivre l'avancement du nettoyage par étage ou chambre avec statistiques.`;

export async function handleGetHousekeepingStatus(
    params: GetHousekeepingStatusParams
): Promise<McpToolResult> {
    try {
        const result = await housekeepingService.getHousekeepingStatus(params);
        return mcpSuccess(result);
    } catch (error: any) {
        return mcpError(error.message);
    }
}