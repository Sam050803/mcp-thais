/**
 * Tool MCP : Créer une demande de service
 */

import { z } from 'zod';
import { serviceRequestService } from '../../services/service-request.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const createServiceRequestSchema = z.object({
    room_number: z.string().describe(`Numéro de chambre`),
    service_type: z.enum(['maintenance', 'housekeeping', 'concierge', 'room_service', 'spa', 'technical', 'other']).describe(`Type de service demandé`),
    description: z.string().describe(`Description du problème ou demande`),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal').describe(`Niveau de priorité`),
    customer_name: z.string().optional().describe(`Nom du client`),
    phone_number: z.string().optional().describe(`Numéro de téléphone`),
    requested_time: z.string().optional().describe(`Créneau souhaité`)
});

export type CreateServiceRequestParams = z.infer<typeof createServiceRequestSchema>;

export const createServiceRequestDescription = `Enregistre une demande de service client avec priorisation.

Permet de créer des tickets d'intervention pour maintenance, ménage, conciergerie, etc.`;

export async function handleCreateServiceRequest(
    params: CreateServiceRequestParams
): Promise<McpToolResult> {
    try {
        const result = await serviceRequestService.createServiceRequest(params);
        return mcpSuccess(result);
    } catch (error: any) {
        return mcpError(error.message);
    }
}