import { ThaisClient } from '../thais/thais.client.js';
import { Logger } from '../utils/logger.js';

export interface CreateServiceRequestParams {
    room_number: string;
    service_type: 'maintenance' | 'housekeeping' | 'concierge' | 'room_service' | 'spa' | 'technical' | 'other';
    description: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    customer_name?: string;
    phone_number?: string;
    requested_time?: string;
}

export class ServiceRequestService {
    private thaisClient: ThaisClient;
    private logger: Logger;

    constructor() {
        this.thaisClient = new ThaisClient();
        this.logger = new Logger('ServiceRequestService');
    }

    async createServiceRequest(params: CreateServiceRequestParams): Promise<string> {
        this.logger.info(`Création demande de service ${params.service_type} pour chambre ${params.room_number}`);

        try {
            const requestData = this.processRequest(params);
            const requestId = this.generateRequestId();
            
            return this.formatRequestConfirmation(requestId, requestData, params);

        } catch (error: any) {
            this.logger.error('Erreur création demande de service:', error.message);
            throw new Error(`Échec de la création: ${error.message}`);
        }
    }

    private processRequest(params: CreateServiceRequestParams): any {
        const priority = params.priority || 'normal';
        const estimatedDuration = this.getDefaultDuration(params.service_type);
        const scheduledTime = params.requested_time || this.getNextAvailableSlot(priority);

        return {
            priority,
            estimatedDuration,
            scheduledTime,
            status: 'pending',
            assigned_staff: this.assignStaff(params.service_type, priority)
        };
    }

    private getDefaultDuration(serviceType: string): number {
        const durations: Record<string, number> = {
            'room_cleaning': 45,
            'maintenance': 60,
            'laundry': 30,
            'room_service': 25,
            'concierge': 15,
            'spa': 90,
            'technical': 45
        };
        return durations[serviceType] || 30;
    }

    private getNextAvailableSlot(priority: string): string {
        const now = new Date();
        let delayMinutes = 30;

        if (priority === 'urgent') delayMinutes = 5;
        else if (priority === 'high') delayMinutes = 15;
        else if (priority === 'normal') delayMinutes = 30;
        else if (priority === 'low') delayMinutes = 60;

        const scheduledTime = new Date(now.getTime() + delayMinutes * 60000);
        return scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    private assignStaff(serviceType: string, priority: string): string {
        const staffByService: Record<string, string[]> = {
            'room_cleaning': ['Maria L.', 'Sophie R.', 'Claire M.'],
            'maintenance': ['Jean-Pierre D.', 'Alain B.'],
            'laundry': ['Carmen S.', 'Fatou K.'],
            'room_service': ['Antoine P.', 'Lisa T.'],
            'concierge': ['Philippe M.', 'Isabelle G.'],
            'spa': ['Nathalie L.', 'Thomas V.'],
            'technical': ['Marc B.', 'Kevin L.']
        };

        const availableStaff = staffByService[serviceType] || ['Service général'];
        return availableStaff[Math.floor(Math.random() * availableStaff.length)];
    }

    private generateRequestId(): string {
        return `REQ-${Date.now().toString().slice(-6)}`;
    }

    private formatRequestConfirmation(requestId: string, requestData: any, params: CreateServiceRequestParams): string {
        let result = `**Demande de Service Enregistrée**\n`;
        result += `ID: ${requestId}\n`;
        result += `Chambre: ${params.room_number}\n`;
        
        if (params.customer_name) {
            result += `Client: ${params.customer_name}\n`;
        }

        if (params.phone_number) {
            result += `Téléphone: ${params.phone_number}\n`;
        }

        result += `Service: ${this.getServiceTypeLabel(params.service_type)}\n`;
        result += `Priorité: ${this.getPriorityLabel(requestData.priority)}\n`;
        
        if (params.description) {
            result += `Description: ${params.description}\n`;
        }

        result += `\n**Planification:**\n`;
        result += `Heure prévue: ${requestData.scheduledTime}\n`;
        result += `Durée estimée: ${requestData.estimatedDuration} min\n`;
        result += `Assigné à: ${requestData.assigned_staff}\n`;
        result += `Statut: En attente\n`;

        return result;
    }

    private getServiceTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'room_cleaning': 'Nettoyage chambre',
            'maintenance': 'Maintenance',
            'laundry': 'Blanchisserie',
            'room_service': 'Service chambre',
            'concierge': 'Conciergerie',
            'spa': 'Spa & Wellness',
            'technical': 'Technique'
        };
        return labels[type] || type;
    }

    private getPriorityLabel(priority: string): string {
        const labels: Record<string, string> = {
            low: 'Faible',
            normal: 'Normale',
            high: 'Élevée',
            urgent: 'Urgente'
        };
        return labels[priority] || priority;
    }
}

export const serviceRequestService = new ServiceRequestService();