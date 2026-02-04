import { ThaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';

export interface SearchClientsParams {
    query?: string;
    email?: string;
    phone?: string;
    name?: string;
    loyalty_level?: 'bronze' | 'silver' | 'gold' | 'platinum';
    recent_stay?: boolean;
    limit?: number;
}

export class ClientService {
    private thaisClient: ThaisClient;
    private logger: Logger;

    constructor() {
        this.thaisClient = new ThaisClient();
        this.logger = new Logger('ClientService');
    }

    async searchClients(params: SearchClientsParams): Promise<string> {
        this.logger.info(`Recherche clients avec critères: ${JSON.stringify(params)}`);

        try {
            const clientsData = this.generateSimulatedClients(params);
            return this.formatClientList(clientsData);

        } catch (error: any) {
            this.logger.error('Erreur recherche clients:', error.message);
            throw new Error(`Échec de la recherche: ${error.message}`);
        }
    }

    private generateSimulatedClients(params: SearchClientsParams): any[] {
        const sampleClients = [
            {
                id: 'CL001',
                name: 'Sophie Moreau',
                email: 'sophie.moreau@email.fr',
                phone: '06.12.34.56.78',
                loyalty_level: 'gold',
                total_stays: 12,
                last_visit: '2024-02-10',
                spent_total: 8450
            },
            {
                id: 'CL002',
                name: 'Laurent Dubois',
                email: 'l.dubois@company.com',
                phone: '07.98.76.54.32',
                loyalty_level: 'platinum',
                total_stays: 25,
                last_visit: '2024-03-01',
                spent_total: 15200
            },
            {
                id: 'CL003',
                name: 'Marie Petit',
                email: 'marie.p@gmail.com',
                phone: '06.45.67.89.01',
                loyalty_level: 'silver',
                total_stays: 6,
                last_visit: '2024-01-20',
                spent_total: 3200
            }
        ];

        let filteredClients = [...sampleClients];

        if (params.query) {
            const query = params.query.toLowerCase();
            filteredClients = filteredClients.filter(client =>
                client.name.toLowerCase().includes(query) ||
                client.email.toLowerCase().includes(query)
            );
        }

        if (params.loyalty_level) {
            filteredClients = filteredClients.filter(client => 
                client.loyalty_level === params.loyalty_level
            );
        }

        if (params.recent_stay) {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filteredClients = filteredClients.filter(client => 
                new Date(client.last_visit) >= thirtyDaysAgo
            );
        }

        const limit = params.limit || 10;
        return filteredClients.slice(0, limit);
    }

    private formatClientList(clients: any[]): string {
        if (clients.length === 0) {
            return 'Aucun client trouvé avec ces critères.';
        }

        let result = `**${clients.length} client(s) trouvé(s)**\n\n`;

        clients.forEach(client => {
            result += `**${client.name}** (${client.id})\n`;
            result += `Email: ${client.email}\n`;
            result += `Téléphone: ${client.phone}\n`;
            result += `Fidélité: ${this.getLoyaltyBadge(client.loyalty_level)}\n`;
            result += `Séjours: ${client.total_stays} | Dépenses: ${client.spent_total}€\n`;
            result += `Dernière visite: ${client.last_visit}\n`;
            result += '---\n';
        });

        return result;
    }

    private getLoyaltyBadge(level: string): string {
        const badges: Record<string, string> = {
            bronze: 'Bronze',
            silver: 'Argent',
            gold: 'Or',
            platinum: 'Platine'
        };
        return badges[level] || level;
    }
}

export const clientService = new ClientService();