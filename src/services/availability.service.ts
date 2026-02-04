/**
 * Service de gestion des disponibilités
 */

import { thaisClient } from "../thais/thais.client.js";
import { validator } from "../utils/validator.js";
import { Logger } from "../utils/logger.js";
import type { Availability } from "../thais/thais.types.js";
import type { FormattedAvailability, NormalizedAvailabilityParams } from "../types/common.types.js";

export class AvailabilityService {
    private logger = new Logger('AvailabilityService');

    async search(params: {
        checkIn: string;
        checkOut: string;
        adults: number;
        children?: number;
    }): Promise<{
        normalized: NormalizedAvailabilityParams;
        availabilities: FormattedAvailability[];
        rawData: Availability[];
    }> {
        const normalized = validator.validateAndNormalizeAvailability(params);

        this.logger.info(`Recherche : ${normalized.checkIn} -> ${normalized.checkOut}`);

        const rawData = await thaisClient.getAvailability({
            checkIn: normalized.checkIn,
            checkOut: normalized.checkOut,
            adults: normalized.adults,
            children: normalized.children,
        });

        const availabilities = this.formatAvailabilities(rawData, normalized.nbNights);
        this.logger.success(`${availabilities.length} chambre(s) trouvée(s)`);

        return { normalized, availabilities, rawData };
    }

    private formatAvailabilities(availabilities: Availability[], nbNights: number): FormattedAvailability[] {
        return availabilities
            .filter(avail => avail.room_type) // Seulement ceux avec room_type
            .map((avail) => ({
                roomTypeName: avail.room_type?.label || `Type #${avail.room_type_id}`,
                roomTypeId: avail.room_type_id,
                capacity: `${avail.room_type?.nb_persons_min || 1}-${avail.room_type?.nb_persons_max || 2} pers.`,
                totalPrice: 0, // Prix non disponible via cet endpoint
                pricePerNight: 0,
                rateName: 'Tarif sur demande',
                rateId: 0,
                availableRooms: avail.availableRooms,
                description: this.cleanHtml(avail.room_type?.description || ''),
            }));
    }

    formatResponse(
        normalized: NormalizedAvailabilityParams,
        availabilities: FormattedAvailability[]
    ): string {
        if (availabilities.length === 0) {
            return this.formatNoAvailability(normalized);
        }
        return this.formatAvailabilitiesList(normalized, availabilities);
    }

    private formatNoAvailability(params: NormalizedAvailabilityParams): string {
        let msg = `😔 **Aucune chambre disponible** du ${params.checkIn} au ${params.checkOut} `;
        msg += `pour ${params.adults} adulte${params.adults > 1 ? 's' : ''}`;
        if (params.children > 0) {
            msg += ` et ${params.children} enfant${params.children > 1 ? 's' : ''}`;
        }
        msg += '.\n\n💡 Essayez d\'autres dates ou un nombre différent de personnes.';
        return msg;
    }

    private formatAvailabilitiesList(
        params: NormalizedAvailabilityParams,
        availabilities: FormattedAvailability[]
    ): string {
        let msg = `✅ **${availabilities.length} type${availabilities.length > 1 ? 's' : ''} de chambre disponible${availabilities.length > 1 ? 's' : ''}** `;
        msg += `du ${this.formatDateFr(params.checkIn)} au ${this.formatDateFr(params.checkOut)} `;
        msg += `(${params.nbNights} nuit${params.nbNights > 1 ? 's' : ''}) :\n\n`;

        availabilities.forEach((room, idx) => {
            msg += `### ${idx + 1}. ${room.roomTypeName}\n`;
            msg += `- **ID** : ${room.roomTypeId}\n`;
            msg += `- **Capacité** : ${room.capacity}\n`;
            if (room.availableRooms) {
                msg += `- **Chambres disponibles** : ${room.availableRooms}\n`;
            }
            if (room.description) {
                const desc = room.description.substring(0, 100);
                msg += `- **Description** : ${desc}${room.description.length > 100 ? '...' : ''}\n`;
            }
            msg += '\n';
        });

        msg += `💡 Pour plus de détails : "Détails de la chambre [ID]"\n`;
        msg += `💡 Pour réserver : "Je souhaite réserver la chambre [ID]"`;

        return msg;
    }

    private formatDateFr(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    private cleanHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').trim();
    }
}

export const availabilityService = new AvailabilityService();