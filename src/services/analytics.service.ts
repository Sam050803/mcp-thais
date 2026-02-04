import { ThaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';

export interface GetSalesReportParams {
    period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom';
    start_date?: string;
    end_date?: string;
    report_type?: 'summary' | 'detailed' | 'by_category' | 'trends';
    include_forecasting?: boolean;
    currency?: 'EUR' | 'USD' | 'GBP';
}

export class AnalyticsService {
    private thaisClient: ThaisClient;
    private logger: Logger;

    constructor() {
        this.thaisClient = new ThaisClient();
        this.logger = new Logger('AnalyticsService');
    }

    async generateSalesReport(params: GetSalesReportParams): Promise<string> {
        this.logger.info(`Génération rapport ventes ${params.period} - type: ${params.report_type}`);

        try {
            const dateRange = this.calculateDateRange(params);
            const salesData = this.generateSimulatedData(params);
            
            return this.formatReport(salesData, params, dateRange);

        } catch (error: any) {
            this.logger.error('Erreur génération rapport:', error.message);
            throw new Error(`Échec de la génération: ${error.message}`);
        }
    }

    private calculateDateRange(params: GetSalesReportParams): { start: string; end: string; label: string } {
        const today = new Date();
        
        switch (params.period) {
            case 'yesterday':
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                return {
                    start: yesterday.toISOString().split('T')[0],
                    end: yesterday.toISOString().split('T')[0],
                    label: 'Hier'
                };
            case 'this_week':
                const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
                return {
                    start: weekStart.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                    label: 'Cette semaine'
                };
            default:
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                    label: 'Aujourd\'hui'
                };
        }
    }

    private generateSimulatedData(params: GetSalesReportParams): any {
        const baseRevenue = params.period === 'today' ? 15000 : 45000;
        const variance = 0.8 + Math.random() * 0.4;
        
        const total = baseRevenue * variance;
        return {
            total_revenue: total,
            accommodation_revenue: total * 0.70,
            restaurant_revenue: total * 0.20,
            spa_revenue: total * 0.07,
            other_revenue: total * 0.03,
            occupancy_rate: 65 + Math.random() * 30,
            revpar: total * 0.60,
            average_daily_rate: 120 + Math.random() * 80,
            transactions_count: Math.floor(total / 150),
            guests_count: Math.floor(total / 200)
        };
    }

    private formatReport(data: any, params: GetSalesReportParams, dateRange: any): string {
        const currency = params.currency || 'EUR';
        const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
        
        let result = `**Rapport de Ventes - ${dateRange.label}**\n`;
        result += `${dateRange.start}${dateRange.start !== dateRange.end ? ` → ${dateRange.end}` : ''}\n\n`;

        result += `**Résultats Financiers**\n`;
        result += `Revenue Total: ${data.total_revenue.toLocaleString()} ${symbol}\n`;
        result += `Panier Moyen: ${(data.total_revenue / data.transactions_count).toFixed(0)} ${symbol}\n`;
        result += `Taux d'Occupation: ${data.occupancy_rate.toFixed(1)}%\n`;
        result += `RevPAR: ${data.revpar.toFixed(0)} ${symbol}\n`;
        result += `Prix Moyen Nuit: ${data.average_daily_rate.toFixed(0)} ${symbol}\n\n`;

        result += `**Activité Client**\n`;
        result += `Clients accueillis: ${data.guests_count}\n`;
        result += `Transactions: ${data.transactions_count}\n\n`;

        if (params.report_type === 'by_category') {
            result += this.formatCategoryBreakdown(data, symbol);
        }

        if (params.include_forecasting) {
            result += this.formatForecasting(data, symbol);
        }

        return result;
    }

    private formatCategoryBreakdown(data: any, symbol: string): string {
        let breakdown = `**Répartition par Catégorie**\n`;
        
        const categories = [
            { name: 'Hébergement', value: data.accommodation_revenue },
            { name: 'Restaurant', value: data.restaurant_revenue },
            { name: 'Spa & Wellness', value: data.spa_revenue },
            { name: 'Autres services', value: data.other_revenue }
        ];

        categories.forEach(cat => {
            const percentage = ((cat.value / data.total_revenue) * 100).toFixed(1);
            breakdown += `${cat.name}: ${cat.value.toLocaleString()} ${symbol} (${percentage}%)\n`;
        });

        return breakdown + '\n';
    }

    private formatForecasting(data: any, symbol: string): string {
        const growth = -5 + Math.random() * 20;
        const forecast = data.total_revenue * (1 + (growth / 100));
        
        let trends = `**Prédictions (7 jours)**\n`;
        trends += `Revenue prévu: ${forecast.toLocaleString()} ${symbol}\n`;
        trends += `Croissance estimée: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%\n`;
        trends += `Occupation prévue: ${(data.occupancy_rate + Math.random() * 10 - 5).toFixed(1)}%\n`;

        return trends;
    }
}

export const analyticsService = new AnalyticsService();