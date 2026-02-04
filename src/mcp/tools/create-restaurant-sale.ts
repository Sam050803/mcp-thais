/**
 * Tool MCP : Créer une vente restaurant
 */

import { z } from 'zod';
import { restaurantService } from '../../services/restaurant.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const createRestaurantSaleSchema = z.object({
    room_number: z.string().describe(`Numéro de chambre pour facturation`),
    customer_name: z.string().optional().describe(`Nom du client (optionnel)`),
    items: z.array(z.object({
        label: z.string().describe(`Nom de l'article`),
        quantity: z.number().min(1).describe(`Quantité`),
        price: z.number().min(0).describe(`Prix unitaire en €`),
        category: z.string().optional().describe(`Catégorie (Entrée, Plat, etc.)`)
    })).describe(`Articles commandés`),
    service_time: z.enum(['breakfast', 'lunch', 'dinner', 'room_service']).default('dinner').describe(`Type de service`),
    special_requests: z.string().optional().describe(`Demandes spéciales`)
});

export type CreateRestaurantSaleParams = z.infer<typeof createRestaurantSaleSchema>;

export const createRestaurantSaleDescription = `Enregistre une vente restaurant avec facturation automatique sur la chambre.

Permet d'ajouter des consommations restaurant, room service ou bar directement sur la note client.`;

export async function handleCreateRestaurantSale(
    params: CreateRestaurantSaleParams
): Promise<McpToolResult> {
    try {
        const result = await restaurantService.createRestaurantSale(params);
        return mcpSuccess(result);
    } catch (error: any) {
        return mcpError(error.message);
    }
}