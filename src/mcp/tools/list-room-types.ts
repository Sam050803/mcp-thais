/**
 * Tool MCP : Lister les types de chambres
 */

import { roomService } from '../../services/room.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const listRoomTypesDescription = `Liste tous les types de chambres de l'hôtel.

🎯 **Quand utiliser** :
- "Quels types de chambres avez-vous ?"
- "Montrez-moi les chambres disponibles"
- "Qu'est-ce que vous proposez ?"

📊 **Retourne** : Liste des types avec capacité et description`;

export async function handleListRoomTypes(): Promise<McpToolResult> {
  try {
    const roomTypes = await roomService.listRoomTypes();
    const response = roomService.formatRoomTypesList(roomTypes);
    return mcpSuccess(response);
  } catch (error: any) {
    return mcpError(error.message);
  }
}