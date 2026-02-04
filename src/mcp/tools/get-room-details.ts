/**
 * Tool MCP : Détails d'une chambre
 */

import { z } from 'zod';
import { roomService } from '../../services/room.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const getRoomDetailsSchema = z.object({
    roomTypeId: z.number().describe(`ID du type de chambre`),
});

export type GetRoomDetailsParams = z.infer<typeof getRoomDetailsSchema>;

export const getRoomDetailsDescription = `Récupère les détails d'un type de chambre.

🎯 **Quand utiliser** :
- "Détails de la chambre 19"
- "Parlez-moi de la Deluxe"
- "Équipements de cette chambre"

⚠️ **Prérequis** : Obtenir l'ID via liste ou disponibilités`;

export async function handleGetRoomDetails(
    params: GetRoomDetailsParams
): Promise<McpToolResult> {
    try {
        const roomType = await roomService.getRoomDetails(params.roomTypeId);
        const response = roomService.formatRoomDetails(roomType);
        return mcpSuccess(response);
    } catch (error: any) {
        return mcpError(error.message);
    }
}