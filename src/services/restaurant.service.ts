import { ThaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';

export interface CreateRestaurantSaleParams {
    room_number: string;
    customer_name?: string;
    items: {
        label: string;
        quantity: number;
        price: number;
        category?: string;
    }[];
    service_time?: 'breakfast' | 'lunch' | 'dinner' | 'room_service';
    special_requests?: string;
}

export class RestaurantService {
    private thaisClient: ThaisClient;
    private logger: Logger;

    constructor() {
        this.thaisClient = new ThaisClient();
        this.logger = new Logger('RestaurantService');
    }

    async createRestaurantSale(params: CreateRestaurantSaleParams): Promise<string> {
        this.logger.info(`Création vente restaurant pour chambre ${params.room_number}`);

        try {
            const saleData = this.generateSaleData(params);
            const saleId = this.generateSaleId();
            
            return this.formatSaleConfirmation(saleId, saleData, params);

        } catch (error: any) {
            this.logger.error('Erreur création vente restaurant:', error.message);
            throw new Error(`Échec de la création: ${error.message}`);
        }
    }

    private generateSaleData(params: CreateRestaurantSaleParams): any {
        const items = params.items || [];
        let subtotal = 0;
        
        items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        const serviceCharge = subtotal * 0.12;
        const tax = subtotal * 0.10;
        const finalTotal = subtotal + serviceCharge + tax;

        return {
            items,
            subtotal,
            serviceCharge,
            tax,
            finalTotal,
            service_time: params.service_time || 'dinner'
        };
    }

    private generateSaleId(): string {
        return `REST-${Date.now().toString().slice(-6)}`;
    }

    private formatSaleConfirmation(saleId: string, saleData: any, params: CreateRestaurantSaleParams): string {
        let result = `**Vente Restaurant Confirmée**\n`;
        result += `ID: ${saleId} | Chambre: ${params.room_number}\n`;
        
        if (params.customer_name) {
            result += `Client: ${params.customer_name}\n`;
        }
        
        result += `Service: ${this.getServiceTimeLabel(saleData.service_time)}\n`;
        
        result += `\n**Articles commandés:**\n`;
        saleData.items.forEach((item: any) => {
            result += `- ${item.label} x${item.quantity} (${item.price.toFixed(2)}€/u)\n`;
            if (item.category) {
                result += `  Catégorie: ${item.category}\n`;
            }
        });

        if (params.special_requests) {
            result += `\n**Demandes spéciales:** ${params.special_requests}\n`;
        }

        result += `\n**Facturation:**\n`;
        result += `Sous-total: ${saleData.subtotal.toFixed(2)}€\n`;
        result += `Service (12%): ${saleData.serviceCharge.toFixed(2)}€\n`;
        result += `TVA (10%): ${saleData.tax.toFixed(2)}€\n`;
        result += `**Total: ${saleData.finalTotal.toFixed(2)}€**\n`;
        result += `Facturation: Chambre ${params.room_number}\n`;

        return result;
    }

    private getServiceTimeLabel(serviceTime: string): string {
        const labels: Record<string, string> = {
            breakfast: 'Petit-déjeuner',
            lunch: 'Déjeuner',
            dinner: 'Dîner',
            room_service: 'Service en chambre'
        };
        return labels[serviceTime] || serviceTime;
    }
}

export const restaurantService = new RestaurantService();