/**
 * Service de gestion des disponibilités
 */

import { thaisClient } from "../thais/thais.client.js";
import { validator } from "../utils/validator.js";
import { Logger } from "../utils/logger.js";
import type { Availability, PriceData } from "../thais/thais.types.js";
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

        // Récupérer disponibilités et tarifs en parallèle
        const [rawData, priceData] = await Promise.all([
            thaisClient.getAvailability({
                checkIn: normalized.checkIn,
                checkOut: normalized.checkOut,
                adults: normalized.adults,
                children: normalized.children,
            }),
            thaisClient.getPrices({
                checkIn: normalized.checkIn,
                checkOut: normalized.checkOut,
            })
        ]);

        const availabilities = this.formatAvailabilities(rawData, priceData, normalized.nbNights);
        this.logger.success(`${availabilities.length} chambre(s) trouvée(s)`);

        return { normalized, availabilities, rawData };
    }

    private formatAvailabilities(availabilities: Availability[], priceData: PriceData[], nbNights: number): FormattedAvailability[] {
        // Créer un map des prix par room_type_id et date
        const priceMap = new Map<string, number>();
        const rateMap = new Map<number, string>();
        
        for (const price of priceData) {
            const key = `${price.room_type_id}_${price.date}`;
            priceMap.set(key, price.price);
            if (price.rate?.label) {
                rateMap.set(price.room_type_id, price.rate.label);
            }
        }

        return availabilities
            .filter(avail => avail.room_type) // Seulement ceux avec room_type
            .map((avail) => {
                // Calculer le prix total pour la période
                let totalPrice = 0;
                let pricesFound = 0;
                
                for (const date of avail.dates) {
                    const key = `${avail.room_type_id}_${date}`;
                    const dayPrice = priceMap.get(key);
                    if (dayPrice) {
                        totalPrice += dayPrice;
                        pricesFound++;
                    }
                }

                const pricePerNight = pricesFound > 0 ? totalPrice / pricesFound : 0;
                const rateName = rateMap.get(avail.room_type_id) || 'Tarif standard';

                return {
                    roomTypeName: avail.room_type?.label || `Type #${avail.room_type_id}`,
                    roomTypeId: avail.room_type_id,
                    capacity: `${avail.room_type?.nb_persons_min || 1}-${avail.room_type?.nb_persons_max || 2} pers.`,
                    totalPrice: Math.round(totalPrice * 100) / 100,
                    pricePerNight: Math.round(pricePerNight * 100) / 100,
                    rateName,
                    rateId: 0,
                    availableRooms: avail.availableRooms,
                    description: this.cleanHtml(avail.room_type?.description || ''),
                };
            });
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
            if (room.totalPrice > 0) {
                msg += `- **Prix total** : ${room.totalPrice}€ (${params.nbNights} nuit${params.nbNights > 1 ? 's' : ''})\n`;
                msg += `- **Prix par nuit** : ${room.pricePerNight}€\n`;
                msg += `- **Tarif** : ${room.rateName}\n`;
            } else {
                msg += `- **Prix** : Sur demande\n`;
            }
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