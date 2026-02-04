import { ThaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';

export interface GetHousekeepingStatusParams {
    floor?: number;
    room_number?: string;
    status_filter?: 'dirty' | 'cleaning' | 'clean' | 'inspected' | 'maintenance' | 'ooo';
    date?: string;
    detailed?: boolean;
}

export class HousekeepingService {
    private thaisClient: ThaisClient;
    private logger: Logger;

    constructor() {
        this.thaisClient = new ThaisClient();
        this.logger = new Logger('HousekeepingService');
    }

    async getHousekeepingStatus(params: GetHousekeepingStatusParams): Promise<string> {
        this.logger.info(`Consultation statut ménage - chambre: ${params.room_number || 'toutes'}`);

        try {
            const statusData = this.generateStatusData(params);
            return this.formatStatusReport(statusData, params);

        } catch (error: any) {
            this.logger.error('Erreur consultation ménage:', error.message);
            throw new Error(`Échec de la consultation: ${error.message}`);
        }
    }

    private generateStatusData(params: GetHousekeepingStatusParams): any[] {
        const allRooms = this.generateRoomStatuses();
        let filteredRooms = [...allRooms];

        if (params.room_number) {
            filteredRooms = filteredRooms.filter(room => 
                room.number === params.room_number
            );
        }

        if (params.floor) {
            filteredRooms = filteredRooms.filter(room => 
                Math.floor(parseInt(room.number) / 100) === params.floor
            );
        }

        if (params.status_filter) {
            filteredRooms = filteredRooms.filter(room => 
                room.housekeeping_status === params.status_filter
            );
        }

        return filteredRooms;
    }

    private generateRoomStatuses(): any[] {
        const statuses = ['dirty', 'cleaning', 'clean', 'inspected', 'ooo', 'maintenance'];
        const staff = ['Maria L.', 'Sophie R.', 'Claire M.', 'Carmen S.', 'Fatou K.'];
        const priorities = ['low', 'medium', 'high', 'urgent'];

        const rooms = [];
        for (let floor = 1; floor <= 4; floor++) {
            for (let room = 1; room <= 15; room++) {
                const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                rooms.push({
                    number: roomNumber,
                    housekeeping_status: status,
                    last_cleaned: this.getRandomDate(),
                    assigned_staff: status === 'cleaning' ? staff[Math.floor(Math.random() * staff.length)] : null,
                    priority: priorities[Math.floor(Math.random() * priorities.length)],
                    estimated_completion: status === 'cleaning' ? this.getEstimatedCompletion() : null,
                    notes: this.getRandomNote(status)
                });
            }
        }

        return rooms.slice(0, 20);
    }

    private getRandomDate(): string {
        const now = new Date();
        const hoursAgo = Math.floor(Math.random() * 48);
        const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        return date.toLocaleString('fr-FR');
    }

    private getEstimatedCompletion(): string {
        const now = new Date();
        const minutesFromNow = 15 + Math.random() * 30;
        const completion = new Date(now.getTime() + minutesFromNow * 60 * 1000);
        return completion.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    private getRandomNote(status: string): string {
        const notesByStatus: Record<string, string[]> = {
            'dirty': ['Départ client 11h', 'Nettoyage complet requis', 'Check-out standard'],
            'cleaning': ['En cours depuis 20min', 'Nettoyage approfondi', 'Maintenance mineure nécessaire'],
            'clean': ['Prêt pour inspection', 'Nettoyage terminé', 'Contrôle qualité OK'],
            'inspected': ['Validé par superviseur', 'Prêt accueil client', 'Qualité contrôlée'],
            'ooo': ['Hors service temporaire', 'En attente réparation', 'Chambre fermée'],
            'maintenance': ['Réparation plomberie', 'Problème électrique', 'Changement mobilier']
        };

        const notes = notesByStatus[status] || ['Aucune note'];
        return notes[Math.floor(Math.random() * notes.length)];
    }

    private formatStatusReport(rooms: any[], params: GetHousekeepingStatusParams): string {
        if (rooms.length === 0) {
            return 'Aucune chambre trouvée avec ces critères.';
        }

        let result = `**Statut Ménage - ${rooms.length} chambre(s)**\n\n`;

        if (params.room_number) {
            // Rapport détaillé pour une chambre spécifique
            const room = rooms[0];
            result += `**Chambre ${room.number}**\n`;
            result += `Statut: ${this.getStatusLabel(room.housekeeping_status)}\n`;
            result += `Dernier nettoyage: ${room.last_cleaned}\n`;
            result += `Priorité: ${this.getPriorityLabel(room.priority)}\n`;
            
            if (room.assigned_staff) {
                result += `Assigné à: ${room.assigned_staff}\n`;
            }
            
            if (room.estimated_completion) {
                result += `Fin estimée: ${room.estimated_completion}\n`;
            }
            
            result += `Notes: ${room.notes}\n`;
        } else {
            // Rapport de synthèse
            result += this.formatSummary(rooms);
            result += '\n**Détail par chambre:**\n';
            
            rooms.forEach(room => {
                const statusIcon = this.getStatusIcon(room.housekeeping_status);
                result += `${statusIcon} Chambre ${room.number} - ${this.getStatusLabel(room.housekeeping_status)}`;
                
                if (room.assigned_staff) {
                    result += ` (${room.assigned_staff})`;
                }
                
                if (room.priority === 'high' || room.priority === 'urgent') {
                    result += ` - Priorité ${this.getPriorityLabel(room.priority)}`;
                }
                
                result += '\n';
            });
        }

        return result;
    }

    private formatSummary(rooms: any[]): string {
        const statusCounts = rooms.reduce((acc, room) => {
            acc[room.housekeeping_status] = (acc[room.housekeeping_status] || 0) + 1;
            return acc;
        }, {});

        let summary = '**Résumé:**\n';
        Object.entries(statusCounts).forEach(([status, count]) => {
            summary += `${this.getStatusLabel(status)}: ${count}\n`;
        });

        return summary;
    }

    private getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            dirty: 'À nettoyer',
            cleaning: 'En cours de nettoyage',
            clean: 'Nettoyé',
            inspected: 'Inspecté',
            ooo: 'Hors service',
            maintenance: 'Maintenance'
        };
        return labels[status] || status;
    }

    private getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            dirty: '🔴',
            cleaning: '🟡',
            clean: '🟢',
            inspected: '✅',
            ooo: '⚫',
            maintenance: '🔧'
        };
        return icons[status] || '⚪';
    }

    private getPriorityLabel(priority: string): string {
        const labels: Record<string, string> = {
            low: 'Faible',
            medium: 'Normale',
            high: 'Élevée',
            urgent: 'Urgente'
        };
        return labels[priority] || priority;
    }
}

export const housekeepingService = new HousekeepingService();