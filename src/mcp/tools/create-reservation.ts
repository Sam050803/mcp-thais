/**
 * Tool MCP : Créer une e-réservation
 */

import { z } from 'zod';
import { reservationService } from '../../services/reservation.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const createReservationSchema = z.object({
    checkIn: z.string().describe(`Date d'arrivée`),
    checkOut: z.string().describe(`Date de départ`),
    roomTypeId: z.number().describe(`ID du type de chambre`),
    rateId: z.number().default(1).describe(`ID du tarif (défaut: 1)`),
    adults: z.number().min(1).describe(`Nombre d'adultes`),
    children: z.number().min(0).default(0).describe(`Nombre d'enfants`),
    guestFirstName: z.string().describe(`Prénom du client`),
    guestLastName: z.string().describe(`Nom du client`),
    guestEmail: z.string().email().describe(`Email du client`),
    guestPhone: z.string().optional().describe(`Téléphone (optionnel)`),
});

export type CreateReservationParams = z.infer<typeof createReservationSchema>;

export const createReservationDescription = `Crée une pré-réservation.

⚠️ **IMPORTANT** : Demander confirmation AVANT de réserver !

🎯 **Quand utiliser** :
- "Je confirme la réservation"
- "Oui, réservez pour moi"
- Après avoir collecté : dates, chambre, nom, email

📊 **Retourne** : Numéro de réservation et récapitulatif`;

export async function handleCreateReservation(
    params: CreateReservationParams
): Promise<McpToolResult> {
    try {
        const reservation = await reservationService.create(params);
        const response = reservationService.formatCreationResponse(reservation, params);
        return mcpSuccess(response);
    } catch (error: any) {
        return mcpError(error.message);
    }
}