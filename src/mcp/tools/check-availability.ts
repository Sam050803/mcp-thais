/**
 * Tool MCP : Vérifier les disponibilités
 */

import { z } from 'zod';
import { availabilityService } from '../../services/availability.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const checkAvailabilitySchema = z.object({
    checkIn: z.string().describe(
        `Date d'arrivée (YYYY-MM-DD, "6 février", "début mars", "demain")`
    ),
    checkOut: z.string().describe(`Date de départ (mêmes formats)`),
    adults: z.number().min(1).max(10).describe(`Nombre d'adultes (1-10)`),
    children: z.number().min(0).max(10).default(0).describe(`Nombre d'enfants (0-10)`),
});

export type CheckAvailabilityParams = z.infer<typeof checkAvailabilitySchema>;

export const checkAvailabilityDescription = `Vérifie la disponibilité des chambres d'hôtel pour une période donnée.

🎯 **Question test principale** :
- "Y a t-il une chambre disponible pour 2 personnes du 6 au 12 février ?"

🔍 **Autres exemples** :
- "Disponibilités pour 2 personnes début mars ?"
- "Chambres libres pour demain ?"
- "Du 15 au 20 juin, chambre pour 4"

📅 **Formats de dates** : YYYY-MM-DD, "6 février", "début/mi/fin mars", "demain", "dans 3 jours"

📊 **Retourne** : Liste des chambres avec tarifs complets`;

export async function handleCheckAvailability(
    params: CheckAvailabilityParams
): Promise<McpToolResult> {
    try {
        const { normalized, availabilities } = await availabilityService.search(params);
        const response = availabilityService.formatResponse(normalized, availabilities);
        return mcpSuccess(response);
    } catch (error: any) {
        return mcpError(error.message);
    }
}