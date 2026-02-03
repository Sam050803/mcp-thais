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

        const availabilities = this.formatAvailabilities(rawData);
        this.logger.success(`${availabilities.length} chambre(s) trouvée(s)`);

        return { normalized, availabilities, rawData };
    }

    private formatAvailabilities(availabilities: Availability[]): FormattedAvailability[] {
        return availabilities.map((avail) => ({
            roomTypeName: avail.room_type.label,
            roomTypeId: avail.room_type_id,
            capacity: `${avail.room_type.nb_persons_min}-${avail.room_type.nb_persons_max} pers.`,
            totalPrice: avail.price,
            pricePerNight: avail.price_per_night,
            rateName: avail.rate.label,
            description: this.cleanHtml(avail.room_type.description || ''),
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
        let msg = `✅ **${availabilities.length} chambre${availabilities.length > 1 ? 's' : ''} disponible${availabilities.length > 1 ? 's' : ''}** `;
        msg += `du ${this.formatDateFr(params.checkIn)} au ${this.formatDateFr(params.checkOut)} `;
        msg += `(${params.nbNights} nuit${params.nbNights > 1 ? 's' : ''}) :\n\n`;

        const sorted = [...availabilities].sort((a, b) => a.totalPrice - b.totalPrice);

        sorted.forEach((room, idx) => {
            msg += `### ${idx + 1}. ${room.roomTypeName}\n`;
            msg += `- **ID** : ${room.roomTypeId}\n`;
            msg += `- **Capacité** : ${room.capacity}\n`;
            msg += `- **Prix total** : ${room.totalPrice.toFixed(2)} €\n`;
            msg += `- **Prix/nuit** : ${room.pricePerNight.toFixed(2)} €\n`;
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