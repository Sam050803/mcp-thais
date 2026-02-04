/**
 * Service de gestion des réservations
 */

import { thaisClient } from '../thais/thais.client.js';
import { validator } from '../utils/validator.js';
import { dateParser, DateParser } from '../utils/date-parser.js';
import { Logger } from '../utils/logger.js';
import type { EReservation, CreateEReservationRequest, Customer } from '../thais/thais.types.js';
import type { CreateReservationParams } from '../types/common.types.js';


export class ReservationService {
    private logger = new Logger('ReservationService');

    async create(params: CreateReservationParams): Promise<EReservation> {
        this.logger.info('Création e-réservation...', { roomTypeId: params.roomTypeId });

        const checkIn = dateParser.parse(params.checkIn);
        const checkOut = dateParser.parse(params.checkOut);

        if (!DateParser.isValidDate(checkIn) || !DateParser.isValidDate(checkOut)) {
            throw new Error('Dates invalides');
        }

        const firstName = validator.validateName(params.guestFirstName, 'Prénom');
        const lastName = validator.validateName(params.guestLastName, 'Nom');
        const email = validator.validateEmail(params.guestEmail);
        const phone = validator.validatePhone(params.guestPhone);

        const customer: Customer = {
            firstname: firstName,
            lastname: lastName,
            email: email,
            phone: phone || '',
        };

        const request: CreateEReservationRequest = {
            check_in: checkIn,
            check_out: checkOut,
            room_type_id: params.roomTypeId,
            rate_id: params.rateId,
            nb_adults: params.adults,
            nb_children: params.children || 0,
            customer: customer,
        };

        const reservation = await thaisClient.createEReservation(request);
        this.logger.success(`E-réservation créée : #${reservation.reservation_number || reservation.id}`);

        return reservation;
    }

    formatCreationResponse(reservation: EReservation, params: CreateReservationParams): string {
        const nbNights = DateParser.calculateNights(
            dateParser.parse(params.checkIn),
            dateParser.parse(params.checkOut)
        );

        let msg = `🎉 **Pré-réservation créée avec succès !**\n\n`;
        msg += `## 📋 Récapitulatif\n`;
        msg += `- **N° réservation** : ${reservation.reservation_number || reservation.id}\n`;
        msg += `- **Chambre** : ${reservation.room_type?.label || `Type #${params.roomTypeId}`}\n`;
        msg += `- **Dates** : ${dateParser.parse(params.checkIn)} → ${dateParser.parse(params.checkOut)}\n`;
        msg += `- **Durée** : ${nbNights} nuit${nbNights > 1 ? 's' : ''}\n`;
        msg += `- **Voyageurs** : ${params.adults} adulte${params.adults > 1 ? 's' : ''}`;
        if (params.children) msg += ` + ${params.children} enfant${params.children > 1 ? 's' : ''}`;
        msg += '\n';

        if (reservation.total_price) {
            msg += `- **Prix total** : ${reservation.total_price.toFixed(2)} €\n`;
        }

        msg += `\n## 👤 Client\n`;
        msg += `- **Nom** : ${params.guestFirstName} ${params.guestLastName}\n`;
        msg += `- **Email** : ${params.guestEmail}\n`;

        msg += `\n📧 Confirmation envoyée à ${params.guestEmail}\n`;
        msg += `⏰ L'hôtel confirmera sous 24-48h`;

        return msg;
    }
}

export const reservationService = new ReservationService();