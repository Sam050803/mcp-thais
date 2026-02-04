/**
 * Tool MCP : Rapport de ventes
 */

import { z } from 'zod';
import { analyticsService } from '../../services/analytics.service.js';
import type { McpToolResult } from '../../types/mcp.types.js';
import { mcpSuccess, mcpError } from '../../types/mcp.types.js';

export const getSalesReportSchema = z.object({
    period: z.enum(['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'custom']).default('today').describe(`Période du rapport`),
    start_date: z.string().optional().describe(`Date début (YYYY-MM-DD) pour période custom`),
    end_date: z.string().optional().describe(`Date fin (YYYY-MM-DD) pour période custom`),
    report_type: z.enum(['summary', 'detailed', 'by_category', 'trends']).default('summary').describe(`Type de rapport`),
    include_forecasting: z.boolean().default(true).describe(`Inclure les prédictions`),
    currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR').describe(`Devise d'affichage`)
});

export type GetSalesReportParams = z.infer<typeof getSalesReportSchema>;

export const getSalesReportDescription = `Génère des rapports de ventes et analytics business.

Affiche les KPIs de revenue management avec prédictions et comparatifs.`;

export async function handleGetSalesReport(
    params: GetSalesReportParams
): Promise<McpToolResult> {
    try {
        const result = await analyticsService.generateSalesReport(params);
        return mcpSuccess(result);
    } catch (error: any) {
        return mcpError(error.message);
    }
}